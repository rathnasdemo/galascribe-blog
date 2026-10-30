---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a17138-2dca-771a-bf70-da3925114283
kind: article
title: 'Revamping the UI: thirteen journeys and a coherence audit'
description: We built thirteen journeys, then audited every screen and found that each area worked on its own while the failures sat between areas.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- ux
- audit
- journeys
- product
status: draft
publishAfter: '2026-12-06'
createdAt: '2026-10-25T04:01:09.000Z'
slug: revamping-the-ui-thirteen-journeys-and-a-coherence-audit
redirects: []
listen:
  audio: assets/listen/revamping-the-ui-thirteen-journeys-and-a-coherence-audit.mp3
  durationSeconds: 403
  format: conversation
extensions: {}
---

On 2026-10-12 one of our own sites gave four different explanations for the same problem. Publish said the publishing setup in the repository "was changed by hand". Home said the repository "needs a quick update". Settings said "Connected", with nothing to press, while its repair notice said to move files on GitHub. The Update repository button on Home ran, returned, and did nothing visible. Nobody had changed anything by hand. A change to our own starter text had made every site compare as edited, and the API was collapsing seven different causes into that one sentence.

Each of those screens was reasonable on its own, and that is the point: the defect lived between them, where no screen-by-screen test looks.

## What the person is trying to do

On 2026-09-30 we inventoried every mounted route: 27 of them, named after the API's own nouns (organisations, members, roles, releases, operations). The contract advertised 86 operations and 14 had no handler behind them, so some screens promised things the server could not do. The first repair was a rule, not a screen: the front end had inferred "live" from the existence of a publish id, so a workflow that never started still read as live. Now only a deployment that reached the verified state, with evidence attached, may be called live.

On 2026-10-09 we wrote the remaining work as thirteen journeys, told from the person's side. An author puts a picture in a post, or schedules one. An owner hands an organisation to a successor, or moves a site into another organisation. Someone brings in an existing repository, previews a change, defines a custom role, closes or exports their account, puts the site on their own domain, removes the Galascribe mark, or asks for a shorter edition of a post. A reader appeals a removed comment. The operator runs the platform. Each one is a numbered list of what the person sees, failure states included: the image that is too big, the upload that fails offline, the schedule cancelled because someone edited the post. All thirteen followed the same rules: server truth only, every state named with a next step, no spinner without a deadline.

By the evening of 2026-10-09 the first batch had passed its gates. Local validation passed eleven of the thirteen; the other two need the real world, production for custom domains and a real provider for generating an edition. One of them we built and then hid. Moving a site between organisations has to move its data, and on our schema that needs a rework: 62 tables carry the publication id, 57 of them under row-level security whose check refuses a different organisation, 47 have composite foreign keys to it, and 29 have triggers that refuse an organisation change. The flow was complete, its final step settled as failed, and the App kept the section behind a flag. We recorded it as a named cut rather than ship a screen that looked finished.

## The audit

On 2026-10-12, three days later, we audited the result, read-only. We dumped all 2,850 interface strings and searched them for vocabulary, read each area's page and its words module, and ran our browser checks, where 49 of 50 passed. Every finding got a severity: blocks (the person cannot finish, or is sent somewhere with nothing to press), confuses (the App contradicts itself, names the wrong cause, or hides the next step) or polish.

The verdict: Domain, Publish and Restore, Start and the editor were each coherent, with states, sentences and next steps. The App broke down between areas.

Counting words made the seams visible. A repository needing repair had five names across the App, a failed publish had five phrasings, "connect" had six meanings and "address" had five. Start asked for an "Address" and said it was where readers find the site, while the value was an internal short name that never reached a reader's URL. "Draft" meant three things with three lifespans: text kept only in this browser, a change saved on GitHub, and a post hidden by its front matter. Someone who switched devices lost the first kind without warning.

The second half of the audit compared promises with what stood behind them. The analyst role read "Can see how the sites are doing", and we have no analytics. The billing role looked after "the plan and payments", which were deferred. With likes and comments off, which was true of every existing site, the Comments page said "No readers have reacted or commented yet", blaming readers for a setting. If the list of sites failed to load, Home said "You do not have a site yet" and offered Create your site, an invitation to make a duplicate. Settings always showed a Move section saying the feature was not available yet, for something we had already decided not to build.

The top ten were ranked by severity, and the first four were rated as blockers. The first was the opening story. The third was a build failure that nothing named: a site on the previous template generation would fail its next publish with "your site couldn't be built".

## What we changed, and what we left

Sixteen of the nineteen proposed work packages (P1 to P16) were pushed to main and deployed on 2026-10-12. The API now carries the reason and the file paths on the attention item (schemas 3.9.0, as optional fields), and the App has one words module that turns a reason into a sentence and a next step. "Changed by hand" can no longer be a guess. Settings, Domain and the site bar offer the repair in place instead of sending you to a screen that says Connected.

The rest is of the same kind. A failed list of sites is no longer the same as an empty one. An organisations index exists, because an organisation with no site had no page you could reach. The Look screen was a full-screen overlay that left the sidebar behind it in the tab order, so a keyboard user's first dozen Tab stops were invisible; it now behaves like a dialog. Six destructive confirmations that rendered as plain text became real buttons. The vocabulary has a test that fails when a banned variant of a phrase appears in the message catalogue, because a glossary nobody enforces drifts.

We try to fix a class once. On 2026-10-13 the start flow showed that Back from GitHub left "Taking you to GitHub" disabled, because browsers restore a page from the back/forward cache with its state intact. The same stuck state existed in several other places that leave for GitHub and return, so one shared hook now resets them all.

What we left, as of 2026-10-12: P17, an attention item for a site whose toolchain no longer matches its lock, was not built, and the offline browser checks still did not open Domain, Comments, History, Account, Import or Retire. A close relative of that problem reached our own blog on 2026-10-21, when its publish failed after its caller moved to a toolchain that no longer served the site's generation.

## One interface instead of two

On 2026-10-18 we deleted the old interface. It had 35 routes and about 35,000 lines of source, plus about 29,000 lines of tests. I made the call because two interfaces meant twice the code to keep right. Before that we ported what mattered: the operator overview, abuse queue, plans, webhooks and caches. We dropped three things on purpose: a stub page for OAuth clients, the content views built on the old model, and editing of destinations other than GitHub Pages.

You can run this audit on your own product with three checks, and they found most of what we found. Dump every user-facing string and count the words used for each noun and each failure; a concept with more than one name is a finding. For every promise on a screen, whether a role description, a button or an empty state, find the code that serves it; if nothing does, the promise is the bug. Follow every refusal that sends someone elsewhere ("update it in Settings") and stand in that place: can anything be pressed? The third check found our Connected screen.

To start a site of your own, the start flow is at https://app.galascribe.com/
