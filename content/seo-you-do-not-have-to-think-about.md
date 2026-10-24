---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a15ca8-eea9-7c23-ab5c-d8b6e5c2421f
kind: article
title: SEO you do not have to think about
description: 'One address per page, descriptions you write, a picture for shared links: what we found auditing our own test site, and what we changed.'
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- seo
- search
- metadata
- authoring
status: draft
createdAt: '2026-10-21T04:12:17.000Z'
slug: seo-you-do-not-have-to-think-about
redirects: []
extensions: {}
---
Search and social presentation is a handful of small facts in a page's head: which address is the canonical one, how the page is described, which picture appears when someone shares a link. Each is easy to get slightly wrong, and a template that gets one wrong gets it wrong on every site it builds. So we audited a live test site of our own. Here is what that audit found, what we changed, and what testing the changes found in turn.

## What the audit found

The test site was built with template 4.0.0. The audit found, among others:

- Canonical addresses without a trailing slash, which GitHub Pages answered with a redirect; eight of the nine sitemap entries redirected too.
- A seeded heading that polluted generated descriptions: starter posts opened with their own title as a heading, and the fallback description could read heading text.
- A description that was just the site name: a site created without a tagline falls back to its title, and the home page title repeated the name.
- No social preview image and no favicon.
- Thin author controls over how a site and its posts appear in search and in shared links.

None of these breaks a site, but a template carries each of them to every site it builds, which is why we treated them as defects in the template and not in one site.

## One address per page

Under the default route profile a page is built as a directory. GitHub Pages serves `/about/` directly and answers `/about` with a 301 redirect to it. Our canonical links and our sitemap used the slash-less form, so following either started with a redirect. We want a sitemap to contain no address that a redirect would serve.

So there is now one rule, decided by one helper that every emitter calls. Under the default profile every public page address ends in a slash, and the root stays `/`. That covers the canonical link, `og:url`, the sitemap, the feeds, the llms files, the structured data, the search index and every internal link. Fixed files such as `/sitemap.xml`, `/feed/rss.xml` and `/assets/…` are unchanged, and so is the `explicit-file` profile.

```
route            if emitted bare               emitted now
/                200                           /
/about           301 to /about/                /about/
/archive/2026    301 to /archive/2026/         /archive/2026/
/page/2          301 to /page/2/               /page/2/
```

We check this by building a fixture site and parsing the output instead of reading it by eye. The condition is that no page address in any of those places lacks its slash, and that the sitemap lists nothing a redirect would serve. It passes in the template release, 4.3.0.

One cost is worth stating. Tag and series pages now use their readable name alone, and add a ten-character hash only when two names collide or the readable name is empty, so existing hashed tag addresses change. We emit no redirects for them, because they are low-value listing pages. If you linked to one, that link will break.

## Descriptions you write

A description is the line under a title in a search result and in a shared-link card. Our rule is that a person writes it. A post's subtitle is its default search description, and the editor lets a post override both that and its search title. The title override allows up to 70 characters, with the site name added after it on every page except the home page; the description override allows up to 300.

The editor shows a search-result preview built from the same fields and suffix, with counters and four checks: the title plus suffix is at most 60 characters, the description is between 70 and 160, a social image is chosen, and every image has a description. Those numbers are our own checks, not promises about how a search engine will display the text.

For the site as a whole there is a tagline, set when the site is created or later in Settings, and a language. Without a tagline the description falls back to the site's name, and when the two are the same the home page title shows the name once. If a post has no written description at all, the renderer falls back to text from the page, and that fallback now skips headings.

## A picture for shared links

Link cards need an image. A site can have a default social image, uploaded in Settings as PNG, JPEG or WebP (we recommend 1200 by 630 pixels) and stored in the repository under `assets/brand/`. A post can choose its own from the pictures in its body or its hero, or upload one. A brand mark uploaded under Look gives the site an icon, an Apple touch icon and a theme colour from its palette, with a dark-mode variant when there is one.

## What an author can control

Collected in one place:

- **Per post:** search title, search description, social image, a canonical address under an Advanced fold for syndicated or moved content, and a switch that hides the post from search engines.
- **Per site:** tagline, language, social links, which feed the organisation's structured data as `sameAs`, a default social image, and a switch that allows or blocks AI crawlers in `robots.txt`.
- **Addresses:** change a published post's address and the old one is added to its redirects automatically, up to 32, with a note that the old address will redirect.

Hiding is not the same as unlisted. An unlisted post is reachable by link, left out of the site's lists and not indexed. A hidden post stays listed on the site, sends `noindex, follow`, and is left out of the sitemap, feeds, llms files and search index. Site settings are saved as a pending change in your repository and go live with the next publish, like any other edit. The site's canonical base is deliberately not editable: it changes only when a domain is attached or removed on the Domain page.

## What testing the fixes found

We checked the changes with scripted browser journeys on a local stack that print facts from the parsed output, not screenshots. Three of its five journeys failed on the first run.

The first failure was easy to miss. The settings saved, but the publish step refused the default social image and the brand assets, so the tagline, social links, social image, icon and crawler setting never reached the built site. An author would have filled in every field and seen nothing change. We extended the publish step to accept them, and the journey now finds each of them in the built output.

The second was in the editor. Reopening a published post from a device draft dropped its reference to the published version, so the redirect note, the redirects and the updated time were skipped, and after Publish the app wrongly said it could not reach Galascribe. The editor now attaches that reference on every draft restore. A rename in our test harness also stalled, because its stand-in for GitHub could not apply deletions; real GitHub can. The app now says a slow commit is still saving instead of claiming it is offline.

Fixed, here, means released and checked on a local stack: the renderer changes are in template 4.3.0 and the contract changes in schemas 3.12.0. The check that remains is a republish of the live test site followed by a request for every sitemap entry.

## What we left out

A navigation editor, `hreflang` (the model has no translations), per-author search fields and a sitemap index for very large sites are out of scope. None of this promises traffic. It removes avoidable mistakes, so that what a crawler or a link card reads is what you wrote.

To try this on a site of your own, the start flow is at https://app.galascribe.com/
