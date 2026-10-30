---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740c-9f8e-705f-a833-b4aa14655826
kind: article
title: Every publish answered 500 before any code ran
description: A generated validation annotation made the publish route fail inside the framework; no test noticed because every test skipped the route.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- testing
- api
- validation
- postgres
status: draft
publishAfter: '2027-04-18'
createdAt: '2026-10-25T17:12:26.000Z'
slug: every-publish-answered-500-before-any-code-ran
redirects: []
listen:
  audio: assets/listen/every-publish-answered-500-before-any-code-ran.mp3
  durationSeconds: 361
  format: conversation
extensions: {}
---

From the day the publish route landed until 2026-09-17, a `POST` to it answered 500 to every caller. Not to some callers, or under load: to all of them, before the controller method ran and before any authorisation decision was made. Our tests were green throughout.

The fix landed on 2026-09-17 at 11:23 Pacific. Its commit message says it plainly: the route "answered 500 to every caller from the day it landed, and no test caught it because every test of that route called the publish service directly". When the route landed is not stated in our records, and neither is whether the broken build ever reached a deployed environment.

## What the framework did

Our API is described by a contract. The contract states its instants, such as a `scheduledFor` time, as `type: string` with an RFC 3339 `pattern`, and declares the Java binding as a temporal type. The generator we use emits both. So the generated getter returned an `OffsetDateTime` with a `@Pattern` annotation on it.

Hibernate Validator, which Spring uses for request validation, has no `@Pattern` validator for a temporal type. When it is asked to resolve one it throws `UnexpectedTypeException`. That happens while the request is being bound, which is before Spring calls the controller method. Nothing in our code was on the stack. There was no business logic to debug and nothing of ours to log, only a framework refusing to continue and a 500 at the edge.

The service layer was untouched by all this. Every test of publishing built a request and called the service, which is where the interesting behaviour lives. The route, the filter chain and the binding between JSON and objects were not part of any test. They were the one layer that was broken.

## The fix, and the tests that go with it

The generation pipeline now strips those annotations from both generated trees, so the reproducibility comparison and the scratch-tree check still compare like with like. Nothing is lost by the removal: the pattern only constrains the wire form, and Jackson's temporal deserialiser already refuses a non-instant with a 400. We kept that 400 and test for it.

We added a contract test that checks the property from three sides, and a route test:

- one check that asks Hibernate Validator itself, reflectively, whether any generated temporal member carries an annotation it cannot handle;
- one that checks textually that the rewrite ran;
- one that demonstrates the exception on a purpose-built type, so we know the first check is not passing because it is blind.

The route test drives the route through the filter chain and the binding, both for an immediate publish and a scheduled one, and keeps the 400 for a value that is not an instant. It is the test that should have existed on day one. It does not cover business rules; it makes sure a request can get as far as the code that does.

## The same day, a flaky test with a different cause

On the same day we found the real cause of a test that had been failing intermittently under the full check. A confirmation integration test kept ending in the wrong state: `COMMITTING` instead of `FAILED_NO_CHANGE`, `ACCEPTED` instead of `EXECUTING`. The obvious suspect was the work-claim window. Instrumenting a red run showed the claim working exactly as intended. The failure came right after it, in the dispatch handler's opening transaction:

```
SQL state [55000]; ERROR: operation attempts begin not started
```

The error came from a database trigger that guards the table of operation attempts.

The insert for an operation attempt filled `created_at` and `updated_at` with two separate `clock_timestamp()` calls. That function is volatile. Postgres re-reads the clock each time it is evaluated, so one statement can see several different values. A trigger requires that `updated_at` equal `created_at` exactly, so the row was legal only if both reads fell in the same microsecond. We measured it directly: 200,000 evaluations of `clock_timestamp()` in a single statement produced more than one distinct microsecond, while `statement_timestamp()` produced exactly one.

When the two reads straddled a tick, the trigger refused the row, the transaction rolled back, and the worker rescheduled the item for 30 seconds. The poll had claimed the work, done nothing and left every count as it found it, which is why the symptom showed up as an assertion about a state machine one transaction away from the cause. The commit notes the failure correlates with load: a busier machine makes the two reads more likely to straddle a tick. In production, the commit says, it would have been "a dispatch that silently costs thirty seconds and an attempt, per occurrence".

The fix takes both timestamps from `statement_timestamp()`, which is fixed for the whole statement. Updates keep `clock_timestamp()` on purpose, because they must be strictly later than the previous value. A contract test now fails the build if any SQL in the main source fills a row's `created_at` and `updated_at` pair from `clock_timestamp()`; we checked that it fails against the commit's own parent.

## What to take from it

If your service has a framework between the network and your code (validation, binding, filters, serialisation), write one test per route that goes through the real stack, with a real HTTP-shaped request. It does not need to check much. It needs to prove a request reaches your handler. A test that calls the service directly cannot see a failure that happens earlier, however many of them you have.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
