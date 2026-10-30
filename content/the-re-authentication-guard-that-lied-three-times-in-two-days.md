---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740d-15e6-7810-8042-5921369f15ab
kind: article
title: The re-authentication guard that lied three times in two days
description: 'A sessionStorage mark meant to stop a sign-in loop misreported its own state in three layers. The fixes: a required id, an expiry and proof of completion.'
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- authentication
- state
- frontend
- review
status: draft
publishAfter: '2027-04-04'
createdAt: '2026-10-25T17:12:57.000Z'
slug: the-re-authentication-guard-that-lied-three-times-in-two-days
redirects: []
listen:
  audio: assets/listen/the-re-authentication-guard-that-lied-three-times-in-two-days.mp3
  durationSeconds: 407
  format: conversation
extensions: {}
---

At 23:54 Pacific on 2026-09-26 we committed a fix to a guard that was supposed to stop an endless "Confirm it's you" loop. By 01:12 the next morning, 77 minutes later, three more commits had landed, each fixing a way the previous one still told the screen something false.

The guard is small to describe. When the API refuses a request with `REAUTH_REQUIRED`, the App offers a reconnect with GitHub. If the person completes it and the very same request is refused again, we must not offer the same button forever. So before sending someone through GitHub we write a mark in `sessionStorage` saying "we tried". If the same refusal comes back and the mark is there, the screen shows a terminal panel instead of the button.

That is a little state machine with one bit in it, and we got the bit wrong three times.

## Lie one: the mark belonged to the route, not the caller

The first version keyed the mark by route. But the publication's Source screen mounts several refusal surfaces on a single route: the bind step, the installations read, plan and confirm, and a step-up affordance on the publish card. They all shared the one mark. Confirming from any one of them silently marked, or unmarked, every other one on the page as exhausted. The step-up affordance did something worse: it deleted the mark on mount, whether or not its own button was ever pressed.

The 23:54 commit keyed the mark by route and by an attempt id, and each call site named itself: bind, installations-read, plan-confirm, revoke.

## Lie two: the id was optional, and the mark never expired

An independent review of that commit found three more problems, and the 00:29 commit fixed them.

- The attempt id had a default. Any screen that forgot to override it shared a mark with its neighbour, which was exactly the bug we had just fixed. The id became a required prop, so the type checker refuses a call site that names none. We added a structural test that scans the source tree for two literal ids colliding in one file.
- A confirmed mark never expired. A call site that succeeded on retry still read as exhausted at its next, unrelated refusal. Marks got a timestamp and a bounded lifetime.
- The terminal panel's copy claimed the refusal "is not about how recently you signed in". That was true when GitHub had refused our stored authorisation, and false for an ordinary session that had simply aged out again. We cut it back to what is known whatever the cause.

The same commit changed something on the server's side of the contract. When GitHub itself refuses Galascribe's stored authorisation for a repository read or a bind, the API now answers `503 CAPABILITY_UNAVAILABLE` rather than `401 REAUTH_REQUIRED`. Three GitHub-credential calls on the Source screen (listing installations, listing repositories, creating a binding) had had no handling for that case beyond a generic "capability not available in this release" state. That message was false, because the feature worked and one GitHub call was refused, and for the bind it took over the whole screen.

## Lie three: "started" was read as "completed"

The 00:45 commit begins with a production sequence, and it is the clearest illustration of the whole problem:

1. A reader pressed "Continue with GitHub" on a refused installations-read panel. That wrote the mark.
2. The API's OAuth callback itself failed and redirected to the sign-in screen with an `unavailable` outcome, signing them out.
3. They pressed "Continue with GitHub" on the sign-in screen, a plain and unrelated sign-in. It worked and resumed the route.
4. The installations read was refused again. The mark from step 1, still inside its lifetime, made that refusal look terminal, though no ceremony had ever finished.

The mark meant "we sent them to GitHub", and the panel read it as "they came back and it did not help". The fix made the distinction explicit. A mark now means "started" until something can prove its own round trip succeeded, and only "completed" can ever read as exhausted. Starting writes the mark plus a single pending-completion pointer. Only the sign-in screen's authenticated resume step, the one place that can observe a round trip actually succeeding, promotes the pending mark to completed. Landing on sign-in with any of the four failure outcomes discards every mark outright, because each of them means the ceremony did not complete. We also reworded the `unavailable` copy, which had named GitHub specifically, since the API uses that outcome as a catch-all for its own internal failures too.

A second independent review still found three gaps, and the 01:12 commit closed them. The collision scanner matched only string literals, so ids passed as a variable went unscanned, and it compared ids within one file though a route's consumers span several. It now fails on any non-literal id unless an explicit allow-list names it with a reason. The pending pointer and a completed mark had shared the same ten-minute lifetime, so an abandoned ceremony followed by an ordinary sign-in could still be promoted for that long; the pointer now expires after five minutes and the completed mark keeps its ten. And pressing Refresh on a terminal panel flipped it back to a loading skeleton, because the query library clears an error when a refetch starts, which read as a recovery and silently discarded the mark. The read now keeps its last classified failure until the fetch settles.

The commit is honest about what remains: the residual gap that only an API change can close is now five minutes wide instead of ten.

## What it cost, and what we would reuse

How many people saw the loop is not stated in our records. The commits credit independent review for the second and fourth rounds; whether the production sequence above came from a real session, we did not record. Wall-clock hours are also not stated, beyond the commit times above. The whole mechanism was later removed with the original UI on 2026-10-18; that deletion lists "the reauth ceremony" among what went.

What we would reuse is the checklist for any loop guard:

- **Who owns it?** A key that two callers can share will be shared. Make the owner a required argument, and test for collisions.
- **When does it expire?** A mark with no expiry is a permanent opinion about one past moment.
- **What proves the thing it guards finished?** "Started" and "completed" are different values. Only the second may trigger a terminal state.
- **Which path wipes it?** Every failure exit needs to clear it.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
