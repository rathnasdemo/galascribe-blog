---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a17138-2dcf-7276-b8ad-7f111ca3293a
kind: article
title: The deploy record is a registry tag, not a file in Git
description: The record of which API image production serves now lives in two registry tags, written only after the host confirms a deploy, instead of in a git manifest.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- deployment
- infrastructure
- registry
- rollback
status: draft
publishAfter: '2027-01-24'
createdAt: '2026-10-25T04:01:09.000Z'
slug: the-deploy-record-is-a-registry-tag
redirects: []
extensions: {}
---

On 2026-09-26 our API went down at 16:36 UTC and was not back until 05:37 UTC the next morning. Six things failed in turn on a real host, and the first of them was a gate: our deploy would only run an image whose digest someone had already written into a manifest file in git. We deleted that field on 2026-09-27 and put two registry tags in its place. Here is why, and what broke on the first day.

## A fact in the wrong place

The question "which image is production serving?" used to have two answers. The host knew, because it was running one. And our infrastructure repository knew, because a field in each environment's manifest held the single digest a deploy was allowed to promote. Shipping a release meant changing that field first, by a human, in a different repository from the code being released. Shortly before we deleted it we had added a dispatchable pipeline to make that edit for us. On 2026-09-27 we deleted the field, the pipeline, its scripts and the access token it needed.

Our reasoning was about where facts belong. Which image runs in production is something that happens, not something we author. Keeping it in git meant every release needed a commit in a second repository, an API pin bump, and a person or a pipeline in between. It also meant the file could only ever say what someone last wrote down. We decided the record is runtime state, and should live where the images already do.

## Two tags and one writer

Our container registry now holds two mutable tags on the API repository. `production` points at the digest the host is serving. `production-previous` points at the digest it served before the last switch. Moving them is two commands, in this order:

```
crane tag <registry>/api@<previous-digest>  production-previous
crane tag <registry>/api@<served-digest>    production
```

Only the API deploy writes them, and it writes them last. After the host confirms the new image is serving and the health canary answers, a recording step moves the tags. If the deploy rolls back by itself, that step is skipped, so the registry never names a digest the host has stopped serving. If the recording step fails, the job fails, because a deploy with a wrong record is not a success. It still does not roll back a good deployment, because the image is already live and healthy.

Everything else reads. A replacement droplet is seeded from the `production` tag, passed in at apply time and never taken from a manifest. A brand-new environment has no tag yet, so that step logs that nothing has been deployed and lets a placeholder stand. The script that prunes old images never deletes either tag and keeps the digests behind them. A small helper resolves a tag to its digest so that an operator can name the rollback target without guessing.

We chose the registry because it is the shared component that both the infrastructure and the API already use, and it is where the images already live. The one new thing it needed was a registry write credential for the recording step. There is no step between "the image was promoted" and "the record changed" that a person or a pipeline has to remember.

## What broke on day one

The API was serving again at 05:37 UTC on 2026-09-27, on a droplet replaced at about 05:30. A redeploy of the same digest then cost about ten minutes of 525 errors, from 06:40 to 06:51 UTC. At 07:15 UTC it was serving that image again, and the tags did not exist. The recording step had failed, because when a promote found the digest already being served, our promote script reported a placeholder as the "previous" digest and the record step choked on it. The fix was applied by about 07:36 UTC, which replaced the droplet again. Then GitHub Actions refused to start any private-repository job because of an account spending limit, so by about 08:20 UTC the same digest was redeployed from a workstation with a script. It worked, and it wrote no tags, because the workstation had no `crane`, the registry client that moves them.

Both gaps taught the same lesson: the bookkeeping must be one implementation, not two. As of 2026-10-22 the workstation script is how every API deploy of ours runs, because the hosted-runner allowance for our private repositories is used up. It reproduces the workflow's steps in the same order, takes the in-window runner straight from the workflow file each time it runs so the two cannot drift, and calls the same recording script. That script is strict by default. It checks the pinned `crane` version, requires the write credential and, when it holds the registry admin token, waits for a registry garbage collection to finish, by default up to 40 minutes, because the registry is read-only while one runs. A complete local deploy cannot report success and leave the tags stale. There is one escape hatch, a flag for emergencies where restoring service matters more than bookkeeping. When the flag is used and `crane` is absent, the script prints the two commands above for someone to run later.

The tags are pointers, not history. They tell you what is served now and what was served one step ago, and anyone with registry write access can move them. That is the cost of a mutable pointer, so we do not use the tags as an audit log.

## Rolling back, and where it stops

A rollback is a redeploy of the digest behind `production-previous`. It is never a rebuild, so the code you roll back to is byte for byte the code that ran before. Our runbook has one hard limit. Migrations are forward-only, and a rollback restarts the previous code without touching the database. That is safe while migrations follow expand-then-contract, so both images can run against the same schema. If the image you are rolling back from has already run a contract-phase migration, the previous image may no longer fit the data, and the answer is not rollback SQL.

If you keep your own deploy record, write down four answers. Who writes it? Ours is the deploy, and only after it has verified the host. What reads it, and what do those readers do when it is missing? Ours log that nothing has been deployed and carry on with a placeholder. What happens when a rollback runs mid-deploy? Ours skips the write, so the record cannot claim something false. And is it a pointer or a history? Ours is a pointer, which is why we do not use it to answer "what ran last Tuesday".

To set up a site of your own, the start flow is at https://app.galascribe.com/
