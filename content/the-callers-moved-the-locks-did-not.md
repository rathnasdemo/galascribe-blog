---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a17138-2dce-7f76-b794-365b54d41c61
kind: article
title: The callers moved and the locks did not
description: Between 2026-10-12 and 2026-10-23, one half of a pinned pair moved without the other four times; one gate now moves a caller and its lock together.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- toolchain
- publishing
- incidents
- lockfile
status: draft
publishAfter: '2027-01-10'
createdAt: '2026-10-25T04:01:09.000Z'
slug: the-callers-moved-the-locks-did-not
redirects: []
listen:
  audio: assets/listen/the-callers-moved-the-locks-did-not.mp3
  durationSeconds: 411
  format: conversation
extensions: {}
---

At 12:46 UTC on 2026-10-23 a new version of our GitHub Pages adapter reached npm. Within six minutes four commits in three repositories named it. Publishes on the newest template contract then failed with `LOCK_ADAPTER_IDENTITY_INVALID`, including our own blog and our newest demo sites, and by 13:21 we had reverted all three repositories. It was the fourth time since 2026-10-12 that a toolchain change broke something for live sites. Each time the cause had the same shape: one half of a pair that has to agree moved, and the other half did not.

## Two files that have to agree

A Galascribe site is a repository, and two files in it decide how it builds. The caller is a small workflow file that says "run the publish workflow at this commit". The commit is a full 40-character SHA of our publish repository, and it identifies the toolchain: the publish tool plus the template, theme and adapter packages that version installs. The lock, `gala.lock.json`, records the exact rows the site was resolved against (schemas, template, theme, adapter) and a digest of the whole. At intake the toolchain compares the lock's rows with the releases it was built with and refuses a mismatch with a finding such as `LOCK_THEME_IDENTITY_INVALID`. The build takes its theme from the lock and from nowhere else.

So the caller chooses the toolchain, and the lock has to name rows that toolchain has. Different writers keep the two halves. Our API moves callers on its own: a periodic sweep moves live sites' callers forward to the newest toolchain. A lock changes only when something rewrites it, and Set up repository, the usual rewriter, refreshed the theme row but never the adapter row.

## Four times

**2026-10-12.** The toolchain moved to the next template generation and could no longer build two of our test sites. It could hold one version of each theme package, so a lock naming the previous generation's rows was refused at intake. We migrated the two sites by hand. The sweep was the step that would have broken the rest, because it moves a caller whether or not the new toolchain still serves the site's generation. The design note we wrote that day set the goal: a toolchain update must never break a live site.

**2026-10-21.** An API release replaced the previous release of each theme in its catalog with the new one. Every site still on the older template contract was then offered only one theme, Editorial. The catalog now keeps both releases and picks the row by the site's own contract.

**2026-10-21 and 22.** Our blog's caller moved to a toolchain that served only the newer template contract, while its lock stayed on the older contract's theme release. The trigger had nothing to do with toolchains: a missing policy file. Any repair writes the template's caller along with the missing file, because the caller is classified separately from the rest. The theme refinement checked the contract for the lock's theme row, and nothing checked that the caller's new toolchain served that contract. Our audit of 2026-10-22 put it plainly: the design had assumed the toolchain would serve the site's generation, "always true until retirement", and, in the audit's words, "The rule exists only in prose; nothing in code encodes it." The next publish failed with `LOCK_THEME_IDENTITY_INVALID`.

The first fix said a caller may only sit on a pin that serves the site's own lock contract, and the API restores one that has drifted. It worked too well. On 2026-10-22 we ran Set up repository on the blog to get the legal footer we had released the day before. Set up moved only the caller, and the new guard put it back 49 seconds later. The footer had been released and reached no site. The second fix made Set up move the lock and the caller in one commit, or hold when the site's theme has no release for the new contract. It went out at about 17:00 UTC, and the blog showed the footer at 17:48.

**2026-10-23.** The adapter release that opens this post came with a pin round: the toolchain's catalog, the repository template's caller and lock, and the API's catalog all changed within minutes. But the live API had not been deployed with the new catalog, so it still wrote the old adapter row into new locks, and the sweep moved every same-contract caller forward onto the new toolchain without touching any lock. The callers moved and the locks did not. We reverted with new commits on top of the bad ones, because the sweep carries callers forward along commit ancestry and never back, and no customer repository was edited.

## The rule, as code

We wrote the rule down as code instead of prose. Every path that writes a caller pin (the sweep, the managed-files repair, a person's Set up, the stale-pin refresh) now goes through one gate. The gate answers keep, move or hold. A move carries the new lock text, and the API writes it in the same commit as the caller. A hold writes nothing, logs a typed reason once per site per day, and leaves the site on the toolchain it already publishes with. The gate moves a caller only when it can prove three conditions:

- the site's template contract is the template's, or the site is being deliberately moved to it;
- the site's theme has a catalog release for that contract, looked up by contract and never by package name alone;
- every adapter row in the resulting lock is admitted by the API's code catalog and by the platform database's admission table.

The "and" in the third condition cost us a second failure the same day. On the proof run at 15:49 UTC the code catalog knew adapter 0.1.2, but the table our API consults when a publish workflow asks for its deployment intent did not, so every republish was refused with a 422 on the adapter version. Live sites kept their previous builds, because the refusal came before deployment. Two sources of truth for one fact is a bug of its own. A test now fails the build when a catalog release has no matching admission migration, and the gate consults both sources. The catalog also keeps the previous release: both contracts for themes, current and previous for adapters.

We then adopted 0.1.2 through the gate. When the API republishes a site after its own change and that publish fails, it now retries with a fresh operation at 10 minutes, 30 minutes and 2 hours, four attempts at most. By 17:51 UTC all eight demo sites had republished green on 0.1.2, and the sweep had moved each one's caller and lock in a single commit. We did 0.1.3 the same way on 2026-10-24: the sweep moved all eight between 07:44 and 07:51 UTC, and every republish was green by 08:09.

One thing is still open: adopting an adapter touches two repositories by hand, and we want it to be one scripted step that produces the catalog row and its migration together. One gap closed the same evening. The failure alert we had added stayed silent on the 15:49 run, because refusals at that step never reached it; a release at 20:32 UTC records them.

If you pin things in your own system, apply this test. List every pair of values that must agree: a caller and a lock, a client and a schema, a migration and a catalog entry. For each pair, write down who writes each half and on what trigger, and ask what happens when only one half moves. If the answer is "a failure at the next run", route every writer of one half through a function that proves the other half and is allowed to answer hold. A hold that writes nothing and says why is cheaper than any repair.

To start a site of your own, the start flow is at https://app.galascribe.com/
