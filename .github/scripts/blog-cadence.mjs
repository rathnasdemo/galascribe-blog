#!/usr/bin/env node
// Blog cadence: publishes the next due draft from content/ through the Galascribe API, one post per run.
//
//   node .github/scripts/blog-cadence.mjs [--dry-run | --live] [--now YYYY-MM-DD]
//
// The calendar is .github/blog-calendar.json (ordered slots, each with a floor date and an
// `approved` flag). A run picks the FIRST slot whose date has come and whose content/<slug>.md
// is still `status: draft`:
//   - not approved   -> prints "held: <slug> awaits approval" and stops; nothing behind it runs;
//   - approved       -> flips the file to `status: published` with `publishedAt` (every other
//                       front matter line is left byte for byte as it is) and sends it through
//                       the API: plan, confirm, publish, then waits for each operation.
// The script never commits: the API commits the change to the repository. Without --live it
// reads the content listing (GET only) and reports what it would send; it writes nothing.
//
// The platform key is read from the environment variable GALA_BLOG_API_KEY and is sent only as
// "Authorization: Bearer". It is never printed: every line the script writes passes through a
// filter that removes the key and anything that follows the word Bearer.
//
// Exit codes: 0 done, held, nothing due, or dry run; 1 failed (a refused request, an operation
// that did not complete, a draft that cannot be sent, a working tree that is not the site's
// head); 2 usage or configuration (flags, calendar, missing key).

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const KEY_ENV = 'GALA_BLOG_API_KEY';
export const API_BASE = 'https://api.galascribe.com';
export const CALENDAR_PATH = '.github/blog-calendar.json';
export const SAMPLE_PATH = 'content/welcome-to-your-publication.md';

export const RETRIES = 3; // after the first attempt, on a 5xx or a network failure
export const RETRY_WAIT_MS = 60_000;
export const POLL_INTERVAL_MS = 10_000;
export const POLL_TIMEOUT_MS = 20 * 60_000; // per operation
export const REQUEST_TIMEOUT_MS = 60_000;
const MAX_DOCUMENT_BYTES = 1024 * 1024;
const MAX_LISTING_PAGES = 100;
const TERMINAL_PHASES = new Set(['completed', 'failed_no_effect', 'cancelled_no_effect']);
const MESSAGE_MAX = 800;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

// What to change for a refusal the owner can fix.
const REMEDIES = {
  REVIEW_REQUIRED: 'Require review is on for the blog; turn it off in the Galascribe App, then the next run tries again.',
  CANONICAL_BASE_MISMATCH:
    'The canonical base in gala/publication.json is not where the site is served; publish once from the Galascribe App so the canonical base becomes the custom domain, then the next run tries again.',
};

/** A failure that ends the run with a message and an exit code. */
export class Exit extends Error {
  constructor(message, code = 1) {
    super(message);
    this.exitCode = code;
  }
}

/** A refused or failed API request. `message` is bounded and carries no credential. */
export class ApiError extends Error {
  constructor(status, code, message, errors = [], currentHead = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.currentHead = currentHead; // X-Gala-Current-Head: the live head the server names for a stale baseRevision
  }
}

// ---------------------------------------------------------------- arguments and calendar

export function parseArgs(argv) {
  const opts = { live: false, dryRun: false, now: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--live') opts.live = true;
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg === '--now' || arg.startsWith('--now=')) {
      const value = arg === '--now' ? argv[++i] : arg.slice('--now='.length);
      if (value === undefined || !isRealDate(value)) {
        throw new Exit(`--now needs a date, YYYY-MM-DD (got ${JSON.stringify(value ?? '')})`, 2);
      }
      opts.now = value;
    } else throw new Exit(`unknown argument ${JSON.stringify(arg)}\n${USAGE}`, 2);
  }
  if (opts.live && opts.dryRun) throw new Exit('--live and --dry-run cannot be combined', 2);
  if (opts.live && opts.now) {
    throw new Exit('--live cannot be combined with --now (a made-up date must never drive a real publish)', 2);
  }
  return opts;
}

