---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a15c94-3082-7fdd-81ea-7b2adc269b58
kind: article
title: 'Write, preview, publish: how a post becomes a page'
description: 'Follow one post from a draft branch in your repository to a live page: how the preview is drawn, what publish does, and how we check it is served.'
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- authoring
- publishing
- github
- preview
status: draft
publishAfter: '2026-11-06'
createdAt: '2026-10-21T03:49:38.000Z'
slug: write-preview-publish-how-a-post-becomes-a-page
redirects: []
listen:
  audio: assets/listen/write-preview-publish-how-a-post-becomes-a-page.mp3
  durationSeconds: 421
  format: conversation
extensions: {}
---
When you press Publish, your text passes through four places: your browser, our API, your site repository on GitHub, and a workflow that runs inside that same repository. We designed each step so that it can fail without losing what you wrote, and without claiming a result it has not seen. This post follows one post through all of them.

## The whole path

```
Browser         API              Your repository    Your workflow
   |             |                      |                 |
   | type; the preview is drawn here
   |             |                      |                 |
   |- plan ------>                      |                 |
   |             |- text as blobs ------>                 |
   |- confirm --->                      |                 |
   |             |- commit, PR --------->                 |
   |             |                      |                 |
   |- publish --->                      |                 |
   |             |- merge (GitHub App) ->                 |
   |             |- dispatch ----------------------------->
   |             |                      |                 | build, deploy to Pages
   |             <------------------------------ receipt -|
                 | fetch marker from the public site
   <- "Live" ----|
```

Each stage below says what it guarantees.

## How the preview is drawn

The preview is rendered in your browser while you type, and nothing leaves it. We render the body with the same Markdown library the site renderer uses, pinned to the same version and configured the same way: raw HTML off, automatic link detection off, typographic replacements off. The result goes into a sandboxed frame with no permissions granted, styled with the site theme's published CSS.

It is labelled a draft preview, with the words "Your published page may differ slightly". It shares the renderer's Markdown settings and the theme's styles, but it is not the build itself, and we say so. If the browser does not recognise the theme, it falls back to neutral styling and says so. The front matter block is read and written with the YAML package at the version the publish tool pins, so the file the editor writes is the file the publish tool reads.

## Where a saved draft lives

Once saved, your draft lives in your own site repository, on a change branch, and not in our database. Before the first save, your text is kept on your device: the editor writes an encrypted copy to your browser's storage half a second after you stop typing, and at least every two seconds while you keep typing. The key stays in the browser, so this protects against casual inspection, not against someone using your device. If the browser blocks storage, as a private window does, the editor still works and says the draft cannot be kept on this device.

Saving is two requests.

The first, a plan, carries the document paths, the text and a digest of each, plus the repository revision you started from. The API writes each document into your repository as a git blob, unreferenced until a commit points at it, using a token limited to that one repository. Our database holds paths, blob ids, sizes and digests, and never what you wrote.

The second, confirm, builds the tree and a commit from those blob ids on a change branch, and opens a pull request. If a blob has disappeared by then, the change fails with no effect, and the app plans again from the draft. A saved, unpublished draft is therefore a branch in a repository you own.

Paths are restricted to the content and asset folders your repository declares. A document write cannot touch the settings files, the lock file or the workflows. A change holds at most 20 documents, each at most 1 MiB.

If someone else changed the main branch after you started, the API refuses with the live head instead of overwriting. Edits to different lines are merged for you. Where the same lines were edited, the browser shows three versions of the file: yours, theirs and the common starting point. Per field you keep yours or theirs, and overlapping body edits keep both sides with markers. The server never merges text and never writes conflict markers into a repository.

## Publish: merged, built and deployed in your repository

By default, publish merges that pull request through the Galascribe GitHub App, and there is no review step. Both are per-site settings. A site can require a review, in which case a reviewer approves first and the merge follows approval; it can also leave the merge to you in GitHub. After the merge, one deploy runs for the resulting main head.

The deploy is the publish workflow, which runs in your repository, not on our servers. Your site repository holds the settings files, a lock file that pins the template and publisher versions and records the theme, and the publish workflow file itself, which calls a pinned version of the publish tool. It builds the site from your files and deploys it to GitHub Pages, which repository set-up enables with the workflow build type. When it finishes, the workflow reports a receipt back to us.

A receipt says the workflow ran. It does not yet say your visitors are being served the result.

## What "live" means

After the receipt, the deployment is in a state we call verifying, and a durable job checks the public site. It fetches a small marker file the build published, from the origins recorded on the deployment, never from an address supplied at check time, and compares three values with the ones we certified: artifact id, artifact digest and generation id. A match makes the deployment verified, and only then does the app say "live". If the site still serves the predecessor's digest, it is propagating and we try again with growing delays for about two minutes. If it serves anything else, we record a mismatch and never mark it verified. After the retries the deployment is marked degraded, and a reconcile, which the app now runs for you, can start the check again.

Because the API fetches from an address a person chose, the fetch is restrictive. It uses https on port 443, refuses any address that is not globally reachable, connects to the address it vetted, sends no credentials, follows at most three redirects within the same origin, and reads at most 64 KiB.

Two limits, stated plainly. This is the first of three tiers in the design; checks of critical routes and of the whole inventory are not built today. And the design document records why the check exists: when it was written, nothing in production code ever moved a deployment to verified, and tests set that state by writing to the database.

## One thing that broke

The cause recorded in our content-journey incident review was a single mismatch. A proposed version of a post is addressed by a revision, and the contract carries that revision in a tagged wire form. The admission check against the database compared it without normalising it first, so the two disagreed about the same revision. On the wire a revision is written `sha1:` followed by the 40 hexadecimal characters of a git object id.

The review's checklist runs in this order. We reproduced the mismatch with a failing API test, then made the API normalise the revision before database admission while keeping the tagged value on the wire. Nineteen targeted API document and asset tests passed, with formatting and style checks, and 183 browser checks across the source, content, review, release and publish journeys passed, at desktop and mobile widths where applicable. The fixed API image was promoted to production, and the image being served and an API canary were verified. One item was still open when the review was written: a signed-in person clicking the proposed-version link in production, which needs a real user session.

If you want to try the path yourself, the start flow is at https://app.galascribe.com/
