---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a21551-c958-76a6-8ee4-3adfe88d45ce
kind: article
title: Markdown publishing platforms compared
description: There are three kinds of Markdown publishing platform. Here is how they differ on where posts live, who runs the build, scheduling, themes and RSS.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- markdown
- github-pages
- publishing
- ownership
status: draft
publishAfter: '2026-11-28'
createdAt: '2026-11-25T20:00:00.000Z'
summary: 'There are three kinds of Markdown publishing platform: a static site generator you run yourself, a hosted Markdown publishing platform, and a general blogging platform that accepts Markdown. Which fits depends on who runs the build and where your files live. Galascribe is a hosted Markdown publishing platform that keeps posts in your own GitHub repository, with scheduled publishing, six built-in themes and RSS.'
faq:
- question: 'Which Markdown publishing platforms should I compare?'
  answer: 'Compare the three kinds: a static site generator you run yourself, a hosted Markdown publishing platform, and a general blogging platform that accepts Markdown. Which fits depends on who runs the build and where your files live.'
- question: 'Which Markdown publishing platforms let me keep my posts in my own GitHub repository?'
  answer: 'A static site generator on GitHub Pages does, if you set it up yourself. Galascribe is a hosted Markdown publishing platform that keeps each post as a Markdown file in a GitHub repository you own and publishes to GitHub Pages by default.'
- question: 'Which Markdown publishing platform has scheduled publishing and built-in themes?'
  answer: 'Galascribe has both. You can schedule a publish for a date and time you choose, up to a year ahead, and pick from six built-in themes: Default, Amaze, Flashy, Minimal, Zebra and Editorial, each with light and dark modes.'
- question: 'Which Markdown publishing platform suits a personal writing site?'
  answer: 'One where the files are yours and nothing needs a server. A static site generator gives you the most control, and a hosted Markdown publishing platform such as Galascribe gives you the same ownership without running the build yourself.'
- question: 'What does it take to leave a Markdown publishing platform?'
  answer: 'With a platform that keeps posts as Markdown files in your own repository, leaving is a git clone. With Galascribe, your repository and published site stay on GitHub if you remove its access or close your account.'
slug: markdown-publishing-platforms-compared
redirects: []
extensions: {}
---

Which Markdown publishing platforms should you compare? There are three kinds: a static site generator you run yourself, a hosted Markdown publishing platform, and a general blogging platform that accepts Markdown. Which one fits depends on who runs the build and where your files live.

We make one of these tools, so we will say where we sit as we go, and where we do not fit.

## What is a Markdown publishing platform?

Markdown is a plain text format. You write a post as a text file, mark headings and links with a few simple characters, and a tool turns the file into a web page. A Markdown publishing platform is the whole path from that file to a published site: something to write in, something that builds the pages, and somewhere to host them.

The word platform covers a lot of ground. Some tools only do the build step and leave the rest to you. Some do everything and hide the files. The useful way to sort them is by who runs the build and where the files live, which gives three kinds.

## What are the three kinds?

### A static site generator you run yourself

A static site generator is a program that reads a folder of Markdown files and writes out a website made of plain files. Hugo, Jekyll, Eleventy and Astro are all static site generators. You install one, pick or write a theme, and run the build yourself, on your machine or in an automated job.

You then need somewhere to put the result. GitHub Pages hosts static files from a repository. Cloudflare Pages hosts static sites too. Neither of them writes your site for you. They serve what you give them.

The cost of this route is that the pieces are yours to assemble and keep working: the theme, the build, the upgrades, the feeds, the editor you write in and the schedule for publishing.

### A hosted Markdown publishing platform

A hosted Markdown publishing platform runs the editor and the build for you and keeps your posts as Markdown. The point of the category is that you get the convenience of a hosted product while the content stays in files rather than in the product's database.

Galascribe is this kind. Each post is a Markdown file in a GitHub repository that belongs to you. Publishing runs in your own GitHub account, on GitHub's build minutes, and the site is hosted on GitHub Pages by default.

### A general blogging platform that accepts Markdown

A general blogging platform is built around its own editor and its own storage, and Markdown is one of the ways you can enter text. Ghost, WordPress.com and Substack are of this kind.

