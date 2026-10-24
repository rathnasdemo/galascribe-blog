# Your publication

This repository is your publication. It holds everything about it: your
settings, your author profile, and every article and page you write.
Galascribe reads this repository to build your site and publish it.

## Where articles go

Every article and page lives in `content/`, as a single Markdown file. Each
file starts with a short block of settings (its "frontmatter") between two
`---` lines, followed by your writing:

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

# My new article

Write your article here, in Markdown.
```

Set `kind` to `article` for a dated piece of writing, or `page` for
something like an About or Contact page that isn't part of your article
feed. `welcome-to-your-publication.md` and `about.md` are two examples
already in `content/` — read them, copy one, and start writing.

## Writing: in Galascribe, or by hand

You can write and edit articles in the Galascribe app, which commits the
changes to this repository for you. You can also edit these files directly
— in any text editor, or by cloning this repository and using `git` — and
push your changes. Both ways work, because everything Galascribe needs is
in the files themselves.

## Your settings

- `gala/publication.json` — your publication's name, description, and base
  address.
- `gala/authors/` — one file per author. Start by editing the file that's
  already there with your own name and short biography.
- `gala/navigation.json` — the links in your site's header and footer.
- `gala/appearance.json` — which visual theme your site uses. New publications
  start with the newsletter-oriented Default theme.
- `gala/modules/interactions.json` — likes and comments are on by default and can be changed in Galascribe under the site's settings or by editing this file.
- `assets/` — images and other files your publication uses that aren't
  articles or pages.

You generally won't need to touch `gala/repository.json` or
`gala.lock.json` by hand — Galascribe manages those.

## Publishing

`.github/workflows/gala-publish-v2.yml` is the file that tells your own
GitHub account how to publish this repository when you're ready. When
Galascribe builds and publishes your site, the work happens inside your own
GitHub account, using GitHub's own build minutes — not on Galascribe's
servers. You don't need to understand this file to use it; just don't
delete or rename it. If Galascribe ever tells you it needs to be updated
(for example, to point at a newer version of the publishing tool), it will
tell you exactly what to change.

## Publishing destinations

- **GitHub Pages** (the default): there is nothing extra to set up. Galascribe
  configures this repository for GitHub Pages when you select the destination;
  publishing then builds and deploys the site.
- **DigitalOcean Spaces**: not offered yet. If you see references to it in
  this repository's files, they are not active for you — Galascribe will
  tell you when this destination becomes available and what you'd need to
  set up for it.

## If something looks broken

If a build fails, check the error Galascribe shows you first — it usually
names the exact file and setting that needs fixing. Nothing here runs code
you wrote or installs anything on your behalf; the tool only reads your
articles, settings, and images, and turns them into a website.

## How this blog publishes

This blog is written in the open and published on a schedule by its own repository.

- **Drafts** live in `content/<slug>.md` with `status: draft`. A draft is never built into the site; the Galascribe App lists it under Posts as a draft.
- **The calendar** is `.github/blog-calendar.json`: the posts in the order they go out, each with a date and an `approved` flag. A date is a floor, not an appointment: a post goes out on the first run on or after it.
- **Approving** a post means setting its `"approved": true` and committing that to `main`. A post that is due but not approved holds every post behind it, so nothing goes out of order.
- **The schedule** is `.github/workflows/blog-cadence.yml`: Sunday 18:05 and Friday 04:05 Pacific. Each run publishes at most one post: the first slot, in order, that is due and still a draft.
- **What a run does**, in `.github/scripts/blog-cadence.mjs`: it rewrites the draft to `status: published` with a `publishedAt` time (nothing else in the file changes), then sends it through the Galascribe API (plan, confirm, publish) and waits for each step to finish. The API makes the commit to this repository; the script commits nothing. The first run also deletes the template's `welcome-to-your-publication` sample article in the same change.
- **The secret** is one repository secret, `GALA_BLOG_API_KEY` (Settings, Secrets and variables, Actions). The script exits with an error if it is missing and never prints it.
- **A dry run** reads the site's content listing, prints the post it would send and whether it would delete the sample article, and writes nothing. In GitHub, open Actions, Blog cadence, Run workflow (dry run is the default; `now` pretends it is another date). Locally: `GALA_BLOG_API_KEY=... node .github/scripts/blog-cadence.mjs --dry-run`, with `--now YYYY-MM-DD` to pick a date. `--live` publishes for real and cannot be combined with `--now`.
- **If the API is down**, a request is tried again three times, a minute apart, and then the run fails and publishes nothing. The post is still a draft whose date has passed, so the next run tries it again.
- **A run refuses a stale copy.** If the draft in this repository differs from the site's copy (for example after an edit in the App that has not reached `main`), the run publishes nothing and prints both versions.
- **The tests** run before every publish, and by hand with `node --test .github/scripts/blog-cadence.test.mjs`.
