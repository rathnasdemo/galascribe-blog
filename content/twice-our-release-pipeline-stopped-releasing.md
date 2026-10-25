---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740c-9f9d-7d3c-9bce-d50b65bf23f9
kind: article
title: Twice our release pipeline stopped releasing
description: On 2026-10-11 a schema release commit and a theme tooling release each removed the npm publish step; the fix took 4 hours 47 minutes in one case.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- releases
- npm
- ci
- incidents
status: draft
publishAfter: '2027-03-12'
createdAt: '2026-10-25T17:12:26.000Z'
slug: twice-our-release-pipeline-stopped-releasing
redirects: []
extensions: {}
---

At 14:53 Pacific on 2026-10-11 we committed "release: add generation 4 theme contracts" to the schema package. The commit had no message body. Its diff to the release workflow removed the job that publishes to npm. At 19:40, 4 hours 47 minutes later, a commit titled "Restore the npm publish job in the release workflow so 3.8.0 is published with provenance" put it back.

The same evening, a second repository family went through the same mistake from the other direction. So this is two incidents on the same day, with a shared shape.

## Incident one: the release commit that could only package

Our schema package releases from a workflow that runs on pushes to the paths that go into the npm tarball. Before 14:53 that workflow had a single job named publish. It ran the full verification gate, skipped publishing a version already on the registry, checked that the CHANGELOG had an entry for the version, published with provenance, and tagged the release.

The generation 4 commit renamed that job to package, and the new job validated the declared version and ran `npm pack` into a directory. The environment, the OIDC permission, the registry configuration, the version-reuse check, the CHANGELOG check, the publish step and the tag step were all gone from the diff. We can see how it happened: the commit touched 69 files and added more than 22,000 lines, and the workflow change was a small part of it. After that commit, a push built a tarball and nothing went to the registry.

The restore took three commits in 18 minutes. The first put the publish job back. The second, at 19:42, allowed the workflow to be dispatched by hand, because pushing to trigger it had stopped being the only way we needed to start it. The third, at 19:58, required the publish step to run after the gate and after the version-reuse refusal, so the ordering was explicit again. We can say the schema 3.8.0 publication was delayed by that gap, since the restore's own title says it was the thing being restored. Whether anyone tried to consume an unpublished 3.8.0 in the meantime is not stated in our records.

## Incident two: the safety rule that forbade the thing it protected

The theme tooling is the package every theme repository uses to verify and release itself. Its 0.5.0 release added an integrity-checked, source-only copy of the schema package, the site template and all six themes, so that package and lock metadata could not resolve a sibling checkout or a mutable registry version. Its tests then asserted that no theme release workflow carried npm publish authority, and its CHANGELOG stated "no npm publication is introduced".

That was wrong, and its own next changelog entry says so plainly: removing the publish job was "wrong: the themes are published to the registry from their `release.yaml`". The 0.5.1 commit, at 20:45 that evening, installs the schema package at 3.8.0 and the site template at 4.0.0 from the registry, drops the themes as dependencies, and changes the tests from forbidding the publish job to requiring it, along with its ordering: already-published check, verify, clean working tree, pack, provenance dry run, publish.

The cost shows in the history. At 18:08:48 and 18:08:49 on 2026-10-11, one commit in each of the six theme repositories restored the publish job with the same message, "Restore the npm publish job for the 4.0.0 release". The commits landed within a second or two of each other, which looks scripted; a sixth theme repository got its restore in a commit with a longer subject, also at 18:08:49. The restores came before the tooling fix, so the themes were repaired one at a time while the tooling still forbade the job. The site template followed at 20:19 with its own: "Consume schemas 3.8.0 from the registry and restore the publish job".

The 0.5.0 changelog gives the aim of the vendored set but does not say why it also removed the publish job; the reason is not stated in our records.

A smaller version of the same mistake showed up two days later, on 2026-10-13. The site template had an exact peer dependency on schemas 3.10.0. That is a tight rule, and it stopped consumers from taking the additive 3.11.0. The fix, template 4.2.1, relaxed the peer to `^3.10.0` while the lockfile still installs 3.10.0. A rule that blocks an additive release is guarding against something that is not a break.

## The skip that came back as a failure

One more piece of history belongs here. On 2026-09-25, a push that touched release paths without bumping the version had been changed from a red run into a clean skip with a notice. The commit gave a reasonable argument: such pushes are "a normal occurrence, not a mistake, and shouldn't leave the workflow red". It also left a hole: a push that forgot the bump now ended green with the content unpublished, and a notice is easy to miss.

On 2026-10-23, at 23:28, we reversed that. The release workflow now checks, before install and before the gate, whether the version is on npm. A push that touches a packed path without a new version fails with an error naming the packed paths and the bump instruction. A dispatch of a published version fails, and so does a version that is not newer than the newest published one. Releases run from main only, npm runs with `--ignore-scripts`, and after publishing the workflow polls the registry and compares the registry tarball's sha256 with the one from the pre-publish pack, writing both to the job summary. The path filter that triggers the release is now exactly the set of packed files. The change aligned this workflow with a release convention shared with the publish toolchain, the site template and the themes.

## What we do differently

Two rules, neither complicated.

First, a release pipeline needs one test that it still publishes. Not that it builds a tarball, but that the publish job exists, runs after the gate, has the permissions and the environment it needs, and runs the command that sends the package to the registry. The 0.5.1 tests now do this for the themes by requiring the job and its order. Check what your workflow's shape test asserts. If it can pass with the publish job deleted, it is a packaging test.

Second, when you tighten a safety rule, run it against the thing it protects. A rule that says "no publish authority here" is easy to write and easy to satisfy by never releasing.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
