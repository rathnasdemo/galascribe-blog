---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740c-9f91-7581-a007-db513106b27a
kind: article
title: No rows, or not allowed? Three ways row-level security fooled us
description: With forced row-level security, an empty result and a refusal look the same; three bugs in 2026 showed us why a fallback on zero rows is a defect.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- postgres
- row-level-security
- testing
- migrations
status: draft
publishAfter: '2027-02-05'
createdAt: '2026-10-25T17:12:26.000Z'
slug: no-rows-or-not-allowed-three-ways-row-level-security-fooled-us
redirects: []
listen:
  audio: assets/listen/no-rows-or-not-allowed-three-ways-row-level-security-fooled-us.mp3
  durationSeconds: 425
  format: conversation
extensions: {}
---

On 2026-09-27 at 23:49 Pacific we committed a one-paragraph fix to a function that confirms changes to a creator's site. It had been refusing every content change with the same error, `INVALID_SOURCE_STATE`, and the content was fine. The function had asked the database a question, been told nothing, and carried on as if "nothing" were an answer.

That is the whole trap of row-level security, and we fell into it three different ways in two weeks. As of 2026-10-25 we have one rule that came out of it: a branch that runs when a query returns zero rows is a bug until a test proves otherwise.

## What forced row-level security does to an empty answer

Our Postgres tables that hold per-organisation data use `FORCE ROW LEVEL SECURITY`. "Force" matters: it binds the table owner too, not only the application roles. A query only sees rows if the connection has first been told which organisation it is acting for, which in our API means running inside a tenant transaction. Outside one, the query does not fail. It returns zero rows, politely, with no warning.

So "there is no such row" and "you may not see it" produce byte-identical results. Any code that treats an empty result as meaningful information is guessing.

## Three ways it fooled us

**The confirm path.** Confirming a change begins by looking up what kind of change it is. That lookup ran outside a tenant transaction, so forced row-level security returned nothing whichever organisation owned the change. The code had a fallback for "no kind found": treat it as a managed-binding change. A managed-binding change is checked by re-reading the declared graph of the site, and a content change was never planned against one, so the check always disagreed and the confirm always refused. An integration test caught it. The fix scoped just that lookup in a tenant transaction.

**The dispatch path, twenty minutes later.** The handler that actually carries a change out had the identical fault, in the words of its commit: the kind lookup and the entry listing both read a forced-RLS table with no tenant transaction open. Here the empty answer did not produce a refusal. It produced a change that settled as `FAILED_NO_CHANGE`, which reads like an ordinary outcome. We caught it on 2026-09-28 only once the integration test ran alongside another content-dispatch test. That exposed a second problem, in our test harness: the handler's gateways were bound to the API connection pool while its transaction boundary was bound to the worker pool, so a correctly scoped transaction set the tenant on a connection the query never used.

**The migration.** On 2026-10-05 we shipped a migration that backfilled a `merged_at` column on the table that records pull requests for a change. The table is forced-RLS. A migration has no tenant context, so the backfill `UPDATE` matched no row, and the `CHECK` constraint added right after failed, in the words of the commit, "on every merged pull request in production". This one reached production. The number of rows affected is not stated in our records, and neither is how long it was broken. The fix lifts the flag around the `UPDATE` and restores it in the same transaction, the way an earlier migration already did.

There was a fourth, smaller one on 2026-10-10: a dashboard migration that renamed a tier and rolled back without regard for the same row visibility, caught by the full gate and fixed in a single commit.

## A refusal with the wrong label

The mirror image is when the database does say "not allowed" and our code mislabels it. A missing grant for the worker role, and a forced-RLS refusal, both come back from Postgres as SQLSTATE `42501`. Spring translates that into a `BadSqlGrammarException`, which belongs to the family of resource-usage errors, so our classifier filed every privilege failure under `CONTRACT_VIOLATION`. Both dispositions are terminal, so nothing was retried wrongly. But the quarantined work item told the operator to hunt for a code or catalogue defect when the fix was a migration. We found this in review on 2026-09-16; the classifier now walks the cause chain looking for the SQL state, so `PERMISSION_DENIED` is reachable at last.

## What a test needs

A mock that returns a row cannot tell you the database would have returned none. What the backfill fix needed, and what we would ask of any test on forced-RLS tables, is simple to state:

- Run the test against a real Postgres, as the role production uses, not as a superuser.
- Seed rows that the code under test must find, and rows it must not, in more than one organisation.
- For a data migration, roll the changeset back, seed the table the way production has it, apply the forward SQL as the owner, and assert on the result.

The backfill fix shipped with exactly that test. Its commit says it "fails on the previous SQL with the production error", and that is the bar for a test that guards a bug: we watch it fail against the code before the fix.

The first real-Postgres run over 2026-09-27 and 2026-09-28 found problems we had not been looking for. One was an assertion in a test for the default-branch gateway that had been passing for the wrong reason: forced RLS hid every row, so "no row found" satisfied a check meant to prove a row was found. The fix was to wrap that lookup in the same tenant transaction as the writes. A test that cannot fail is its own kind of defect.

Search your code for every `if (result.isEmpty())` or `orElse(...)` that sits after a query on a table with row-level security. For each one, ask whether the empty case can mean "you may not see it". If it can, either make the empty case an error that names the possibility, or make sure the tenant context is set before the query runs. Then write the test that runs as the real role, with rows in two tenants, and watch it fail first.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
