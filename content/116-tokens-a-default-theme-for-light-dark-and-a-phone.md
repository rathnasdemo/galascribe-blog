---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a15ca8-eea0-73cc-a075-ad82769105ef
kind: article
title: '116 tokens: a default theme for light, dark and a phone'
description: How the default theme became 116 typed design tokens with light and dark values, and how a creator's own colours are checked for contrast before a build.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- themes
- tokens
- contrast
- darkmode
status: draft
publishAfter: '2026-11-13'
createdAt: '2026-10-21T04:12:17.000Z'
slug: 116-tokens-a-default-theme-for-light-dark-and-a-phone
redirects: []
extensions: {}
---
Our default theme was a skin over a fixed page. When I approved a new design for it, five decisions shaped what followed. This post covers what they produced: a closed list of 116 typed tokens, a light and a dark value for each, and a way for a creator to pick their own colours without making the page unreadable.

## Five decisions

I approved a working preview and asked for the production theme to be replaced with it. The decisions that went with it:

1. No backwards compatibility. Only test users were onboarded, so we broke contracts and bumped majors, with no migration shims.
2. The template owns layout. Themes supply design values, the tokens, plus optional skin CSS.
3. A site script is allowed, but every page must read completely with JavaScript off. The script only enhances: search, copy buttons, the menu, the colour-mode toggle.
4. "Most read" was dropped, because we have no visit data. The newsletter panel became a link to a sign-up address the author sets, hidden when none is set. There are no forms.
5. The official token list grows to the preview's full set of values, each with a strict type.

## 116, counted

Decision 5 said "about 100 tokens". The contract list that came out of it has 116 entries and replaces a list of 35. Keys are sorted and each has a fixed type, so the list is closed. By type, counted from the list:

```
type          count   may differ between light and dark
color           40    yes
paint            4    yes
border           8    yes
shadow           5    yes
font-family      5    no
font-weight      5    no
length          28    no
box              3    no
number           2    no
duration         3    no
easing           2    no
keyword         11    no
total          116    57 may differ, 59 must be byte-equal
```

A token is a key, a type, a light value and a dark value, and nothing else. The value grammars are allow-lists. A colour is a lowercase `#rrggbb` or `#rrggbbaa`. A length is a number with `px`, `rem`, `em` or `%`. No value may contain `url(`, `var(`, `calc(`, `attr(`, `expression`, a semicolon, braces, a backslash or a quote, apart from a few fixed keywords.

The allow-list is partly about safety and partly about checking. Because a colour is always a literal, we can compute the contrast of any pair before a page is served. Run-time functions such as `var()` would make that impossible, so the grammar excludes them. To convert the preview, we resolved every `var()` to its literal value for each mode and turned `color-mix()` into its computed hex. The preview's component CSS had no theme-specific selectors, so everything a theme varies is a token, and we kept it that way.

## Light and dark are both authored

Every token carries a value for each mode. The 57 whose types may differ are the colours, paints, borders and shadows. The other 59 (fonts, weights, lengths and the rest) must be byte-equal in light and dark, and the contract enforces it. Dark mode cannot quietly change your spacing or your type.

One mistake is worth owning. Look, the page where a creator styles a site, has a "Visitors see" control that saves a default colour mode. While reading code for the palette work, we found that the template never read it. The page script started from the reader's stored choice or the system setting, and without the script the page rendered light. The setting was saved and did nothing. The fix renders the author's default on the page root and, when it is light or dark, as the server-resolved mode. A reader's stored choice still wins, and when a creator allows only one mode there is no toggle.

## The phone, and no script

We audited the designs in a real browser instead of trusting static checks, at 320, 360, 390, 414, 768, 820, 1024 (touch) and 1440 pixels and on a phone on its side at 844 by 390. It asserted rows, overflow, overlap and tap-target sizes, and it caught the header and the reaction bar (the row with Like and the emoji reactions) wrapping onto two lines, which the static checks had missed.

The header's mobile menu is a `<details>` element, which opens and closes without script. The contents list comes from the article's second-level headings when there are at least two. A card without a cover image gets a placeholder painted from tokens. Everything the script adds degrades to plain links or `<details>` when it is off.

## Letting a creator choose colours

A theme's colours are literals in its `theme.json`, so a creator who wanted their own accent had nowhere to put it. There are three roles, Accent, Background and Text, each an explicit light and dark pair. A role left unpicked uses the theme's own value. Six named presets live in a list in the app, and "Theme colours" always comes first.

Three colours cannot drive 116 tokens, and they should not. A theme can bind them to at most 40: the three seeds, 24 more colours such as links, chips, header and footer, all four paints, seven of the eight borders and two shadows. The other 17 stay with the theme: code blocks and their syntax colours, the status colours, the overlay, form inputs, and the card and dialog shadows.

Each theme says which seed each of its colours follows. When a creator picks an accent, the build moves every colour that follows it by the same perceptual change that turns the theme's accent into theirs, in OKLCH, a colour space with hue, chroma and lightness as its axes. A colour whose seed has not changed keeps the theme's literal exactly, so the default palette reproduces today's colours by construction.

Two limits apply to what the creator picks. Background must be light enough in light mode and dark enough in dark mode: lightness of at least 0.90 and at most 0.30 on the OKLab scale, where our six themes measure 0.951 to 1.000 and 0.145 to 0.191. Text must reach 4.5:1 against Background in each mode. The creator's colours are used exactly as chosen. If a pick fails, Save is disabled and the reason is shown, for example "Hard to read in dark: 3.1 of 4.5".

Derived colours are different. Links, chip text and similar colours are computed from the pick, so we adjust them. We check 21 pairs in each mode on the final values: the 17 pairs already checked for every theme at 4.5:1, focus on canvas at 3:1, and the three status colours at 4.5:1. Where a pair's foreground follows the palette, the build moves its lightness by the smallest step that clears the minimum plus 0.1, aiming at 4.6 so that the browser and the build agree on a pass. A failing pair whose foreground belongs to the theme is never adjusted. It fails.

That has a visible cost: a pure yellow accent gives olive links. In our calculations on the Editorial theme in light mode, a yellow of `#ffd60a` gives links of `#f1ca00` at 1.38:1, which the adjustment moves to `#7f6900` at 4.64:1.

## Where it is checked

The check runs in five places: in the app while a creator picks, where a failing role shows its ratio; in the API at save, which checks shape, lowercase hex, the background band and text on background; in the template at render, which is the authority and refuses the build with `APPEARANCE_PALETTE_CONTRAST`, naming the pair, the mode and the ratio; at theme release, against a stress corpus of palettes; and in a test that runs every preset and every theme's default palette through all six themes in both modes.

Every preset's pass through each theme's bindings is proved by that test, not by arithmetic, and a failing preset is retuned before it ships, with the one exception noted below.

A contrast audit found zero violations. By hand we measured one preset, Graphite, at 4.05 to 4.25:1 for muted meta text over the page glow in two themes, below our 4.5:1 aim, and it is not fixed yet.

To set up a site and try the colour choices in Look, the start flow is at https://app.galascribe.com/
