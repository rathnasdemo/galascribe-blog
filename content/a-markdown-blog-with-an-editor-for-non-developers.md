---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a213c4-22e9-78ac-863a-4e8b6fec1853
kind: article
title: A Markdown blog with an editor for non-developers
description: Galascribe keeps every post as a Markdown file in your GitHub repository and gives you an editor with live preview, so you never need to touch git.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- markdown
- github
- publishing
- ownership
status: draft
publishAfter: '2026-12-08'
createdAt: '2026-11-25T18:00:00.000Z'
summary: Yes. Galascribe stores each post as a Markdown file in a GitHub repository you own, and gives you an editor with live preview, drafts and scheduled release, so you can write and publish without using git. Developers can still clone the repository and edit by hand. It starts free with one site.
faq:
- question: 'Is there a Markdown blog platform with an editor for non-developers?'
  answer: 'Yes. Galascribe keeps every post as a Markdown file in a GitHub repository you own, and you write and publish in an editor with live preview, drafts and scheduled release, without using git.'
- question: 'Do I need to know Markdown to use Galascribe?'
  answer: 'You write in the editor and see the preview as you go. The file on disk is Markdown with a short block of settings at the top, so you can learn the format at your own pace.'
- question: 'Can a developer still edit a Galascribe blog with git?'
  answer: 'Yes. Each post is one Markdown file in content/ with YAML front matter, and settings are JSON files in gala/. You can clone the repository and edit with git by hand.'
- question: 'What does Galascribe cost for a non-developer who just wants to write?'
  answer: 'The Free plan is $0 for one site and one collaborator. Basic is $12 a month or $96 a year, and Pro is $149 a month or $1,188 a year.'
slug: a-markdown-blog-with-an-editor-for-non-developers
redirects: []
extensions: {}
---

Yes. Galascribe stores every post as a Markdown file in a GitHub repository you own, and you write in an editor with live preview, so you do not need git or a terminal to publish. A developer on the same site can still clone the repository and edit the files by hand.

## Who asks this question

Two kinds of people, usually. The first is a writer who likes the idea of plain text files they will still be able to open in ten years, but who has never used a command line and does not want to start. The second is a developer setting up a blog for someone else, a co-founder or a client, who wants the files to be Markdown and the editing to be easy for a person who does not live in an editor like theirs.

A Markdown blog without an editor asks the writer to be a developer. A visual editor without Markdown asks the writer to trust a database. The question is whether you can have both.

## What are the options?

You can run a static site generator such as Jekyll or Hugo. Posts are Markdown files, and that part is good. But the writer then edits files in a text editor, commits and pushes with git, and waits for a build. Getting a preview means running the site on their own machine. For a developer that is routine. For anyone else it is a wall.

You can put a hosted editor in front of the repository, which is the idea behind a git-based CMS. We write about that in [a git-based CMS for a blog](https://blog.galascribe.com/a-git-based-cms-for-a-blog/).

Or you can use a platform that was built around both halves. That is what Galascribe is.

## What does the editor do?

You sign in with GitHub, start a site, and write in the app. The editor has live preview, drafts and scheduled release, so you can set one post for an exact time or give each draft its own day. You can preview a post on desktop and on a phone before you publish. Pressing Publish builds the site and puts it on GitHub Pages.

Behind that, nothing is hidden. Each post is one Markdown file in `content/`, with a short block of settings at the top called front matter. Your settings are JSON files in `gala/`. The app writes those files for you, and you can open them in any editor you like.

## Do I need to know Markdown?

No, but you will pick it up. The preview shows the result as you type, so you can see what each mark does.

## Editor or git?

| | Edit with git | Edit in Galascribe |
| --- | --- | --- |
| Needs a terminal | Yes | No |
| Preview | Run the site on your machine | Live preview in the app, desktop and phone |
| Drafts and scheduling | You manage them in files | Built in |
| Where the files are | Your repository | Your repository |
| Who can work this way | Anyone who knows git | Anyone who can sign in with GitHub |

Both ways work on the same repository, so the files stay yours whichever way you edit. A push you make by hand is safe, but it does not publish anything by itself.

## Who should not pick Galascribe?

If your whole team lives in git and wants every change to go through a pull request, you may find the app's editor gets in your way, and a plain static site generator will suit you better.

If you want to charge readers through your blog, Galascribe does not do that: you cannot charge readers through it.

## How do I try it?

Open [app.galascribe.com](https://app.galascribe.com/) and sign in with GitHub. The Free plan is $0 for one site and one collaborator, and the [pricing page](https://app.galascribe.com/pricing) lists Basic ($12 a month or $96 a year) and Pro ($149 a month or $1,188 a year). If you want to see how it compares with other products before you start, the [compare page](https://app.galascribe.com/compare) sets Galascribe beside Ghost, Substack and WordPress, with sources.

For a walk through what happens between pressing Publish and the page appearing, read [Write, preview, publish: how a post becomes a page](https://blog.galascribe.com/write-preview-publish-how-a-post-becomes-a-page/).
