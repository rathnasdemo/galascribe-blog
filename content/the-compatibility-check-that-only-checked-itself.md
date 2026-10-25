---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740c-9f98-7418-96db-01c55c66c705
kind: article
title: The compatibility check that only checked itself
description: Our compatibility catalogue pinned 46 pairings at 2.0.0 through eleven releases and nothing read it; here is how we found it and what replaced it.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- schemas
- ci
- testing
- releases
status: draft
publishAfter: '2027-02-19'
createdAt: '2026-10-25T17:12:26.000Z'
slug: the-compatibility-check-that-only-checked-itself
redirects: []
extensions: {}
---

The compatibility catalogue in our schema package listed 21 contracts and 46 producer and consumer pairings. Every one of those pairings said 2.0.0. They had said 2.0.0 since the day the catalogue was introduced, and the package went on to ship 2.1.0 through 2.11.0 without a single entry changing. On 2026-09-25, at 09:01 Pacific, a review pointed this out and we deleted the whole thing.

We had a gate called "compatibility", it passed on every push, and for eleven minor releases it told us nothing.

## Four ways to be a safety net with nothing under it

The review on 2026-09-25 found the same defect in four places in the schema package. They are worth listing, because each looks reasonable on its own.

**A catalogue that checked itself.** The checker validated the catalogue against the catalogue. It never compared a pairing with the version in the package's own package.json. The real consumers pinned the package at versions the catalogue had never listed. The function that evaluated the catalogue was never part of the published surface, and nothing in the API, the App or the publish toolchain read the catalogue or imported that function. A safety net with no consumer is decoration. Our commit message says we removed it "rather than repair a safety net with no consumer".

**A script npm could not run.** A `prepublishOnly` script was described in the CHANGELOG as "the sole guard" of the first release. But the package's npm configuration sets `ignore-scripts=true`, which disables every lifecycle script, for CI's publish and for a manual one alike. The script had been dead from the day it was written. The real guard was always an explicit verify step in the release workflow. We deleted the script and rewrote the CHANGELOG entry to name the real guard, and to say plainly that a manual publish outside CI has not been verified.

**Adversarial tests that agreed with themselves.** We keep a corpus of fourteen adversarial categories: path traversal, unsafe URLs, duplicate keys, YAML aliases, and so on. Only two of the fourteen called anything the package ships. The other twelve reimplemented their check inline inside the test harness's dispatcher, so a passing test proved that the harness agreed with itself, not that the shipped validator rejected the payload.

**A release note carrying the weight.** With the catalogue gone, the compatibility claims for eleven minor releases rested on hand-checked CHANGELOG prose and nothing else. That was always true. Deleting the catalogue only made it visible.

## What we did, in order

The deletion went out first, and it broke CI. The CI workflow still ran the deleted compatibility script, so the generated-artifacts job failed on every push, and the release workflow still listed the deleted catalogue file among its trigger paths. A fix landed two hours later, at 11:06. The order was wrong: we should have grepped the workflows for the thing we were removing before pushing the removal. A gate you delete is referenced from somewhere.

Then we replaced the catalogue with something that could turn red. We wrote down, for the first time, what the package means by "compatible": which structural changes are additive (relaxing a required set, widening a bound, adding an optional property) and which are breaking (the reverse of each). A script now diffs every root schema against a frozen, committed snapshot of the schemas and classifies each difference as additive or breaking. Any breaking difference fails the build.

We committed the snapshot instead of fetching the last published tarball from the registry. That keeps the gate free of network access, so it behaves identically on a laptop and in CI. The snapshot advances only at release time, after the CHANGELOG entry says what moved.

Two honest notes on that gate. Its first run reports zero differences by construction, because the baseline was seeded from current content; it polices compatibility from that day forward and does not look back at the eleven releases it did not exist for. And before we trusted it, we asked the question in the title of this post. We added a required property to one schema as a scratch change and confirmed the gate failed with the diagnostic we expected, then reverted it. The full build, lint, typecheck and the 349-test unit suite passed.

For the adversarial corpus, we sorted the fourteen categories into two sets. Four are decidable from a single value or a single complete document, with no outside state, and now call the functions a consumer would call. The other ten need something a schema validator does not have when it receives one parsed instance: the raw text before parsing, a real filesystem, a whole repository's file listing, a plugin registry, a transport limit, or render-time handling of prose that legitimately quotes a script tag. Those ten are documented and named after the consumer responsible, not tested in a way that pretends otherwise. A new test asserts that the two sets partition the fourteen with no gap and no overlap. No expected outcome changed, so parity with the other language's validator was unaffected.

## What we cannot say

Our records do not say whether a bad release ever shipped because the catalogue was inert.

## A question to ask your own gates

For each check that gates a release, ask what would turn it red, and then make that thing happen once on purpose. If you cannot name a change that fails the check, or the only changes that fail it are changes to the check, it is not protecting anything. Then ask who reads its output. A catalogue nobody imports and a script npm never runs are the same failure from two directions.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
