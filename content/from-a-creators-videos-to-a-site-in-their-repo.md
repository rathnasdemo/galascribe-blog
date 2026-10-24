---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a15c94-307e-79f3-adb5-26cc1f632a8b
kind: article
title: From a creator's videos to a site in their repo
description: How a YouTube catalogue becomes drafted articles from the creator's own transcripts, a labelled preview site, and a claim that moves it into their GitHub.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- youtube
- transcripts
- handover
- github
status: draft
createdAt: '2026-10-21T03:49:38.000Z'
slug: from-a-creators-videos-to-a-site-in-their-repo
redirects: []
extensions: {}
---
A creator who has published on YouTube for years has a large body of spoken work and often nothing written that they own. This post walks through what Galascribe does with that catalogue, using a demo site we built for a history channel, and says where the method runs out.

## The route in one picture

```text
catalogue --> transcripts --> drafts --> checks --> preview site
                                                        |
                          claim: GitHub sign-in + proof of channel
                                                        |
  creator's GitHub organisation <-- "Move my site" <----+
                |
        publish at the new address, search engines on
```

## Catalogue in, transcripts out

We list the channel's uploads and filter them. Shorts, videos under a minimum length, live streams and members-only videos are skipped. For the demo we take the three most-viewed long videos. The rest of the catalogue waits until the creator agrees to go further.

Each video needs a transcript in the language it was spoken in. The tool prefers manual captions in that language, then automatic captions in that language, and falls back to a speech-recognition model only when there are no captions. The order exists because of a mistake of ours: an earlier version of the tool could pick an automatically dubbed track in another language, and 36 transcripts came out in the wrong language. It now never takes such a track, and a test keeps it that way.

Onboarding from a channel is operator-run today. We run these steps ourselves, on a machine we operate, and a creator cannot start them on their own.

## Drafting from the creator's own words

A language model writes each article from its transcript, following rules we keep in a versioned file. We wrote the rules down from the three samples on the demo site.

- Only what the video says. No outside facts.
- First person, in the creator's voice.
- A "Watch from m:ss" link at each section, and a link to the full video.
- Names the captions misheard are corrected and listed in a notes file, and uncertain ones are marked "confirm".
- Figures worth a second look are listed. Only crude phrasing is softened, and every softening is listed.
- References that only make sense on screen, such as "this map", are left out.

There is no length target.

## Checks before anything is landed

A draft must pass automatic checks. The front matter validates against our schema. Every timestamp link falls inside the video's length. Every figure appears in the transcript. The article's length relative to the transcript sits inside set bounds, which catches truncated and runaway drafts. No Markdown is left over, and links go only to YouTube and the creator's own pages. A second pass with a cheaper model flags sentences the transcript does not support, and above a threshold the video is held. A failure stops that video and leaves the others alone.

## What a reader sees

Open the demo and, under the site name, there is a notice that it is a preview built from the channel's videos, not yet claimed, and hidden from search engines. That last part is real. Crawlers read `robots.txt` only from the root of a host, and every demo shares one host, so a single file disallowing everything covers all of them. When a site moves to the creator's account it leaves that host and the block stops applying, with nothing to flip. A blocked address can still appear as a bare link if someone links to it publicly.

The home page has Home, Journal and About, a tag list with counts, search, a light and dark switch, an RSS link, and the three articles as cards with a summary and a reading time of 16, 20 or 27 minutes. An article opens with its summary, author and reading time, then an outline of its sections. The one we opened has seven, a line crediting the original video with a link, and a "Watch from 1:09" style link at each section. The video's thumbnail is the hero image. The video is a link, not an embedded player, because our render policy strips iframes. At the foot are a Like button, a conversation area that says it needs JavaScript, and newer, older and related articles.

## Who approves what

The three sample articles go live on a demo address that Galascribe owns, with no per-article approval from the creator. The automatic checks above are the only gate: a draft that fails is not landed at all.

The step after a claim is not built. The pipeline design imagines new videos arriving as drafts for the creator to review and publish, but today nothing in Galascribe proposes new articles to a creator once a site is claimed. From then on the site is the creator's to write in.

## Claiming the site

The operator command prints a claim link once. The creator opens it, signs in with GitHub and proves they own the channel. The preferred proof is Google's read-only YouTube permission: we use the access once to ask which channel the person owns, compare it with the channel the site was built from, and revoke it. We do not store the token. The fallback is a one-time code, valid for 24 hours, that the creator pastes into their channel description for us to check through the YouTube Data API.

Accepting makes the creator the owner of the organisation that holds the demo, after a recent GitHub authentication.

## Moving it into their repository

The creator makes a GitHub organisation (we recommend one just for Galascribe), installs the Galascribe GitHub App on it and clicks "Move my site". The site repository itself is transferred, not copied. We re-link it only when a handover is expected for that exact owner and a live read through the new installation shows it is the same repository, never on a webhook alone.

The change that sets the new address, rewrites the description to a neutral default and removes the preview notice from the About page is planned and confirmed in the creator's own session. A change should stay a person's act. Likes and comments are tied to the publication and article rather than to a web address, so the ones left on the preview survive the move.

The result we test for is a site at the creator's own `github.io` address, with canonical links, sitemap and og:url on the new address, no preview notice, search engines allowed, and the next publish working from their account. A creator can then move the site to a domain they own from its Domain page, which shows the exact DNS records and checks them; a later post covers that.

## Where it runs out

A transcript is speech. Maps, diagrams, on-screen text and demonstrations are gone, which is why the rules drop "this map" and why the notes record what was left out. Readers who need the visuals have to follow the link back to the video.

Captions mishear proper nouns. We list corrections and mark uncertain ones, but we cannot always tell a mishearing from the speaker's own slip. A check that every number appears in the transcript cannot tell whether the speaker misspoke, and the second pass is one model grading another's work. It flags; a person decides.

Softening crude phrasing is an editorial hand on someone else's words, which is why every change is listed. Math is not rendered. And creators cannot start the route on their own.

Read the three articles and judge the result for yourself: https://demo.galascribe.com/henry-stewart/
