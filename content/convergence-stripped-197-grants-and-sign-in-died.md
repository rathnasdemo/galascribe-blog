---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740c-9f8d-7e4b-b9ea-2a3d2f9b9531
kind: article
title: Convergence stripped 197 grants, and sign-in died with permission denied
description: A deny-by-default database reset plus a hand-kept allow list removed 197 privileges and broke GitHub sign-in; deriving the list from the changelog fixed it.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- postgres
- deploys
- permissions
- incidents
status: draft
publishAfter: '2026-12-25'
createdAt: '2026-10-25T17:12:26.000Z'
slug: convergence-stripped-197-grants-and-sign-in-died
redirects: []
listen:
  audio: assets/listen/convergence-stripped-197-grants-and-sign-in-died.mp3
  durationSeconds: 378
  format: conversation
extensions: {}
---

By 2026-09-25 every GitHub sign-in on production was failing with the same message: "permission denied for table". The table was the one that stores sign-in credentials, and the API's runtime role had lost the SELECT, INSERT and UPDATE it needed on it. The fix was committed that afternoon. The deploy had taken the privileges away, exactly as designed, and then failed to give them back.

## A reset that is only as good as its list

Our deploy path converges the production database to a known privilege state every time it runs. It first revokes everything the runtime roles hold on the application schemas, then grants back only what a file in the infrastructure code declares. The file is a privilege manifest. The point of the design is that a privilege nobody declared cannot survive: if someone grants a role something by hand, or a migration grants more than we meant, the next deploy removes it.

That is a good property. It is also deny-by-default with a hand-kept allow list, and the allow list was wrong. The manifest declared 40 table authorities. The API's database changelog, which is the thing that actually creates tables and grants on them, executes 357 table, column and function privileges. Everything in the gap worked, because the changelog had granted it, right up to the next convergence. Then the revoke step removed it and the manifest re-granted only its 40. In the words of the commit that fixed it, those privileges survived "exactly until the next apply and then vanished silently".

The gap stayed hidden wherever a database is built from the changelog alone, because every grant is present there. Only a convergence run applies the manifest on top.

## The first bug hid the second

Before we found the manifest gap, we had a different convergence problem, fixed on 2026-09-23. Our managed database cluster gives us an admin role that can create roles but is not a superuser. It holds only the right to administer the roles it created, not to inherit their powers. Under that identity, PostgreSQL's GRANT and REVOKE on objects owned by another role "silently apply nothing instead of erroring", because the admin is neither the owner nor holds grant option.

So convergence on the managed cluster could report success while changing nothing. We fixed that by having the statements that touch owned objects borrow the schema owner's identity for exactly those statements: grant the admin a temporary membership, switch role, run the revokes and grants, switch back, drop the membership. We extended the test to run the convergence scripts twice as the managed admin and assert that the privileges actually converge and no borrowed membership survives.

That fix is what made the second bug real. Revocations now genuinely worked, so the thin manifest finally had teeth. A convergence that silently did nothing would have hidden the 197 missing grants for much longer.

The local harness had been passing for the same reason in both cases. A superuser bypasses ownership checks, so the harness never saw a silent no-op and never saw a missing schema privilege. We hit that again fifteen minutes after the manifest fix was committed. On 2026-09-25 we added a verification pass that reads the privileges back after convergence. It resolved each object by name, and name resolution needs USAGE on the schema. The managed admin deliberately holds nothing on the application schemas, so production stopped at "permission denied for schema" after the grants had already applied. The verification was read-only and borrowed no identity, so it ran as the weakest role in the story, and the only place that role exists is production. We rewrote the lookups to query the system catalogue by schema and relation name, which needs no privilege on the schema being described.

## Derive it, then test as the weak role

The fix for the manifest was to stop writing it. A script now replays every GRANT and REVOKE the changelog executes, in the order the migration tool applies them, and the manifest is its output. We checked it against a throwaway Postgres with the whole changelog applied: the derived set matched the real access-control lists exactly, and a convergence run afterwards left them byte-identical "instead of stripping 197 of them". The 197 is the count the commit gives for what a convergence stripped before the fix.

Three details of that change are worth keeping:

- Column-scoped grants were rendered for the first time. One migration had narrowed the runtime role's UPDATE on an identity table to four columns, but the old manifest re-granted table-wide UPDATE, "quietly widening" what the earlier migration had taken away. The reset had been undoing a security narrowing, not just removing access.
- The revoke step stayed as it was. It is the only thing that can remove a privilege nobody declared, and scoping it away from the runtime roles would have fixed the symptom by abandoning the property.
- A test now diffs the manifest against a fresh derivation and fails when they disagree, and CI checks out the API code beside the infrastructure code so the guard cannot silently skip.

We should be honest about what is still hand-run. The derivation exists, but the manifest is a checked-in file, and someone has to regenerate it for each API release that touches grants. Between 2026-10-03 and 2026-10-23 there were 16 commits whose subject names the manifest, one per release or small batch of releases. The test caught a stale one on 2026-10-18: a release had added a column-scoped UPDATE on the table that holds the sealed site-handover link, the manifest did not know, and the commit says the next convergence "would have revoked the privilege". The test failed first. That is the behaviour we wanted, though a quicker route would have the API's release produce the manifest, which we have not done.

How long sign-in was broken is not stated in our records, and we do not know whether anyone beyond our own test accounts hit it.

## What you can take from it

If you reset privileges and re-grant from a list, apply these three checks:

1. Count both sides. Ours were 40 and 357. Comparing the list with the thing that really grants is a small job, and it shows a gap like this at once.
2. Generate the list from the source of truth. If a human must keep it in step with the migrations, it will drift on the first release nobody remembers it for.
3. Run the convergence, and the check that follows it, as the least privileged identity your production database uses, not as a superuser. Ours passed locally twice for exactly that reason.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