We do not claim much about them, and what we do claim comes from their own public pages as we read them on 19 November 2026. Ghost keeps content in a database, and its hosting documentation names MySQL 8.0 or 8.4 as the supported one. Ghost is also a publishing platform with newsletters and paid memberships, hosted by Ghost or on a server you run. WordPress.com hosts the site for you, and exports an XML file of your posts, pages, comments, categories and tags when you leave. Substack is a hosted newsletter and publishing network with paid subscriptions, and its going-paid page says you own all of your content and your subscriber list.

These platforms do things we do not, including charging readers for subscriptions. Our [compare page](https://app.galascribe.com/compare) sets out the differences with sources.

## How do the kinds compare?

This table states what each kind is by definition. For Galascribe, every cell is something we can show in the product.

| | Static site generator | General blogging platform | Galascribe |
| --- | --- | --- | --- |
| Where your posts live | Files in a folder or repository you choose | In the platform's own storage | Markdown files in a GitHub repository you own |
| Who runs the build | You | The platform | GitHub, in your own account |
| Editor | Whatever text editor you bring | The platform's editor | A visual editor with a Markdown view |
| Scheduled publishing | Whatever you build or add | Depends on the platform | Pick a date and time, up to a year ahead; one scheduled publish per site at a time |
| Themes | Whatever you choose or write | Depends on the platform | Six built-in themes with light and dark modes |
| RSS | Whatever you set up | Depends on the platform | Full-text RSS and Atom feeds of the 50 newest posts |
| What leaving takes | Nothing, you already have the files | An export, in the platform's format | A git clone |

Where the table says depends, we are not hiding a weakness. We have not read every platform's current pages for every row, so we will not guess.

## Which one keeps posts in my own GitHub repository?

A static site generator does, because the files are yours from the start. You set up the repository, the build and the publish step.

Galascribe does it for you. Posts are Markdown files with a short block of settings at the top, in a repository in your own GitHub account. If you leave or close your account, the repository and the published site stay on GitHub. Leaving is a git clone.

Not everything lives in the repository. Likes, comments and follows are held by our service, because a static site cannot hold them. We explain that in [Your writing should live in a repository you own](https://blog.galascribe.com/your-writing-should-live-in-a-repository-you-own/).

## Which has scheduled publishing and built-in themes?

With a static site generator, both are things you add. You can build scheduling with an automated job and pick a theme from the generator's community, and plenty of people do. It is work you take on and maintain.

Galascribe has them built in. You can schedule a publish for a date and time you choose, up to a year ahead, with one scheduled publish per site at a time. You can also give a draft a release date and have it publish on that day in your time zone, which is a day, not an hour.

The six themes are Default, Amaze, Flashy, Minimal, Zebra and Editorial. Each has light and dark modes, and you can pick one of six colour sets or use your own colours. The full list is on our [features page](https://app.galascribe.com/features), and the [Markdown publishing platform page](https://app.galascribe.com/markdown-publishing-platform) covers the same ground in one place. How a post moves from draft to page is in [Write, preview, publish](https://blog.galascribe.com/write-preview-publish-how-a-post-becomes-a-page/).

## Which suits a personal writing site?

For a personal writing site, the questions are small. Do you want to own the files? Do you want to run a build? Do you want to look after a server?

If you enjoy the tooling and want full control, a static site generator on GitHub Pages is a good answer, and you will learn a lot. If you want to write and have the files stay yours without owning the build, a hosted Markdown publishing platform is the middle path. If you want newsletters and paid memberships as the centre of your site, a general blogging platform is likely the better fit.

Our own answer for a writer who wants a site they control is the middle one, which is why we built Galascribe. That is a bias, and you should weigh it.

## Where does Galascribe not fit?

We would rather say this plainly.

- If you want to run everything yourself, with full control of the build and the server, use a static site generator. We do not offer self-hosting Galascribe.
- If you want to charge readers, Galascribe is not the tool. You cannot charge readers through it.
- If you want plugins, we do not have a plugin system.
- If you want a store, we do not sell one.

## How do I try it?

Open [app.galascribe.com](https://app.galascribe.com/) and sign in with GitHub. Free is $0 for one site. Basic is $12 a month or $96 a year, and Pro is $149 a month or $1,188 a year; see the [pricing page](https://app.galascribe.com/pricing). If you stop, your repository and your published site stay on GitHub.
