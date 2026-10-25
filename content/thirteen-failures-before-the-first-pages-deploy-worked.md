---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a17138-2dd4-7b06-a4d6-3273e1febcdf
kind: article
title: Thirteen failures on the way to our first Pages deploy
description: Thirteen refused deploys in three days taught us to measure a CI provider's tokens, digests and uploads on a real runner before writing any validator for them.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- github-actions
- github-pages
- oidc
- testing
- incident
status: draft
publishAfter: '2027-01-01'
createdAt: '2026-10-25T04:01:09.000Z'
slug: thirteen-failures-before-the-first-pages-deploy-worked
redirects: []
extensions: {}
---

On 2026-10-03 we found that no production publish had ever completed. Two faults on our side explained it: our edge was turning away GitHub's runners, and the workload-identity settings our API needs had never been delivered to production. Once those were fixed, the real chain ran for the first time and GitHub started refusing us. Between 18:33 UTC that day and 13:15 UTC the next, we pushed twelve fixes (and one commit that only added logging) to the publish toolchain, one for each way the Pages deploy leg failed on a real GitHub runner. A thirteenth arrived on 2026-10-05. Ten of the thirteen were a value or behaviour of GitHub's that we had assumed instead of measured. The other three were mistakes in our own code, which the same real runs exposed. Here they are in the order they happened, then the rule we drew.

## The thirteen, in order

1. **The token host.** We pinned a list of the hosts GitHub's Actions token endpoint uses. GitHub rotates the runner shard behind that address, and a deploy was refused for a host called `run-actions-3-azure-eastus`. The list became a grammar: https, no port, no credentials, one lowercase label under GitHub's domain.
2. **The token request path.** We expected one shape of request path. The newer shards use another: a number, an empty segment (two slashes in a row), `idtoken`, then two UUIDs.
3. **The bearer's size.** We capped GitHub's runner bearer at 4,096 bytes. A job that deploys to Pages carries one of 4,128. The cap is now 32,768.
4. **The digest's format.** GitHub's upload action reports a SHA-256 as bare hex. We compared it with a `sha256:` prefix and refused two identical digests.
5. **The token's name.** Our deploy step read `GITHUB_TOKEN`. Every step in the workflow exported `GH_TOKEN`, so nothing set the one we read.
6. **What the digest covers.** The same action's digest is of the zip it stores, not of the tar inside. We were comparing it with the tar.
7. **Key order.** Our API wrote the generation marker with sorted keys, the adapter wrote it in declaration order, and the same values produced different bytes and a digest mismatch.
8. **The build version.** GitHub's deployment call answers 200 only when the build version is a real commit of the repository, the run's head. Any other 40-character hex value answers 404. We had been sending a synthetic hash, which could never deploy.
9. **A reserved name.** We passed the toolchain's commit to the adapter as `GITHUB_WORKFLOW_SHA`. A step cannot override that name, and in a reusable workflow it holds the caller's commit, so every deploy refused its own token before it called GitHub.
10. **A timer.** The poll's sleep used an unreferenced timer. Node exited with code 13 in the middle of the first real poll, right after GitHub had accepted the deployment.
11. **Compression.** Pages processes a standard, zip-wrapped artifact holding an uncompressed tar. A gzip tar fails. A raw upload sits queued forever.
12. **Directory entries.** A tar of file entries alone, with empty owner names, is refused with "Deployment failed". The same files with directory entries and `root` names deploy.
13. **Eventual consistency.** After we uploaded a file, reading it back by id returned 404 until GitHub's REST view caught up. We now retry for up to 61 seconds, and never retry a 200.

A test site went live at 13:18 UTC on 2026-10-04, on the toolchain from the twelfth fix, with nobody clicking anything: our recovery job had re-pinned and republished its failed first publish by itself. The thirteenth failure surfaced the day after, which makes the title slightly generous.

## Why our tests passed

All thirteen were found by real GitHub runs, none by our test suite. For the first four (the host, the request path, the bearer's size and the digest's format) we checked why the tests had not caught them: our fixtures had been written from the same assumptions as the code, so each test confirmed the guess. A fixture that agrees with its code tells you the code is consistent. It says nothing about GitHub.

The failures also cost more than they should have. A run that fails leaves its operation in a terminal state. "Re-run failed jobs" reuses the first attempt's artifacts and is refused by design. A toolchain fix reaches a site only through a new pin in the site's workflow, so validating each fix took a toolchain commit, a pin bump and a fresh repository to publish from. Existing repositories on the old pin simply read as not set up. That is how twelve fixes took nearly nineteen hours: each one needed its own round trip to find the next.

## The rule

Measure the value on a real runner before you pin it. We now put a scratch workflow in a throwaway repository that prints only the structure of whatever GitHub gives us: lengths, character classes, the keys of a JSON object. It never prints the value itself, since some of these values are credentials. Then we write the validator.

Four smaller rules came with it:

- When a leg has never run in production, run its real code in a scratch repository before asking anyone to click anything.
- When one closed limit breaks, audit every sibling limit in the same path in one pass instead of waiting for each to fail. The bearer cap and three sibling ceilings in the same path went up together.
- Give opaque values generous memory bounds and keep the structural checks exact. We moved the bearer cap from 4,096 to 32,768 bytes and changed none of the character-class or token-shape checks.
- Log the provider's refusal, redacted. Our journal keeps only the class name of a failure, by contract, and that left a production refusal invisible until the kernel also printed GitHub's message to the job log.

If you are about to write a validator for something a CI provider hands you, whether a token, a digest or an upload, write the scratch workflow first. It is cheaper than finding the answer one failed deploy at a time.

To run a publish on a site of your own, the start flow is at https://app.galascribe.com/
