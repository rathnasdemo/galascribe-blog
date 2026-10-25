---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740c-9f9f-71fd-849e-e06eaba35faf
kind: article
title: What 3,000 commits say about how we fail
description: Across more than 3,000 commits in 16 repositories, our mistakes fell into 13 recurring classes; each now has one question we ask before shipping.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- engineering
- retrospective
- testing
- incidents
status: draft
publishAfter: '2027-04-25'
createdAt: '2026-10-25T17:12:26.000Z'
slug: what-3000-commits-say-about-how-we-fail
redirects: []
extensions: {}
---

On 2026-10-25 our 16 repositories held 3,130 commits made since 2026-09-15 (counting every branch; an earlier count by commit subject gave 3,070). Six Claude agents, one per group of repositories, searched the subjects for fixes and read many of the bodies in full; we checked their counts against git before writing this. We expected a long list of different bugs. What we found was 13 kinds of mistake, made again and again in different places.

This post is the map. Each class has a count and a date range, one case in a sentence and, where one exists, the post that tells it properly. The counts come from keyword matches on commit subjects, not from a database, so they are marked "about" and are upper bounds: a match counts any commit that mentions the word. We opened at least one commit for every class. Everything is as of 2026-10-25.

## How we fail, in classes

**Gates that cannot fail.** Four or more cases in the publish toolchain, 2026-09-25 to 2026-10-08, and about eight silent no-ops in the infrastructure code, 2026-09-20 to 2026-09-25. Our compatibility catalogue listed 21 contracts and 46 pairings, all pinned at version 2.0.0 since its introduction while the package moved through eleven minor releases, and its checker only compared the catalogue to itself. We deleted it. On 2026-09-20 we also converted 16 shell guards of the form `${VAR:?}` into explicit non-zero exits. See The compatibility check that only checked itself, Four checks that could not fail and A green deploy with every secret empty.

**Silent fallback on an empty result.** About 6 commits in the API, 2026-09-27 to 2026-10-05. A lookup of the kind of a change ran outside a tenant transaction, so row-level security returned zero rows, and the fallback quietly treated every content change as a different kind of change. See No rows, or not allowed? Three ways row-level security fooled us.

**Passed locally, failed on the real host.** About 12 fixes in the infrastructure code, 2026-09-22 to 2026-09-26, and a run of them in the App, 2026-09-16 to 2026-09-25. On 2026-09-25 the verification pass of our privilege manifest stopped production's infrastructure run with "permission denied" on a schema, because the role that runs it holds nothing there. Our local harness used a superuser, which bypasses every ownership check. See The first production deploy: eight layers, each hiding the next and Passed locally, failed on the first real hostname.

**Derived artifacts that drift.** About 12 commits touching the software bill of materials in the publish toolchain, about 11 in the schema package, and 16 hand-regenerations of the privilege manifest between 2026-10-03 and 2026-10-23. A small case: editing an OpenAPI example value changed a digest recorded in the schema inventory, so the inventory had to be regenerated. See The SBOM that kept regenerating differently, 93 copies, 13 had drifted for the copy-paste version of the fault, and A cache key must include the judge for a cache that forgot what produced its answers.

**Pinned counts.** About 47 commits in the API maintain tests that pin a count, 2026-09-17 to 2026-10-23; the two most pinned files were touched 140 and 112 times. On 2026-09-18 one new migration changed the tail of the changelog, and three rollback tests each needed their count raised by one. See The test that counts migrations. The caller-and-lock version of the fault is The callers moved and the locks did not.

**Cron treated as a clock.** Three commits in the outreach tool, 2026-10-21 to 2026-10-23. On 2026-10-21 GitHub fired three scheduled send jobs three to four hours late and dropped two, so we replaced them with a job every 30 minutes across a window. The blog scheduler story, We built the blog scheduler three times in four days, has the same root.

**Success words before verification.** App, 2026-10-08 to 2026-10-21. The App could say a post was Published before the site was live. On 2026-10-08 the screen was changed to say Waiting to publish, Publishing, Couldn't go live or Not confirmed live, from what the site read back.

**The reason lost on the way to a human.** At least 8 commits in the API, 2026-09-16 to 2026-10-23. A missing database grant and a row-level security refusal both arrive as the same SQL error code, which our code filed under CONTRACT_VIOLATION, so an operator went hunting for a code defect when the fix was a migration. See The redactor ate the evidence.

**State kept outside the tool.** About 5 commits in the infrastructure code, 2026-09-20 to 2026-09-26. On 2026-09-25 production's DNS records were deleted and re-created by hand, so the next apply tried to create all six again and the DNS provider refused them as duplicates. See Hand edits to production that Terraform could not see.

**Hard limits found by hitting them.** Four cases in the infrastructure code. Our host provider caps boot configuration at 64KB, and ours measured 154,212 bytes on 2026-09-22. See Sixty-four kilobytes: the boot script that kept hitting a hard limit.

**References to state that does not exist yet.** Publish toolchain, 2026-10-21 to 2026-10-23. On 2026-10-22 we reverted an adapter version that had been pinned before it was published to npm, so every site deploy failed with `DEPLOY_ADAPTER_VERSION_MISMATCH`.

**Gates that pipeline changes and automation walked around.** API, 2026-09-22 to 2026-09-26. A CI split moved the secret scan to nightly only; we restored it to every push because, as the commit says, a leaked secret sitting on the main branch for up to 24 hours was unacceptable. See Six Dependabot merges, two majors, one revert.

**Rebuilt within days.** Four cases in the outreach tool, 2026-10-20 to 2026-10-25. The sharpest is the blog scheduler: a runner of 1,329 lines was added at 09:37 Pacific on 2026-10-24 and 1,326 of them were deleted 3 hours 44 minutes later. We opened the scheduler's commits; the other three cases come from the agents' notes.

## The questions we ask now

One per class, kept short because a long checklist is not read. These are the questions we ask ourselves, not rules a machine enforces. A check in code exists for only a few of them today: the schema package's build fails when two copies of a shared definition differ, the cache key for the draft checks includes a digest of the code that judges, and the secret scan runs on every push again. The rest are habits we have to remember.

- **Gates:** break the thing on purpose and watch the gate go red before you trust it green.
- **Silent fallbacks:** make an empty result an error, not a default, and test it with the real access rules.
- **Passed locally:** run the first-time path as the least-privileged identity production uses.
- **Derived artifacts:** regenerate in CI and fail on any difference, or do not commit the artifact.
- **Pinned counts:** derive the number from the source instead of typing it into a test.
- **Cron:** treat a schedule as a hint; compute what is due from state, and make the job safe to run twice.
- **Success words:** say a thing is done only after reading it back from where users will see it.
- **Lost reasons:** assert in a test that the specific code reaches the person who must act on it.
- **Outside state:** import it into the tool or forbid it.
- **Hard limits:** put the headroom, in numbers, into a check that fails before the limit does.
- **Unpublished references:** check the registry before any pin names a version.
- **Review bypass:** automation and pipeline changes go through the same gate as a person.
- **Rebuilt in days:** name the second user before you build the first version.

The most useful thing we did was read the whole list at once. A bug found alone is an accident; the same bug found again and again is a missing habit, and a habit can be written down. Pick the three classes your own history shows most, search your commit subjects for their keywords, and write the one question for each.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