export const USAGE = 'usage: node .github/scripts/blog-cadence.mjs [--dry-run | --live] [--now YYYY-MM-DD]';

function isRealDate(text) {
  const m = ISO_DATE.exec(text);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

const CALENDAR_KEYS = new Set(['note', 'organizationId', 'publicationId', 'authorId', 'timezone', 'slots']);

/** Parse and check the calendar text; every problem is exit 2 naming the file. */
export function parseCalendar(text) {
  const bad = (why) => new Exit(`${CALENDAR_PATH}: ${why}`, 2);
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    throw bad(`not valid JSON (${e.message})`);
  }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) throw bad('expected an object');
  for (const key of Object.keys(raw)) if (!CALENDAR_KEYS.has(key)) throw bad(`unknown key ${key}`);
  for (const key of ['organizationId', 'publicationId', 'authorId']) {
    if (typeof raw[key] !== 'string' || !UUID.test(raw[key])) throw bad(`${key} must be a lowercase UUID`);
  }
  if (typeof raw.timezone !== 'string') throw bad('timezone must be an IANA timezone name');
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: raw.timezone });
  } catch {
    throw bad(`timezone ${JSON.stringify(raw.timezone)} is not an IANA timezone name`);
  }
  if (!Array.isArray(raw.slots) || raw.slots.length === 0) throw bad('slots must be a non-empty list');
  const seen = new Set();
  const slots = raw.slots.map((s, i) => {
    const n = i + 1;
    if (s === null || typeof s !== 'object' || Array.isArray(s)) throw bad(`slot ${n} must be an object`);
    const keys = Object.keys(s).sort().join(',');
    if (keys !== 'approved,date,slug') throw bad(`slot ${n} must have exactly slug, date and approved`);
    if (typeof s.slug !== 'string' || !SLUG.test(s.slug)) throw bad(`slot ${n}: slug ${JSON.stringify(s.slug)} is not a lowercase hyphenated slug`);
    if (seen.has(s.slug)) throw bad(`slug ${s.slug} appears more than once`);
    seen.add(s.slug);
    if (typeof s.date !== 'string' || !isRealDate(s.date)) throw bad(`slot ${s.slug}: date must be a real date, YYYY-MM-DD`);
    if (typeof s.approved !== 'boolean') throw bad(`slot ${s.slug}: approved must be true or false`);
    return { slug: s.slug, date: s.date, approved: s.approved };
  });
  return {
    organizationId: raw.organizationId,
    publicationId: raw.publicationId,
    authorId: raw.authorId,
    timezone: raw.timezone,
    slots,
  };
}

/** The date (YYYY-MM-DD) it is now in `timezone`. */
export function todayIn(timezone, instant) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(instant)
    .reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

// ---------------------------------------------------------------- front matter

const FRONT = /^---\n([\s\S]*?)\n---\n/;
const TOP_LEVEL_KEY = /^([A-Za-z][A-Za-z0-9]*):(?:[ \t]+(.*))?$/;

/** The front matter lines and the rest of the document. */
export function splitDocument(text) {
  if (text.includes('\r')) throw new Error('the file has carriage returns; expected LF line endings');
  const m = FRONT.exec(text);
  if (!m) throw new Error('the file must start with a --- front matter block closed by ---');
  return { lines: m[1].split('\n'), rest: text.slice(m[0].length) };
}

function unquote(value) {
  const v = (value ?? '').trim();
  const m = /^'(.*)'$/.exec(v) ?? /^"(.*)"$/.exec(v);
  return m ? m[1] : v;
}

/** Top-level `key: value` lines of the front matter: key -> { index, value }. A duplicate key is an error. */
export function topLevelScalars(lines) {
  const found = new Map();
  lines.forEach((line, index) => {
    const m = TOP_LEVEL_KEY.exec(line);
    if (!m) return;
    if (found.has(m[1])) throw new Error(`front matter key ${m[1]} appears twice`);
    found.set(m[1], { index, value: unquote(m[2]) });
  });
  return found;
}

