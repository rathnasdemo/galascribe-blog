---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a15c94-3083-785d-a0f3-2f37ebea1260
kind: article
title: Your writing should live in a repository you own
description: Every Galascribe article is a Markdown file in a GitHub repository you
  own. Here is what that takes away from us, and why we built it that way anyway.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- ownership
- github
- markdown
- hosting
status: published
createdAt: '2026-10-21T03:49:38.000Z'
publishedAt: '2026-10-25T07:00:34.375Z'
slug: your-writing-should-live-in-a-repository-you-own
redirects: []
extensions: {}
---
A Galascribe site is a folder of Markdown files in a GitHub repository that belongs to the person who wrote them, published by default through GitHub Pages from that same repository. We call it the site repository. Neither the content nor the hosting is ours to hold, and that is deliberate. This post covers what the site repository holds, what we give up by building it this way, and why we accepted the trade.

## What is in the repository

A repository that Galascribe creates is generated from the repository template, the layout every new site starts from, and the repository template's README says the repository is the publication: your settings, your author profile, and every article and page. Articles and pages are single Markdown files in `content/`. Each begins with a short block of settings, the front matter, between two `---` lines:

```markdown
---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: "2.0.0"
id: <a stable id — do not change once published>
kind: article
title: My new article
language: en-US
authors:
  - <your author id, from gala/authors/>
tags: []
status: published
createdAt: "2026-01-01T00:00:00.000Z"
slug: my-new-article
redirects: []
extensions: {}
---

Write your article here, in Markdown.
```

That is the repository template's own example, trimmed to one line of body, with the placeholders left in. `kind` is `article` for a dated piece that goes in your feed, or `page` for something like an About page. The author is a reference to a file in `gala/authors/`, so a biography is written once.

The rest is plain files too. `gala/publication.json` holds the name, description and base address. `gala/navigation.json` holds the header and footer links, `gala/appearance.json` the theme, and `gala/modules/interactions.json` whether likes and comments are on. Images live in `assets/`. Two files, `gala/repository.json` and `gala.lock.json`, are managed by Galascribe, and the README says you generally will not touch them.

## Edit it anywhere

You can write in the Galascribe app, which commits for you. You can also clone the site repository, edit in any text editor and push. The README puts it in one sentence: both ways work, because everything Galascribe needs is in the files themselves.

A push you make by hand is safe but does not publish anything. It moves the head of the repository, and the next accepted publish deploys whatever the head is.

## Hosting you also own

The default destination is GitHub Pages. Publishing is done by the publish workflow, a file in your site repository at `.github/workflows/gala-publish-v2.yml`. It runs in your GitHub account on GitHub's build minutes, not on our servers. The README also says nothing there runs code you wrote or installs anything on your behalf: the tool only reads your articles, settings and images and turns them into a website.

Our design for a second destination, DigitalOcean Spaces, has the same shape: two buckets in your own account, one serving the site and one private for staging. The README lists it as not offered yet. One decision from that design is worth recording. We chose not to build a "verify my buckets" check, because we hold no credential for that account and a check that reports success without being able to look would be lying.

## Who creates the repository

If the site repository does not exist yet, Galascribe can create it, but as you rather than as us. Creation uses your own GitHub authorization, never an installation token or the Galascribe GitHub App's own key. GitHub therefore decides what you may create and where, and we add no authority of our own. The repository is generated from the repository template using that same authorization, and it comes with a default branch already in place, because linking reads the default branch and an empty repository has none. Creating and linking are two separate confirmations. We never delete, rename or change the visibility of a repository.

## What this costs us

We would rather list these than have you find them.

- **We cannot keep anyone.** There is no export step for your writing because there is nothing to export: the writing and its history are files in your repository, while likes and comments are held by our service and have no export today. A creator can leave with a clone of the site repository. We hear about changes to a repository from GitHub's events. A rename updates our record. An archive or a delete ends our authority over it, and so does a transfer to an owner who has not installed the Galascribe GitHub App. We react afterwards. We do not get a say.
- **We do not serve the site.** GitHub Pages answers the reader's request, so the serving side is not ours to change.
- **Publishing is something Galascribe drives.** The README says that when Galascribe builds and publishes your site, the work runs in your GitHub account. What you hold outright is the content: plain Markdown files with front matter in a repository you own, and the renderer that turns them into a site is published as versioned packages. There is no documented way to build and publish without Galascribe yet. We are focused on the minimum product, on measuring real traction, and on earning product-market fit before we invest in second-priority features, and a build-it-yourself guide is one of those. The files are still plain Markdown in your repository today, so nothing stops you rendering them another way. We have just not written the guide.
- **Your readers' replies are not in the repository.** Likes and comments need a server, so Galascribe's service holds them, tied to the publication and the article rather than to a web address. `interactions.json` only switches them on or off. There is no export for them today. That is a real limit of the thesis of this post: "nothing to export" is true of your writing, and not true of what your readers add to it.
- **Hand edits can break a build.** A file edited by hand can be wrong in a way the app would have refused. When a build fails, the error shown usually names the file and the setting. We cannot stop the edit.

Put together, that is fewer levers. We cannot hold your content, we cannot hold the serving, and we cannot make leaving awkward.

## Why we chose it anyway

The constraint is also a discipline. If everything Galascribe needs is in the files, then the files are the source of truth, and any feature that needs hidden state has to justify itself. Likes and comments are the one place we had to, and we say so above rather than burying it. I built it this way for the reason in our tagline: you should own every word you write, and I do not want your archive to depend on whether Galascribe is still around.

A post is a long-lived thing. Plain Markdown and JSON in a git repository can be opened by any editor, with or without us. To us that seemed a more durable thing to hand a writer than an export button.

It also narrows what you have to trust us with. GitHub holds the repository and enforces who can touch it, and GitHub's own build minutes do the publishing. What you grant us is a set of permissions for the Galascribe GitHub App in your own account, not custody of your work.

To start a site of your own, the start flow is at https://app.galascribe.com/
