---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a17138-2dd6-7aa4-a6cf-038e30e37582
kind: article
title: We build your site first, then you claim it
description: We build a creator's site from their own videos before they ask, and hand it over only after they prove the channel is theirs.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- creators
- claim
- handover
- trust
status: draft
publishAfter: '2026-12-11'
createdAt: '2026-10-25T04:01:09.000Z'
slug: we-build-your-site-first-then-you-claim-it
redirects: []
listen:
  audio: assets/listen/we-build-your-site-first-then-you-claim-it.mp3
  durationSeconds: 417
  format: conversation
extensions: {}
---

Before a creator has heard of us, a site made from their videos can already exist: three articles with links back to timestamps in the video, likes and comments switched on, and a rule keeping the whole thing out of search engines. It sits in a GitHub organisation we own. The half of the arrangement that matters more is how the site stops being ours.

## Why we build first, and when we changed our mind

Our design of 2026-10-15 built the site after a creator said yes. The goal was a live site within a day of the answer, and the first demo was made by hand for one history channel. On 2026-10-23 we reversed the order and decided to build a preview for every prospect before the first email, so that the email links to their own page instead of an example from someone else's channel.

Building first costs something we should state plainly: we hold a site with a person's channel name and words on it before they have agreed to anything. Everything below follows from that. While the site is ours it has to be hidden and removable on request. If the creator wants it, it has to become theirs completely, not shared with us. The design says demo sites are demo-only: when a creator claims one, the repository moves to their GitHub account and our address is not redirected to it.

## Four checks between a link and a repository

**The link.** A claim link is 32 random bytes. We store only a digest of it, and it is shown once, when we create it. The API answers a signed-out request for the claim details with a 401 and reveals nothing about the channel or the site. A link forwarded to the wrong person gets them as far as a GitHub sign-in, which creates their Galascribe account, and the claim page. It does not get them past the next check.

**The channel.** The person has to prove they own the YouTube channel the site was built from, by one of two routes. The first is Google's read-only YouTube permission. We make one request, which asks for the IDs of the channels that Google account owns, check that the claimed channel's ID is among them, and revoke the access on every outcome. We store no token and log none. We ask for that scope because the narrower ones (openid, email, profile) cannot identify a channel. The second route is a code: a one-time code that expires in 24 hours, which the person pastes into the channel description and which we read back through the YouTube Data API.

Google reviews apps that use this scope, and the review takes weeks. We submitted on 2026-10-17, and at our last record (2026-10-18) the branding was verified and the data access was still under review. Until it passes, Google's consent screen warns that it has not verified the app, so we point people to the code route. That route worked live on 2026-10-17, on a channel we own.

**The ownership.** The "Make it mine" button requires that the channel was verified by this same person and that they have signed in recently. Accepting then runs one transaction. It checks that the claim is verified by the claimant and unexpired, that the organisation holding the demo is a single-person organisation and active, and that its current owner is the person who created the demo, using a compare-and-set on the membership epoch so a concurrent change cannot slip through. Ownership moves by succession: our operator's membership ends and the claimant becomes the owner. A claim by the person who created the demo is refused.

**The repository.** "Move my site" transfers the repository itself, not a copy. The creator makes a GitHub organisation (we recommend one just for Galascribe), installs the Galascribe app on it and clicks. Before the transfer starts, the change that sets the new address, replaces the description with a neutral default and removes the preview notice is planned and confirmed in the creator's own session, because a change should stay a person's act. After the transfer we re-link the site to the new installation only when a handover for that exact owner is expected and a live read through the new installation shows the same repository and the same owner id. We never re-link on a webhook alone. Then we turn Pages on and publish the confirmed change.

What the creator ends up with is short: canonical links, sitemap and og:url on their own address; no preview notice; search engines allowed, because the rule that hides previews lives on our host and not theirs; their next publish running from their own account; and the likes and comments made before the move, which are keyed to the publication and the article rather than to a web address.

## What broke on the way

The first handover could not have worked. We planned to transfer the repository with the demo organisation's installation token, and GitHub answers that with a 403, "Resource not accessible by integration": an installation token can never transfer a repository. We had a probe planned to measure this, and our own production log answered it first, on 2026-10-17. Every handover had failed by design until then. The fix has two steps. The installation token adds the person as an admin collaborator, and then their own user token makes the transfer. The first live repository move that way passed at about 10:40 UTC that day.

The second failure was an identity bug. The sign-in confirmation behind "Make it mine" let someone pick a different GitHub account on GitHub's account chooser. We had rotated the session before checking who had signed in, so the mismatch left the browser signed out, and signing in again as the other account ended on "Verified with a different account". The check now comes first, and the fix went in on 2026-10-18.

One limit to state plainly: as of 2026-10-18 every claim had been a rehearsal on a channel we own, and no creator had completed one.

## Checking it yourself

If you do claim a site, three things are worth verifying afterwards. The repository should be listed under your GitHub account or organisation, not ours. Your Google account's third-party access page should not list Galascribe, because we revoked the access when the check finished. And your site should not be asking search engines to stay away: the Disallow rule lives on our preview host, so it applies to nothing on yours unless you add it.

To start a site of your own, the start flow is at https://app.galascribe.com/
