---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740c-9f96-708a-827f-cf369a0f9766
kind: article
title: Six Dependabot merges, two majors, one revert
description: On 2026-09-26 unreviewed Dependabot merges broke main in two of our repositories; we reverted six in the API, pinned two versions and gated the bot.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- dependabot
- dependencies
- ci
- incidents
status: draft
publishAfter: '2027-03-05'
createdAt: '2026-10-25T17:12:26.000Z'
slug: six-dependabot-merges-two-majors-one-revert
redirects: []
extensions: {}
---

At 11:21 on the morning of 2026-09-26 (Pacific) we committed "Reconcile package-lock.json after the Dependabot merges" in our schema package. Thirty-two minutes later, in the API, we committed a revert of six dependency upgrades that nobody had reviewed. By 12:35 a seventh had to be pinned back. In one morning, an automated tool had put changes on our main branches that no person had reviewed, and two of them were major-version upgrades of the framework and the build tool.

Who or what pressed merge is not stated in our records: the commits do not say whether it was an auto-merge setting or a person clicking through pull requests that looked routine. The API revert says the changes merged "without review".

## What landed

In the API, six Dependabot pull requests had merged on top of the reviewed baseline. Two were majors: Spring Boot 4.1.1 and Gradle 9.7.1. The others were caffeine 3.3.0, spotless 8.10.2, tomcat-embed-core 11.0.26 and jackson-databind-nullable 0.2.11. The revert commit lists them in reverse merge order and restores the lockfile, the version catalogue, the wrapper properties and the build script to the reviewed state. Dependabot had already been paused: the commit that paused it, "until it is grouped and capped", is stamped 11:33, twenty minutes before the revert at 11:53.

The schema package had its own version of the morning. Its grouped dev-tooling pull request pulled in typescript 7.0.2 and yaml 2.9.1. TypeScript 7.0.2 broke `npm ci` outright, because the peer range of the linter plugin we use is `>=4.8.4 <6.1.0` and npm refused to resolve it with an `ERESOLVE` error. The yaml bump collided with a test that asserts the exact version 2.9.0, the one our review had verified. We reverted those two, kept the others (including eslint, prettier, jsdom and the type definitions for Node), and regenerated the lockfile and the licence inventory. The full verify gate was green again: build, lint, typecheck, architecture, duplication, workflow checks, 396 tests, licence and SBOM checks and an audit.

Its follow-up commit says four Dependabot pull requests merged that day and broke main.

## The one the revert missed

Within the hour we found another in the API: Dependabot's bump of webauthn4j from 0.29.7 to 0.31.10 had broken dependency verification for nine artifacts. It was not a leftover from the Spring Boot 4 revert. Tracing the lockfile history showed that the new webauthn4j-core POM depends directly on Jackson 3, version 3.2.1, a different package namespace from the Jackson 2.21.x that our Spring Boot 3.5.16 stack uses everywhere else. That would have put a second major Jackson lineage into the build with no verification metadata covering it. The commit calls it "exactly the class of drift" that the earlier revert had already rejected once.

We pinned webauthn4j back to 0.29.7, the last reviewed version, and confirmed that the Jackson 3 lockfile entries disappeared completely. A benign test-scope bump of archunit stayed, with its metadata entries added. The full check passed with `--rerun-tasks`.

Dependency verification did its job here: the bump broke the build in the place designed to make an unreviewed transitive dependency hard to miss. What failed was the process in front of it, because nothing stopped the bump from reaching main first.

## What we changed

Four rules, all written down on the same day:

1. **Group and cap.** In the schema package Dependabot's config now groups minor and patch updates for GitHub Actions and Gradle into single pull requests and caps the number of open pull requests in every ecosystem.
2. **Majors need a human.** Majors are ignored for typescript, the Gradle wrapper and our JSON schema validator, all deliberately gated, and every bump to yaml, semver, ajv and ajv-formats is ignored because tests pin them exactly.
3. **No gate, no merge.** CI does not run on Dependabot pull requests unless a maintainer adds the `ci:run` label. A gate job that every other job depends on skips for the bot's pull requests and stays true for pushes to main. The API got the same label gate that afternoon, as part of a change whose stated aim was to conserve GitHub Actions minutes without weakening any gate.
4. **Pin what you cannot review.** webauthn4j stays below the version that pulls in Jackson 3 until someone reads it.

The second rule is the one that matters. Rules one and three slow the bot down, which is what we wanted from them. Rule two says that some changes are not routine whatever the bot's title says, and a person has to decide them.

What we cannot tell you is whether anything shipped from the bad main during those hours. Our records do not say, and we have not put a figure on the time lost. The reverts, in the end, were cheap. The expensive part was the order of events: the changes were on main before anyone had been asked a question about them.

## Check yours

Open your repository settings and answer three questions. Can your dependency bot merge, or only open pull requests? Does CI run on its pull requests before a human sees them? Which of your dependencies would you refuse a major version of, and have you told the bot? If you cannot answer the last one, start with the packages that your tests or lockfile pin to an exact version. The bot will find them for you on its first run, as it did for us.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