/** `status` and `slug` of a content file, or throws with why it cannot be read. */
export function readHeader(text) {
  const { lines } = splitDocument(text);
  const keys = topLevelScalars(lines);
  const status = keys.get('status')?.value;
  if (!status) throw new Error('front matter has no status');
  return { status, slug: keys.get('slug')?.value };
}

/**
 * The document published at `isoNow`: `status: published` and a `publishedAt` line right after
 * `createdAt`. Every other front matter line, and the body, stay byte for byte as they are.
 */
export function publishDocument(text, isoNow) {
  const { lines, rest } = splitDocument(text);
  const keys = topLevelScalars(lines);
  if (keys.get('status')?.value !== 'draft') throw new Error('status is not draft');
  if (keys.has('publishedAt')) throw new Error('a draft must not have publishedAt');
  const created = keys.get('createdAt');
  if (!created || created.value === '') throw new Error('front matter has no single-line createdAt');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(isoNow)) throw new Error(`publishedAt ${isoNow} is not a UTC millisecond timestamp`);
  const out = [...lines];
  out[keys.get('status').index] = 'status: published';
  out.splice(created.index + 1, 0, `publishedAt: '${isoNow}'`);
  const document = `---\n${out.join('\n')}\n---\n${rest}`;
  // Defence: reading the result back must show the two changes and nothing else.
  const back = splitDocument(document);
  const same = back.lines.filter((_, i) => i !== created.index + 1);
  same[keys.get('status').index] = lines[keys.get('status').index];
  if (same.join('\n') !== lines.join('\n') || back.rest !== rest) throw new Error('internal error: the rewrite changed more than status and publishedAt');
  return document;
}

// ---------------------------------------------------------------- digests

export function sha256Digest(text) {
  return `sha256:${createHash('sha256').update(text, 'utf8').digest('hex')}`;
}

/** The git blob id (`sha1:` or `sha256:` form, as the listing's `blobId`) of file bytes. */
export function gitBlobId(bytes, algorithm) {
  const hash = createHash(algorithm).update(`blob ${bytes.length}\0`).update(bytes);
  return `${algorithm}:${hash.digest('hex')}`;
}

// ---------------------------------------------------------------- slots

/** Every calendar slot with what its file says: `{ slot, due, file }`, file = missing | unreadable | header. */
export function readSlots(calendar, today, root) {
  return calendar.slots.map((slot) => {
    const file = path.join(root, 'content', `${slot.slug}.md`);
    const due = slot.date <= today;
    let bytes;
    try {
      bytes = readFileSync(file);
    } catch (e) {
      if (e.code === 'ENOENT') return { slot, due, state: 'missing' };
      return { slot, due, state: 'unreadable', problem: `cannot read ${file}: ${e.code ?? e.message}` };
    }
    try {
      const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
      const header = readHeader(text);
      if (header.slug !== slot.slug) throw new Error(`front matter slug ${JSON.stringify(header.slug)} does not match the file name`);
      return { slot, due, state: header.status === 'draft' ? 'draft' : 'done', status: header.status, bytes, text };
    } catch (e) {
      return { slot, due, state: 'unreadable', problem: `content/${slot.slug}.md: ${e.message}` };
    }
  });
}

function label(entry) {
  const { slot, due, state, status } = entry;
  if (state === 'done') return status;
  if (state === 'missing') return due ? 'MISSING FILE' : 'scheduled, no file yet';
  if (state === 'unreadable') return 'UNREADABLE';
  const approval = slot.approved ? 'approved' : 'awaits approval';
  return `${due ? 'due' : 'scheduled'}, ${approval}`;
}

/**
 * What this run does: `{ action: 'none' }`, `{ action: 'held', entry }`, `{ action: 'send', entry }`
 * or `{ action: 'fail', message }`. The first due slot that is not already published decides; a
 * slot ahead of the others that cannot go (not approved, no file, unreadable) stops the run.
 */
