// Tests for blog-cadence.mjs: node --test .github/scripts/blog-cadence.test.mjs
// No network: the API is a fake fetch, time is a fake clock, the repository is a temporary directory.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';

import {
  API_BASE,
  POLL_INTERVAL_MS,
  POLL_TIMEOUT_MS,
  RETRIES,
  RETRY_WAIT_MS,
  SAMPLE_PATH,
  gitBlobId,
  main,
  parseArgs,
  publishDocument,
  sha256Digest,
  todayIn,
} from './blog-cadence.mjs';

const KEY = 'gk_test_0123456789abcdefSECRET';
const ORG = '01a15c64-6fba-764a-9785-a362169bbcf6';
const PUB = '01a15c64-7f88-7a2f-9e28-40347da02d25';
const AUTHOR = '01a15c65-9a71-782f-b76c-d0f002d9c6e5';
const PUB_PATH = `/v2/organizations/${ORG}/publications/${PUB}`;
const NOW = new Date('2026-10-26T01:05:00.000Z'); // Sunday 18:05 PDT, 2026-10-25 in Los Angeles
const NOW_ISO = '2026-10-26T01:05:00.000Z';

const A = 'first-post';
const B = 'second-post';
const C = 'third-post';

const dirs = [];
after(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })));

/** A draft the way `blog normalize` writes it (PyYAML dump order and quoting). */
function draft(slug, status = 'draft') {
  const published = status === 'draft' ? '' : "publishedAt: '2026-10-20T10:00:00.000Z'\n";
  return [
    '---',
    'schemaId: urn:gala:schema:content-frontmatter:2.0.0',
    'schemaVersion: 2.0.0',
    'id: 01a15c94-3083-785d-a0f3-2f37ebea1260',
    'kind: article',
    `title: 'Title: of ${slug}'`,
    'description: A description that is long enough to be a description.',
    'language: en',
    'authors:',
    `- ${AUTHOR}`,
    'tags:',
    '- ownership',
    'series: Building in public',
    'seriesOrder: 2',
    `status: ${status}`,
    "createdAt: '2026-10-21T03:49:38.000Z'",
    `${published}slug: ${slug}`,
    'redirects: []',
    'extensions: {}',
    '---',
    `Body of ${slug}.`,
    '',
    '## A heading',
    '',
    '```text',
    'a --> b',
    '```',
    '',
  ].join('\n');
}

/**
 * A repository in a temporary directory. `slots` is [slug, date, approved] rows; `files` maps a
 * slug to its text (a slug without an entry has no file).
 */
function repo(slots, files, { calendar = {} } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'blog-cadence-'));
  dirs.push(root);
  mkdirSync(path.join(root, '.github'), { recursive: true });
  mkdirSync(path.join(root, 'content'), { recursive: true });
  mkdirSync(path.join(root, 'gala'), { recursive: true });
  writeFileSync(
    path.join(root, '.github', 'blog-calendar.json'),
    JSON.stringify({
      organizationId: ORG,
      publicationId: PUB,
      authorId: AUTHOR,
      timezone: 'America/Los_Angeles',
      slots: slots.map(([slug, date, approved]) => ({ slug, date, approved })),
      ...calendar,
    }),
  );
  writeFileSync(path.join(root, 'gala', 'publication.json'), JSON.stringify({ canonicalBase: 'https://blog.example.com/' }));
  for (const [slug, text] of Object.entries(files)) writeFileSync(path.join(root, 'content', `${slug}.md`), text);
  return root;
}

function item(slug, text, extra = {}) {
  const bytes = Buffer.from(text);
  return { path: `content/${slug}.md`, kind: 'ARTICLE', blobId: gitBlobId(bytes, 'sha1'), size: bytes.length, ...extra };
}

