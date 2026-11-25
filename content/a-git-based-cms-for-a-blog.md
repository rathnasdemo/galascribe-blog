---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a213c4-22ea-70ad-8611-7689c8dd3472
kind: article
title: A git-based CMS for a blog, and when to use one
description: A git-based CMS keeps your posts as files in a repository instead of a database. Here is when that helps, what it costs, and where Galascribe fits.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- git
- ownership
- markdown
- github
status: draft
publishAfter: '2026-12-02'
createdAt: '2026-11-25T18:00:00.000Z'
summary: A git-based CMS stores your posts as files in a git repository instead of rows in a database, so your archive can be cloned, versioned and moved. Use one when you want to own the files and have no server to run. Galascribe is a git-based blog platform on GitHub Pages; a static site generator alone is the do-it-yourself version.
faq:
- question: 'What is a git-based CMS?'
  answer: 'A content management system that stores your posts as files in a git repository instead of rows in a database. The repository is the source of truth, so the content can be cloned, versioned and moved.'
- question: 'When should I use a git-based CMS for a blog?'
  answer: 'When you want to own your files, keep a history of every change, and avoid running a server or a database. It is a weaker fit if you want to charge readers through the blog or want a large plugin ecosystem.'
- question: 'Is Galascribe a git-based CMS?'
  answer: 'Yes, for blogs. Each post is a Markdown file in a GitHub repository you own, settings are JSON files in the same repository, and the site is published to GitHub Pages by default.'
- question: 'Do I have to use git to use a git-based CMS?'
  answer: 'Not with Galascribe. You write and publish in the app and it handles the repository. You can also clone the repository and edit by hand with git if you want to.'
slug: a-git-based-cms-for-a-blog
redirects: []
extensions: {}
---

A git-based CMS is a content management system that keeps your posts as files in a git repository instead of rows in a database. Use one when you want to own the files, keep a history of every change and avoid running a server. Galascribe is a git-based platform for blogs: your posts are Markdown files in a GitHub repository you own.

## What is a git-based CMS?

A traditional CMS stores a post in a database and builds the page when a reader asks for it. A git-based CMS turns that around. The post is a file, usually Markdown with a short block of settings at the top, and it lives in a git repository. A tool builds the pages ahead of time, and the result is static files that any host can serve.

The word CMS is doing a little work here. A repository by itself is not a CMS. It becomes one when something sits on top of it that lets a person write, preview and publish without handling git directly.

## Who asks this question

Mostly people who have been burned once. They had a blog in a database, and moving it was harder than writing it. Or they run a static site and spend more time on the build than on the writing. A git-based CMS is the middle path: you keep the files, and someone else keeps the tooling.

## When should you use one?

Use one when these are true.

You want your archive to be a folder you can clone. If the tool vanishes, you still have every post.

You want a history. Git records every change to every file, so you can see who changed what and go back.

You do not want a server or a database to look after. A static site has nothing to patch.

You write mostly text. Posts, notes and essays suit files well.

## When should you not?

If you want to charge readers through your blog, a git-based setup is the harder way to do it. If you want a very large choice of plugins, or a store, a different platform is the better fit. Our [compare page](https://app.galascribe.com/compare) names the cases where Ghost, Substack or WordPress is the right choice.

If your writers will never touch a file and have no use for a repository, you are paying a complexity cost for a benefit they do not feel. The tool on top has to hide the git, or this will not work for them.

## What are the options?

You can build one yourself. Take a static site generator such as Jekyll or Hugo, keep the content in a repository and publish to GitHub Pages. You get full control. You also own the theme, the build, the upgrades, the feeds and sitemap, and whatever tool your writers use to edit.

Or you can use a platform that has done that work. Galascribe is one. It does not claim to be the only one, and a different tool may suit a team with its own workflow.

## Where does Galascribe fit?

Each post is a Markdown file in `content/` with YAML front matter. Settings are JSON files in `gala/`. The repository belongs to you, and publishing runs in your own GitHub account through a GitHub Actions workflow, on GitHub's build minutes, not on our servers. You write in an app with live preview and drafts. You can clone the repository and edit with git if you want to.

| | Git-based setup you build | Galascribe |
| --- | --- | --- |
| Files | Markdown in your repository | Markdown in your repository |
| History | Git | Git, and version history in the app |
| Editing | Text editor and git | App editor, or git |
| Build and hosting | You set it up | GitHub Pages by default |
| Server or database | None | None |

Not everything is in the repository. Likes, comments and follows are held by our service, because a static site cannot hold them. We explain what that means in [Your writing should live in a repository you own](https://blog.galascribe.com/your-writing-should-live-in-a-repository-you-own/).

## How do I try it?

Open [app.galascribe.com](https://app.galascribe.com/) and sign in with GitHub. Free is $0 for one site. Basic is $12 a month or $96 a year, and Pro is $149 a month or $1,188 a year; see the [pricing page](https://app.galascribe.com/pricing). If you stop, your repository and your published site stay on GitHub, and leaving is a git clone.
