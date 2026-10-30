---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740c-9f99-7614-afe7-cf853f837133
kind: article
title: The redactor ate the evidence
description: A handover retried for two hours with no reason in the log, and our redactor would have blanked it anyway; a second redactor bug dropped credentials.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- logging
- redaction
- incidents
- security
status: draft
publishAfter: '2027-03-19'
createdAt: '2026-10-25T17:12:26.000Z'
slug: the-redactor-ate-the-evidence
redirects: []
listen:
  audio: assets/listen/the-redactor-ate-the-evidence.mp3
  durationSeconds: 368
  format: conversation
extensions: {}
---

A site handover on our platform retried for two hours and then failed with `PUBLISH_FAILED`. For those two hours the production log said nothing about why. The reason existed: the program had it in hand, but logged only the exception class. And when we looked at what a fuller line would have survived, our own log redactor blanked the very key a reason code would sit under.

We fixed it on 2026-10-18. This post is about that, and about a second redactor that failed in the opposite direction.

## Two hours of retries and a blank

A handover is when a creator takes over their site. Its last step, finalize, publishes changes. Those changes are made by the system, under the requester's recorded decision to publish, not by a person at a keyboard.

The batch judge that decides whether a publish may go ahead did not know that. On a publication with "Require review" switched on, it refused each finalize change as `REVIEW_REQUIRED`, on every attempt. With "Galascribe merges" switched off it would have refused them `SOURCE_NOT_MERGED`, in the same way. Both make sense for a person's edit and neither applies to a system change.

The handover retried. As the commit puts it, "the handover retried silently for two hours and then failed `PUBLISH_FAILED`". The word that matters is silently. The driver that ran the attempts logged only the exception class on a refused finalize. Even if it had logged the refusal code, the production log redactor would have eaten it: that redactor blanks the value after any `code=` or `state=` key. A line that said `code=REVIEW_REQUIRED` would have reached us as `code=` and a blank.

The fix has two parts. The judge now treats a handover's changes as system changes, so the two refusals do not apply to them; every other refusal is unchanged, and session, scheduled and due-time publishes are untouched. And the driver's log fields were renamed to `failureCode=` and `handoverState=`, which the redactor does not match. The change logs the refusal's codes and pointers, never its message.

The part we are least proud of is that ten days earlier we had already set out to make refusals visible. On 2026-10-08 two commits, at 11:21 and 12:23 Pacific, were titled "Name every bind `INVALID_SOURCE_STATE` refusal" and "Name every 403 and 503 refusal in the log". Those covered other refusals; the handover driver's own log line was not among them. Naming a failure in one place is not the same as having it appear everywhere you read.

## The same failure with a different label

Five days later, on 2026-10-23, the same class turned up one layer over. The run verdict, the field the App reads to tell a creator what happened to a publish, labelled any run whose authorisation job failed as `DESTINATION_BUSY`. The App turned that into "another update was still going live, publish again". The real refusal had come from the platform side: a 422 `VALIDATION_FAILED` on an adapter version, a mismatch between the toolchain, the lock and what the platform admits. Eight sites were shown the wrong message. Telling a creator to publish again, when publishing again cannot work, is worse than telling them nothing.

The fix records the exchange refusal beside the operation's dispatch, in a transaction of its own, because the transaction that was refused has rolled back by the time anyone looks. The verdict now reads the refusal recorded for that run's own attempt: `DESTINATION_BUSY` only when the destination really was busy, `WORKLOAD_EXCHANGE_REFUSED` for any other refusal, and `AUTHORIZATION_FAILED` when none was recorded at all. That last case is deliberate: when the evidence is missing, the verdict says so.

## A redactor that deleted credentials

The publish toolchain had the mirror-image bug. On 2026-09-25 a security review found that its `redactSecrets` function cloned untrusted JSON into a plain object with bracket assignment. JSON parsing can produce an object with a genuine own key named `__proto__`. Assigned by brackets, that key does not become data; it goes through the prototype setter. Two things followed. The credential subtree under that key silently dropped out of the redacted clone. And the clone's own prototype became attacker-controlled.

The fix builds the clone with `Object.defineProperty`, which creates an own property whatever the key is called, and adds regression tests for `__proto__`, `constructor` and `prototype` keys, nested objects and arrays of objects. The tests themselves tripped our secret scanner two minutes later, because they reuse a synthetic credential at new line numbers, and we added fingerprints for them. It was the same review that found the other publishing defect: every published package declared Apache-2.0 in its file list but shipped no LICENSE, because npm silently drops a `files` entry that does not resolve to a real path.

## What we check now

Both redactors failed quietly in opposite directions: one removed the reason, the other removed the data. The shared lesson is that a redactor is code with its own bugs, sitting between you and your evidence.

If you run one, write the test that starts at the failure and ends where you read it. Cause a refusal, run the real log pipeline, and assert that the reason is in the output. Add a hostile input to the redactor itself, and assert the output keeps everything except the secret. Then choose your field names knowing the rules, so a reason code is never filed under a key the redactor treats as sensitive.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
