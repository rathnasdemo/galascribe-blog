---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a17138-2dc7-7901-b7df-948b4f74252c
kind: article
title: GitHub Pages caches for ten minutes, so poll for eleven
description: GitHub Pages serves max-age=600 and ignored every cache-busting trick we tried, so a deploy check that reads the site once ends up measuring the cache.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- github-pages
- caching
- publishing
- ci
status: draft
publishAfter: '2027-01-03'
createdAt: '2026-10-25T04:01:09.000Z'
slug: github-pages-caches-for-ten-minutes
redirects: []
listen:
  audio: assets/listen/github-pages-caches-for-ten-minutes.mp3
  durationSeconds: 340
  format: conversation
extensions: {}
---

On 2026-10-22 a publish to our own blog turned red seven minutes after the previous one. The error was `DEPLOY_NOT_ACTIVATED`, with `verified=false`. The site was live. One second later our API recorded the same deployment as `ACTIVE_VERIFIED`. Only the Actions run was red.

The step that failed is our Pages adapter's final check that the new version is being served. After GitHub activates a deployment, the adapter's `observe` step reads the site's marker file and every page over the public internet and compares what comes back with what was just built. It read each one once, and it got the old version.

## What we measured

We requested the blog's pages on 2026-10-22 and read the headers. Every response carried `cache-control: max-age=600`, along with `x-cache` (HIT or MISS) and `age`. Then we tried to go around the cache in two ways. A request with a unique query string appended still came back `x-cache: HIT` with `age: 4`. A request carrying `Cache-Control: no-cache` and `Pragma: no-cache` still came back HIT. Neither worked, and we found no way for a client to bypass the edge cache of GitHub Pages. Our adapter has no way to clear it either: it declares `cacheInvalidation: none` and holds no purge authority.

That explains the red run. The previous publish had finished with its own verification, which read every page and so left them in the cache with a ten-minute lifetime. Seven minutes later the next publish activated a new generation and read every page once. Those reads were served the previous generation from the cache, the marker and the digest did not match, and `observe` reported the new version as unverified. The check had measured the cache, not the deploy.

The strictness was right. Serving the wrong generation is a real failure, and we want to know about it. What was wrong was the assumption that a read made right after activation sees the new bytes.

## What we shipped

On 2026-10-22 we replaced the single read with a bounded poll, and on 2026-10-23 we released a reworked version as adapter 0.1.2. It reads again, waiting 5 seconds at first and doubling up to 30, until the marker and the artifact digest match. The deadline comes from the response itself: the `max-age` the origin declares, 600 seconds if it declares none and capped at 900, plus a margin of 60 seconds. With GitHub's value that is 660 seconds, eleven minutes. When the deadline passes it reports what the last pass saw.

Some things do not wait. A redirect from the public origin fails at once, since waiting will not change where the origin sends you. Transient network errors such as a reset connection or a timeout are retried inside the deadline and reported as findings if they persist; the same error on three passes in a row stops the wait, and name-resolution, certificate and TLS errors stop it immediately.

The request count needed a second pass. The first version re-read every page on every pass. A review put that at about 25 passes times the number of pages, roughly 50,000 requests for a 2,000-page site. Version 0.1.2 reads every page on the first pass and after that only the marker until it matches, plus a rotating sample of at most 20 pages that have not matched yet. Once the marker and the sample agree, it reads the remaining pages in that same pass. A site of 50 pages or fewer re-reads what matched earlier once more before it reports success. The changelog gives the cost as about passes times 21, plus twice the number of pages. For the same 2,000-page site and 25 passes, that is about 4,500 requests. We bound the wait by time and put no cap on requests that could end it early.

## What it costs, and what we have not proven

A real failure, such as a missing page or a wrong version, now takes up to eleven minutes to report, and up to sixteen if the origin declares the longest lifetime we wait out. The adapter declares a managed execution budget of 1,500 seconds, which is the schema maximum. The true worst case is higher: 1,500 seconds of polling GitHub for the activation, plus up to 960 seconds of observing.

We also shipped this on the evidence of one red run and one set of measurements. When it went out on 2026-10-22 we had not run the test that matters, a deliberate back-to-back publish inside the ten-minute window, and our last note on it, written after that deploy, still lists it as not proven. Sites on the older template contract kept the single-read check until they were set up again, and our own blog moved to the new check on 2026-10-22.

## If you check a Pages deploy yourself

The same rule applies to any smoke test, end-to-end test or browser check of a freshly published site, not only to ours. The procedure we wrote for publishing this blog's posts says to verify each one by fetching its address and the sitemap with bounded polling, for the same reason.

- Read the `max-age` from the response and wait that long, plus a margin. Do not hard-code it.
- Compare an identity, such as the digest in a marker file, and not "the page loads".
- Back off between reads, and bound the wait by time.
- After the first full pass, re-read only what has not matched, or a sample of it. Or read only paths that are unique to the new generation, which nothing has had a chance to cache.
- Skip cache-busting query strings and no-cache headers. We measured both and neither worked.

And when a check goes red within ten minutes of a previous deploy, read the `age` header before you read your code.

To run a publish on a site of your own, the start flow is at https://app.galascribe.com/
