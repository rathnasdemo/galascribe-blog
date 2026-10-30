---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a17138-2dcc-7897-9099-0a82c5af69e8
kind: article
title: Scheduling a post is not scheduling a publish
description: Galascribe's Schedule button holds one pending publish per site, so we built dated drafts and a ten-minute sweep for blogs instead.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- publishing
- scheduling
- api
- blogging
status: draft
publishAfter: '2027-01-22'
createdAt: '2026-10-25T04:01:09.000Z'
slug: scheduling-a-post-is-not-scheduling-a-publish
redirects: []
listen:
  audio: assets/listen/scheduling-a-post-is-not-scheduling-a-publish.mp3
  durationSeconds: 383
  format: conversation
extensions: {}
---

The plan we wrote on 2026-10-20 for this blog was eighteen posts, two a week, from 2026-10-25 to 2026-12-25. Galascribe already had a Schedule button, and the API answers a second pending schedule on the same site with a `409 SCHEDULE_EXISTS`. That one fact ruled out the obvious feature. Three more finished the job, and what we built instead was a different feature that happens to share the word.

## Why the Schedule button could not run a blog

The button schedules a publish: one deploy at one instant. You save the post, which makes a branch and a pull request in your repository, then choose a date and time, and at that moment the named changes are merged and the site is built. The API accepts a time between 5 minutes and 366 days ahead. Against a blog's calendar it has four problems, all of which we checked in code on 2026-10-24.

First, a site can have one schedule pending at a time. The App says so in its own words: "There can be one at a time." A single schedule can name several changes, but they all go out together. Eighteen posts on eighteen dates means eighteen separate sittings, each started after the previous post has gone live.

Second, a key cannot schedule. Our API keys carry scopes for reading, writing content and publishing, and the capability to schedule is in none of them. Scheduling also needs a recent sign-in. The tool that was going to push this blog's posts could not set their dates.

Third, the dates come out wrong. The editor fills a post's `publishedAt` with the moment of saving, and the Schedule button does not change it, so every post would be dated the day we saved it, not the day it went live.

Fourth, editing a post that sits in a schedule cancels the schedule. The editor warns you: "Saving your changes cancels that schedule." A calendar you cannot touch is a poor calendar for writers who keep revising.

Our own v1 definition had asked for something else. It said posts were staggered: published at a future preset date declared in the Markdown file itself, written as `YYYY-MM-DD`, read in the owner's time zone, with day-level precision judged sufficient. The v2 button is a scheduled publish. A blog needs a date on each post. On 2026-10-24 I asked for the second as an option, switchable per site.

## What we built instead

A draft can carry a `publishAfter` date in its front matter. This is the front matter of the draft of our post about likes and comments:

```yaml
status: draft
publishAfter: '2026-11-15'
```

The field is allowed on drafts only. Saving a dated draft while the setting is off is refused with a `409 STAGGERED_RELEASE_DISABLED`, and putting a date on a published post is refused with a `422 PUBLISH_AFTER_ON_PUBLISHED_POST`.

The setting is a Staggered release section in the site's Settings, just under Publishing, with a switch ("Release scheduled drafts on their dates") and a time zone chosen from the browser's list of IANA zones. It is off by default. While it is on, the editor shows a "Release on" field for drafts, the Posts page marks them "Scheduled" with the date, and Home shows the next release.

The work is done by a sweep inside the API's worker, every ten minutes. For each site with the setting on, it reads the dated drafts at the head of the site's repository and takes those whose date is today or earlier in the site's time zone. It rewrites each file once: `status` becomes `published`, `publishedAt` becomes the moment of release, and `publishAfter` is removed so the renderer never sees it. Everything due goes out in one commit and one system-started publish. The sweep re-judges every file before it rewrites it, so a stale listing cannot publish anything, and a released post is never touched again because it no longer reads as a draft.

Two cases are handled on purpose. If the site requires review, the sweep writes nothing and shows the post as waiting for review; the setting never overrides a person's approval. If a release fails, it is recorded, alerted and retried after 10 minutes, then 30 minutes, 2 hours and 6 hours, and given up after eight attempts. Changing the post's date starts it again. A site that is merely not ready, for instance with a publish in flight, is waited for and not counted as a failure.

We shipped the contract change as schemas 3.19.0 and deployed the API on 2026-10-24. As of 2026-10-25 this blog runs on it: the setting is on, in the America/Los_Angeles time zone, and the front matter of its eight drafts already carries their dates.

## What it does not do

It has no time of day. A post dated a Sunday goes out within about ten minutes of midnight at the start of that Sunday in the site's zone, and our own plan names hours (Sunday 18:00 and Friday 04:00 Pacific) that a date cannot say. It also depends on us. In v1 whether a post published was a function of its dates and today's date alone, so publishing continued when the platform was down. In v2 the site's workflow has no cron, so nothing publishes without our API; when the worker is back, anything whose day has passed goes out on its first sweep.

A release is also deliberately cautious. It goes out only when what is live is exactly the head of the repository it was made on, so a site that holds work nobody has published yet waits until someone publishes it. That keeps the sweep from shipping a half-finished edit along with the post.

It does not hide the draft either. A dated draft is a file in your repository, and a change saved with the Schedule button waits in a pull request there. If the repository is public, as it must be for Pages on a free GitHub account, anyone can read the post before its day.

If you want a post live on a particular date, switch on Staggered release, pick the time zone you think in and put the date on the draft. If you need one change at an exact minute, the Schedule button still does that, one at a time.

To set up a site of your own, the start flow is at https://app.galascribe.com/
