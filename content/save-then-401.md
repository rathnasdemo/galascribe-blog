---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740c-9f95-7754-9bdf-3b177729d198
kind: article
title: Save, then 401
description: On 2026-10-08 a publish step-up expired after a save succeeded, and the publish was refused. How we fixed the App, and why a longer window is not the answer.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- authentication
- ux
- publishing
- incident
status: draft
publishAfter: '2027-04-09'
createdAt: '2026-10-25T17:12:26.000Z'
slug: save-then-401
redirects: []
listen:
  audio: assets/listen/save-then-401.mp3
  durationSeconds: 371
  format: conversation
extensions: {}
---

The day of the incident, 2026-10-08, has a timestamp pattern that tells most of the story. At 01:45 Pacific, an API commit changed one number: publishing would now accept a sign-in "up to 12 hours old instead of 5 minutes". Six minutes later, at 01:51, the first of a run of App commits began. By 20:12 that evening we had changed what the word "Published" means.

Here is what had been happening, as far as the commit subjects let us reconstruct it. To publish, a person had to have signed in within the last five minutes. They could write for longer than that, save, and then be refused at Publish because the sign-in was now too old. Save, then 401. The refusal arrived after the work was already saved, which is the worst moment to be asked who you are, and the words on the screen did not always match what had happened.

## The App said things that were not true

The App commits from that morning have long subjects, and the subjects are the evidence. Reading them in order:

- "Say what really happened when a publish is refused, and keep unknown outcomes unknown." A refusal had been described with the wrong words, and some outcomes we did not know had been shown as if we did.
- "Confirm it's you during a publish, then resume the same publish automatically; refresh after every refusal; mint a new key for different ids." The security prompt now brought the person back to the same publish, under an idempotency key, rather than leaving them to start again.
- "Make the save-to-publish hand-off honest: reuse a saved change by looking it up, never show an empty publish list or a false all-live outbox, name sign-in failures, and keep a saved change saved when the review request fails."
- At 10:19, "Home's waiting list no longer claims everything is live unless the site is live".

Those phrases, "empty publish list", "false all-live outbox", are the bugs. Read together, they describe a hand-off that could show an empty publish list and could claim everything was live when it was not. The subjects also say a saved change is now looked up and reused, and stays saved when the review request fails; the bodies do not say what went wrong before.

## Checking before the work, not after

The 10:20 commit is the one we think mattered most for the person at the keyboard: "Check the publish sign-in before the editor saves anything, and confirm first when it is too old." The sequence used to be work, save, find out. Now the sign-in is checked before the save, and if it is too old the person is asked to confirm first. A prompt that appears after a save is a prompt that has already cost something. A prompt before the save costs a click.

Then, at 20:12: "Say a post is Published only once the site is live: show Waiting to publish, Publishing, Couldn't go live or Not confirmed live from the site read." Five states now exist where one word used to. Published means the site read says live. "Not confirmed live" exists specifically so that not knowing is allowed to look like not knowing.

The earlier hand-off had claimed "all live" before anything had been verified. The rule we took from it: never show a success word until something has checked the outcome.

## Then we tried to use the window for everything

The twelve-hour window was the quick fix on the server side, and it solved the symptom. It did not solve the cause, which was that a security prompt could arrive at the wrong moment.

On 2026-10-17 we extended the same twelve hours. At 17:04 an API commit said "the 12-hour recent-sign-in window also covers moving a site and taking ownership of a claim". Two hours later, at 19:04, the next one reversed part of it: "ownership transfer keeps the standard recent-sign-in step-up; the 12-hour window is for publishing only".

The commit subjects do not give the reason, so this is our own reasoning rather than a quotation: a longer window only moves the failure. People will still hit its edge, only less often and at a worse time, and we will have weakened a protection to hide a user-interface problem. A transfer of ownership is exactly the action where you want a recent proof of identity. Publishing a post you wrote is not.

What the window should not carry is the *reading* of state. That evening a further API commit (20:45) added a new session-level capability for viewing the handover's progress, while managing the handover (start, cancel, claim links) keeps its stricter requirement. Reads that only need a signed-in session get exactly that. Actions that change things confirm and resume.

That split is the design we would suggest: reads need a session; actions confirm, and then resume the action they interrupted.

**What we do not have.** The cost to people, in lost edits and failed publishes, is not stated in our records; the commit bodies from that day are empty and the subjects are all we have. We do not know how many people hit it. We know the day's sequence from its timestamps: one server change, then the App's honesty fixes through the morning, a pre-flight check at 10:20, and a redefinition of "Published" that evening.

## What you can use

1. **Check the thing that can fail before you accept the work that depends on it.** If publishing needs a fresh sign-in, ask before the save.
2. **A security prompt must resume, not restart.** Store the action and its idempotency key, send the person to prove who they are, and carry on with the same one.
3. **Every success word is a claim.** "Published", "saved", "live" should come from a read that verified it. Give "I do not know yet" its own label.
4. **Do not lengthen a window to fix a flow.** If the prompt arrives at a bad moment, move the prompt.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
