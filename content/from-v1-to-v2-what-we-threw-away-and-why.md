---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a15c94-3080-7600-97fc-d710bd11ccbb
kind: article
title: 'From v1 to v2: what we threw away and why'
description: We deleted our first v2 interface instead of keeping it beside the rebuilt one. What went, what stayed underneath, and which seams still show.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- product
- redesign
- migration
- ux
status: draft
createdAt: '2026-10-21T03:49:38.000Z'
slug: from-v1-to-v2-what-we-threw-away-and-why
redirects: []
extensions: {}
---
Galascribe has had two generations. The earlier product, v1, had a public API that took a key in an `X-Gala-API-Key` header and offered read-only "published" scopes, and its sites were published from a headless API. The current platform, v2, works the other way round: a site is a set of files in a repository you own, built and published to GitHub Pages.

This post is mostly about what happened inside v2. We built one interface, rebuilt it around what a writer does, ran the two side by side for a while, and then deleted the first outright. There is now one interface at the root of the app, a table of permanent redirects for the addresses the old one used to answer, and a real 404 for everything else.

## What the first v2 UI was

The journey inventory we wrote on 2026-09-30 counted 27 routed journeys. They followed the API's own nouns: organisations, members, roles, publications, source, content, reviews, releases, operations, account. The Releases screen carried the pipeline's controls: publish now or scheduled, out-of-date recovery, retry the default branch, reconcile, roll back.

It also exposed our gaps. The contract advertised 86 operations, and 14 of them had no handler behind them. The account export and account closure screens rendered "unavailable" because nothing served them. A screen per API object ships whatever the API advertises, including promises the server cannot keep.

The first item in the inventory's repair order was a bug. The front end had inferred "live" from the existence of a publish id, so a workflow that failed, or never started, was still reported as live. The repair was a rule rather than a screen: only a deployment that reached the verified state, with verification evidence attached, may be called live.

## What the rebuilt UI decided differently

The design we agreed on 2026-10-05 reorganised the interface around the author's own words: Site, Posts and Look, Changes, Publish, History. Review stopped being a pipeline stage and became an optional collaboration setting. Two defaults went into each publication's settings, both overridable: there is no review step, and the Galascribe GitHub App merges the pull request on the author's behalf.

The governing rule is short: if the system can decide correctly, it must not ask.

| What the first v2 UI left to you | What the rebuilt UI does |
|---|---|
| Notice that other changes had been published first, then bring yours up to date | Rebases automatically when the change is clean; asks only for a real text conflict, where the same lines were edited |
| Merge the pull request in GitHub, then wait for Galascribe to verify the merge | Merges the pull request itself unless the publication's settings say otherwise |
| Choose Reconcile or retry the default branch when a deployment stalled | Reconciles itself; a repair button appears only when something is broken |
| Find progress across the operations and releases screens | One progress strip (Preparing, Building, Going live, Live) that follows you between screens |

## Deleting it rather than keeping both

The rebuilt UI first lived under a path of its own while the first one stayed at the root. Later the roles swapped: the rebuilt UI moved to the root and the old one moved to a path of its own. On 2026-10-18 we deleted the old one outright.

Running both left marks that we are still removing: comments about the rebuilt UI's early base path, style checks that skipped its folder, and copy that referred to a "second UI".

Old addresses were the part we did not want to break. The 2026-09-30 inventory lists routes such as `/organizations/{id}/publications` and `/invitations/{id}/accept`, the kind of address someone may have bookmarked or been sent. A table of 301 redirects now answers the old addresses. An address that is in neither interface gets a real 404, never a silent redirect; that was already the rule for unknown routes.

## What changed in the model, and what did not

In the API a site is a publication, and the interface calls it a site. A publication has a destination, the place its built output goes. GitHub Pages is the only destination; the API call that edits a publication's destination is on our list of wrappers no screen uses.

Most of what mattered did not change, and that is why we could replace the interface rather than the system:

- Your content stays in your site repository. The API stores paths, blob ids, sizes and digests, not what you wrote.
- "Live" still means a verified deployment with evidence, as above.
- A change is still a pull request in your site repository.
- The API is not versioned. Every backend change for the rebuilt UI was additive: a publishing policy, publishing several changes in one action, a site summary read, a readable history, restore limited to versions that were live, and one pending change per path.

The contract stood at version 3.15.0 at our last inventory.

## What we dropped

Deliberately, with the old UI:

- A stub OAuth clients page. About 1,000 lines of server code, 47 interface strings and three operations that served it still wait for removal, which needs a contract release.
- The content and source views built on the old model.
- Editing of publishing destinations other than GitHub Pages.

Cut from the rebuilt UI because no API stands behind them: account export and account closure. We would rather have no button than one that says "unavailable".

Deferred on purpose, with nothing half-built: newsletter, payments, a command-line tool, hreflang, a navigation editor, per-author SEO, theme font pairing and density, and layout variants.

## What the seams still show

Deleting the screens did not delete everything they left behind. Our own inventory from 2026-10-18 lists:

- 1,248 catalogue content keys that no screen references but that still ship in the bundle, and a 196-key message file belonging to the deleted interface.
- Role descriptions that still mention analytics and payments, which we do not offer.
- A passkey registration on the Account page that promises sign-in with passkeys, while sign-in offers GitHub and a recovery code. At the time of the inventory the API side was complete and the sign-in side was not.
- A service README that still carries about 3,000 lines describing screens that no longer exist.

The cleanup list is ranked and most of it needs no decision, only time. We would rather print the list than let the deleted interface go on shaping what we say.

To see what a site looks like at the end of all this, the demo is at https://demo.galascribe.com/henry-stewart/
