---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a17138-2dd3-7a66-acc8-5262a6fefa6c
kind: article
title: 'The sign-in bug that cost a week: OAuth apps versus GitHub Apps'
description: A repository link looped through sign-in because GitHub's installations route rejects OAuth App tokens, and the fix was a second OAuth client.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- github
- oauth
- authentication
- incident
status: draft
publishAfter: '2026-12-04'
createdAt: '2026-10-25T04:01:09.000Z'
slug: the-sign-in-bug-that-cost-a-week
redirects: []
listen:
  audio: assets/listen/the-sign-in-bug-that-cost-a-week.mp3
  durationSeconds: 423
  format: conversation
extensions: {}
---

On 2026-09-26 I tried to link a GitHub repository to a source in production Galascribe. The app sent me back through GitHub to re-confirm my connection. I did, and was refused the same way. Our API had answered `401 REAUTH_REQUIRED`. The answer GitHub had actually given, one layer down, was a 403.

The title counts elapsed time, not effort: from 2026-09-20, when we wrote the instruction that sent us the wrong way, to 2026-09-27, when the list of installations loaded in production.

## Two kinds of app that look like one

GitHub has two kinds of application, and we had registered one of each without treating them as different things. An OAuth App signs a person in. A GitHub App is installed on accounts and repositories, and it has its own OAuth client, with its own client id and secret, for acting on behalf of a signed-in user. They issue different tokens. Our OAuth App's client id begins `Ov23` and its tokens `gho_`; the GitHub App's client id begins `Iv23` and its user tokens `ghu_`.

The route we needed, `GET /user/installations`, lists the installations of our GitHub App that a person can see. Our API documentation puts the rule in one line: only the GitHub App's own user authorisation yields a token that route accepts. We were calling it with the token from sign-in, which came from the OAuth App, and GitHub answered 403.

The same fact had already shown up once, in a different costume. On 2026-09-16, on our local stack, a fresh sign-in was followed about ten seconds later by the same `401 REAUTH_REQUIRED`. That time the cause was expiry. An OAuth App's token response carries no `expires_in`, and our OAuth library fills in a default of one second when the field is absent. GitHub App user tokens do send one: 28,800 seconds, eight hours. We fixed the symptom by treating an absent `expires_in` as no expiry, and we wrote down that the five-minute re-authentication window we had suspected was never involved. Both were consequences of which kind of token we held.

## How a 403 became a loop

Our API read a 401 or 403 from that route as a lost credential and answered `401 REAUTH_REQUIRED`. The app handled that code the way it should handle a lost credential: it sent the person through GitHub again. That produced another OAuth App token, which GitHub refused in the same way. `REAUTH_REQUIRED` already had two unrelated causes on the server, a stale session and a bad GitHub credential. Now it had a third that no re-authentication could repair.

Nothing was positioned to catch it. Our local stand-in for GitHub mirrors the OAuth App's token response and never answers 403 on that route, so local development worked. When the incident hit, we had no test and no post-deploy check that exercised an authenticated GitHub flow.

And the instruction was ours. Our to-do list for me of 2026-09-20 and the help text of our production setup script told me to register a separate OAuth App for sign-in and to discard the client id and secret that GitHub generated with the GitHub App. That contradicted the registration manifest we generate, which gives the GitHub App callback addresses and asks for user authorisation during installation. I followed the script exactly. Our specification had called for two independent OAuth clients all along. The implementation had never built the second: no configuration key, no slot in the secrets inventory.

## What we changed

On 2026-09-26 we changed the API, and deployed it on 2026-09-27, to stop treating every 403 as a lost credential. A 403 from GitHub without a rate-limit signal is a different fact, and it is now answered `503 CAPABILITY_UNAVAILABLE`, not another trip through sign-in. The contract release that followed, 2.13.0, declares the new answers.

On 2026-09-27 we added the second OAuth client. Sign-in keeps the OAuth App. Repository linking and reconnection use the GitHub App's own client whenever it is configured, and once it is, the API refuses to let a token minted at sign-in overwrite a stored GitHub App token. The first deploy was a stopgap: the production host only forwarded the credential names it already knew, so we fed the GitHub App's credentials in under the sign-in names for that deploy, which meant a later deploy that forgot the override would have silently reverted both flows.

The same day we found two more faults on the same flow. After you install the GitHub App, GitHub sends the browser to the app's first registered redirect address with a code, an installation id and a setup action, but no state value. Our callback read a code without state as an expired sign-in and showed a failure to someone who had just succeeded. It now recognises an installation return and sends the browser on; the screen re-reads the installations through the person's own authorisation, and an installation id in a URL is treated as a hint at most.

The second fault was a race. The app asks for the installations and the repositories in parallel. Each read recorded a "last used" time on the stored credential with a version-checked update, and an update that matched no row raised not-found, so the second request got `401 REAUTH_REQUIRED` with a missing-token cause. We found it in the production log: in the same second, one read returned 200 and one was refused. The update is now state-guarded and no longer version-checked. We have no test that failed before the fix. A two-request test passed on the old code too, so what we have is the log, the code and tests with many concurrent readers.

On 2026-09-28 we handled another difference: GitHub App user tokens expire after eight hours, which the OAuth App's never did. The API now keeps GitHub's rotating refresh token with the credential and refreshes before use. Credentials stored by earlier builds needed one more authorisation, because those builds had discarded the refresh token.

## What we check now

At startup the API logs a warning, outside local development, if the GitHub App's client is not configured, and an error if the configured client id has the OAuth App shape. When a linking or reconnection ceremony returns a token that is not a GitHub App user token, one error line names the token's prefix class and never the token. Since 2026-09-16 a rejected stored credential also logs its reason, where one HTTP code used to hide not found, expired, revoked and re-authentication required.

Our browser checks of the connect, install and link flow make assertions, 34 of them as of 2026-09-27, but they do not talk to real GitHub, so they could not have seen this. What did was a test against real GitHub on 2026-09-27: I connected, installed the app on a test account, came back automatically and the list of accounts loaded. We now treat that as the rule for any GitHub-facing change. As of 2026-09-27 that step was still a person doing it by hand.

If you are adding "connect GitHub" to a product, write next to each GitHub call which token class it needs, and log the class (a prefix, never the token) wherever you receive one. Then decide what a 403 means before you ship. Ours meant "this credential can never work here", and no amount of signing in again can answer that.

To link a repository of your own, the start flow is at https://app.galascribe.com/
