---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: '2.0.0'
id: 01a171d6-eb79-7591-aa47-670d83f924aa
kind: article
title: We pre-built 23 websites nobody had asked for
description: Pre-building a preview site for every prospect burned half a week's model limit in four hours; the site is now built only when the creator clicks.
language: en
authors:
  - 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
  - outreach
  - tokens
  - previews
  - automation
  - cost
status: published
createdAt: '2026-10-25T06:54:32.000Z'
publishedAt: '2026-10-25T17:49:48.852Z'
slug: we-pre-built-23-websites-nobody-had-asked-for
redirects: []
extensions: {}
---

On the evening of 2026-10-24 the last piece of our outreach automation went in, and we celebrated by running it. Discovery, nightly content generation, scheduled sends, reply handling and two daily to-do lists had all become launchd jobs on the Mac on my desk. We pointed the generation step at 23 creators. Four hours later it had built 23 preview sites, spent four to five million tokens and used up half of a week's limit on the Claude subscription. Not one of the 23 people had opened an email, because the first of those emails was not due to go out until 2026-10-26. When they do go out, most will not be opened.

A preview site is how we pitch. Galascribe turns a creator's YouTube videos into articles on a site they own, and an example from someone else's channel does not show a creator what their own would look like. So we pick three of their videos, write an article from each full transcript, have a second model check every draft against the transcript, publish the three as a small site that search engines are told to ignore, and email a link that says it was built for them. The email also says one email takes it down. On 2026-10-23 we had decided to build one of these for every prospect before the first email. On 2026-10-24 we automated it. On 2026-10-25 we changed the order.

## The evening in numbers

Each preview costs the same set of model calls, with retries:

| Per preview site | As measured 2026-10-24 |
|---|---|
| Articles | 3, each prompt carrying the whole timed transcript and the writing rules |
| Faithfulness checks | 3, by a second model |
| Email | 1 |
| Attempts allowed per piece | up to 3 |
| Model calls | 8 to 12 |
| Tokens | 150,000 to 250,000 |
| Time, end to end | 9 to 11 minutes |
| Cost at API prices | $0.29 to $0.91 |

We did not pay those API prices. There was no API budget, so the work ran on the subscription, where the unit is not a bill but a weekly limit, and half of it was gone in four hours. For scale: the seven agents that wrote the automation that day used about 750,000 tokens between them, and the first evening of running what they wrote used five to seven times that. The session directing those agents ran four hours and several hundred tool calls on the most capable model available to us, which is its own lesson about who should do the typing and who should only review.

## Three things went wrong, and one went right

Two runs were wasted on our own mistakes before anything useful was built. The first started from a fresh clone of the repository that had never had its packages installed. Every article the model wrote failed the front-matter check, not because the front matter was wrong but because the checker could not load its YAML package. The writer was shown one word, FAIL, so it rewrote the article, up to three times, and failed the same way each time. The second mistake followed from the first. A run's results are cached, failures included, so when we fixed the clone and ran again, the cached failures came straight back and the same articles failed before anything had been checked. We found that only after clearing the cache. A failure caused by a broken environment is not a verdict on the text, and caching it as one poisons every later run.

Those two were bugs, and bugs get fixed. The third problem was the design, and it would have cost the same amount every evening. We generated ahead of interest. A minority of cold-email recipients open the email, and fewer click the link. At those rates most of the 23 sites would have been taken down unvisited, after costing 150,000 to 250,000 tokens apiece. "Automate everything" and "generate before anyone asks" each sound like sound engineering. Together they multiply the waste by the number of people who never open the email.

What went right was the faithfulness check. Each draft goes to a second model with the transcript and one question: does the article say anything the video did not? That night it rejected three drafts. One claimed the creator had called a configuration file "bloated", a word the video never used. One misread a figure from a chart in the video. Those three sites were not published. A preview that misquotes the person it is trying to impress is worse than no preview, and the pipeline knew that when we did not.

## Build it when they click

The fix is obvious in hindsight, and we decided it on 2026-10-25: generate the site when the creator clicks, not before. As of that date it is designed and not yet built, and the scheduled job that pre-built sites is switched off.

The nightly job shrinks to the cheap steps. Pick three videos, fetch the transcripts, write the email naming those videos rather than articles that do not exist yet, and register the creator's page with a small Cloudflare Worker. The email links to that page. Before anyone clicks, it is a waiting page that names the three videos and says the site is being built from them.

The first click starts generation on the Mac, which is always on and polls the worker for requests. The three articles are written in parallel and appear on the page as they finish, the first in about a minute, so the person reads an article instead of watching a spinner. The faithfulness checks run, the site publishes in the background, which takes four to seven minutes today, and the page redirects when it is live. If they leave before then, we email them the link.

Tokens are spent only on creators who clicked. Unclaimed sites stop existing, because they never existed, and there is nothing to take down. And the click becomes the engagement signal we did not have: at a 10 to 30% click rate, twenty emails a day turn into two to six generations a day, and 70 to 90% fewer generation tokens for the same outreach volume.

## Rules we keep now

- Estimate tokens before a batch the way you would estimate dollars, and print the estimate before the run starts. Nothing runs more than three generations without a person saying yes.
- Put the expensive step behind the first signal of interest. A click is cheap to detect, and it is the only evidence that anyone wants what you are about to build.
- A failed check caused by the environment is a failed check, not a verdict. Clear it with the fix, and show the writer the reason, not one word.
- Keep the check that says no, even when it costs tokens. The three drafts it rejected were the only ones that would have embarrassed us.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
