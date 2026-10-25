---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a17138-2dd5-7923-bfe6-0c939ee4813e
kind: article
title: Two days on one footer
description: Our legal footer was on npm on 2026-10-21 yet missing from our blog on 2026-10-22, because of a lock that never moved, themes the App lacked and no rebuild.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- releases
- rollout
- incident
- testing
status: draft
publishAfter: '2027-01-29'
createdAt: '2026-10-25T04:01:09.000Z'
slug: two-days-on-one-footer
redirects: []
extensions: {}
---

We wrote the legal footer on 2026-10-20 and it was on npm the next day. On 2026-10-22 I opened our own blog and it was not there. No Terms link, no Privacy link, no credit link. In the same visit I found that the Look page told me our Minimal theme "does not support colours yet", and that the layout looked wrong (template 4.4.1, released that day, reworked the header and footer layout). The template, the schemas and five of the six themes were already released. No reader of our own blog could have seen the feature.

The distance between "released" and "on a site" took us until 17:48 UTC that day to close.

## What we had counted as done

The footer was part of a larger change. Template 4.4.0 added a legal navigation with Terms and Privacy links, two policy pages every site now carries, and an optional consent banner for analytics. Because the template's styling contract grew, every theme had to be rebuilt as 4.2.0 against it: template 4.4.0 refuses themes built for the old contract. By 2026-10-21 the schemas, the template, the theme tooling and five of the six themes were on npm. The publish toolchain and the repository that our set-up step copies from were still waiting on two packages we had not yet published, an Editorial theme release and a new adapter version.

Released to npm and pushed was our definition of finished, and the last step in our rollout notes read "Set up repository, then Publish, on each live site." We had never run that step on a production site. Our own notes had even recorded that no action existed to move a site onto the new template generation, and we kept writing the rollout line as though one did. Every live site was still on template 4.3.0. The footer lives in 4.4.0.

## Three separate causes

The first was that nothing moved a site to the new generation. "Set up repository" rewrote the workflow file that calls our publish toolchain, but not the site's lock file, which is what names the template version. A background generation sweep reverted the change 49 seconds later. A site that stays on 4.3.0 cannot render a footer built in 4.4.0, however many times it is published.

The second was a mistake of ours, made while moving the theme catalog to the new releases. On 2026-10-21 we changed the API's theme catalog and, by replacing the older theme entries instead of adding to them, left sites still on 4.3.0 with only Editorial in the picker. We repaired that the same evening by keeping both releases of each theme and choosing between them by the site's own contract. But our App had bundled only the new theme releases. Given old-generation entries from the API, it could not read the site's manifest, which is how the Look page came to say that Minimal had no colour support. We had changed the set of values the API serves and had not tested the App against the new values.

The third turned up when everything else worked. We shipped fixes at about 17:00 UTC: Set up repository now moves the lock and the caller in a single commit, and the App bundles both theme generations. I pressed Update now on the blog. The set-up commit landed with the lock on template 4.4.1 and was not reverted. And the site was still not rebuilt. The App only shows Publish when a change is pending, set-up commits go straight to the main branch and are not changes, and the automatic first publish skips sites that are already published. No button a person could press would publish the repository's current head.

We got the footer out by a side route. Saving the Legal pages settings created a pending change, Publish Now deployed it, and at 17:48 UTC a plain fetch of the blog showed the Terms, Privacy and Galascribe credit links, with `/terms` and `/privacy` both answering 200. A settings save is not a way to publish a site, so we counted the missing path as a defect, not as the fix.

## What we changed

Update now publishes a live site in the same click that moves it, and the App's repair text says so. Existing sites do not move to a new template generation on their own. We decided there would be no background generation move: a site changes generation when a person presses Update now, and not otherwise.

The part that took more thought is the self-healing. A worker now republishes a live site whose repository head is ahead of the live build only by commits that Galascribe itself wrote, once per head. The proof that we wrote them is a ledger in the API of the commit SHAs we created, not authorship. Authorship is spoofable here: GitHub resolves a commit made with our bot's noreply address to the bot, and marks it verified. Each publication is seeded into the ledger once, on the worker's first pass.

That code reached production at 21:41 UTC on 2026-10-22. Its first pass looked at seven publications and republished two. The blog's run succeeded at 21:47 UTC. The other publication was verified live at 21:50 UTC.

That day needed three human workarounds: press Update twice, force a publish through a settings save, and explain a red run that was not a real failure. By 2026-10-23 every package in the release chain was out. The designed path for any other existing site is one click on Update now, which moves the site and publishes it, with the self-healing worker as the backstop when the publish does not follow.

## The rule we kept

A feature is finished when a real live site renders it after the exact button sequence a person uses. Before you call a rollout path "run Set up, then Publish", run it on one production site. Read the commit it produced, then fetch the built page and look for the thing.

The second rule is narrower. When a server change alters the set of values it serves, such as catalog rows, enum members or versions, search every client that consumes them and add a test with the new values. No App test used the new values, so none could have failed.

To set up a site of your own, the start flow is at https://app.galascribe.com/