export function pickSlot(entries) {
  for (const entry of entries) {
    if (!entry.due || entry.state === 'done') continue;
    if (entry.state === 'missing') return { action: 'fail', message: `${entry.slot.slug} is due (${entry.slot.date}) but content/${entry.slot.slug}.md does not exist` };
    if (entry.state === 'unreadable') return { action: 'fail', message: `${entry.slot.slug} is due (${entry.slot.date}) but ${entry.problem}` };
    return entry.slot.approved ? { action: 'send', entry } : { action: 'held', entry };
  }
  return { action: 'none' };
}

// ---------------------------------------------------------------- API client

function bounded(text, limit) {
  const line = String(text ?? '').split(/\s+/).filter(Boolean).join(' ');
  return line.length > limit ? `${line.slice(0, limit - 1)}…` : line;
}

function redactor(key) {
  return (text) => {
    let out = String(text);
    if (key) out = out.split(key).join('[redacted]');
    return out.replace(/\bbearer\s+\S+/gi, 'Bearer [redacted]');
  };
}

async function problemOf(res, redact) {
  let doc = null;
  let raw = '';
  try {
    raw = await res.text();
    doc = JSON.parse(raw);
  } catch {
    doc = null;
  }
  let code = `HTTP_${res.status}`;
  let title = '';
  let detail = '';
  let type = '';
  let errors = [];
  if (doc !== null && typeof doc === 'object' && !Array.isArray(doc)) {
    code = bounded(redact(doc.code ?? ''), 80) || code;
    title = bounded(redact(doc.title ?? ''), 200);
    type = bounded(redact(doc.type ?? ''), 200);
    detail = bounded(redact(doc.detail ?? doc.title ?? ''), 500);
    if (Array.isArray(doc.errors)) {
      errors = doc.errors
        .filter((e) => e !== null && typeof e === 'object')
        .map((e) => ({
          code: bounded(redact(e.code ?? ''), 80),
          pointer: bounded(redact(e.pointer ?? ''), 160),
          reason: bounded(redact(e.reason ?? ''), 160),
          paths: Array.isArray(e.paths) ? e.paths.map((p) => bounded(redact(p), 160)).join(',') : '',
        }));
    }
  } else {
    detail = bounded(redact(raw), 200);
  }
  const said = [...new Set([title, detail].filter(Boolean))].join(': ');
  let tail = errors
    .map((e) => [e.code, e.pointer].filter(Boolean).join(' ') + (e.reason ? `: ${e.reason}` : '') + (e.paths ? ` paths=${e.paths}` : ''))
    .filter(Boolean)
    .join('; ');
  tail = tail ? ` [${tail}]` : '';
  const head = `${res.status} ${code}${said ? `: ${said}` : ''}${type ? ` (type ${type})` : ''}`;
  return new ApiError(res.status, code, head.slice(0, Math.max(MESSAGE_MAX - tail.length, 0)) + tail, errors, res.headers.get('x-gala-current-head'));
}

/** What went wrong at `step`, with what to change when the refusal is one the owner can fix. */
export function describe(step, e) {
  if (!(e instanceof ApiError)) return `${step} failed: ${e.message}`;
  const codes = [...new Set([e.code, ...e.errors.map((x) => x.code).filter(Boolean)])];
  const remedy = codes.map((c) => REMEDIES[c]).find(Boolean) ?? (e.status === 401 ? `The key in ${KEY_ENV} was refused; replace the repository secret.` : '');
  return `${step} failed: ${e.message}${remedy ? `. ${remedy}` : ''}`;
}

