---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a17138-2dd0-7bab-bfbf-8e438276e5e9
kind: article
title: The platform that serves no HTML
description: Our first architecture record says the platform hosts nothing and GitHub Pages serves every page, which saved us infrastructure and limits every author.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- architecture
- github-pages
- hosting
- limits
status: draft
publishAfter: '2026-12-27'
createdAt: '2026-10-25T04:01:09.000Z'
slug: the-platform-that-serves-no-html
redirects: []
extensions: {}
---

ADR-002, an architecture decision record in our v1 design set versioned 2026-08-09, is titled "GitHub Pages is the only host; the platform serves no HTML". Its decision reads: "All HTML is served by GitHub Pages, from the author's domain or `username.github.io`. The platform hosts nothing." We wrote that sentence because the alternative was blocked, and we have lived with the consequences ever since. Here is why we could not host the pages ourselves, what we got in exchange, and what it costs the people who publish with us.

## Why we could not host it ourselves

The earlier design mirrored articles to a page on our own domain, at an address of the form `/@username/slug`. That needed rendering infrastructure, a canonical-address policy, media hosting and a gate before publishing. The record says the mirror was "blocked outright": as we understood GitHub in August, it enforces one repository per custom domain and cannot route several repositories under one domain's subpaths.

We looked at the other ways in. A reverse proxy was workable but brought back infrastructure, bandwidth and liability. Per-user subdomains on our domain would have put other people's content inside our cookie and CORS scope. Both were rejected.

GitHub's current documentation describes the nearest thing it offers. A custom domain set on a user or organisation site is inherited by that account's project sites, which are served under the repository name as a path. That is an arrangement within one account. As we read it, it still does not let a platform put other people's repositories under its own domain, which was the thing we needed.

## What the decision bought

The record lists the gains in one sentence: it removed duplicate content, canonical-address conflicts, media hosting and CDN cost "in one move", and our liability shrank to the REST API.

It also set a security boundary. A second record, ADR-003, says that everything running in the author's own CI is untrusted, because the workflow file lives in their repository and they can edit it, fork the action or call any endpoint directly. Validation in that runner is feedback and never enforcement. The record is blunt about why this is tolerable: "Acceptable only because of ADR-002." We cannot guarantee what any Pages site serves, and if platform hosting ever returned, that boundary would break.

Not serving the site also means we have to go and look at it. The Pages adapter in our publish tooling ends a deploy by verifying the result through public reads of the activated address, made without credentials, because GitHub, not us, answers the reader's request.

## What it costs the people who publish

The v1 record put it plainly: authors inherit the limits of Pages. GitHub's documentation, read on 2026-10-24, gives the numbers:

- A published site may be no larger than 1 GB.
- A site has a soft bandwidth limit of 100 GB per month.
- Deployments time out if they take longer than 10 minutes.
- There is a soft limit of 10 builds per hour, which GitHub says does not apply if you build and publish with a custom GitHub Actions workflow. Galascribe publishes through a workflow in your repository, so it does not.

Our adapter declares its own ceilings of 1,073,741,824 bytes for an artifact, which is 1 GiB, and 100,000 files. GitHub's wording says 1 GB. If a site ever gets near the line, GitHub's page is the one to trust.

GitHub's page also says Pages is "not intended for or allowed to be used as a free web-hosting service to run your online business", and it extends that to sites mainly focused on commercial transactions or commercial software as a service. If you plan to sell directly from your site, read that paragraph before you read ours.

There were quieter costs in v1. The record says free-plan authors had to use public repositories, and GitHub's documentation says scheduled workflows in a public repository are disabled automatically after 60 days without repository activity. Our nightly job therefore pushed an empty commit when a repository got close to that age, and the record concedes that repositories "accumulate occasional empty commits". Comments, being client-side, contribute nothing to search ranking: ADR-016 says widgets fetch from the API at read time, so comment text is not in the HTML GitHub serves.

## What v2 kept, and what it changed

The decision survived the rewrite for creators' pages. v1 had no hosted interface at all, by decision: administration was REST only. v2 has an app at app.galascribe.com, and that is HTML we serve, but none of it is an author's article. The build now runs in the author's own repository: the README every new site starts with says the work "happens inside your own GitHub account, using GitHub's own build minutes — not on Galascribe's servers". The renderer is a published package built on Eleventy, the same generator v1 chose, run inside that workflow.

Likes and comments are the one thing a page cannot do by itself. It cannot count them, so the built page asks our API for them as data. The page is still GitHub's.

The price of the decision shows in what we do not offer. GitHub Pages is the only destination a creator can publish to today. The contract describes two others, DigitalOcean Spaces and a local directory, and the README for new sites says the Spaces option is not offered yet. A creator who outgrows Pages has no second host inside our product.

Before you put a publication on Pages, with us or without us, check three numbers against your own site: the size of the built output with every image, how long a full build and deploy takes, and your monthly traffic. If any of them is close to GitHub's limits, plan for that now, because today we have no other host to move you to.

To start a site on GitHub Pages, the start flow is at https://app.galascribe.com/
