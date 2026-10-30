---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a17138-2dd7-71f5-b3e4-d6278a50ca5a
kind: article
title: Where we differ from Ghost, Substack and WordPress
description: What Ghost, Substack and WordPress do better than Galascribe as of 2026-10, and the one structural difference we chose on purpose.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- comparison
- ownership
- markdown
- hosting
status: draft
publishAfter: '2026-11-22'
createdAt: '2026-10-25T04:01:09.000Z'
slug: where-we-differ-from-ghost-substack-and-wordpress
redirects: []
listen:
  audio: assets/listen/where-we-differ-from-ghost-substack-and-wordpress.mp3
  durationSeconds: 425
  format: conversation
extensions: {}
---

On 2026-10-11 we wrote down what a writer expects from a publishing service and marked where Galascribe stood against each expectation, next to Ghost, Substack, WordPress.com and five other services. Most rows were gaps. Three of them read "none": newsletter, paid subscriptions, analytics. The row that matters most here is ownership. Here is the part of that table about three of those services, in public, gaps first.

A note on method. Everything below about the other three comes from their own documentation pages, which we read on 2026-10-24. Their products change, so read each claim as "as of 2026-10" and check their pages before you decide anything about ours.

## What they do better

**Ghost** puts the whole business of a publication in one product. Its documentation says a post can be delivered to free members, paid members or a segment of either, that a site can run more than one newsletter, and that members choose which ones they get. Paid memberships go through Stripe, with billing information kept in your own Stripe account, and the docs say Ghost takes 0% of your revenue on top of Stripe's processing fees. Ghost(Pro), its hosted option, includes bulk email delivery. A self-hosted site has to add Mailgun API keys for that.

**Substack** adds ways to reach readers. Its features page lists email delivery of every post, paid subscriptions, a short-form feed called Notes, native iOS and Android apps, free podcast hosting and recommendations between publications. Its going-paid page says writers keep 90% of their revenue minus credit card fees. We have no native apps, no short-form feed and no recommendations between sites.

**WordPress** has range. WordPress.com's themes page offers "thousands of free and premium themes", and says the Site Editor lets you change colours, fonts, layouts and even templates. WordPress is also software you can host yourself, and its requirements page says what the server needs. Galascribe has six themes as of 2026-10-24, and our own review on 2026-10-11 concluded that a theme of ours could restyle one page layout but not rearrange it.

Here is what we lack, stated plainly. We cannot send your posts to subscribers by email, and you cannot charge your readers through us. The newsletter support in our site format is a panel with a title, a short text and a link, and nothing more. We deferred the newsletter and payments out of the first release on 2026-09-09, and as of 2026-10-24 neither exists. For analytics, the one option is Google Analytics 4, which you switch on yourself: readers see a consent banner and nothing loads until they accept. That is not the same as the built-in analytics Ghost documents. We make no promise about when any of this arrives.

## The one structural difference

In Ghost, Substack and WordPress, the application holds your writing. Ghost's hosting documentation names MySQL 8.0 or 8.4 as its supported database. WordPress's requirements page recommends MariaDB 10.11 or newer, or MySQL 8.0 or newer. Our reading is that your posts are rows in that database, and on Substack and WordPress.com somebody else runs the whole thing for you.

In Galascribe, the writing is a Markdown file in a GitHub repository that belongs to you. The README that every new site starts with says "This repository is your publication" and lists what it holds: your settings, your author profile, and every article and page you write. The default destination is GitHub Pages. When Galascribe builds and publishes your site, the README says, the work happens inside your own GitHub account, using GitHub's build minutes, not on our servers. Our software changes files in that repository. It is not where the files live.

All three of the others offer a way out, and that deserves saying. Substack's help centre describes an export that produces a zip of your publication's data, including your posts and your subscriber list. WordPress.com's export is an XML file of posts, pages, comments, categories and tags; its support page says the file links to your media instead of containing it, and leaves out your theme and plugins. Ghost lets you self-host with direct SSH and database access, and its hosting page describes that option as "Best for teams who are comfortable managing servers".

So the difference is not that they trap you. It is where the working copy sits. With them, leaving is an export you run at the end. With us, leaving is a `git clone`, because the files were never anywhere else. We made the longer argument, and listed what it costs us, in our post "Your writing should live in a repository you own".

That difference has limits, and they matter more in a comparison than in our own pitch. Likes and comments are held in our database, because a static site cannot count them, and there is no export for them today. And owning the files is not the same as owning the pipeline. As of today there is no documented way to build and publish a Galascribe site without Galascribe. The files are plain Markdown and the renderer is published as versioned packages, so nothing stops you rendering them another way, but we have not written that guide.

## How to choose

If you want to email subscribers and charge for it from one place today, use Ghost or Substack. Pick Substack if the network and the apps matter to you. Pick Ghost if you want to run the stack yourself or care that it takes no cut of your revenue beyond Stripe's fees. If you want a large choice of designs, use WordPress.com.

If your first requirement is that your archive sits in a repository you control, and you can do without email delivery and payments for now, that is what we built.

Whichever you pick, run one test before you commit: ask what you would be holding if the company disappeared tomorrow, then do the export or the clone today and open the result. If you want to try ours, the start flow is at https://app.galascribe.com/
