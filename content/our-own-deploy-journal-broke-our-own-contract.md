---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740c-9f93-722d-a190-0bc2d755b201
kind: article
title: Our own deploy journal broke our own contract
description: Our deploy kernel journaled a finished staging as a pair its own contract forbids, so every real publish failed with a 409 until we validated real journals.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- publishing
- contracts
- testing
- incidents
status: draft
publishAfter: '2027-02-14'
createdAt: '2026-10-25T17:12:26.000Z'
slug: our-own-deploy-journal-broke-our-own-contract
redirects: []
listen:
  audio: assets/listen/our-own-deploy-journal-broke-our-own-contract.mp3
  durationSeconds: 367
  format: conversation
extensions: {}
---

On 2026-09-28, at 10:06 Pacific, we committed a fix whose message begins with a sentence we would rather not have had to write: "every real publish failed the receipt submission with 409 INVALID_SOURCE_STATE". Thirteen minutes later we committed a second fix for the same class of mistake. Neither one was found by a test that already existed. Both were found by feeding the deploy kernel's real output to the validator that the API uses on the other side.

## What the kernel writes down

When a Galascribe site is published, a small deploy kernel stages the built files at the destination, asks the destination's adapter whether to activate them, and writes a journal of what happened. Each entry in the journal is an observation with a class (how we know what we know) and an outcome (what happened). When the run ends, those observations and the attempts behind them are assembled into a receipt and sent to the API.

The contract for that receipt lives in two places that must agree: two schemas in the schema package, and a database check constraint in the API. Together they form a matrix of allowed pairs. The one that matters here: the class `request-accepted` ("we asked, and the destination said it would try") may only be paired with the outcome `outcome-unknown-reconciling`. That makes sense: a request that has merely been accepted is not yet a success.

The kernel's staging step did something different. It staged the artifact to completion, watched the provider confirm it, and then journaled that definite success as `request-accepted` with outcome `succeeded`. That pair is not in the matrix. The API refused the receipt, and as the commit message puts it, every real publish failed.

The fix was one line of meaning: a staging that ran to completion is `provider-state` with outcome `succeeded`, which is the pair the contract provides for exactly that case.

## Why the tests were green

We did have tests for the journal. They checked each observation against a mirror of the contract kept inside the publish toolchain: a flat list of fields and allowed enum values. That mirror encodes which values exist. It does not encode the cross-field matrix, which says which values may sit next to each other. A journal could pass every check in the mirror and still contain a pair the real contract rejects. The commit says as much: the mirror "does not encode the cross-field matrix and would not have caught this".

So the tests had been written from the producer's idea of the shape, and the producer agreed with itself. Nothing in the suite was a consumer.

The change that found the problem was small. We took the real journal a kernel run produces, across the existing end-to-end tests for all three adapters, and validated every observation with the contract's own validator. Then we assembled the run's attempts and terminal observation into a receipt and validated that too. That immediately turned up two more things in the same commit: the activation path's unknown-outcome attempt and the cleanup path's succeeded attempt carried no result digest, although the API's attempt lifecycle constraint requires one on every succeeded, failed or unknown attempt. Both now attach a result.

## The audit, thirteen minutes later

One mismatch found by a new technique is a reason to ask what else the technique would find. The follow-up commit audited every class and outcome pair the kernel can emit, plus every attempt outcome and result pair, against both schema representations and the API's check constraints. It found two more.

The first: when an adapter's own decision was anything other than "activate", the kernel journaled a refusal as a clean `provider-state` observation, either `rejected` or `succeeded`, with `destinationChanged` set to `unknown`. The contract never admits that. `rejected` only pairs with `no`, and `succeeded` only with `no` or `yes`.

The second: the matching attempt was journaled as a clean `failed` outcome. The contract pairs `failed` with `destinationChanged: no` and a failure code in the rejected family. The kernel cannot vouch for either, because one of the adapters can report a refusal after it has already written objects to the served root. A refusal from the adapter does not guarantee the destination was left untouched.

Both cases now use `outcome-unknown-reconciling` and attempt outcome `unknown`, the pair the contract provides for "changed, but not confirmed to be what was intended". The commit message puts the principle better than we could: never round down to a definite outcome the kernel cannot back up.

This is the less obvious half of the lesson. The first bug was a wrong label. The second and third were the kernel being more confident than its evidence, and the contract, by refusing the pair, was the thing telling us so. We wrote the audit up in the toolchain's documentation, listing every pair the kernel can emit and why every other document-building site in the repository does not carry the same risk. We also noted one inconsistency we left alone on purpose: a stricter rule for skipped attempts exists in the wire schema, but only the database constraint enforces it, so reshaping skipped attempts to match it would remove information for no benefit.

What we do not know: our records do not say how the failure first surfaced, how many publishes were refused, or how long the window lasted. The commit messages describe the defect and the fix, not the incident. Earlier that same day, in the schema package, we also corrected a guard that refused exactly the committed, reviewed and approved changes a publish refuses as out of date; that one was a fault in the contract itself, which is a reminder that either side of a pair can be the wrong one.

## What you can use

If you have a producer and a consumer of a document, one test belongs to neither of them: run the producer's real output, from its real end-to-end tests, through the consumer's actual validator, including any constraint that spans two fields. If the consumer's rules live in a database, put that constraint in the test too. A mirror of the rules written by the producer's author will pass whatever the producer's author expected.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
