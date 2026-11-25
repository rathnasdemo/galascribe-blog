---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a213c4-22ed-76bb-b750-af26ae7a781f
kind: article
title: A blog platform for AI search and llms.txt
description: Galascribe sites publish llms.txt, llms-full.txt, a sitemap, structured data and robots.txt. Nobody can promise an AI assistant will cite a page.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- seo
- llms-txt
- publishing
- hosting
status: draft
publishAfter: '2026-12-16'
createdAt: '2026-11-25T18:00:00.000Z'
summary: Every Galascribe site publishes llms.txt, llms-full.txt, a sitemap, robots.txt and structured data, so crawlers and assistants can read it. We cannot promise that any AI assistant or search engine will cite a page, and nobody honestly can. Whatever platform you pick, the files are only a way to be read, not a way to be chosen.
faq:
- question: 'What is llms.txt?'
  answer: 'A Markdown file at the root of a site, in the llmstxt.org layout, that gives language-model assistants an index of the site. A companion llms-full.txt can carry the full text of every article.'
- question: 'Which blog platforms work with AI search and llms.txt?'
  answer: 'Any site can publish an llms.txt file. Galascribe generates llms.txt and llms-full.txt for every site, with a sitemap, robots.txt and structured data, so you do not write them by hand.'
- question: 'Will AI assistants cite my Galascribe blog?'
  answer: 'We cannot promise that, and no platform honestly can. These files let crawlers and assistants read your site. Whether one cites a page is the assistant''s decision.'
- question: 'Can I stop AI crawlers from reading my Galascribe site?'
  answer: 'Galascribe has a setting for AI crawlers, and robots.txt can block them. Posts you mark to stay out of search results are left out of the sitemap and out of llms.txt.'
slug: a-blog-platform-for-ai-search-and-llms-txt
redirects: []
extensions: {}
---

Every Galascribe site publishes `llms.txt`, `llms-full.txt`, a sitemap, `robots.txt` and structured data, so that search crawlers and AI assistants can read it. What we cannot do is promise that any assistant will cite a page. Nobody can, and a platform that says otherwise is selling something it does not control.

## What is llms.txt?

It is a plain Markdown file at the root of a site, written in the layout described at llmstxt.org. It starts with the site's name, a one-line description and a list of links to the pages worth reading, each with a short note. It is meant for language-model assistants, which read a site differently from a person with a browser. A companion file, `llms-full.txt`, carries the full text of every article in one place.

It is a convention, not a standard that every assistant follows. Some may read it, some may not, and we do not know which. We publish it because it costs the writer nothing.

## Who asks this question

Writers and small businesses who have heard that people now ask an assistant instead of searching, and want to know whether their blog can be found that way. Often they have been sold a promise. The honest answer starts with what you control and ends with what you do not.

## What can you control?

Whether your site can be read. That means clean pages, a sitemap, a robots file that does not shut crawlers out by mistake, structured data that says what each page is, and, if you like, an `llms.txt`. If you run a static site generator yourself, you write or install each of these and keep them current. That is doable, and the cost is your time and the care to keep it right as the site grows.

## What does a Galascribe site emit?

We checked each of these against the site template before writing this post.

- `llms.txt`: a Markdown index of the site in the llmstxt.org layout, with the site title and description, and a link and one-line description for each published article and page.
- `llms-full.txt`: one plain-text file carrying every published article in full.
- `sitemap.xml`: published pages only. Pages you mark to stay out of search results are left out of the sitemap, and out of `llms.txt` too.
- `robots.txt`: allows crawlers by default and names the sitemap. A site setting can block AI crawlers, and when you set AI rights the site also writes a license file.
- Structured data: JSON-LD for the site, its articles and their breadcrumbs. When a post has a summary and questions and answers, the page also carries them as FAQ structured data.
- RSS 2.0 and Atom feeds, and canonical URLs.

You do not write any of this by hand. It is generated when your site is built.

## What can you not control?

Whether an assistant reads the file, whether it quotes you, and what it says when it does. We make no claim about what any search engine or assistant rewards. We write posts that answer one question plainly, and we publish the files so they are available. That is the whole of the method.

## Do it yourself or Galascribe?

| | Static site generator you run | Galascribe |
| --- | --- | --- |
| llms.txt and llms-full.txt | You write or install them | Generated for every site |
| Sitemap and robots.txt | You configure them | Generated for every site |
| Structured data | You add it to your templates | Generated for every site |
| Promise of being cited | None | None |

## Who should not pick Galascribe?

If your reason is a guarantee of citations or ranking, no platform can give you one, and you should be wary of any that does.

If you want to charge readers through your blog, you cannot do that through Galascribe. If you want a large plugin ecosystem, another product is the better fit; our [choosing blog publishing software page](https://app.galascribe.com/best-blog-publishing-software) says which to consider for which need.

## How do I try it?

Start free at [app.galascribe.com](https://app.galascribe.com/). The Free plan is $0 for one site; Basic ($12 a month or $96 a year) and Pro ($149 a month or $1,188 a year) are on the [pricing page](https://app.galascribe.com/pricing). If you want to write an `llms.txt` for a site that is not on Galascribe, our free [llms.txt generator](https://app.galascribe.com/tools/llms-txt-generator) builds one in the same layout.

For the search side of this, read [SEO you do not have to think about](https://blog.galascribe.com/seo-you-do-not-have-to-think-about/).
