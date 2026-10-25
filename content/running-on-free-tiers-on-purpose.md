---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a17138-2dcb-795f-be5b-0e20705a4455
kind: article
title: Running on free tiers on purpose, and where we pay
description: Creator sites cost us nothing to serve, and our paid core of a host, a database, storage and a registry was estimated at about $49 a month.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- hosting
- costs
- github
- cloudflare
status: draft
publishAfter: '2026-12-18'
createdAt: '2026-10-25T04:01:09.000Z'
slug: running-on-free-tiers-on-purpose
redirects: []
extensions: {}
---

Fifteen to twenty minutes: that is what one push to the main branch of our API repository used to cost in GitHub Actions. The quality gate, the release gate, the image build, the vulnerability scan and the deploy all ran. A pull request cost about eight. GitHub's free plan gives an account's private repositories 2,000 minutes a month between them, which is 100 to 133 pushes, or three to four a day, with nothing left for pull requests. By 2026-09-27 we had none. GitHub declined to start jobs on our private repositories until the account's spending limit was raised.

That ceiling was not a choice, and it is the least flattering part of the story. The rest of the stack was a deliberate split, decided on 2026-09-09: free hosting wherever it can carry the load, paid compute where it cannot, and nothing in a reader's path that depends on our servers. Here is what that looks like in practice, including the parts that are not free.

## What is free, and what free means here

Every creator's site is served by GitHub Pages from a repository the creator owns. We do not serve their HTML, so a reader's page view, the bandwidth and the caching never reach our servers or our bill. The build runs as a workflow in the creator's own repository, so it runs under their GitHub account, not ours. For a creator, Pages costs nothing on a free GitHub account as long as the repository is public.

Our App is a set of static files on Cloudflare Pages. The decision record for the hosting layout lists what the Cloudflare free plan supplies: DNS for our domain, proxying and TLS for the API, the managed firewall rule set available on that plan, the redirect from the bare domain to the App, and static hosting. It also names what we do not depend on: load balancing, Argo, Access and the other paid products.

Our packages (the schemas, the renderer, the themes and the publishing toolchain) live in public repositories, which do not draw on the 2,000 minutes, so their checks and npm releases cost us none of them.

The part of the product that a creator's readers touch should cost us nothing per reader, and the decision record states the requirement: published author sites must stay readable when our control plane is down. We think that is the right constraint for a creator product. Your archive is files in your repository, served by a host we do not run, so reading it does not depend on our servers or on our bill being paid.

## What we pay for

The control plane is not free. One DigitalOcean Droplet runs the API, and since 2026-09-30 the background worker runs inside the same process. One single-node managed PostgreSQL database sits in the same region. There is object storage for backups and encrypted exports, a container registry, and a Google Workspace for our mail. We put backups with a different provider from the one that fronts the API on purpose, so a provider-level incident does not take both.

The decision record from 2026-09-09 carries an estimate of the launch bill, written to size the decision and meant to be checked against the providers' pricing before the first invoice: about $24 a month for the Droplet, $15 for the database, $5 for object storage, $5 for the registry and nothing for Cloudflare, roughly $49 in all. It excludes bandwidth overage, snapshot storage, backup retention beyond the included window and any paid Cloudflare product, and it does not include the Workspace. It is a planning figure from 2026-09-09, not an invoice.

The decision record calls the single Droplet "a single failure domain", and it is one. What keeps that tolerable is the rule above: when the API is down, every published page still loads. The one exception is the thing that needs us, which is likes and comments. In that case the article loads as before and its reaction section says responses are unavailable.

## What the free tiers cost us

- **GitHub Pages.** Its limits become our creators' limits. GitHub's documentation, read on 2026-10-24, gives a published site no more than 1 GB, a soft bandwidth limit of 100 GB a month and a 10-minute deployment timeout, which is what we had recorded in August 2026. Its cache is a limit too. On 2026-10-22 we measured `max-age=600`, and neither a unique query string nor a no-cache request header got past it, so we verify that a publish is live by polling for up to about eleven minutes and never trust a single read. GitHub's documentation also says that on GitHub Free the repository must be public, and that a Pages site is publicly available on the internet even if its repository is private. We cannot change any of that.
- **Cloudflare in front of the API.** Its protection refuses GitHub-hosted runners, so the deploy's canary check of the API was designed to run from the host itself.

The third cost is the one that changed how we work. On 2026-09-27 we moved every repository to main, stopped opening pull requests, and began deploying from the workstation. Since 2026-10-06 each commit pushed to a private repository ends with `[skip actions]`, and any run a push still starts is cancelled, because a run in progress also blocks the local deploy script. Gates run on the workstation from clean clones. By 2026-10-18 our notes counted 296 recorded deploys. The public repositories still release through Actions, which we accepted because their minutes are free.

The price is that a workstation is now our deploy server, and no pull request or pipeline stands between a commit and production except our own checks. We replaced the automation with guards. The deploy script refuses to run when any of the three private checkouts has uncommitted changes or is ahead of its remote, it runs the full test gate for any commit that has no recorded gate, and it stops if a GitHub run is active. They are guards and not a pipeline, and we say so because a reader weighing the same trade should not mistake one for the other.

## Before you pick a free tier

Write down the unit the limit is counted in, price your routine action in that unit, and multiply by how often you really do it. We had not done that sum. The unit was minutes, the action was a push, the price was 15 to 20 of 2,000, and the answer was three or four pushes a day.

To set up a site of your own, the start flow is at https://app.galascribe.com/
