---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740c-9f8b-7e85-98c6-166acc16f2e6
kind: article
title: Back resurrects a dead button
description: Pressing Back from GitHub restores our page frozen in its leaving state; one small hook listening for a persisted pageshow event now resets it.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- browser
- frontend
- bfcache
- incidents
status: draft
publishAfter: '2027-04-23'
createdAt: '2026-10-25T17:12:26.000Z'
slug: back-resurrects-a-dead-button
redirects: []
extensions: {}
---

A person clicks Connect GitHub in the App, lands on GitHub, changes their mind, and presses the browser's Back button. They arrive on our page and the button is still there, greyed out, still saying it is working. Nothing is happening. The only way out is to reload the page.

We fixed it on 2026-10-13, in two commits three minutes apart (09:09 and 09:12, Pacific). The fix is short. What is worth writing down is why a page can come back from the dead, and how far the same fault reached once we looked for it.

## What the browser does

Modern browsers keep a page you navigate away from in a back/forward cache. Press Back and the browser does not rebuild the page. It restores it from memory exactly as it was: the JavaScript heap, the React state and the DOM, with the button still disabled.

That is a good feature for a content page and a trap for a page that hands the person to a third party. Our Connect GitHub step sets a "leaving" state when the person clicks, which disables the button, and expects the person to come back by a fresh load of the page after GitHub redirects. Back is a second way to arrive, and it does not reload anything. Our own commit message puts it plainly: a page restored from the cache keeps its starting state, so reset it on `pageshow` with `persisted`.

The comment on the hook we wrote says the same thing: `pageshow` with `persisted === true` is the only signal browsers give for that case, and a normal load mounts fresh state and never fires it.

## A hook, and where it was needed

The first commit (09:09) added a small React hook, `useRestoredPage`, 23 lines. It listens for `pageshow` on the window and calls a function only when the event's `persisted` flag is true. It takes an `active` flag, so a page listens only while it is in the state that needs recovering. The commit then used it in every place that sent the person away: the editor's hand-off, the publish and restore confirmations, the invitation sign-in, the reader connect page, the sign-in view and the site reconnect flow. It changed 18 files, about half of them tests, to fix one symptom on one screen and the same fault on its siblings. The hook's own tests cover the edges: it ignores an ordinary `pageshow`, does not subscribe while inactive, uses the newest callback after a re-render and stops listening on unmount.

The tests have the same shape. Click the button, check that it is disabled, dispatch a `pageshow` event with `persisted` set, check the button is enabled again, click it and check that the action ran a second time. The test sends a synthetic event. It proves our handler does the right thing when the event arrives. It does not prove that a real browser fires it, and none of the commits we looked at drives a real back-forward cache. We hold that gap openly.

The second commit (09:12) was the Connect GitHub step itself, and it fixed three further things in the same screen.

- On restore, the step goes back to idle and checks again for GitHub installations, so the person sees what is true now and not what was true when they left.
- **Check again** gave no feedback. Someone who clicked it could not tell whether the re-check had run, particularly when the answer was the same as before. The button now disables itself and says it is working while it reads, and when the check comes back empty the screen says so.
- The screen now recommends creating a GitHub organisation just for their sites, with an example name built from their GitHub login plus `-sites` (or `my-sites` when the login is unknown), and adds a line: "After you add it, GitHub brings you back here." The advice is specific. A separate organisation gives Galascribe access to that organisation only, never to personal repositories; choosing All repositories when GitHub asks means every later site is ready with nothing to grant; and a personal account works too, with the caveat that on GitHub Free the Pages site and its files are both public. The link to create an organisation opens in a new tab, because GitHub's page does not send the person back.

On 2026-10-18 the same recovery pattern, with Check again, went into the Move my site flow (it offers the GitHub accounts Galascribe is already installed on).

## The test to run

Any step where the user leaves for a third party and is expected to come back needs two answers: what does the page look like if they return by the link, and what does it look like if they return by Back? The first is the one everyone tests. The second is the one that leaves a button dead.

Three habits follow from what the commits changed. Put any "I am leaving" state behind a flag that the restore handler can clear. Make the handler re-read the truth (here, the GitHub installations) instead of assuming the world is as the person left it. And give every re-check a visible working state, because a button that answers silently looks the same as a button that did nothing.

Do it by hand once: click through to the other site, press Back, and look at the page. If your page disables controls before leaving, it needs a handler.

We do not know how many people met the dead button before we fixed it. The commits do not say, and no user report is cited. That is the reason to press Back yourself before someone writes in.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
