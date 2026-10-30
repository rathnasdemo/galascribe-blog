---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740c-9f89-714b-8a37-73481182698b
kind: article
title: A cache key must include the judge
description: Our checks cache keyed on the draft, not the code that judged it, so fixing a check changed nothing; the key now includes the judge.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- caching
- testing
- incidents
- build-in-public
status: draft
publishAfter: '2027-03-21'
createdAt: '2026-10-25T17:12:26.000Z'
slug: a-cache-key-must-include-the-judge
redirects: []
listen:
  audio: assets/listen/a-cache-key-must-include-the-judge.mp3
  durationSeconds: 366
  format: conversation
extensions: {}
---

On 2026-10-22 we noticed that fixing a check in the outreach tool would not change a single verdict we had already cached. A draft the old check had judged would keep the old verdict, because the cache had no way to learn that the check had been rewritten. This post is about that cache: three commits in three days, each fixing a different hole in the same key.

We have told the first half of a related story, the cached failure from a broken environment, in We pre-built 23 websites nobody had asked for. This is the rest: why the key was wrong in the first place, how we widened it twice, and what we still do not protect.

## What was cached, and under what key

The outreach tool turns a creator's video into a draft article and then runs a set of checks on the draft: front matter, links, numbers that appear in the article but not in the transcript, summary rules, and so on. The checks cost no model call, as a comment in the first fix notes. The expensive step is the model that writes the draft; the checks are cheap and deterministic.

Each step of the run is cached under a hash of its inputs, so that a re-run skips work that has already been done. For the checks step the inputs were the draft, the transcript, the faithfulness result and the checks settings. That looks complete, and it is the mistake. Those are the things being judged. The thing doing the judging, the code of the checks themselves, was not in the key.

So when we fixed a check, the key for every already-checked draft was unchanged, and the old verdict came straight back. The fix was real and the output was identical to before it. Anyone who has debugged a "fix that does nothing" knows how long it takes to suspect the cache last.

## Two holes in the digest

The first hole was the checks module itself. The commit of 2026-10-22 at 10:10 added a constant to the checks module: the first 16 hexadecimal characters of a SHA-256 of the module's own source, computed when the module loads. That value went into the inputs of the checks step beside the draft and the settings. Any edit to the module changes the digest, the key changes, and every cached verdict is recomputed. Since the checks are free, recomputing everything is the right trade.

A test pins the constant to a recomputation from the file, so the digest cannot be quietly replaced by a literal.

The second hole was the file next door. The next day, 2026-10-23 at 13:27, we found the digest covered one file and the judging was done by two. The TL;DR and meta-description checks apply rules that live in a separate summaries module, so an edit to those rules left the key untouched. The fix replaced the single-file digest with a function that hashes a list of named source files, each by name and bytes in order, and put both files on the list. A new test builds two temporary copies of the files and checks that changing the second one changes the digest.

This is the same bug as the first one, found a day later, and it came from the same cause: we had decided what the judge was by looking at where the function was defined, not at what it called. The list is written by hand. If a third file ever starts deciding what passes, nothing will tell us to add it. We have not solved that; we have only made the list explicit, so there is a place to add to it.

## Third hole: a failure is not a verdict

The third commit, on 2026-10-24 at 17:11, is about the other half of a cache: what you are willing to store. A check that ran where the site's node modules were missing failed with an error about the machine. The tool cached check results by the draft's text, so it wrote that result to the cache, and, in the commit's words, that failure poisoned every later run of the same article.

The fix has three parts. When a cached result's failed checks name a machine failure, the tool deletes the cached result and its inputs file, logs that the cached result named a machine failure and was cleared, and checks the draft once more. If the second attempt passes, the run carries on. If it fails with a machine failure again, the run stops with the remedy in the message: run the install step in the site folder, and nothing more is tried that night. Failures that belong to the article, a bad link or an invented number, are still kept and still shown to the writer.

The distinction is the point. A verdict on the text is a fact about the text and can live as long as the text and the judge are unchanged. A failure of the environment is a fact about the machine at that moment, and it expires the moment the machine changes.

## A short test for any cache key

Before you add a cache, list everything that can change the answer, then ask three questions.

1. Is the code that computes the answer in the key? A digest of its source is cheap. If the code comes from a library, put the library's version in the key.
2. Is the configuration in the key? We had this one. Settings were in from the start.
3. Can an error get stored? If a failure can come from the environment, do not store it, or store it with a time limit and a reason so it can be told apart from a verdict.

Then write the test that proves each one: change the code, change the settings, break the environment, and confirm the key moved or the result was not kept. Two of ours, the digest of the checks module and of the summary rules, have such a test. How many nights or articles the stale verdicts affected is not stated in our records.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
