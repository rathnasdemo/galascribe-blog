---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a17138-2dda-7a0a-839b-26daa1aa576f
kind: article
title: Your own domain without touching DNS, if you use Cloudflare
description: How the Domain page adds your DNS records on Cloudflare with one consent and a grant we revoke, and what broke when we pointed our own blog at it.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- domains
- dns
- cloudflare
- github-pages
- incident
status: draft
publishAfter: '2026-11-27'
createdAt: '2026-10-25T04:01:09.000Z'
slug: your-own-domain-without-touching-dns
redirects: []
listen:
  audio: assets/listen/your-own-domain-without-touching-dns.mp3
  durationSeconds: 418
  format: conversation
extensions: {}
---

At 03:46 UTC on 2026-10-21 we published our own blog from the Galascribe app, having just connected blog.galascribe.com to it. About two minutes later the deploy died on a redirect our tooling treated as fatal, and the custom domain went on serving the first build, whose stylesheets and scripts answered 404. The records were fine. What failed was everything that has to happen to a site after its domain starts working. Below are both halves: what the Domain page does, and what we had to fix before a domain was safe to add to a site that had already published once.

## What the Domain page does

You type a domain. The page lists the DNS records GitHub Pages needs, each value copyable, and checks every few minutes whether public DNS points at GitHub. That path works with any registrar and it is still there.

If your DNS is on Cloudflare there is a second path, a button labelled "Add these records on Cloudflare". We accepted the design on 2026-10-10 and it was live by 18:35 UTC that day. It uses Cloudflare's own authorisation for third-party apps, which our design notes record as generally available since 2026-06-03. Four choices in it are worth stating.

The grant is small and short. We ask for two permissions, Zone Read and DNS Write, and not for offline access, so Cloudflare issues us no refresh token. We use the access token inside one chain of requests and revoke it the moment the chain ends. On the normal path it is never written to our database.

The records are written as DNS only, not proxied. GitHub has to see its own addresses to verify the domain and issue the certificate, and with Cloudflare's proxy on it cannot. The page says so in one sentence.

Nothing in your way is changed without showing you first. If every record we want is new or already identical, we write them at once. If one would be replaced, such as a different A record at the root or a CNAME at that name pointing elsewhere, nothing is touched until you have seen a plan of what would be added, kept or replaced, with the current value, and chosen Apply or Don't change. Only on that path do we keep the token, encrypted, for at most ten minutes. Removing a domain uses the same flow and deletes only records whose values are Galascribe's own targets, never anything else at that name.

The proxy is a separate, later step. Once the domain is active and its certificate is issued, the page offers to turn it on, with a warning that while it is on GitHub stops renewing its own certificate, so Cloudflare's SSL/TLS mode must be Full (not Full strict).

Two mistakes showed up on the first day. We had guessed the identifier of the DNS write scope; Cloudflare's own picker showed different ones, and the first deploy needed the setting corrected. And at 18:55 UTC on 2026-10-10 "Check now" on a live domain answered with a 503. GitHub answers its Pages health read with an empty object and a 200 while it re-runs its own DNS check, and our client treated that as a malformed response. An empty object now means pending.

## What you see while you wait

Most of the work of a domain is waiting, so the page names each wait. The states include Waiting for DNS, Waiting for GitHub, Certificate pending, Almost live and Live, with Has a problem and Expired at the edges. The page tells you that DNS changes can take from a few minutes to a day, that the certificate can take up to 24 hours, and that a setup expires if the records are not added within 7 days.

One wait surprised us. Adding the `www` record makes GitHub request a new certificate, and GitHub reports that as a change in DNS settings. The old certificate keeps serving the main address meanwhile. Our first version read that as a failure and showed "Needs attention" next to "nothing to do". We fixed it on 2026-10-11, and the page now says that GitHub is issuing a new certificate and the current one is valid until a stated date.

## How we broke our own blog

The blog repository was created at 02:58 UTC on 2026-10-21 and published for the first time a minute later. Some time between 03:00 and 03:45 we connected the domain. Setting the domain made GitHub start redirecting the old github.io address to it, from that moment and not from when the certificate was ready. Then we published.

Our own notes list five causes. The site's own address in its settings moved only when a person pressed Check now. The guard that refuses a doomed publish believed the old address was still correct until the domain was fully active, so it let the build through. The app hid the one sentence that said the address still had to move. The deploy tooling treated the expected redirect as fatal, threw an uncaught exception, and reported nothing. And because no report arrived, nothing released the lock that stops two deploys overwriting each other: a second publish waited behind it, retrying every 30 seconds, and the app showed "Publishing... Preparing" indefinitely.

The rule we took from it is that a person should never have to know any of that. Moving the site's address is now something the system owes and does, not something a person triggers. The page says "Getting ready to move your site to" the new domain, "This starts by itself once your domain is verified. You don't need to do anything." A publish either carries the address change or is refused with a named reason, instead of building a site that cannot work. A lock is bound to the deploy that holds it and is released when that deploy ends. And the GitHub Pages adapter released on 2026-10-23 reports a redirect by name instead of throwing.

The first deploy of the fix did not move the blog. Production held rows in states we had not designed for, and each one needed its own fix: a domain whose certificate was issued but which had never reached the active state in our records, a sweep that had moved live sites onto a toolchain whose themes no longer matched their lock files, and a guard in our repository writer that our test fake never enforced. The move finally ran at 07:05 UTC on 2026-10-22. We checked it in a fresh browser: a 200 at the new address, the new canonical, five stylesheets, no failed requests, and the old address redirecting to it.

## If you do this by hand

The mechanics apply to any GitHub Pages project site, with or without us.

1. GitHub redirects the github.io address to your custom domain as soon as the domain is set, before the certificate arrives. If your site is served under the repository name, change your generator's base address at the same time, or your asset paths will 404 on the new domain.
2. Keep Cloudflare records set to DNS only (the grey cloud) until GitHub has issued the certificate.
3. Budget up to 24 hours for the certificate, and treat a "new certificate" notice after adding `www` as routine.
4. After the address changes, publish once and open the site in a fresh browser.

If your DNS is on Cloudflare, the Domain page will add the records for you. To try it on a site of your own, the start flow is at https://app.galascribe.com/
