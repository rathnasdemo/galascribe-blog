---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a15ca8-eea2-7668-a436-b719d668ac8c
kind: article
title: 'A theme is not a template: it supplies values, not layout'
description: How a Galascribe site splits into a renderer that owns layout, themes that supply typed values, and a lock file that decides which of them a build uses.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- themes
- template
- toolchain
- lockfile
status: draft
publishAfter: '2026-11-08'
createdAt: '2026-10-21T04:12:17.000Z'
slug: a-theme-is-a-renderer-not-a-template
redirects: []
listen:
  audio: assets/listen/a-theme-is-a-renderer-not-a-template.mp3
  durationSeconds: 402
  format: conversation
extensions: {}
---
A Galascribe site is built from three parts that know little about each other: your content, a theme, and the renderer we call the template, the package that builds your pages. Most of our decisions about themes come down to who is allowed to decide what. This post covers the division we settled on, how a build chooses its theme, and what the division costs us.

## Why five themes were not enough

We had five themes: Default, Amaze, Flashy, Minimal and Zebra. They were token skins over one fixed page skeleton. The template owned the markup: header, breadcrumb, article header, contents rail, body, footer and a single listing style. A theme could not add a magazine grid, a featured-story hero, an author page with a portrait or a different article header.

My review of them was blunt: "not even a kid will use these themes." The cause was structural, not a matter of colour. Every theme was the same page in a different coat, and the coats (Zebra's diagonal stripes, Flashy's gradients, Amaze's serif) read as gimmicks on an unchanged skeleton. Better palettes would not have fixed it.

## Layout moved into the template

The fix went into the renderer, not into the themes. Template 4 carries the layouts, and we named the directions by purpose instead of by adjective: Editorial, Personal, Newsletter, Visual and Developer. Each has its own home, article and author layout. The five existing themes were upgraded in place to one direction each, and a sixth theme, Editorial, was added.

What a theme still owns is values. It is a package of files: `theme.json`, `tokens.css`, `components.css`, an optional `utilities.css`, `print.css` and any passive assets. `theme.json` says which composition the theme uses, declares 116 typed tokens with a light and a dark value each, lists digests for the files, and gives the range of template versions the theme works with.

The template ships its own base layer, `gala-base`, and the stylesheet layers have a fixed order: base, tokens, components, utilities, print. The base comes first, so a theme can override it but cannot reorder it.

## The lock file decides

Which theme builds your site? The lock file in your site repository decides, not whatever is newest. That rule shipped on 2026-10-04. Your repository carries two records. `gala/appearance.json` holds your choice as a range, for example `@rathnasgala2/theme-default@^4.0.0`. `gala.lock.json` holds the resolved result: an exact row for the schemas package, one for the template and one for the theme, plus a digest of the whole lock. The build reads the lock, requires the exact theme version, and compares the lock's theme row byte for byte with the row the toolchain knows. By toolchain we mean the publish tool your workflow pins, plus the template and theme packages it installs.

Before it renders anything, the template treats the theme as lower-trust input than your own writing. `theme.json` is validated against the theme contract schema first. Its `contractVersion`, `stylingContractDigest` and `templateRange` are checked against the template's own styling contract. Every declared file's length and SHA-256 is compared with the bytes read, and the theme's size budgets are enforced.

While writing the design below we found a gap in how the theme folder is located. As of our design note of 12 October, the resolver looked first in the repository's own `node_modules` and checked only name and version strings, so a theme folder committed by an author would render while the provenance still named the registry digest. The design recommends closing it by resolving themes for managed builds only from the toolchain's own install. That change has not shipped.

## Two generations at once (a proposal)

None of this is built yet. Today the toolchain serves one generation, and a site on the previous one has to be migrated by hand. This mattered the day the toolchain moved to generation 4. It could no longer build the two sites still on generation 3, and we migrated them by hand. The toolchain could hold only one version of each theme package: one catalog row per package, one directory per name, an exact version check. A second step did the actual damage, the sweep that moves every site's publish workflow to the newest toolchain pin.

The goal we wrote down: a toolchain update never breaks a live site, and a site changes generation only when a person asks.

What follows is the design's intent. A theme generation would be the template's major version, which is also the styling contract's major version and the `contractVersion` in the lock's template row. The template already enforces that binding, and inside a generation the contract does not move: the styling contract file stayed unchanged from template 3.0.0 through 3.2.1. The catalog would be keyed by package and generation. The toolchain would serve the newest generation and one before it, installed side by side under local alias names in the one install root, so there would still be one lockfile, one audit and one SBOM.

```
gala.lock.json                         what the toolchain would serve
  schemas   exact row  --+
  template  exact row  --+--> must byte-equal the rows of ONE generation
  theme     exact row  --+
  lockDigest

generation 3   template 3.2.1   contract 3.0.0   schemas 3.3.0   5 themes
generation 4   template 4.0.0   contract 4.0.0   schemas 3.8.0   6 themes

all three rows match one generation ....... build
older minor or patch of that generation ... LOCK_ROW_STALE
rows from two generations ................. LOCK_THEME_GENERATION_MIXED
generation retired ........................ THEME_GENERATION_RETIRED
anything else ............................. LOCK_THEME_GENERATION_UNKNOWN
```

The rows are the ones in the design when we wrote it, and the finding names are the design's. Galascribe would refresh a stale row inside a served generation. The other findings would be refusals with a plain recovery message, such as "Choose the theme again in Look."

The sweep would follow the same rule. It could refresh a row within its generation, and move the workflow pin when the new toolchain still serves the site's generation. It would never change the template's major, the theme package or the contract version. Moving to generation 4 would be an explicit appearance change that rewrites the lock's three rows and the theme range. It would go through the normal publish workflow like any edit, and if its build failed, the live site would keep serving its previous artifact.

## What this costs

Every theme must satisfy a contract, and the contract is strict. A theme with a bad digest, a template range that excludes the renderer, an exceeded size budget or an invalid `theme.json` is refused. Since template 4.1.0, a theme with no `palette` block is refused too, with the code `THEME_PALETTE_MISSING`. A mismatch refuses the build instead of falling back to something close.

There are other costs:

- A theme author who wants a layout we do not have cannot add one. The layout has to be added to the template, where every theme can use it.
- The toolchain would carry more. In the design, seven package entries become thirteen aliases, and every pairing of generation and theme gets its own test.
- Each generation we kept serving would be one we have to retire eventually.
- The hand migration of our own two sites was a small version of the bill. Strictness moves work onto the people who ship themes, and onto us.

## Why that is the point

A site here lives in your repository and builds in a workflow you can read. If the build quietly accepted a theme that did not match the lock, you would have no way to know that the page differed from what you chose. A refusal that names the row and the reason is less pleasant on the day, but it leaves you a record you can trust. We prefer a build that does what the lock says or says why it will not.

Splitting the page from its values has a second payoff: a theme becomes checkable data, so what a theme may contain can be tested before it ships.

To start a site of your own, the start flow is at https://app.galascribe.com/
