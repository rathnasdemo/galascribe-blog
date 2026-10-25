---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a17138-2dd9-79e9-aed2-0ddd51fdaa74
kind: article
title: Why a preview we send is public, and says so
description: We build a creator's preview before emailing them, so it is public by then; our email now says it is hidden from search engines and one email removes it.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- outreach
- previews
- privacy
- honesty
status: draft
publishAfter: '2027-01-15'
createdAt: '2026-10-25T04:01:09.000Z'
slug: why-a-preview-we-send-is-public-and-says-so
redirects: []
extensions: {}
---

Until 2026-10-23 our cold email to creators carried a sentence that had stopped being true: "nothing is published until you approve it." By then we had decided to build each creator's preview site before writing to them, and to link it in the email. The page, made from their own videos, was on the internet when the email was sent. Here is what we replaced it with, and what "hidden" does and does not mean.

## How a sentence went false

Our design of 2026-10-15 built a creator's demo after they said yes. On 2026-10-23 we decided to reverse that: a preview for every prospect first, so the email shows their own page instead of an example from someone else's channel. The wording of the email did not change when the plan did.

On 2026-10-23 itself we first logged the sentence as an open copy question and left it as it was, and the decision to drop it was recorded the same day. The fixed paragraph in the email now says that the preview built for them is hidden from search engines, carries no ads, and is not used by Galascribe in any other way, and that one email to our support address takes it down. The closing paragraph says a quick "no" is fine and we will take the preview down and not write again.

We also moved the promise into code. Our outreach tool compares the fixed paragraphs with the saved email character for character, apart from quote style, no-break spaces and line wrapping. A draft that still carries the earlier wording is refused, and the message shows the current paragraph. The support address is allowed to appear only inside that paragraph; written anywhere else in an email it is refused as a domain that is not in the facts. A promise that lives in a test does not drift back the next time someone writes an email by hand.

The same facts sit on the page itself. The landing page at the root of our preview domain explains how a preview works, says that previews are kept out of search engines, carry no ads and are not used in any other way, and tells a creator who received our email that replying yes brings the link that makes the site theirs. Our design of 2026-10-15 already required that creators be told, on the site and in the email, that previews are not indexed.

## What "hidden from search engines" means

Every demo site shares one host, and crawlers read `robots.txt` only from the root of a host. One repository serves that root, and its file says `Disallow: /`, so it covers every preview under `demo.galascribe.com` at once. The landing page at the root also carries `noindex`. When a creator claims a site, it moves to their own GitHub account and address, and the rule no longer applies to it. Nothing has to be flipped or republished.

We considered marking each page `noindex` and rejected it. It would need a bulk edit and a republish at claim time, and a crawler blocked by `robots.txt` never reads the page to see the tag anyway.

The limits are real. A blocked address can still appear in search results as a bare link if someone links to it publicly. And "hidden from search engines" is not "private": anyone with the address can open the page.

The address of a preview for a channel that does not license its videos under Creative Commons Attribution carries a six-character suffix, so typing the creator's name does not reach it. For channels that do license that way, the preview may have a plain public address. The suffix is a convenience, not a lock: anyone who learns the address can open the page. That is obscurity, not access control, and it is one more reason the email says the page is public.

## What stays manual, and what we cannot undo

Our own rule, recorded in the note on each preview built without consent, is to delete it on request or after 14 days without a reply. It is our policy, not a legal claim. For the set we built on 2026-10-23, that deadline is 2026-11-06. Deleting them is manual today: our tool lists the previews that are due, and a person removes them.

A refusal gets the same plain treatment. A reply that is only "no", "no thanks" or "not interested", or whose first clause is, marks the creator as unsubscribed, because the email promises that a quick no is enough. A "no" inside a longer sentence goes to a person to read.

What no paragraph can change is that a preview exists before anyone has asked for it. We make a page from a creator's public videos, in their own words, with each article linking back to the video, and we do it before we have their consent. That is a judgement call we are making openly, and the plain paragraph is how we try to keep it fair: it states the facts a creator needs and lets them remove the page with one email.

## If you send something you made for a person

Before the first message goes out, check that it says five things, in plain words:

1. Where the thing lives, and that it is public if it is public.
2. Who can find it, including search engines, and how that is enforced.
3. What you do with it, and what you do not.
4. How to have it removed, by what action, and how fast.
5. What happens if they never answer.

Then put the wording where a test can see it, so that changing the plan forces a visit to the words. Ours is compared character for character now, which means any change to the promise is a code change that somebody has to review.

To start a site of your own, the start flow is at https://app.galascribe.com/
