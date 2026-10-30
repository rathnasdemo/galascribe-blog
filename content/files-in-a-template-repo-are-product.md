---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740c-9f8f-7729-b186-5ff99f69a280
kind: article
title: Files in a template repo are product
description: On 2026-10-23 an 82-line CI workflow added to our user template broke repository set-up, because the API copies template files into every new site.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- templates
- ci
- github
- incidents
status: draft
publishAfter: '2027-04-02'
createdAt: '2026-10-25T17:12:26.000Z'
slug: files-in-a-template-repo-are-product
redirects: []
listen:
  audio: assets/listen/files-in-a-template-repo-are-product.mp3
  durationSeconds: 344
  format: conversation
extensions: {}
---

At 06:52 Pacific on 2026-10-23 we added a CI workflow to our user template, so that the template would be checked against the publish toolchain it pins. At 07:03 we removed it. The subject line of the removal commit is long enough to be the whole post: the API copies every template file outside the template's own tooling directory into sites, and refuses any `.github` path except the caller, "so it broke repository set-up".

We had treated a file in a repository as tooling. For this repository, that was the wrong category.

## What the template is

When someone sets up a Galascribe site, the API creates a new repository for them from our user template. The template holds the caller workflow that runs the publish toolchain and the lock file that records the adapter and schema versions the site builds against, among other files. The API does not clone the template wholesale. It copies the files, and it applies two rules we wrote on purpose: everything outside the template's own tooling directory is copied into the new site, and of everything under `.github`, only the caller workflow is allowed.

So the caller is the one workflow a new site may have. Anything else under `.github` is refused, and a refusal during set-up means set-up fails.

## The eleven minutes

The workflow we added was named verify. It started at 68 lines and was 82 by the time we removed it, and it sat under the template's `.github/workflows`, and it checked the caller, the lock and the pinned toolchain against each other. Its header comment says it runs only in the template repository, "never in sites created from it", and the job carries a condition on the repository name to make that true. That guard stops the workflow from running in a customer's repository. It does nothing about the file arriving there, and the API's refusal is about the path. It was a sensible thing to want: the template, the caller and the lock all have to agree with each other, and a failed pin is cheaper to find in the template's own CI than in a customer's first publish.

What it did, step by step: on a push to main or a pull request it read the pinned toolchain commit out of the caller, checked out the toolchain at exactly that commit, and fetched the toolchain's current documentation copy of the caller from its main branch, refusing to continue if the pin was not an ancestor of main. It then installed the toolchain, laid out the schema package, the template and the default theme the way the template's own verifier expects, and ran that verifier. One check, the comparison against the API's import fixture, needs the API's code, which is private, so the first commit made it report SKIP in CI and left it enforced in local runs. The second commit, a minute later, compared the caller with the documentation copy on main because the pinned toolchain predates that copy.

The sequence in the commit history, all on 2026-10-23:

| Time (Pacific) | Change |
|---|---|
| 06:52 | Add the CI workflow |
| 06:53 | Adjust it to compare the caller with the publish toolchain's documentation copy, because the pinned toolchain predates it |
| 07:03 | Remove it: it "broke repository set-up" |
| 08:20 | Restore it, in the same commit that pins the caller to a new toolchain commit and locks the Pages adapter at 0.1.2 |

We do not have a record of how long the window of failed set-ups was, how many were affected, or whether any live user hit it. The commit timestamps cover when the file was in the template, not when someone tried to use the template. The removal message states a cause; our records do not include the failing request.

## The restore we cannot fully explain

The 08:20 commit says the workflow "is restored exactly as it was" at the second commit, and the diff stat shows 82 added lines under the workflows directory. It does not say how that file stops tripping the rule. As of 2026-10-25 the file is in the template's tree, next to the caller. The commit that put it back is a pin update with a longer body about adapter 0.1.2, and nothing in it describes a change to the copy rule or a move of the file.

We would rather say that than guess. What we can say is what happened next: the pin has moved twice more since the restore (to adapter 0.1.3 the same night, and to a later toolchain with schemas 3.19.0 the next day), which is the kind of change this workflow exists to check. The template's history does not tell us whether the API's rule changed elsewhere or whether set-up now handles the file some other way. The incident is clear in our records and the resolution is not.

## The lesson, in terms you can apply

A template repository is a product with two audiences. One is the people who maintain it. The other is every user whose repository is created from it. A file in the template is not tooling unless something stops it from reaching the second audience. Everything that lands in a customer's repository is something we have shipped to them, and their next push builds on it.

That gives you three checks before you add anything to a template:

1. Find the copy rule. Which paths does the generator carry over, and which does it skip? Ours skips the template's tooling directory. Put maintainers' tooling there.
2. Find the refusal rules. A generator that refuses certain paths, like workflow files it did not write, will refuse your addition for you, loudly or not.
3. Run set-up from the template as the last step of your change, before you merge, with the file included.

The first of those would have been enough. The CI we wanted for the template can live in the tooling directory, or in the publish toolchain's repository, aimed at the template. Neither puts a file in a customer's repository.

To set up a site of your own, the start flow is at https://app.galascribe.com/
