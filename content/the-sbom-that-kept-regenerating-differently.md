---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740c-9f9a-75ff-bd57-0ad069e2fde5
kind: article
title: The SBOM that kept regenerating differently
description: Committed SBOMs diverged between laptop and CI three times in the themes, then lost data under a UUID path; here is what we changed and what a 1-in-3 drift was.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- sbom
- ci
- determinism
- supply-chain
status: draft
publishAfter: '2027-03-28'
createdAt: '2026-10-25T17:12:26.000Z'
slug: the-sbom-that-kept-regenerating-differently
redirects: []
listen:
  audio: assets/listen/the-sbom-that-kept-regenerating-differently.mp3
  durationSeconds: 390
  format: conversation
extensions: {}
---

The commit message for 2026-09-26 says our theme SBOM had "diverged between a local machine and CI three times running". The same kind of commit, "Regenerate the SBOM from a normal checkout", then appeared again on 2026-10-08, 2026-10-10, 2026-10-12 and 2026-10-22, across the site template, the publish toolchain and the schema package. We had a generated file that we committed, and we could not regenerate it identically in two places.

An SBOM, a software bill of materials, is a JSON list of the components a package contains. We commit one next to each package and a freshness check regenerates it and compares. That only works if regeneration is repeatable.

## The theme SBOM described the wrong package

The default theme committed an SBOM file. It was produced by a CycloneDX tool scanning the theme tooling's own lockfile, and it was attributed to the theme's identity. That was the mistake, before any drift: the file described another package's development tree under the theme's name.

The drift followed from it. The theme tooling commit of the same morning says the design "repeatedly diverged between a local machine and CI for reasons traced to which cyclonedx-npm/cyclonedx-library release a lockfile scan happened to resolve to, not to anything about the theme".

The fix removed the input we did not own. A theme's SBOM is now built from nothing but the theme's own name and version: zero dependency components in the output, no tool invocation, no node_modules, no lockfile read, so it cannot differ by environment. The check asserts that generation is deterministic instead of diffing against a committed file. The theme's SBOM is no longer committed at all; the release workflow generates it and uploads it as a build artifact. The same commit pinned `ignore-scripts=true` so a local install and CI's install behave the same, and gave the tooling its own CI, so that the producer verifies its own artifacts and does not rely on downstream themes to notice a regression.

The same morning's theme commit also fixed a neighbouring fault of the same family: the theme's metadata carried a package field at 2.0.0 while its package file had moved to 2.1.0, which would have thrown a `THEME_CONTRACT_IDENTITY_MISMATCH` for any consumer that read identity from it. A new check catches that class.

## The SBOM that lost its root component

The packages that do have real dependency trees kept their committed SBOMs, and those drifted for a different reason. On 2026-10-21 the publish toolchain's freshness check was changed to name its cause instead of reporting "stale". The commit has no message body, but the code comment explains it: `npm ls` masks path segments that look like tokens, a UUID directory for example, as `***`. The CycloneDX tool then cannot read the root package file, and the regenerated SBOM silently loses the root component's description, its engine constraints and its `private` flag.

Nothing about that looks like a bug. It looks like the file is out of date, and the obvious response to an out-of-date generated file is to regenerate and commit it, which commits the degraded one. The check now compares the path npm reports with the real path and, when they differ, fails with a message that says npm masks token-like segments and to run from a path without a UUID.

On 2026-10-22 we hit the schema-package version of it. The 3.18.0 commit is titled "regenerate the SBOM from a normal checkout (the previous one lost the root package metadata)". The site template had its own on the same day: "Regenerate the SBOM so the release gate's freshness check matches the committed file". Our records do not say whether a degraded SBOM was ever released. We have no reliable total for what this cost. As of 2026-10-25, about 12 commit subjects in the publish toolchain, 11 in the schema package and 8 in the site template mention the SBOM, and not all of them are regeneration commits.

## The drift that was a README

A review reported that theme digests drifted about one run in three between two absolute paths, for "identical" content. That sounds like path dependence, the same family as the SBOM trouble. The theme tooling commit on 2026-09-25 records what we did before changing any code. We ran the path-independence test 30 times in a row and the full suite 15 times, including concurrent `npm pack` runs from other test files. There were zero failures. We then read the digest code from end to end and found no path, working directory, timestamp or ordering input.

The cause was content. A README is part of every theme's npm tarball, so it is part of the digest, exactly as a stylesheet is. Two checkouts that looked identical but had different READMEs legitimately produced different digests. The system was working. We documented it and added a test that locks in the real behaviour: editing the README changes the digest, so the next person is not sent hunting for a path bug.

## What you can use

- Commit a derived artifact only if its inputs are your own and it regenerates byte for byte anywhere. If it describes someone else's tree, generate it in their repository.
- When a freshness check fails, make it say why. "Stale" sent us to commit a degraded file; a message naming the environment would have sent us to move the checkout.
- Before fixing a flaky thing, reproduce it dozens of times. We ran the path test 30 times and the full suite 15 times, found no failure, and learned that the two inputs differed.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
