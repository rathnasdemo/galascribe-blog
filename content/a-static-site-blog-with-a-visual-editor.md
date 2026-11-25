---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a213c4-22eb-7a03-a972-55bedf1bae06
kind: article
title: A static site blog with a visual editor
description: Yes, a static site blog can have an editor with live preview. Galascribe writes Markdown to your repository and publishes static files to GitHub Pages.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- static-sites
- github-pages
- publishing
- markdown
status: draft
publishAfter: '2026-12-09'
createdAt: '2026-11-25T18:00:00.000Z'
summary: Yes. A static site is built ahead of time from files, and an editor can sit in front of those files. Galascribe is an app with live preview, drafts and scheduled release that writes Markdown to your GitHub repository and publishes the static result to GitHub Pages. Only likes, comments and follows need a server, and that server is ours.
faq:
- question: 'Can a static site blog have a visual editor?'
  answer: 'Yes. The editor writes the post files and a build turns them into static pages. Galascribe is one example: an app with live preview that writes Markdown to your GitHub repository and publishes to GitHub Pages.'
- question: 'Does a static site blog need a server?'
  answer: 'The pages do not. Your Galascribe site is static files on GitHub Pages and stays up even when Galascribe is down. Only likes, comments and follows call Galascribe.'
- question: 'Can I preview a post on a phone before I publish it?'
  answer: 'Yes. Galascribe previews a post on desktop and on a phone before you press Publish.'
- question: 'Can I schedule posts on a static site blog?'
  answer: 'Yes. In Galascribe you can set one post for an exact time, or give each draft its own day.'
slug: a-static-site-blog-with-a-visual-editor
redirects: []
extensions: {}
---

Yes. A static site blog can have a visual editor, because the editor and the site are separate things. The editor writes the post files, and a build turns them into static pages. Galascribe is one way to get that: an editor with live preview that writes Markdown to your GitHub repository and publishes static files to GitHub Pages.

## Who asks this question

Someone who likes what a static site gives them, such as speed, no database and no server to patch, but who does not want to write posts in a code editor. Or someone who tried a static site generator, found that every post meant a commit and a build, and wondered whether there was a nicer way to write.

## What does static mean here?

A dynamic site builds each page when a reader asks for it, using a database. A static site builds every page ahead of time and serves plain files. Nothing runs on the server when someone reads a post.

The consequence for editing is simple. The editor never has to be part of the site. It only has to produce the files the build reads. So the editor can be a separate app, and the site stays static.

## What are the options?

The do-it-yourself route is a static site generator such as Jekyll or Hugo. You write Markdown in a text editor, run a build, and publish the output, for example to GitHub Pages. Previewing means running the generator on your own machine. You get full control, and you do all the work: the theme, the build, the upgrades and the tools your writers will use.

The other route is an app that supplies the editor and keeps the files in a repository you own. In Galascribe you write in the app, see a live preview, and press Publish. Each post becomes a Markdown file in your repository, and the site that comes out is plain files on GitHub Pages.

## What does the editor give you?

Live preview while you type, drafts, and scheduled release. You can preview a post on desktop and on a phone before it goes out. You can set one post for an exact time, or give each draft its own day. There are also tags and series, RSS and Atom feeds, a sitemap, and site search, which the site ships without you adding them.

We describe the path from the editor to the page in [Write, preview, publish: how a post becomes a page](https://blog.galascribe.com/write-preview-publish-how-a-post-becomes-a-page/).

## What does a static site still need a server for?

Reader features. Likes, comments and follows cannot live in static files, so they call Galascribe. Everything else, including every page and every post, is served from GitHub Pages, so your pages stay up even when Galascribe is down. If our service is unavailable, readers can still read; they cannot like or comment until it is back.

## Do it yourself or Galascribe?

| | Static site generator you run | Galascribe |
| --- | --- | --- |
| Editor | A text editor | App editor with live preview |
| Preview | On your machine | In the app, desktop and phone |
| Scheduling | You build it | Per post, by date and time |
| Reader likes and comments | You find a separate service | Included, held by us |
| Output | Static files | Static files on GitHub Pages |

## Who should not pick Galascribe?

If you want a drag-and-drop page builder for any kind of site, a blog platform is the wrong tool. Galascribe is for blogs.

If you want to own the whole stack, including how likes and comments are stored, you will want to build that part yourself.

If you want to charge readers through your blog, you cannot do that through Galascribe. The [best blog publishing software page](https://app.galascribe.com/best-blog-publishing-software) says which products to consider for which need.

## How do I try it?

Open [app.galascribe.com](https://app.galascribe.com/), sign in with GitHub and start a free site. The Free plan is $0 for one site and one collaborator; Basic and Pro are on the [pricing page](https://app.galascribe.com/pricing). If you leave, your repository and your published site stay on GitHub.
