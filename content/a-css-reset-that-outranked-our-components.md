---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a17138-2dc5-79d6-9e26-3b6a95894aab
kind: article
title: A CSS reset that outranked our components
description: A (0,1,1) reset beat every single-class button rule in our base CSS. Wrapping resets in :where() fixed it, and 300 scans went from seven failure groups to zero.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- css
- accessibility
- specificity
- testing
status: draft
publishAfter: '2027-01-31'
createdAt: '2026-10-25T04:01:09.000Z'
slug: a-css-reset-that-outranked-our-components
redirects: []
listen:
  audio: assets/listen/a-css-reset-that-outranked-our-components.mp3
  durationSeconds: 386
  format: conversation
extensions: {}
---

On 2026-10-13 Lighthouse flagged the comment sign-in button on one of our test sites. In dark mode its label was `#9aa5b5` on a `#7b97ff` background, and in light mode `#556070` on `#2b59ff`. Computed with the WCAG formula, those pairs are 1.09:1 and 1.21:1, against the 4.5:1 that WCAG asks for normal text. The button's own rule asked for the right colour, a token paired with its background. It lost, and the rule that beat it was a reset.

## The arithmetic

Specificity is a triple: ids, then classes, attributes and pseudo-classes, then element types. Our base stylesheet scopes every rule under the publication's root attribute. The reset read:

```css
[data-gala-publication-root] button { font: inherit; color: inherit; }
```

The attribute selector counts one in the middle column and `button` counts one in the last, so the reset is (0,1,1). The sign-in button's rule is `.g-composer__signin`, a single class, so (0,1,0). Both sat in the same cascade layer, `gala-base`. Layers are compared before specificity, but inside one layer specificity decides, and (0,1,1) beats (0,1,0) whichever rule comes later in the file.

So `color: inherit` won. The button took its colour from the actions row around it, which is the muted text colour. Font size and weight went the same way: the search, like, cancel and "more comments" buttons also lost the type their own rules set. No rule was wrong on its own. The reset just outranked every component rule that used one class.

Cascade layers did not help here. We keep the base stylesheet in the lowest layer so that a theme's token declarations win whatever the selectors. That protects a theme from our base rules. It does nothing for two rules inside the base layer arguing with each other. The link reset a few lines above the button reset was already written with `:where()`. The button one was not.

The same arithmetic explains why the bug hid. The block that styles the sign-in button also styles the report form's submit button, selected as `.g-report button[type="submit"]`. That selector is (0,2,1), one class plus one attribute plus one element, so it beat the reset and looked right. One declaration block was correct for one button and wrong for another.

## The fix is zero

`:where()` contributes no specificity whatever its argument. We changed the reset to:

```css
[data-gala-publication-root] :where(button) { font: inherit; color: inherit; }
```

Now the attribute selector alone gives (0,1,0). A single-class component rule ties with it, and a tie goes to source order, so component rules win only because the resets come first. That is a weaker guarantee than it sounds, and it is why the fix includes a test. We made it as two commits that afternoon. The first covered the button. The second moved the `body`, image, heading, paragraph and list resets, which had the same defect, under `:where()` too.

The second commit also fixed damage that no contrast check could see. The element resets had been overriding the spacing that `.g-pills`, `.g-tags` and `.g-social` set for themselves, so those three components were rendering without their own block padding, top margin and leading offset. They apply as written now.

The test reads our own stylesheet text. For each reset list, it asserts the rule is wrapped in `:where()` and appears before the first component rule, and a pattern check fails if any bare element-type reset under the root comes back. That is crude, because it checks text and not rendering, but it pins the one property that mattered. A comment above the test names the sign-in button, so the next person to add a reset finds out why the rule is there.

## The 300 scans

One flagged button does not mean one bug, so we ran axe-core over rendered pages. The matrix was six themes, each with the default palette and the App's six presets, in light and dark, across every page kind, with the reader widgets mocked. That is 300 scans. Before the fixes they reported seven groups of failures and one axe error about interactive elements nested inside each other, a search-result link inside an element with the option role. After the fixes, zero violations. The four template commits behind those fixes are all in the history of template 4.3.0.

The groups had causes besides the reset, and one theme, Zebra, needed its code-language label recoloured. Informational text such as like counts, pill counts and comment times used the faintest text token and measured between 1.0:1 and 3.9:1, so it moved to the muted token. A "Featured" badge used an icon-grade accent colour, which no theme pins against its page, and fell to 3.42:1 on one theme's light glow. It now uses the link colour, which every theme's own contrast check holds at 4.5:1 or better.

The scan has its own trap. The like button starts disabled, so a scan taken straight after a state change read the transition's first frame, not its end. The harness needed a settle wait before measuring.

Two limits stood when we wrote the audit up. It was a run, not a permanent gate: our theme tooling's own visual check never rendered reader widgets or presets, so a regression there would not fail a build, and we had offered to make the audit a permanent gate without doing it. And one preset, Graphite, has muted meta text at 4.05 to 4.25:1 over the light page glow in two themes, below our 4.5:1 aim. As of 2026-10-24 that is not fixed yet.

If you keep a stylesheet of your own, list the resets and count the specificity of each one. Any reset at (0,1,1) or higher will beat a single-class component rule inside the same layer. Wrap the reset in `:where()`, put it before the components, and add a test that fails when someone adds one that is not. When you scan the result, wait for transitions to finish and scan the states a reader reaches, not only the page as it loads.

To set up a site of your own, the start flow is at https://app.galascribe.com/
