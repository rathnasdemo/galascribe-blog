---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a213c4-22ec-701f-adf9-3ad284d969e4
kind: article
title: A blogging platform with no lock-in
description: No blogging platform has zero lock-in, but you can check what you keep. With Galascribe your posts are Markdown files in a repository you own.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- ownership
- github
- markdown
- hosting
status: draft
publishAfter: '2026-12-15'
createdAt: '2026-11-25T18:00:00.000Z'
summary: No platform has zero lock-in, so ask what you keep when you leave. With Galascribe your posts are Markdown files in a GitHub repository you own and your site stays on GitHub if you leave. What stays with us is likes and comments, and the build that turns the files into a site has no documented path without Galascribe yet.
faq:
- question: 'Which blogging platform has no lock-in?'
  answer: 'None has zero lock-in, so ask what you keep when you leave. With Galascribe your posts are Markdown files in a GitHub repository you own, and your repository and published site stay on GitHub if you leave.'
- question: 'What do I keep if I leave Galascribe?'
  answer: 'Your repository and published site stay on GitHub when you remove Galascribe''s access or close your account. Retiring a site or closing your account deletes nothing in the repository. Leaving is a git clone.'
- question: 'What does Galascribe still hold that I cannot take with me?'
  answer: 'Likes, comments and follows are held by our service. A one-file data export of your profile, sites, connections, comments and reactions is available from Account. There is no documented way yet to build and publish without Galascribe.'
- question: 'Can I move a blog to Galascribe from WordPress, Ghost, Substack or Medium?'
  answer: 'Yes. Galascribe reads posts from a WordPress, Ghost, Substack or Medium export file, with a summary of what it found before anything is written.'
slug: a-blogging-platform-with-no-lock-in
redirects: []
extensions: {}
---

No blogging platform has no lock-in at all, so the useful question is what you keep when you leave. With Galascribe you keep your posts as Markdown files in a GitHub repository you own, and your published site stays on GitHub. What stays with us is likes and comments, and the tool that builds your site.

## Who asks this question

People who have moved a blog once and do not want to do it again. The move is usually the expensive part. The writing is fine; it is the export file, the broken links, the missing images and the weeks of cleanup. So before choosing a platform they ask whether they can ever get out cleanly.

## What should you check?

Four things, for any platform.

Where do your posts live? In a database the vendor runs, or in files you hold?

What does the export contain? Posts only, or also the media, the design and the comments?

Where is the site served from? If the vendor stops, does your site stop?

What would you have to rebuild by hand if you left tomorrow?

## What do other platforms say?

We have read the vendors' own pages and keep the findings, with sources and a date, on our [compare page](https://app.galascribe.com/compare). In short:

Ghost's hosting documentation names MySQL as its supported database. Self-hosting gives you SSH and database access, so you hold the database. Ghost(Pro), the managed platform, does not give SSH or database access.

Substack's going-paid page says you "Own all of your content and your subscriber list". The publication itself is hosted by Substack.

WordPress.com exports an XML file of your posts, pages, comments, categories and tags, with links to your media. The export does not include your theme, design customisations, plugins or the image files themselves.

These are not criticisms. They are the facts you need to weigh. Each product is the better choice for some people, and the compare page says who.

## What does Galascribe keep, and what do you keep?

You keep your posts. Each is a Markdown file with YAML front matter in `content/` in a GitHub repository you own, and settings are JSON files in `gala/`. Your site is served by GitHub Pages in a repository you control. You can remove our access in GitHub settings, and your repository and published site stay. Retiring a site or closing your account deletes nothing in the repository. Leaving is a git clone.

Account closure has a 7-day grace period. After it, your sign-in methods, sessions, memberships and likes are deleted, and your comments remain, credited to "Former reader". A one-file data export of your profile, sites, connections, comments and reactions is available from Account.

## Where are you still tied to us?

We would be misleading you if we said nowhere.

Likes, comments and follows are held by our service, because a static site cannot hold them.

The step that turns your Markdown into a site is our publish workflow, which runs in your GitHub account. We have not yet documented a way to build and publish without Galascribe. Your files would still be plain Markdown, and a static site generator can read Markdown, but you would be doing that setup yourself.

We explain the trade in [Your writing should live in a repository you own](https://blog.galascribe.com/your-writing-should-live-in-a-repository-you-own/).

## What does it look like side by side?

| | Hosted platform with a database | Galascribe |
| --- | --- | --- |
| Where posts live | The vendor's database | Markdown files in your repository |
| What leaving takes | An export file | A git clone |
| Where the site is served | The vendor | GitHub Pages in your account |
| What stays behind | Depends on the export | Likes and comments |

## Who should not pick Galascribe?

If your first need is to charge readers, Galascribe is not the answer: you cannot charge readers through it. If you want a large plugin ecosystem or a store, another product suits you better.

If you need a tool whose build you can run entirely without the vendor, today, a static site generator you run yourself gives you that. Galascribe does not yet.

## How do I try it?

Start free at [app.galascribe.com](https://app.galascribe.com/). Free is $0 for one site; Basic ($12 a month or $96 a year) and Pro ($149 a month or $1,188 a year) are on the [pricing page](https://app.galascribe.com/pricing). If you are coming from another platform, our [alternatives page](https://app.galascribe.com/alternatives) explains how to move, and Galascribe reads posts from a WordPress, Ghost, Substack or Medium export file.
