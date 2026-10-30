---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740c-9f94-7b6e-a3a9-5089d6264448
kind: article
title: Red on every push for eight days, and nobody looked
description: A CI run stayed red from 2026-10-01 to 10-09 and hid every test behind its first failure. What we found when we read it, and what we now list when we cut CI.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- ci
- testing
- security
- gates
status: draft
publishAfter: '2027-02-26'
createdAt: '2026-10-25T17:12:26.000Z'
slug: red-on-every-push-for-eight-days-and-nobody-looked
redirects: []
listen:
  audio: assets/listen/red-on-every-push-for-eight-days-and-nobody-looked.mp3
  durationSeconds: 353
  format: conversation
extensions: {}
---

The commit that finally turned our publish toolchain's CI green again, on 2026-10-09 at 10:00 Pacific, contains a sentence we are not proud of: that failure "has turned the CI run red on every push since 2026-10-01, and the run stops there, so the repository-level tests behind it never run."

Eight days. Every push, red. And because the first failing job ended the run, the larger suite behind it had not executed once in that time. The gate was not failing loudly. It was failing in a way that made it a disabled gate with a red light on.

## What the one failure was

A helper in the toolchain, when it runs on GitHub Actions and sees the runner's commit in its environment, returns that real commit. A test of the helper's local stand-in, meant to run outside a git working tree and produce a `sha256:` stand-in value, therefore got `sha1:` plus the runner's commit and failed. Locally it never failed, because the environment variables are not set on a laptop.

The fix was to pass the test an empty environment, as its neighbour already did. One line of intent. The cost was in the eight days around it.

## It was not the first gate to mislead us

A week or so before, in the infrastructure code, we had found a gate that was not doing what we thought three times in four days, between 2026-09-22 and 2026-09-25.

**A lock file that only knew one laptop.** The provider lock file held a single hash per provider, recorded on the owner's Mac. The Linux runners on GitHub Actions download a different package for the same provider version, whose hash was not in the file. Our check runs initialisation in read-only lock mode, so it refused rather than adding one. We had never seen it fail locally because, in the commit's words, "local runs stayed green only because" the working folder already held the macOS package. The 2026-09-22 fix regenerated the lock for both platforms and added a guard: before initialising, the gate re-runs the lock command and fails, naming the fix, if it would change anything. One of our own validation scripts had also asserted exactly one hash per provider, which would have forced every lock file back down to a single platform. That assertion went too.

**A scanner that had never run.** Later that day we found that the secret scanner had never actually run in the gate. The commit says the gate "never reached the gitleaks step until now (an earlier gate failure always stopped the run first)", so nine matches in the secret-handling tests had gone unnoticed: decoy private keys, a malformed base64 payload and marker tokens that the assertions prove never leak. We marked each of the nine with an allow comment on the exact matched line, rather than allowing a path or a rule, so a real secret landing anywhere else in those files would still fail.

**A crash that skipped half the gate.** On 2026-09-25 a test in the infrastructure suite crashed the whole OpenTofu test process before it wrote a summary. The next script threw "expected exactly 1 test_file events, observed 0", the gate script's `set -eu` exited on the spot, and everything after it was silently skipped: three adoption tests, six droplet forced-command suites and the convergence suite. The fix to the test was ordinary. The fix to the gate was the point. Every stage became a named function run in its own subshell; failures accumulate instead of ending the script. After the change, a full run reached every stage to the end and reported one real remaining failure, "instead of exiting after the ~15th of ~30 stages". A red gate now lists every failing stage.

## The scan we moved to nightly

During a CI split on 2026-09-22, the secret scan became nightly-only. That afternoon, at 13:38, we put it back on every push in both the infrastructure code and the API, as its own parallel job in addition to the nightly run. The message is short and direct: "a leaked secret sitting on main for up to 24h is unacceptable".

Restoring it cost something. In the API it needed a narrowly scoped ignore file for two pre-existing false positives, a domain constant name and a structured log statement, matched by exact historical fingerprint only. Later, in the App, the same scanner flagged a payments provider's publishable key, which is public by design, and a claim-test fixture line that had moved. Separately, on 2026-10-21 one commit allowlisted nine dependency advisories in one go. Every one of those entries is a place where a real problem could hide later, and whether the reason survives next to each is the difference between an allowlist and a blind spot. The commit above that annotated nine fixtures shows what we want: one exact line, with a stated reason. The two App commits just mentioned are subject lines only, and we are not going to defend them.

Whether anyone was reading the red during those eight days is not stated in our records, and neither is how many runs failed.

## What you can use

- **Treat a build that has been red for a day as an incident,** not a mood. Eight days of red is a policy that nothing behind the first failure is tested.
- **Make the gate run every stage and count failures.** `set -e` at the top level turns the first failure into a veto over everything after it. Run stages in subshells, collect the statuses, exit non-zero at the end.
- **When you cut CI cost, write down which guarantees moved from every push to daily.** For us it was the secret scan, and we put it back the same day.
- **Allowlist by exact line or fingerprint, and put the reason next to the entry.**
- **Run your gate from a fresh checkout on a clean runner image** before believing it. The lock file and the revision test were both green only on a machine that differed from the runner.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
