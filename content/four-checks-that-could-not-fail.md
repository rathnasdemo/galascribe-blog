---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740d-15d7-7018-bb18-eaae490d9207
kind: article
title: Four checks that could not fail
description: 'Four of our gates went green while checking nothing: an unstyled page, skipped gradients, a verifier restored in 45 seconds, a key search that found itself.'
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- testing
- ci
- accessibility
- gates
status: draft
publishAfter: '2027-02-21'
createdAt: '2026-10-25T17:12:57.000Z'
slug: four-checks-that-could-not-fail
redirects: []
listen:
  audio: assets/listen/four-checks-that-could-not-fail.mp3
  durationSeconds: 351
  format: conversation
extensions: {}
---

Our shared accessibility and visual harness for the themes rendered a fixture page, ran axe over it and took a light and a dark screenshot. On 2026-09-25, at 21:17 Pacific, we committed the fix for the fact that it had never seen a single one of our styles.

That was the first of four checks in our own tooling that could not fail. None of them was exotic. Each one was green for a reason that had nothing to do with the thing it was meant to guard.

## The page with no stylesheet

The harness opened the rendered fixture straight from disk, over `file://`. Our template writes root-absolute asset links: a stylesheet `href` starting with a slash, and a bootstrap script `src` the same. Over `file://` a slash means the root of the filesystem, so every stylesheet and the script returned a 404. Nothing complained. The browser fell back to its default styles, the page rendered with the browser's own styles only, so axe's findings were meaningless, and the light and dark screenshots came out identical.

The identical screenshots were the visible symptom. A green axe report on a page with no theme is not a result. It is a measurement of the browser's defaults.

The fix itself was small: serve the render output from a loopback-only HTTP server on a random port, with correct content types, and navigate there. The part we would repeat anywhere is what we added next. On every run the harness now asserts three things about itself:

- at least one theme stylesheet came back with a 200;
- a computed style on the publication's root element differs from the browser's default for that property;
- the light and dark screenshots differ in bytes.

The same three assertions are repeated independently in the test, so the harness cannot quietly stop checking its own eyesight. The same commit also fixed a test that passed the wrong working directory, which made the end-to-end case crash to "0 screenshots" instead of running. A check that reports zero of something and exits is another way to look green.

**The gradient that was skipped, and read as a pass.** Our contrast checker measures text against its background. When the background was a gradient, it did not measure anything; it printed `SKIPPED`. A skip next to a column of passes reads like a pass, and the tooling's changelog is plain about it: "Previously every gradient was skipped."

Version 0.4.0, released 2026-10-10, measures a text colour against every colour stop of a gradient and reports the minimum as the pair's ratio, naming the worst stop. A gradient it cannot read stays `SKIPPED` with the reason, and is never counted as a pass. Six minutes after the checker learned to read gradients, a commit in our default theme darkened the end stop of its light panel gradient "so panel text meets 4.5:1". The commits do not say that the checker found it, only that the two landed together. The ratio before the fix is not stated in our records.

## The verifier restored 45 seconds later

On 2026-10-08 at 17:59:51 we added a verification step to the user-site template for a new reader-interactions configuration file. At 18:00:36, forty-five seconds later, came the next commit, titled "Restore strict schema validation in verify script". The word "restore" suggests the first version validated less strictly than it should have. Neither commit has a message body, so what the first version let through, and why we wrote it that way, is not stated in our records. We include it because the fix was the right size for the mistake: forty-five seconds, caught by us rather than by a user.

## The key search that found itself

The last one sat behind a large deletion. On 2026-10-18 we deleted the original UI from the App: 398 files changed and 73,390 lines deleted, including 136 test files and 1,169 hand-authored message keys that nothing referenced any more.

Ten hours later, at 21:28 that day, we committed a fix to the gate that is supposed to stop dead message keys accumulating, which had been blind. The check counted a key as referenced when it appeared in its own defining messages file. The one file that holds the American English strings was excluded from the search, but the other message files were not, so every key in them found itself and counted as used. Fixing the gate to leave every file under the messages folder out of the search, and naming the single prefix the code builds at run time, exposed 219 unused keys. Of those, 196 were the keys of the platform message file belonging to the removed UI, which we deleted. The other 23 were scattered through the editor, comments, domain, organisations, platform overrides, prism and landing copy.

## What we do now

Three habits came out of the four:

1. **Make the gate prove it is looking at the real thing, every run.** A stylesheet that loaded, a style that differs from the default, a screenshot pair that differs. Cheap, and they fail loudly if the setup rots.
2. **Give "I could not check" its own outcome, and never count it as a pass.** `SKIPPED` with a reason is fine; `SKIPPED` rolled into the green total is not.
3. **Feed the gate a known failure before you trust a green.** Plant a dead key, a gradient with a pale stop, an invalid config, a page with no CSS, and watch the gate go red. If it doesn't, you have found the next one of these.

A gate you have never seen fail is a hypothesis about the gate, not a result.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
