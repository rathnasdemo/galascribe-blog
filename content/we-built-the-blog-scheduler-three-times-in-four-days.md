---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740c-9f9e-7d09-9536-9cadb914c51d
kind: article
title: We built the blog scheduler three times in four days
description: Our blog's publishing schedule went from a cron job to a 1,329-line runner to a platform setting in four days; ask whether the product should do it first.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- scheduling
- blog
- incidents
- build-in-public
status: draft
publishAfter: '2027-03-14'
createdAt: '2026-10-25T17:12:26.000Z'
slug: we-built-the-blog-scheduler-three-times-in-four-days
redirects: []
listen:
  audio: assets/listen/we-built-the-blog-scheduler-three-times-in-four-days.mp3
  durationSeconds: 389
  format: conversation
extensions: {}
---

At 09:37 on Saturday 2026-10-24 (Pacific) we committed a scheduler for this blog: 1,329 lines across five files. At 13:21 the same day we deleted 1,326 of them. That was 3 hours 44 minutes later, and it was the second scheduler we had thrown away in four days.

This is the history of how a blog that publishes itself on a timetable came to have three schedulers, and of the question we should have asked before writing the first one.

## Attempt one: a cron job in the outreach tool

On the evening of 2026-10-20 we needed the blog to publish two posts a week without anyone pressing a button. The drafts went into the outreach tool, our private command-line tool for the sales side of the business; the commit does not say why that tool was chosen.

The commit at 20:39 added a drafts folder, a calendar, a command that published the next due post through the Galascribe API, and a GitHub Actions workflow that ran it on Tuesdays and Thursdays at 16:00 UTC. The first four drafts came with it. The commit message records that 837 tests passed, with one failing only because a sibling checkout was mid-change in another session.

Eleven minutes later, at 20:50, we changed the cadence to Sunday evening and Friday morning, so the workflow moved to Monday 01:05 and Friday 11:05 UTC, which land on Sunday 18:00 and Friday 04:00 Pacific in both summer and winter time. The same commit added a calendar of 18 posts running from 2026-10-25 to 2026-12-25.

Nothing about this was careless. It had tests, and it published through the Galascribe API. The problem was where it lived. A blog's drafts inside a sales tool is a place nobody would think to look, and the blog itself, an ordinary Galascribe site with its own repository, held none of the scheduling logic.

## Attempt two: a runner in the blog's own repository

On Saturday morning we moved everything to the blog's own repository. The 09:37 commit was a new JavaScript runner: a script of 617 lines, a test file of 600 lines, a 70-line workflow, a 27-line calendar and a 15-line README section. It was a better scheduler than the first. The README from that commit describes its rules:

- A date in the calendar is a floor, not an appointment: a post goes out on the first run on or after its date.
- A post carries an `approved` flag, and a due post that is not approved holds every post behind it, so nothing goes out of order.
- Each run publishes at most one post.
- If the API is down, a request is retried three times, a minute apart, and then the run publishes nothing.
- A run refuses to publish if the draft in the repository differs from the site's own copy, for example after an edit made in the App that has not reached the main branch.

Under two minutes later we pinned the runner to a specific Ubuntu image. The commit does not say why. At 09:45 the outreach tool's copy was removed: 12 files and 997 deleted lines, among them the workflow, the calendar and eight drafts.

Read that list of rules again. Every line is something a customer who wants to schedule posts would also want: ordering, approval, retries, a guard against publishing a stale copy. We had written a small publishing scheduler for ourselves, and we run a publishing platform.

## Attempt three: the platform does it

The question changed from "where should our scheduler live" to "why do we have one". At 11:56 we refreshed a vendored copy of the content schema to version 3.19.0, which carries a `publishAfter` date for a post's front matter. At 13:21 the runner was deleted: its script, its tests, its workflow, its calendar, and the README section that described them.

What replaced it is a setting. The site has Staggered release switched on in the App, with the timezone America/Los_Angeles. A draft that carries `publishAfter: YYYY-MM-DD` is published by Galascribe on that day in that timezone, and a draft with no date stays a draft. The Posts page shows dated drafts as Scheduled, and Home shows the next release. Require review still applies to every release, so the check that a human has looked at a post did not move. The final README says it plainly: there is no workflow or calendar in the repository any more.

Our records show the sequence and not the reasoning: the runner was added at 09:37 and deleted at 13:21, 3 hours 44 minutes later, in favour of the platform's staggered release. The commit message gives no other reason, so we will not invent one.

## What the three have in common

The first scheduler was a cron job, and cron is not a clock; its trigger times drift, and on 2026-10-21 we found GitHub firing three of our outreach send jobs three to four hours late and dropping two. The second was still a pair of fixed-time crons, Monday 01:05 and Friday 11:05 UTC, and its floor-date rule means a late run is harmless, though its README does not say that was the purpose. The third has no trigger of ours to be late.

The pattern is easy to see now. Each scheduler was correct for the problem in front of us. None answered a different question: if a customer wants this, should the product do it for everyone? We already had a longer post on why the API route cannot schedule, Scheduling a post is not scheduling a publish. Knowing that the route could not do it should have sent us to the platform sooner. It sent us to a workflow instead.

Between 2026-10-20 and 2026-10-24 that came to two repositories and three implementations. The people-time is not stated in our records and we will not guess it.

If you are about to build a scheduler, a notifier, an exporter or any other piece of plumbing for your own product, write down the customer who would want the same thing before you write the first line. If you can name one, build it as a product feature, with the same review rules and the same screen, and use it yourself. If you cannot name one, build the small version in the place your own content already lives, not in a tool you built for something else.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