const json = (status, body, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

/**
 * A fake API. `listing` is the items array; `script` maps "METHOD route" to a list of responses
 * (consumed in order, the last one repeats) for the routes a test wants to change.
 */
function fakeApi({ items = [], head = 'head-1', script = {} } = {}) {
  const calls = [];
  const used = {};
  const defaults = {
    'GET content': [() => json(200, { head, items, hasMore: false })],
    'POST plan': [() => json(200, { changeId: 'chg-1' })],
    'POST confirm': [() => json(202, { operationId: 'op-confirm' })],
    'GET op-confirm': [() => json(200, { operationId: 'op-confirm', phase: 'completed' })],
    'POST publish': [() => json(202, { operationId: 'op-publish', publishId: 'pub-1' })],
    'GET op-publish': [() => json(200, { operationId: 'op-publish', phase: 'completed' })],
  };
  function route(method, pathname) {
    if (pathname === `${PUB_PATH}/content`) return `${method} content`;
    if (pathname === `${PUB_PATH}/content-changes:plan`) return `${method} plan`;
    if (pathname.startsWith(`${PUB_PATH}/repository-changes/`) && pathname.endsWith(':confirm')) return `${method} confirm`;
    if (pathname === `${PUB_PATH}/changes:publish`) return `${method} publish`;
    if (pathname.startsWith(`/v2/organizations/${ORG}/operations/`)) return `${method} ${pathname.split('/').pop()}`;
    return `${method} ${pathname}`;
  }
  async function fetch(url, init) {
    const u = new URL(url);
    assert.equal(u.origin, API_BASE);
    const call = {
      method: init.method,
      path: u.pathname,
      query: u.search,
      headers: Object.fromEntries(Object.entries(init.headers).map(([k, v]) => [k.toLowerCase(), v])),
      body: init.body === undefined ? undefined : JSON.parse(init.body),
      route: route(init.method, u.pathname),
    };
    calls.push(call);
    const list = script[call.route] ?? defaults[call.route];
    assert.ok(list, `no fake response for ${call.route}`);
    const n = (used[call.route] = (used[call.route] ?? 0) + 1);
    const make = list[Math.min(n, list.length) - 1];
    return typeof make === 'function' ? make(call) : make.clone(); // a Response body can be read once
  }
  return { fetch, calls, routes: () => calls.map((c) => c.route) };
}

function fakeClock() {
  const clock = { t: 0, sleeps: [], now: () => clock.t, sleep: async (ms) => { clock.sleeps.push(ms); clock.t += ms; } };
  return clock;
}

async function run(root, argv, { api = fakeApi(), env = { GALA_BLOG_API_KEY: KEY }, clock = fakeClock(), instant = NOW } = {}) {
  const out = [];
  const err = [];
  let n = 0;
  const code = await main(argv, {
    root,
    env,
    fetch: api.fetch,
    clock,
    instant,
    uuid: () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`,
    out: (line) => out.push(line),
    err: (line) => err.push(line),
  });
  return { code, out: out.join('\n'), err: err.join('\n'), api, clock };
}

const fileOf = (root, slug) => readFileSync(path.join(root, 'content', `${slug}.md`), 'utf8');

// ------------------------------------------------------------------ choosing the slot

test('picks the first due draft, not a later one and not one whose date has not come', async () => {
  const root = repo([[A, '2026-10-25', true], [B, '2026-10-25', true], [C, '2026-11-01', true]], { [A]: draft(A), [B]: draft(B), [C]: draft(C) });
  const api = fakeApi({ items: [item(A, draft(A)), item(B, draft(B)), item(C, draft(C))] });
  const r = await run(root, ['--dry-run'], { api });
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /due: first-post \(2026-10-25\)/);
  assert.match(r.out, /would send content\/first-post\.md/);
  assert.doesNotMatch(r.out, /would send content\/second-post/);
});

test('today is the date in the calendar timezone, summer and winter', () => {
  assert.equal(todayIn('America/Los_Angeles', new Date('2026-10-26T01:05:00Z')), '2026-10-25'); // PDT
  assert.equal(todayIn('America/Los_Angeles', new Date('2026-11-02T01:05:00Z')), '2026-11-01'); // PST
  assert.equal(todayIn('America/Los_Angeles', new Date('2026-10-30T11:05:00Z')), '2026-10-30'); // Friday 04:05 PDT
  assert.equal(todayIn('America/Los_Angeles', new Date('2026-11-06T11:05:00Z')), '2026-11-06'); // Friday 03:05 PST
});

test('a slot whose draft is not approved holds everything behind it', async () => {
  const root = repo([[A, '2026-10-25', false], [B, '2026-10-25', true]], { [A]: draft(A), [B]: draft(B) });
  const r = await run(root, ['--live']);
  assert.equal(r.code, 0);
  assert.match(r.out, /held: first-post awaits approval/);
  assert.equal(r.api.calls.length, 0, 'a held run makes no request');
  assert.equal(fileOf(root, B), draft(B));
});

test('a published slot is skipped and the next draft goes', async () => {
  const root = repo([[A, '2026-10-20', false], [B, '2026-10-25', true]], { [A]: draft(A, 'published'), [B]: draft(B) });
  const api = fakeApi({ items: [item(A, draft(A, 'published')), item(B, draft(B))] });
  const r = await run(root, ['--dry-run'], { api });
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /due: second-post/);
  assert.match(r.out, /published {2}.*first-post/);
});

test('a due slot without a file is exit 1 naming it, and nothing behind it runs', async () => {
  const root = repo([[A, '2026-10-25', true], [B, '2026-10-25', true]], { [B]: draft(B) });
  const r = await run(root, ['--live']);
  assert.equal(r.code, 1);
  assert.match(r.err, /first-post is due \(2026-10-25\) but content\/first-post\.md does not exist/);
  assert.equal(r.api.calls.length, 0);
});

test('a slot whose date has not come is not looked for, and nothing due is exit 0', async () => {
  const root = repo([[A, '2026-10-30', true]], {});
  const r = await run(root, ['--live']);
  assert.equal(r.code, 0);
  assert.match(r.out, /nothing is due/);
  assert.equal(r.api.calls.length, 0);
});

test('a due draft with an unreadable header is exit 1', async () => {
  const root = repo([[A, '2026-10-25', true]], { [A]: 'no front matter here\n' });
  const r = await run(root, ['--live']);
  assert.equal(r.code, 1);
  assert.match(r.err, /content\/first-post\.md: the file must start with a --- front matter block/);
});

test('a draft whose front matter slug is not its file name is refused', async () => {
  const root = repo([[A, '2026-10-25', true]], { [A]: draft(B) });
  const r = await run(root, ['--live']);
  assert.equal(r.code, 1);
  assert.match(r.err, /does not match the file name/);
});

test('an OWNER or sources comment left in the draft stops the slot', async () => {
  const text = `${draft(A)}\n<!-- OWNER: still open -->\n`;
  const root = repo([[A, '2026-10-25', true]], { [A]: text });
  const r = await run(root, ['--live'], { api: fakeApi({ items: [item(A, text)] }) });
  assert.equal(r.code, 1);
  assert.match(r.err, /still has an OWNER or sources comment/);
  assert.equal(r.api.calls.length, 0);
});

// ------------------------------------------------------------------ dry run

test('a dry run sends nothing: it reads the listing, writes nothing and says what it would send', async () => {
  const text = draft(A);
  const root = repo([[A, '2026-10-25', true]], { [A]: text });
  const api = fakeApi({ items: [item(A, text), item('welcome-to-your-publication', 'x')] });
  const r = await run(root, [], { api }); // no flag means a dry run
  assert.equal(r.code, 0, r.err);
  assert.deepEqual(api.routes(), ['GET content']);
  const sent = publishDocument(text, NOW_ISO);
  assert.match(r.out, new RegExp(`would send content/first-post\\.md, ${Buffer.byteLength(sent)} bytes, ${sha256Digest(sent)}, publishedAt ${NOW_ISO}`));
  assert.match(r.out, /would also delete content\/welcome-to-your-publication\.md \(the template's sample article\): yes/);
  assert.match(r.out, /nothing was written/);
  assert.equal(fileOf(root, A), text, 'the working tree file is untouched');
  assert.deepEqual(readdirSync(path.join(root, 'content')), [`${A}.md`]);
});

test('a dry run says no to the delete when the listing has no sample article', async () => {
  const text = draft(A);
  const root = repo([[A, '2026-10-25', true]], { [A]: text });
  const r = await run(root, ['--dry-run'], { api: fakeApi({ items: [item(A, text)] }) });
  assert.match(r.out, /the template's sample article\): no/);
});

test('--now makes a dry run use another date', async () => {
  const root = repo([[A, '2026-11-20', true]], { [A]: draft(A) });
  const api = fakeApi({ items: [item(A, draft(A))] });
  const r = await run(root, ['--dry-run', '--now', '2026-11-21'], { api });
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /today 2026-11-21/);
  assert.match(r.out, /due: first-post/);
});

// ------------------------------------------------------------------ live

test('live: plan, confirm, wait, publish, wait, with the exact paths and bodies', async () => {
  const text = draft(A);
  const root = repo([[A, '2026-10-25', true]], { [A]: text });
  const sent = publishDocument(text, NOW_ISO);
  const api = fakeApi({
    items: [item(A, text)],
    head: 'head-7',
    script: {
      'GET op-confirm': [json(200, { phase: 'accepted' }), json(200, { phase: 'executing' }), json(200, { phase: 'completed' })],
      'GET op-publish': [json(200, { phase: 'reconciling' }), json(200, { phase: 'completed' })],
    },
  });
  const r = await run(root, ['--live'], { api });
  assert.equal(r.code, 0, r.err);
  assert.deepEqual(api.routes(), [
    'GET content',
    'POST plan',
    'POST confirm',
    'GET op-confirm',
    'GET op-confirm',
    'GET op-confirm',
    'POST publish',
    'GET op-publish',
    'GET op-publish',
  ]);
  const [list, plan, confirm, , , , publish] = api.calls;
  assert.equal(list.path, `${PUB_PATH}/content`);
  assert.equal(list.query, '?limit=100');
  assert.deepEqual(plan.body, {
    baseRevision: 'head-7',
    documents: [{ action: 'PUT', path: 'content/first-post.md', text: sent, contentDigest: sha256Digest(sent) }],
  });
  assert.equal(plan.path, `${PUB_PATH}/content-changes:plan`);
  assert.equal(confirm.path, `${PUB_PATH}/repository-changes/chg-1:confirm`);
  assert.deepEqual(confirm.body, {});
  assert.equal(publish.path, `${PUB_PATH}/changes:publish`);
  assert.deepEqual(publish.body, { changeIds: ['chg-1'] });
  assert.equal(api.calls[3].path, `/v2/organizations/${ORG}/operations/op-confirm`);
  assert.equal(api.calls[7].path, `/v2/organizations/${ORG}/operations/op-publish`);
  assert.deepEqual(r.clock.sleeps, [POLL_INTERVAL_MS, POLL_INTERVAL_MS, POLL_INTERVAL_MS]);
  assert.match(r.out, /published first-post: https:\/\/blog\.example\.com\/first-post\//);
  for (const c of api.calls) {
    assert.equal(c.headers.authorization, `Bearer ${KEY}`);
    assert.ok(c.headers['x-csrf-token'].length >= 32);
    assert.equal('cookie' in c.headers, false);
  }
  assert.equal('idempotency-key' in list.headers, false, 'reads carry no idempotency key');
  assert.ok(plan.headers['idempotency-key'] && confirm.headers['idempotency-key'] && publish.headers['idempotency-key']);
  assert.equal(new Set([plan, confirm, publish].map((c) => c.headers['idempotency-key'])).size, 3);
  assert.equal(fileOf(root, A), text, 'the script never writes the working tree; the API commits');
});

test('the document sent keeps every other front matter line and the body as they were', () => {
  const text = draft(A);
  const sent = publishDocument(text, NOW_ISO);
  const before = text.split('\n');
  const after = sent.split('\n');
  assert.equal(after.length, before.length + 1);
  const created = before.indexOf("createdAt: '2026-10-21T03:49:38.000Z'");
  assert.equal(after[created + 1], `publishedAt: '${NOW_ISO}'`);
  assert.equal(after.filter((l) => l.startsWith('status:')).join(), 'status: published');
  const rest = after.filter((l, i) => i !== created + 1 && l !== 'status: published');
  assert.deepEqual(rest, before.filter((l) => l !== 'status: draft'));
  // the front matter of the result still reads as YAML a stricter reader accepts: one block, closed
  assert.match(sent, /^---\n[\s\S]*\npublishedAt: '2026-10-26T01:05:00\.000Z'\nslug: first-post\n[\s\S]*\n---\nBody of first-post\./);
});

test('publishDocument refuses what it cannot rewrite exactly', () => {
  assert.throws(() => publishDocument(draft(A, 'published'), NOW_ISO), /status is not draft/);
  assert.throws(() => publishDocument(draft(A).replace('slug: first-post', "publishedAt: '2026-10-20T10:00:00.000Z'\nslug: first-post"), NOW_ISO), /must not have publishedAt/);
  assert.throws(() => publishDocument(draft(A).replace(/createdAt:.*\n/, ''), NOW_ISO), /no single-line createdAt/);
  assert.throws(() => publishDocument(draft(A), '2026-10-26T01:05:00Z'), /not a UTC millisecond timestamp/);
  assert.throws(() => publishDocument(draft(A).replace(/\n/g, '\r\n'), NOW_ISO), /carriage returns/);
  assert.throws(() => publishDocument(draft(A).replace('status: draft', 'status: draft\nstatus: draft'), NOW_ISO), /appears twice/);
  assert.equal(publishDocument(draft(A).replace('status: draft', 'status: "draft"'), NOW_ISO).includes('status: published\n'), true);
});

test('the sample article is deleted in the same change only when the listing has it', async () => {
  for (const listed of [true, false]) {
    const text = draft(A);
    const root = repo([[A, '2026-10-25', true]], { [A]: text });
    const items = [item(A, text), ...(listed ? [item('welcome-to-your-publication', 'w')] : [])];
    const api = fakeApi({ items });
    const r = await run(root, ['--live'], { api });
    assert.equal(r.code, 0, r.err);
    const documents = api.calls.find((c) => c.route === 'POST plan').body.documents;
    assert.equal(documents.length, listed ? 2 : 1);
    if (listed) assert.deepEqual(documents[1], { action: 'DELETE', path: SAMPLE_PATH });
    assert.equal(documents[0].action, 'PUT');
  }
});

test('the listing is read page by page', async () => {
  const text = draft(A);
  const root = repo([[A, '2026-10-25', true]], { [A]: text });
  const api = fakeApi({
    script: {
      'GET content': [
        json(200, { head: 'head-2', items: [item('a-page', 'p')], hasMore: true, nextCursor: 'c1' }),
        json(200, { items: [item(A, text), item('welcome-to-your-publication', 'w')], hasMore: false }),
      ],
    },
  });
  const r = await run(root, ['--live'], { api });
  assert.equal(r.code, 0, r.err);
  assert.equal(api.calls[1].query, '?limit=100&cursor=c1');
  const plan = api.calls.find((c) => c.route === 'POST plan').body;
  assert.equal(plan.baseRevision, 'head-2');
  assert.equal(plan.documents.length, 2);
});

test('when the head moved before the plan, the listing is read again once and the plan retried', async () => {
  const text = draft(A);
  const root = repo([[A, '2026-10-25', true]], { [A]: text });
  const heads = ['head-1', 'head-2'];
  const api = fakeApi({
    script: {
      'GET content': [() => json(200, { head: heads.shift(), items: [item(A, text)], hasMore: false })],
      'POST plan': [json(409, { code: 'INVALID_SOURCE_STATE', title: 'stale' }, { 'X-Gala-Current-Head': 'head-2' }), json(200, { changeId: 'chg-1' })],
    },
  });
  const r = await run(root, ['--live'], { api });
  assert.equal(r.code, 0, r.err);
  assert.deepEqual(api.routes().slice(0, 4), ['GET content', 'POST plan', 'GET content', 'POST plan']);
  assert.deepEqual(api.calls.filter((c) => c.route === 'POST plan').map((c) => c.body.baseRevision), ['head-1', 'head-2']);
});

test('an operation that ends without effect is exit 1 and nothing more is sent', async () => {
  const text = draft(A);
  const root = repo([[A, '2026-10-25', true]], { [A]: text });
  const api = fakeApi({ items: [item(A, text)], script: { 'GET op-confirm': [json(200, { phase: 'failed_no_effect', reason: 'BUILD_FAILED' })] } });
  const r = await run(root, ['--live'], { api });
  assert.equal(r.code, 1);
  assert.match(r.err, /confirm operation op-confirm ended failed_no_effect \(BUILD_FAILED\); nothing was published, the next run tries this post again/);
  assert.equal(api.routes().includes('POST publish'), false);
});

test('an operation still running after 20 minutes is exit 1', async () => {
  const text = draft(A);
  const root = repo([[A, '2026-10-25', true]], { [A]: text });
  const api = fakeApi({ items: [item(A, text)], script: { 'GET op-confirm': [json(200, { phase: 'executing' })] } });
  const r = await run(root, ['--live'], { api });
  assert.equal(r.code, 1);
  assert.match(r.err, /was still executing after 20 minutes/);
  assert.ok(r.clock.t >= POLL_TIMEOUT_MS);
  assert.equal(api.routes().includes('POST publish'), false);
});

// ------------------------------------------------------------------ refusals

test('a working tree copy that is not the site\'s copy is refused with both revisions printed', async () => {
  const text = draft(A);
  const root = repo([[A, '2026-10-25', true]], { [A]: text });
  const siteCopy = text.replace('Body of', 'Edited in the app: body of');
  const api = fakeApi({ items: [item(A, siteCopy, { summary: { status: 'DRAFT' } })], head: 'head-9' });
  const r = await run(root, ['--live'], { api, env: { GALA_BLOG_API_KEY: KEY, GITHUB_SHA: 'abc123' } });
  assert.equal(r.code, 1);
  assert.match(r.err, /is not the site's copy/);
  assert.match(r.err, new RegExp(`working tree: ${gitBlobId(Buffer.from(text), 'sha1')}.*checkout abc123`));
  assert.match(r.err, new RegExp(`site listing: ${gitBlobId(Buffer.from(siteCopy), 'sha1')}.*status DRAFT; head head-9`));
  assert.deepEqual(api.routes(), ['GET content'], 'nothing is planned');
});

test('a draft the site does not have yet is refused', async () => {
  const root = repo([[A, '2026-10-25', true]], { [A]: draft(A) });
  const r = await run(root, ['--live'], { api: fakeApi({ items: [], head: 'head-3' }) });
  assert.equal(r.code, 1);
  assert.match(r.err, /the working tree has content\/first-post\.md but the site does not \(listing head head-3/);
});

test('the git blob id matches git itself, for sha1 and for the sha256 form', () => {
  const bytes = Buffer.from('---\ntitle: café\n---\nbody\n');
  assert.equal(gitBlobId(bytes, 'sha1'), `sha1:${execFileSync('git', ['hash-object', '--stdin'], { input: bytes }).toString().trim()}`);
  assert.match(gitBlobId(bytes, 'sha256'), /^sha256:[0-9a-f]{64}$/);
});

test('a missing key is exit 2 with a clear line, before anything else, and the line carries no value', async () => {
  const root = repo([[A, '2026-10-25', true]], { [A]: draft(A) });
  for (const argv of [['--live'], ['--dry-run']]) {
    const r = await run(root, argv, { env: {} });
    assert.equal(r.code, 2);
    assert.match(r.err, /error: GALA_BLOG_API_KEY is not set/);
    assert.equal(r.api.calls.length, 0);
  }
  const empty = await run(root, ['--live'], { env: { GALA_BLOG_API_KEY: '' } });
  assert.equal(empty.code, 2);
});

test('usage mistakes are exit 2: unknown flag, both modes, --live with --now, a bad date', () => {
  for (const argv of [['--nope'], ['--live', '--dry-run'], ['--live', '--now', '2026-10-25'], ['--now', '2026-02-31'], ['--now']]) {
    assert.throws(() => parseArgs(argv), (e) => e.exitCode === 2, argv.join(' '));
  }
  assert.deepEqual(parseArgs(['--now=2026-10-25']), { live: false, dryRun: false, now: '2026-10-25', help: false });
});

test('a calendar that is not in the known shape is exit 2 naming the problem', async () => {
  const cases = [
    [{ slots: [{ slug: A, date: '2026-10-25' }] }, /slot 1 must have exactly slug, date and approved/],
    [{ slots: [{ slug: A, date: '2026-10-25', approved: 'yes' }] }, /approved must be true or false/],
    [{ slots: [{ slug: A, date: '2026-13-25', approved: true }] }, /date must be a real date/],
    [{ slots: [{ slug: 'Bad_Slug', date: '2026-10-25', approved: true }] }, /not a lowercase hyphenated slug/],
    [{ slots: [{ slug: A, date: '2026-10-25', approved: true }, { slug: A, date: '2026-10-26', approved: true }] }, /appears more than once/],
    [{ timezone: 'Mars/Olympus' }, /not an IANA timezone name/],
    [{ organizationId: '../etc' }, /organizationId must be a lowercase UUID/],
    [{ surprise: 1 }, /unknown key surprise/],
  ];
  for (const [calendar, message] of cases) {
    const root = repo([[A, '2026-10-25', true]], { [A]: draft(A) }, { calendar });
    const r = await run(root, ['--dry-run']);
    assert.equal(r.code, 2, JSON.stringify(calendar));
    assert.match(r.err, message);
    assert.equal(r.api.calls.length, 0);
  }
});

// ------------------------------------------------------------------ failures of the API

test('a 5xx is retried three times a minute apart, then the run fails with exit 1', async () => {
  const text = draft(A);
  const root = repo([[A, '2026-10-25', true]], { [A]: text });
  const api = fakeApi({ items: [item(A, text)], script: { 'GET content': [json(503, { code: 'UNAVAILABLE', title: 'try later' })] } });
  const r = await run(root, ['--live'], { api });
  assert.equal(r.code, 1);
  assert.equal(api.calls.length, RETRIES + 1);
  assert.deepEqual(r.clock.sleeps, [RETRY_WAIT_MS, RETRY_WAIT_MS, RETRY_WAIT_MS]);
  assert.match(r.err, /content listing failed: 503 UNAVAILABLE: try later/);
  assert.match(r.out, /retry: GET .*content\?limit=100 answered HTTP 503; attempt 2 of 4 in 60 s/);
});

test('a network failure is retried the same way, and a later success carries on', async () => {
  const text = draft(A);
  const root = repo([[A, '2026-10-25', true]], { [A]: text });
  let down = 2;
  const api = fakeApi({ items: [item(A, text)] });
  const real = api.fetch;
  api.fetch = async (url, init) => {
    if (init.method === 'POST' && down-- > 0) throw Object.assign(new TypeError('fetch failed'), { name: 'TypeError' });
    return real(url, init);
  };
  const r = await run(root, ['--live'], { api });
  assert.equal(r.code, 0, r.err);
  assert.deepEqual(r.clock.sleeps.slice(0, 2), [RETRY_WAIT_MS, RETRY_WAIT_MS]);
  assert.match(r.out, /could not be reached \(TypeError\)/);
});

test('a retried mutation reuses its idempotency key', async () => {
  const text = draft(A);
  const root = repo([[A, '2026-10-25', true]], { [A]: text });
  const api = fakeApi({ items: [item(A, text)], script: { 'POST plan': [json(502, { code: 'BAD_GATEWAY' }), json(200, { changeId: 'chg-1' })] } });
  const r = await run(root, ['--live'], { api });
  assert.equal(r.code, 0, r.err);
  const plans = api.calls.filter((c) => c.route === 'POST plan');
  assert.equal(plans.length, 2);
  assert.equal(plans[0].headers['idempotency-key'], plans[1].headers['idempotency-key']);
});

test('a 4xx prints the problem and exits 1 without retrying, with the remedy for a refusal the owner can fix', async () => {
  const text = draft(A);
  const root = repo([[A, '2026-10-25', true]], { [A]: text });
  const api = fakeApi({
    items: [item(A, text)],
    script: {
      'POST plan': [
        json(422, {
          code: 'INVALID_SOURCE_STATE',
          title: 'Invalid source state',
          detail: 'The publication cannot be published.',
          type: 'https://api.galascribe.com/problems/invalid-source-state',
          errors: [{ code: 'REVIEW_REQUIRED', pointer: '/documents/0', reason: 'review is on' }],
        }),
      ],
    },
  });
  const r = await run(root, ['--live'], { api });
  assert.equal(r.code, 1);
  assert.deepEqual(r.clock.sleeps, []);
  assert.equal(api.calls.filter((c) => c.route === 'POST plan').length, 1);
  assert.match(r.err, /plan failed: 422 INVALID_SOURCE_STATE: Invalid source state: The publication cannot be published\./);
  assert.match(r.err, /\[REVIEW_REQUIRED \/documents\/0: review is on\]/);
  assert.match(r.err, /Require review is on for the blog; turn it off in the Galascribe App/);
});

test('a refused key is exit 1 with the instruction to replace the secret', async () => {
  const text = draft(A);
  const root = repo([[A, '2026-10-25', true]], { [A]: text });
  const api = fakeApi({ script: { 'GET content': [json(401, { code: 'UNAUTHENTICATED', title: 'no' })] } });
  const r = await run(root, ['--live'], { api });
  assert.equal(r.code, 1);
  assert.match(r.err, /The key in GALA_BLOG_API_KEY was refused; replace the repository secret/);
});

test('the key is never written, even when the server echoes it back', async () => {
  const text = draft(A);
  const root = repo([[A, '2026-10-25', true]], { [A]: text });
  const api = fakeApi({
    items: [item(A, text)],
    script: { 'POST plan': [json(400, { code: 'BAD', title: `rejected Authorization: Bearer ${KEY}`, detail: `key ${KEY} is wrong`, errors: [{ code: 'X', reason: KEY }] })] },
  });
  const r = await run(root, ['--live'], { api });
  assert.equal(r.code, 1);
  assert.doesNotMatch(r.out + r.err, new RegExp(KEY));
  assert.match(r.err, /\[redacted\]/);
});

test('a non-JSON error body is shown, bounded', async () => {
  const text = draft(A);
  const root = repo([[A, '2026-10-25', true]], { [A]: text });
  const api = fakeApi({ script: { 'GET content': [new Response(`<html>${'x'.repeat(500)}</html>`, { status: 404 })] } });
  const r = await run(root, ['--live'], { api });
  assert.equal(r.code, 1);
  assert.match(r.err, /404 HTTP_404: <html>x+…?/);
  assert.ok(r.err.length < 400);
});
