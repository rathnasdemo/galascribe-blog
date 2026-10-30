---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740c-9f9b-758f-b32b-fa1b1f1ae24d
kind: article
title: The test that counts migrations
description: Our database guard tests pinned counts we had to edit on every migration; 140 commits touched one pinned file, and a property would have cost nothing.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- testing
- migrations
- postgres
- merge-conflicts
status: draft
publishAfter: '2027-03-07'
createdAt: '2026-10-25T17:12:26.000Z'
slug: the-test-that-counts-migrations
redirects: []
listen:
  audio: assets/listen/the-test-that-counts-migrations.mp3
  durationSeconds: 379
  format: conversation
extensions: {}
---

On 2026-10-23 we made two commits, three and a half hours apart, with nearly the same message: "Count release 0122 in the policy rollover rollback depth", then "Count release 0123 in the policy rollover rollback depth". Neither commit changed behaviour. Each one existed because someone had added a database migration, and a test somewhere knew how many migrations there were.

As of 2026-10-25, the API's history has 939 commits. Counting with `git log` on that day, 140 of them touched the file that lists every database object the foundation migrations should create, and 112 touched the checkstyle suppressions file. 48 commit subjects contain "re-pin", "re-derive", "suppress" or "checkstyle". We did not time any of it, and our records state no hours. The shape of the cost is visible without them.

## What the tests pin

Our database has a strict story: the roles, grants, policies, triggers and indexes that a fresh Postgres ends up with are an agreed set, and a rollback must put things back. So there are tests that guard it. Three of them matter here.

An **object manifest** is a text file listing every relation, routine, trigger and index the migrations create. The test compares it with what a real Postgres contains after migrating from empty. A **rollback-depth** test exercises a rollback with the depth written into the test as a literal that has to include every release added since; that is the number the 0122 and 0123 commits edited. And a **changeset count** says how many there are in total.

All of these are sound ideas. The trouble is the form: each one is a number or list you must edit by hand whenever the thing it counts changes. And the thing it counts changes with every migration.

## Why that is a merge-conflict machine

Take two feature branches, each adding a migration. Both are green on their own. Branch A re-derives the manifest and the counts for "main plus A". Branch B does the same for "main plus B". Whichever merges second conflicts on every pinned line, and a clean textual merge would still be wrong, because the right answer is "main plus A plus B", which neither branch computed.

You can see us learning this in the log. On 2026-10-08 the merge of the reader-interaction work was committed as "re-derive changeset count and object manifest as the union". On 2026-10-09, after merging a second tree, "Re-derive pinned tests for the merged tree: manifest, rollback depths, lifecycle webhooks, config keys, run-poll clock". On 2026-10-15 a merge for creator claims finished with the words "union counts". The word "union" appears because that is the only honest description: we were not fixing a defect, we were recomputing a sum.

The checkstyle suppressions file had the same disease in another form. Our suppressions are pinned by line number, so when a file gains or loses an import, the suppressions below it can point at the wrong line and the build goes red. On 2026-10-22 one commit was titled "Re-pin line-based checkstyle suppressions after import shifts". The code had not changed in any way a reviewer would care about.

## The moment a pinned test did real work

It would be neater to say these tests are pure tax. They are not. On 2026-09-17 a new contract test for the migration preconditions "earned its place immediately", in the commit's words. The precondition for the migration numbered 0039 was written to refuse a database that lacked a particular worker grant. It read `information_schema.role_table_grants`, a view that only lists grants for roles the current user is party to. The migrator role is party to none of them. So the check "would have admitted the grant on exactly the database it was written to refuse". It was reading the real access-control list through `pg_catalog` and `aclexplode` from then on.

The same commit re-derived the counts: one new relation, two routines, one trigger, two indexes, and "an unchanged policy tally", which was the proof that a temporary migration-scan policy really is dropped inside its own changeset. That unchanged number was information. The test was doing its job. The part we resent was the hand-editing around it, not the idea behind it.

## What we would pin instead

We have not made this change, and we are not claiming a fix. What we would do:

1. Pin a property, not a number. "Rolling back the last changeset leaves no object that was not there before" needs no count; it stays true when the tenth migration becomes the eleventh.
2. Derive the expected set from the migrations themselves. The manifest can be generated and compared against the database, with a review of any diff, instead of typed by hand and compared the other way.
3. Suppress by annotation or by pattern, not by line number, so an import cannot move the target.
4. Where a count must stay, put each branch's contribution in its own file, so two branches add lines rather than edit the same one.

If your own suite has a test that fails on every merge until someone bumps a literal, count how many commits changed that literal in your history. The command is one line of `git log` on the file. If the answer is in the dozens, the literal is not guarding anything; the property behind it is. Write that instead.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
