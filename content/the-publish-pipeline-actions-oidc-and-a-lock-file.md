---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a17138-2dd1-7097-94e1-f33c15044448
kind: article
title: 'The publish pipeline: Actions, OIDC and a lock file'
description: A site's publish workflow holds no secret, because each run is authorised by a one-use GitHub identity token and two pins fix the code and inputs.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- publishing
- github-actions
- oidc
- security
status: draft
publishAfter: '2026-11-29'
createdAt: '2026-10-25T04:01:09.000Z'
slug: the-publish-pipeline-actions-oidc-and-a-lock-file
redirects: []
extensions: {}
---

The workflow that publishes a Galascribe site lives in the site's own repository, at `.github/workflows/gala-publish-v2.yml`, and it is 63 lines long. Look in it for a credential and you find one block: a secret map naming three optional DigitalOcean Spaces keys, for a destination we do not offer yet. A GitHub Pages site sets none of them. The toolchain's documentation says the Pages deploy job "receives only its job-scoped GitHub token and OIDC authority".

Yet the reusable workflow that file calls builds the site, deploys it to GitHub Pages and reports to our API, which lets it do so only for a publish we opened. Here is how that works when the repository holds nothing to steal. It comes down to authority issued per run, a graph of jobs in which the jobs that touch your files cannot ask for any, and pins that fix both the code and its inputs.

## What the file does hold

The caller is a fixed contract, not a file to edit. It has two triggers, `create` and `workflow_dispatch`, and a guard that admits only a branch named `gala/publish/` followed by an operation id. A branch under `gala/candidate/`, where a saved change waits while you work, is never built. A push to main, a pull request or a schedule starts nothing. Our API creates the publish branch when someone presses Publish, and a run it did not open fails closed.

Its permissions are five lines: `actions: read`, `contents: read`, `id-token: write`, `pages: write` and `attestations: write`. Its `uses:` line points at a reusable workflow in our [public publish repository](https://github.com/rathnasgala2/publish), pinned to a full 40-character commit, never a tag or a branch. And it is checked: our API reads your repository at the commit that triggered a run and admits the caller only if its path, digest, pin, trigger, permissions, inputs, secret map and guard all equal the contract.

## How a run earns its authority

The reusable workflow has nine jobs, and which of them may hold what is the core of the design.

`prep` is the only job that sees a checkout of your repository. It packs the files into a carrier. `build` never sees the checkout: it unpacks the carrier, installs our pinned toolchain and renders the site in a sandbox with no network after dependencies are installed, a read-only source mount, one writable directory, a non-root user with every capability dropped and a wall-clock ceiling. Its permissions are `actions: read` and nothing else, so that job cannot request an identity token at all. `freeze` then recalculates the digests in a third empty workspace, trusting neither earlier job's filesystem, only their exact artifact ids and digests.

Only after that does a job ask for authority. `authorize` holds `id-token: write`. (An optional `attest` job, which signs provenance records, holds one too; the standard caller leaves it off.) It asks GitHub for a short-lived signed token saying, in effect, this repository, this commit, this run, addressed to one audience: a URN naming the deployment-intent purpose. It sends that token to our API with the metadata of the frozen build. The token is single-use, so the helper builds the request and validates it against the closed contract first and asks GitHub for the token only then; a body our API would refuse never spends one. The token is never written to disk and never passed to a later job.

What comes back is the deployment intent, the only authority the later jobs bind to. It names the adapter, the destination coordinates (for Pages, the owner and repository), the workload as a URN built from the numeric repository id, run id and attempt, and the generation the destination is expected to be serving. The deploy job takes every value it acts on from the intent, and none from a workflow input or an environment variable naming a destination. If the intent's Pages binding names a different repository from the one the runner is in, the job refuses before it reads a credential. The expected generation is checked twice, before anything is staged and again just before activation, so a run authorised against one live version cannot overwrite a newer one.

The Pages deploy job holds `id-token: write` and `pages: write`, because Pages requires its own identity token alongside the job's GitHub token. A last job, `report`, asks for a second token with a different audience, the receipt purpose, and exchanges it for a single-use reporting capability, which reaches one masked step output. With it the job posts a preliminary report and the deploy journal. It never issues the receipt; only our reconciliation worker does. Nothing in the chain is a long-lived secret that could sit in your repository settings.

## Two pins, and why they move together

Two files fix what runs. The caller pins the toolchain by commit, which decides the code. The lock file, `gala.lock.json`, pins the inputs by exact version and SHA-256: the schemas, the template, the theme and the publisher packages, including the deploy adapter. As of 2026-10-24 the repository we copy into new sites locks schemas 3.19.0, template 4.4.1, theme-default 4.2.0 and the Pages adapter 0.1.3. The lock is the build's only source for the theme, so a build refuses if your appearance settings name another one, and our API admits a lock row only if it matches a release it knows.

Exact pins have a price, and we paid it three times.

On 2026-10-03 we fixed a toolchain bug and tried to prove it on the sites that had failed. It could not work, by design. A publish operation is bound to the head of its publish branch, so moving the pin there and dispatching a run got a 409 from the exchange, and re-running an old run never passes because its carriers are stale. Sites whose caller carried the old pin read as not set up until set-up ran again. The only proof of a toolchain fix was a new publish, and we spent two hours on the old ones before accepting that.

The same two days taught the other lesson. When the Pages leg first ran on real GitHub runners, on 2026-10-03 and 2026-10-04, its first four failures each came from a value GitHub controls that we had pinned by assumption: the host list for the token endpoint, the shape of its request path, a 4,096-byte ceiling on a runner credential that measured 4,128 bytes in an environment job, and the format of an artifact digest. Unit tests passed because the fixtures held the same guess. Each fix cost a commit, a pin bump and a fresh repository, since a failed operation is terminal. We replaced the host list with a grammar, because GitHub rotates the shard behind that endpoint. The rule we kept: measure on a real runner with a scratch workflow that prints lengths and shapes, never values, before pinning anything GitHub provides.

On 2026-10-23 the lock half bit us. A new Pages adapter, 0.1.2, reached npm at 12:46 UTC. Within minutes the round that adopted it had moved the callers of existing sites to the new toolchain without moving their locks, and publishes on the newest template contract began failing with `LOCK_ADAPTER_IDENTITY_INVALID`. By 13:21 we had reverted, with new commits that descend from the old ones, and we had adopted 0.1.2 properly by 17:51 UTC. Now the caller and the lock move in one commit or the move is held, the toolchain keeps the previous release admitted, and the order is fixed: catalog row, release to npm, API admission, then the template.

## Before you build your own

If you are designing a deploy that must hold no secret, start with two lists: the jobs that touch content you do not control, and the one job that has to prove who it is. Keep them apart. Then pin the code by commit and the inputs by integrity, move a caller and its lock together, and measure what GitHub sends you before you write a grammar for it.

To watch a publish run, the start flow is at https://app.galascribe.com/
