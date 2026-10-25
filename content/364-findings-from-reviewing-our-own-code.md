---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a17138-2dc2-7b4f-807c-814b049d898b
kind: article
title: 364 findings from reviewing our own code
description: Our 2026-09-25 review counted 364 findings (260 distinct) in six patterns, each one a search you can run on your own code.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- code-review
- security
- testing
- quality
status: draft
publishAfter: '2027-01-17'
createdAt: '2026-10-25T04:01:09.000Z'
slug: 364-findings-from-reviewing-our-own-code
redirects: []
extensions: {}
---

The first finding in the API report was about an empty string. Our API read its polling intervals from environment variables with a default, written `${VAR:default}`, and Spring applies that default only when the variable is absent, never when it is present and empty. A deploy pipeline setting a variable to the empty string is ordinary, and ours had just done it. At nine places where a scheduled job reads its interval, one empty value stops the process from booting, and the same shape had stopped the API from starting that same day. We had fixed three classes and missed nine, because nothing checked for the pattern. That is the review in miniature: a rule that held in the cases we had tried, and that nothing enforced everywhere.

## What 364 means

On 2026-09-25 we finished a written review of every repository: eleven reports, each finding carrying a file and line, the standard it should meet, the consequence and a fix. The summary table adds up to 22 critical, 108 high, 148 medium and 86 low, which is 364.

Read that number with one correction. Our five theme packages are near copies of each other, and 26 findings (1 critical, 8 high, 11 medium, 6 low) are identical across them, so they are counted in each of the five reports. Count each of those once and the distinct total is 260: 18 critical, 76 high, 104 medium and 62 low. We lead with 364 because it is the number the table prints. The largest reports were schema with 48 findings and infra with 46; the API had 34, publish 32, the App 28, the template 19, and each theme package between 26 and 33.

The summaries are not grim. Each report has a "Verified sound" section, the API is called "a well above-average production backend" and infra "an unusually disciplined infrastructure repository". What the findings share is that the discipline was not enforced everywhere.

## Six patterns

**Gates that look like safety nets and are not.** The theme packages ran a digest check straight after the generator that rewrites the file it checks, so it could never fail. Their drift test skips when it cannot find its baseline, and in CI it never could; in Node's test runner a skipped test counts as a pass. Our infra check script stopped at its first failing stage on main, so the whole suite behind it, including the tests for the host's forced commands and SSH admission window, never ran. The schema package's compatibility catalog validated only itself; it was removed that day and left no backward-compatibility enforcement at all, and eleven minor releases had already shipped on hand-checked claims.

**Two sides of an interface configured separately.** A build of the App with its environment variable unset succeeded, deployed cleanly and produced a sign-in screen with no sign-in button, because the check that fails closed ran only at runtime. Our content-security policy carried a comment saying no inline styles existed, while a UI library in the bundle injects them, so the browser refused the styles that position menus and tooltips. We reproduced the violation live and widened the policy the same day.

**Set-but-empty versus absent.** The opening example. A worse sibling: an empty value for the management listener's address would bind an unauthenticated listener, meant for loopback, to every interface. It failed open, with no crash and no log line.

**Origin authenticity at the edge.** Cloudflare was set to Full, not Full (strict), the origin presented a self-signed certificate, and our firewall admitted all of Cloudflare's address ranges. An IP allowlist of a shared proxy is not authentication, because it admits every customer of that proxy, not only us. The fix is Authenticated Origin Pulls with an origin certificate. When the remediation closed on 2026-09-26, applying it to the live zone was still waiting on a decision.

**Decorative artifacts.** About 16,000 of the 25,377 lines in the schema package's source were unreachable from any declared export, and 20 MB of its 37 MB tarball was fixtures that nothing exported. Its adversarial corpus, presented as part of the package, was checked by about 60 lines of regular expressions in the test harness. Eleven of its fourteen categories never called the shipped validators, and the defences they described, such as active-content detection and reference-cycle detection, were not in the package's source at all.

**Documentation as a live hazard.** The themes' README and changelog claimed a tested accessibility property, a themed focus ring. The CSS set colour and width but no outline style, so the browser ignored both and drew its own default ring, and the contrast gate reported a pass for a colour that never reached a pixel. Stale remedies in error strings and runbooks were followed during real incidents.

Some findings fit no pattern; they were bugs. Our secret-redaction function, handed JSON containing a `__proto__` key, returned an object that printed clean while the raw credential stayed reachable on it.

## What we did with it

Remediation ran as one branch per repository, with commits per finding, and all eleven closed on 2026-09-26. The branches hold 364 commits between them, which matches the finding count only by coincidence: the per-repository numbers differ. We did not trust the first green. Each fix was checked by a second pass whose job was to show that a test fails when the fix is reverted, and that pass found several gates reported green that were red. Gates also went back to a fresh copy of the repository, because on 2026-09-22 three infra failures had hidden behind untracked local files and a reported fresh-copy pass had been false at least once.

Some items were deferred behind written plans: splitting the 4,530 lines that declare and carry out every write in the API, moving pending sign-in state from process memory into the database, 756 strict-mode diagnostics in the schema validators held behind a shrink-only allowlist, and narrowing outbound traffic, which our cloud provider does not publish narrow ranges for.

Three days later, on 2026-09-28, a second review looked at critical issues only and found six, five in the review itself and a sixth during live root-cause work. They were all lifecycle bugs across time, queues and boundaries: credentials in primary log messages, an expired authorization trusted indefinitely, tenants starved by capped discovery in three worker paths, events written with no delivery, a refresh herd on unknown key ids, and a second deploy intent that could omit the current generation. Each component had passed its own tests, and all six were fixed and deployed.

## Six searches to run on your own repository

1. Find `skip` in your CI configuration and ask what the skipped test was guarding.
2. Revert one recent fix and check that a test turns red.
3. Find every `${NAME:default}` where an empty value is possible, and decide what the empty value should do.
4. Find every allowlist described as authentication.
5. Compare what you publish with what your exports reference.
6. Pick one claim in your README and find the line that enforces it.

To set up a site of your own, the start flow is at https://app.galascribe.com/