function makeClient(ctx) {
  const { fetch, key, clock, uuid, log, redact } = ctx;
  async function request(method, apiPath, { body, mutation = false } = {}) {
    const url = `${API_BASE}${apiPath}`;
    const idempotencyKey = mutation ? uuid() : null; // one key per call, kept across its retries
    for (let attempt = 1; ; attempt++) {
      const headers = {
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
        'User-Agent': 'galascribe-blog-cadence',
        'X-CSRF-TOKEN': randomBytes(32).toString('base64url'),
      };
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
      let res;
      try {
        res = await fetch(url, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
          redirect: 'manual',
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch (e) {
        if (attempt > RETRIES) throw new ApiError(0, 'NETWORK', `0 NETWORK: ${redact(e?.name ?? 'Error')} calling ${method} ${apiPath}`);
        log(`retry: ${method} ${apiPath} could not be reached (${redact(e?.name ?? 'Error')}); attempt ${attempt + 1} of ${RETRIES + 1} in ${RETRY_WAIT_MS / 1000} s`);
        await clock.sleep(RETRY_WAIT_MS);
        continue;
      }
      if (res.status >= 500 && attempt <= RETRIES) {
        log(`retry: ${method} ${apiPath} answered HTTP ${res.status}; attempt ${attempt + 1} of ${RETRIES + 1} in ${RETRY_WAIT_MS / 1000} s`);
        await res.text().catch(() => '');
        await clock.sleep(RETRY_WAIT_MS);
        continue;
      }
      if (res.status >= 300) throw await problemOf(res, redact);
      const raw = await res.text();
      if (raw === '') return {};
      try {
        return JSON.parse(raw);
      } catch {
        throw new ApiError(res.status, 'BAD_RESPONSE', `${res.status} BAD_RESPONSE: response is not JSON`);
      }
    }
  }
  return { get: (p) => request('GET', p), post: (p, body) => request('POST', p, { body, mutation: true }) };
}

function sitePaths(calendar) {
  const pub = `/v2/organizations/${calendar.organizationId}/publications/${calendar.publicationId}`;
  return {
    content: `${pub}/content`,
    plan: `${pub}/content-changes:plan`,
    confirm: (changeId) => `${pub}/repository-changes/${encodeURIComponent(changeId)}:confirm`,
    publish: `${pub}/changes:publish`,
    operation: (id) => `/v2/organizations/${calendar.organizationId}/operations/${encodeURIComponent(id)}`,
  };
}

/** The whole content inventory: `{ head, items }`, following the cursor. */
async function readListing(api, paths) {
  let head;
  const items = [];
  let cursor = null;
  for (let page = 0; page < MAX_LISTING_PAGES; page++) {
    const query = `limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
    const body = await api.get(`${paths.content}?${query}`);
    head ??= body.head;
    items.push(...(body.items ?? []));
    cursor = body.nextCursor;
    if (!body.hasMore || !cursor) break;
  }
  if (typeof head !== 'string' || head === '') throw new ApiError(200, 'BAD_RESPONSE', 'the content listing has no head');
  return { head, items };
}

/** Poll an operation until it ends; returns the operation. Bounded by POLL_TIMEOUT_MS. */
async function waitFor(api, paths, clock, step, operationId) {
  const deadline = clock.now() + POLL_TIMEOUT_MS;
  for (;;) {
    const op = await api.get(paths.operation(operationId));
    if (TERMINAL_PHASES.has(op.phase)) return op;
    if (clock.now() >= deadline) {
      throw new Exit(`${step}: operation ${operationId} was still ${op.phase} after ${POLL_TIMEOUT_MS / 60_000} minutes; check it in the Galascribe App. Nothing more was sent.`);
    }
    await clock.sleep(POLL_INTERVAL_MS);
  }
}

function finished(step, op, operationId, log) {
  if (op.phase !== 'completed') {
    const reason = op.reason ? ` (${bounded(op.reason, 64)})` : '';
    throw new Exit(`${step} operation ${operationId} ended ${op.phase}${reason}; nothing was published, the next run tries this post again`);
  }
  log(`${step}: operation ${operationId} completed`);
}

/**
 * The guard: the working tree's copy of the draft must be the very blob the site's listing has at
 * `item.path`, or the run would publish something other than what the site holds. Prints both when not.
 */
export function checkWorkingCopy(listing, entry, env) {
  const docPath = `content/${entry.slot.slug}.md`;
  const item = listing.items.find((i) => i.path === docPath);
  const checkout = env.GITHUB_SHA ? `checkout ${env.GITHUB_SHA}` : 'checkout (not a workflow run)';
  if (!item) {
    throw new Exit(
      `the working tree has ${docPath} but the site does not (listing head ${listing.head}; ${checkout}); the next run tries again once the site has it`,
    );
  }
  const algorithm = String(item.blobId ?? '').startsWith('sha256:') ? 'sha256' : 'sha1';
  const mine = gitBlobId(entry.bytes, algorithm);
  if (mine !== item.blobId) {
    const status = item.summary?.status ? `, status ${item.summary.status}` : '';
    throw new Exit(
      [
        `${docPath} in the working tree is not the site's copy; refusing to publish it.`,
        `  working tree: ${mine} (${entry.bytes.length} bytes; ${checkout})`,
        `  site listing: ${item.blobId} (${item.size} bytes${status}; head ${listing.head})`,
      ].join('\n'),
    );
  }
}

