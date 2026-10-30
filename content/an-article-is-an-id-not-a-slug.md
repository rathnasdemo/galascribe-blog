---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a17138-2dc6-73de-a6e0-6cbd9bca03b8
kind: article
title: An article is an ID, not a slug
description: Likes and comments attach to a UUIDv7 in each post's front matter, not to its URL, so renaming a post or moving a site leaves them where they are.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- identity
- front-matter
- urls
- redirects
status: draft
publishAfter: '2027-01-08'
createdAt: '2026-10-25T04:01:09.000Z'
slug: an-article-is-an-id-not-a-slug
redirects: []
listen:
  audio: assets/listen/an-article-is-an-id-not-a-slug.mp3
  durationSeconds: 357
  format: conversation
extensions: {}
---

Rename a post on a Galascribe site and its address changes, but its likes and comments stay where they were, because they never belonged to the address. They belong to an ID stamped into the post's front matter. We decided that in ADR-006, one of the decision records for the first version of Galascribe, dated 2026-08-09. The second version's design, in a snapshot dated 2026-09-09, kept the decision while changing nearly everything around it.

## What the first version decided

The record is short. Comments, reactions, follows and statistics must bind to an article that survives renames and language variants. So a ULID is stamped into the front matter when the post is created, never regenerated, and it is the key the API uses. We rejected two alternatives. The slug as key is readable, but a rename orphans every attached record. A composite of site, slug and language has the same fragility, and language variants would split the engagement across what is one article.

The consequences section listed what we gained: renames, folder moves and language variants are safe, and so would be a future hosting migration. The model separated one identity row per article from one row per language variant, with comments shared across languages and view statistics keeping the language as a dimension. A rename was not a deletion followed by a creation; our requirements said that the same ULID with a changed derived slug is a rename. A post written by hand without an ID got one assigned and committed on the first build.

## What the second version kept, and changed

The rule survived. Three details moved.

The ID became a UUIDv7, in lowercase, required in the front matter of every article, page and edition. The schema describes it as immutable once published and says its time ordering carries no meaning about chronology or authority. The database follows the same choice: native UUID columns with application-generated UUIDv7 keys, and ULID text accepted only at explicitly versioned compatibility edges.

The ID is now supplied up front. In the first version the build assigned a missing one. In the second, `id` is in the schema's required list, so a file without one fails validation, and the README in the repository template that new sites start from says what to put after `id:`, a stable id that you do not change once published.

And the slug became a property with a history. The front matter carries a `slug`, in lowercase letters, digits and hyphens up to 80 characters, and a `redirects` list of up to 32 old routes. In the app, changing the address of a published post shows "The old address will redirect", and on save the old route is appended to `redirects`, without duplicates. At build time each old route gets a small HTML page that refreshes to the current address and carries a canonical link to it.

That is weaker than a server redirect. The old address answers with an ordinary page that moves the browser on, and the renderer records that page's status as 200. The cap of 32 is per post. A validator also checks routes and redirects against each other, and a document or redirect at `/terms` or `/privacy` fails the build.

We tested a rename on a live post, starting on 2026-10-14. It failed in the first QA run and again in the second, and passed in the fourth. In the first, reopening a published post from a device draft lost track of the post's live copy, so the redirect note, the redirects and the updated time were skipped. The second run still failed: our first fix missed the real reopen path, and the rename then stalled because our test stand-in for GitHub could not apply a deletion, while the app called the slow commit "offline". The fourth run showed the redirect note, the `redirects` entry and the updated time, and a second publish went out.

## What hangs off the ID

The public endpoints that read and write a post's reactions and comments are addressed by two identifiers: a publication ID and a content ID. The reactions table is keyed by publication, content ID, reader and reaction. Comments carry the content ID. Each built article carries both IDs as data attributes, the content ID being the one from its front matter, so the page script never needs to know its own URL to ask for its likes. The totals an author sees in the app come back grouped by content ID as well.

So a rename moves nothing in the database, and neither does a change of address. Our code survey for handing a site to its creator, written on 2026-10-15, records that likes and comments are keyed by publication and content IDs, not URLs, so no data migration is needed. The same survey names one catch: reader sign-in works on the new address only after one verified publish there, because the return address must match the newest verified deployment.

## What it costs

The price is a second identifier in every file. The address is for readers and the ID is for machines, and a person writing by hand has to supply a UUIDv7 where the first version would have stamped one on for them. Copying a post file to start another copies its ID, and the README in a new site repository does suggest copying an example. Give the copy a new `id` as well as a new `slug`: two files with one ID would share one set of likes and comments.

If you are building anything that attaches data to pages, such as comments, counts or bookmarks, mint an identifier once, store it with the content, and keep the URL as a mutable property with a recorded history. If you write on Galascribe by hand, change `id` and `slug` together when you copy a post, and add the old address to `redirects` when you rename a published one, or let the app do it. The start flow is at https://app.galascribe.com/
