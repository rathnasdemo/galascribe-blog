---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a15ca8-eea7-7783-a74c-f7fb82750acd
kind: article
title: Likes and comments on a static site
description: A site of plain files cannot count likes or know who is commenting. How built pages call the platform API for both, and what that costs us.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- interactions
- comments
- security
- moderation
status: draft
createdAt: '2026-10-21T04:12:17.000Z'
slug: likes-and-comments-on-a-static-site
redirects: []
extensions: {}
---
A Galascribe site is a folder of files served by GitHub Pages, and a built page used to make no request to anything but its own files; its content-security policy said so. We deferred likes and comments in an early plan, then reversed that: they are core to what we are building. Files cannot add a like to a count, cannot tell who is pressing the button, and cannot slow down someone who presses it a thousand times. Something outside the site has to do those jobs. This post describes the build specification we wrote on 8 October 2026, and what we left out of it.

## What a static site cannot do alone

Three things stand in the way.

A count is shared state. Two readers must see the same number, so it has to live somewhere both can write to. A comment has the same need, plus it has to outlast the reader's tab.

Identity is the second. Writing on someone's site needs a name attached, or comments answer to nobody. A github.io page has no account system and cannot keep a secret: any key in its script is readable by every visitor.

Limits are the third. Rate limits, link limits and moderation need a place that sees every request, and a static host sees none.

So the platform's API has to hold the state, the identities and the rules, and the page has to ask it questions. The cost belongs up front: the design stores reactions and comments in our database, not in the creator's repository, and there is no export of comments or likes today. In the design the settings live in the repository; the readers' data does not.

## How a page talks to the API

The design calls for the module to be off unless the repository says otherwise. A file, `gala/modules/interactions.json`, holds the author's choices for reactions, comments, thread depth and public counts, and with no file the built page gets no markup, no script and no requests. The design has our web app edit that file as a repository change, following the precedent of theme selection.

In the design, each article gets a section at its foot, carrying the publication id, the article's id, the canonical address and the API origin as data attributes. One script, loaded on article pages only, does the rest, building the interface with DOM calls and never inserting fetched data as HTML.

Reading is public. The design has the script ask the API for the article's reactions and a first page of comments from endpoints that answer cross-origin requests from any site, take no cookies, and report counts in buckets, which we come back to below.

Writing needs a reader, and our own sign-in does not help. The platform's session cookie is host-only and `SameSite=Lax`, so a browser does not attach it to requests a github.io page makes to our API. The page needs a credential of its own, handed over without cookies. The design uses a full-page redirect and an OAuth authorization code with PKCE, in four steps:

1. The script makes a random state value and a code verifier, stores them in `sessionStorage` with what the reader was trying to do, and sends the tab to our app's connect page.
2. The app signs the reader in with GitHub if needed and asks the API for a one-time code that lasts 60 seconds. The API refuses any return address that does not begin with the publication's recorded address.
3. The reader lands back on the article with the code in the URL fragment. The script removes the fragment from the history at once, checks the state value, and trades code and verifier for a token.
4. The token is valid for 30 days and good for one publication only. It sits in that site's `localStorage`; the API stores only its hash. Every write sends it as a bearer header with credentials omitted.

A pending like is then applied, and a half-written comment is put back in the box, not posted for the reader. The design lets readers see and revoke every site they have connected from their Account page.

## What this does to the content-security policy

Until now every built page carried a content-security policy that allowed connections to the site itself and nothing else. A like button must connect elsewhere, so the design changes one directive. The policy it calls for, with line breaks added:

```
default-src 'none';
base-uri 'none';
object-src 'none';
form-action 'none';
script-src 'self';
style-src 'self';
img-src 'self';
font-src 'self';
connect-src 'self' https://api.galascribe.com;
media-src 'self';
manifest-src 'self';
worker-src 'none'
```

The line that matters is `connect-src`, which used to be `'self'` alone. Everything else stays closed: scripts only from the site's own files, no frames or forms, images only from the site itself. That last rule is why avatars are initials. A reader's profile picture would have meant opening `img-src`, and we chose not to.

Three consequences follow.

First, the design allows the API origin on every site, interactions on or off. The policy is a fixed constant hashed into what we call the render-policy identity, so any change moves that identity, and every place that checks it (the template, the theme tooling, the publish step) has to change together.

Second, every build's manifest and provenance record carries an `interactionBearing` field that the schemas pin to `false`. Making it a plain boolean means a schema release, not a template tweak.

Third, a token in `localStorage` can be read by any script running on that origin, so `script-src 'self'` is not decoration: only files served from the site itself can run beside the token.

## Abuse limits

Anyone can call the public endpoints, so the design puts the limits on the API. Its defaults: 60 reactions a minute; 5 comments a minute and 30 an hour; 10 comments an hour for accounts under a day old; 20 reports an hour. They are runtime settings enforced in the database, and a breach answers 429 with a retry hint.

The design calls for comments to be plain text, 1 to 10,000 characters, with at most 10 links, each marked `nofollow ugc`. Text that looks like a credential, such as a GitHub token or a private-key header, is refused, and a required idempotency key stops a double click posting twice.

In the design a new comment is visible at once and scanned afterwards: deterministic spam checks always, and a language-model classifier only if an API key is configured. The scan can flag a comment or hold it from view, both reversible. Only a person removes a comment, and report counts alone never do.

The design reports public counts as lower bounds: exact up to 9, then 10+, 20+, 50+ and so on, worded "At least 50 likes", never "people". Exact numbers go to the site's owner only.

## What we left out on purpose

The design has no reader login of its own: no passwords and no new providers. A reader is an existing Galascribe account, signed in with GitHub. The trade-off is plain: a reader without a GitHub account cannot comment, and we have not tried to solve that.

We left out popups, frames, cross-window messaging and FedCM. The spec records the popup-and-message approach as the one that failed in v1. The design uses no cookies or third-party requests on the page, and the redirect costs the reader a page load.

The design makes comments plain text, with no images or formatting. A site without the configuration file is simply off. If our API is down, the design keeps the article loading as before and the section says responses are unavailable. Without JavaScript there are no interactions at all.

To set up a site of your own, the start flow is at https://app.galascribe.com/