function postUrl(root, slug) {
  try {
    const base = new URL(JSON.parse(readFileSync(path.join(root, 'gala', 'publication.json'), 'utf8')).canonicalBase);
    if (base.protocol !== 'https:') return null;
    return new URL(`${slug}/`, base.href.endsWith('/') ? base.href : `${base.href}/`).href;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- the run

/**
 * Run once. `deps` are injectable for tests: `env`, `fetch`, `clock` ({ now, sleep }), `root` (the
 * repository directory), `out` and `err` (line writers), `uuid`, `instant` (the Date used as "now").
 * Returns the exit code.
 */
export async function main(argv, deps = {}) {
  const env = deps.env ?? process.env;
  const key = env[KEY_ENV] ?? '';
  const redact = redactor(key);
  const write = deps.out ?? ((line) => console.log(line));
  const writeErr = deps.err ?? ((line) => console.error(line));
  const log = (line) => write(redact(line));
  const fail = (line) => writeErr(redact(`error: ${line}`));
  const clock = deps.clock ?? { now: () => Date.now(), sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)) };
  const root = deps.root ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  try {
    const opts = parseArgs(argv);
    if (opts.help) {
      log(USAGE);
      return 0;
    }
    let calendarText;
    try {
      calendarText = readFileSync(path.join(root, CALENDAR_PATH), 'utf8');
    } catch (e) {
      throw new Exit(`${CALENDAR_PATH}: cannot read it (${e.code ?? e.message})`, 2);
    }
    const calendar = parseCalendar(calendarText);
    if (key === '') throw new Exit(`${KEY_ENV} is not set; add it as a repository secret (Settings, Secrets and variables, Actions)`, 2);

    const instant = deps.instant ?? new Date(clock.now());
    const today = opts.now ?? todayIn(calendar.timezone, instant);
    const entries = readSlots(calendar, today, root);
    log(`today ${today} (${calendar.timezone}), mode ${opts.live ? 'live' : 'dry run'}`);
    for (const entry of entries) log(`${entry.slot.date}  ${label(entry).padEnd(28)}  ${entry.slot.slug}`);

    const pick = pickSlot(entries);
    if (pick.action === 'none') {
      log('nothing is due');
      return 0;
    }
    if (pick.action === 'fail') throw new Exit(pick.message);
    if (pick.action === 'held') {
      log(`held: ${pick.entry.slot.slug} awaits approval`);
      return 0;
    }

    const { entry } = pick;
    const slug = entry.slot.slug;
    const docPath = `content/${slug}.md`;
    log(`due: ${slug} (${entry.slot.date})`);
    if (/<!--\s*(OWNER|sources)\b/i.test(entry.text)) throw new Exit(`${docPath} still has an OWNER or sources comment; remove it before the slot can go out`);
    const publishedAt = instant.toISOString();
    let text;
    try {
      text = publishDocument(entry.text, publishedAt);
    } catch (e) {
      throw new Exit(`${docPath}: ${e.message}`);
    }
    const size = Buffer.byteLength(text, 'utf8');
    if (size > MAX_DOCUMENT_BYTES) throw new Exit(`${docPath} is ${size} bytes; the limit is ${MAX_DOCUMENT_BYTES}`);
    const digest = sha256Digest(text);

    const api = makeClient({ fetch: deps.fetch ?? globalThis.fetch, key, clock, uuid: deps.uuid ?? randomUUID, log, redact });
    const paths = sitePaths(calendar);

    // One logical attempt: read the listing, check the working copy against it, plan the change.
    // When the site's head moved between the listing and the plan, read it again once.
    let changeId;
    let withDelete = false;
    for (let attempt = 1; ; attempt++) {
      const listing = await readListing(api, paths).catch((e) => {
        throw new Exit(describe('content listing', e));
      });
      checkWorkingCopy(listing, entry, env);
      withDelete = listing.items.some((i) => i.path === SAMPLE_PATH);
      log(`listing: head ${listing.head}, ${listing.items.length} items; ${docPath} matches the working tree`);
      if (!opts.live) {
        log(`dry run: would send ${docPath}, ${size} bytes, ${digest}, publishedAt ${publishedAt}`);
        log(`dry run: would also delete ${SAMPLE_PATH} (the template's sample article): ${withDelete ? 'yes' : 'no'}`);
        log('dry run: nothing was written; add --live to publish');
        return 0;
      }
      const documents = [{ action: 'PUT', path: docPath, text, contentDigest: digest }];
      if (withDelete) documents.push({ action: 'DELETE', path: SAMPLE_PATH });
      try {
        ({ changeId } = await api.post(paths.plan, { baseRevision: listing.head, documents }));
        break;
      } catch (e) {
        // INVALID_SOURCE_STATE is also how a refused review policy arrives; only a stale base names the live head.
        if (e instanceof ApiError && e.code === 'INVALID_SOURCE_STATE' && e.currentHead && attempt === 1) {
          log(`plan: the site's head moved from ${listing.head} to ${bounded(e.currentHead, 100)}; reading the listing again`);
          continue;
        }
        throw new Exit(describe('plan', e));
      }
    }
    if (typeof changeId !== 'string' || changeId === '') throw new Exit('plan failed: the response has no changeId');
    log(`plan: ${docPath} ${digest}${withDelete ? ` and delete ${SAMPLE_PATH}` : ''} as change ${changeId}`);

    const step = async (name, fn) => {
      try {
        return await fn();
      } catch (e) {
        if (e instanceof Exit) throw e;
        throw new Exit(describe(name, e));
      }
    };
    const confirmed = await step('confirm', () => api.post(paths.confirm(changeId), {}));
    log(`confirm: change ${changeId}, operation ${confirmed.operationId}`);
    finished('confirm', await step('confirm', () => waitFor(api, paths, clock, 'confirm', confirmed.operationId)), confirmed.operationId, log);

    const accepted = await step('publish', () => api.post(paths.publish, { changeIds: [changeId] }));
    log(`publish: operation ${accepted.operationId}, publish ${accepted.publishId}`);
    finished('publish', await step('publish', () => waitFor(api, paths, clock, 'publish', accepted.operationId)), accepted.operationId, log);

    const url = postUrl(root, slug);
    log(`published ${slug}${url ? `: ${url}` : ''}`);
    return 0;
  } catch (e) {
    if (e instanceof Exit) {
      fail(e.message);
      return e.exitCode;
    }
    fail(`unexpected ${e?.name ?? 'error'}: ${e?.message ?? e}`);
    return 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  process.exitCode = await main(process.argv.slice(2));
}
