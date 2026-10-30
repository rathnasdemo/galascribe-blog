---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740c-9f87-784e-8ae4-f464e4236ac9
kind: article
title: 93 copies, 13 had drifted
description: We found 93 schema definitions copy-pasted across 20 files, 13 of them no longer identical; a build gate now fails when two copies of a name differ.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- schemas
- testing
- validation
- build-in-public
status: draft
publishAfter: '2027-04-16'
createdAt: '2026-10-25T17:12:26.000Z'
slug: 93-copies-13-had-drifted
redirects: []
listen:
  audio: assets/listen/93-copies-13-had-drifted.mp3
  durationSeconds: 364
  format: conversation
extensions: {}
---

On 2026-09-25 we counted a number we did not like in our schema package: 93 definition names copy-pasted across the 20 schema files in the package, and nothing that checked the copies still agreed. We wrote the check that day. It found that 13 of the 93 had already drifted apart under the same name.

The schema package is the shared contract between our API, the App and the publish toolchain: the shapes of a site's configuration, a build record, a deployment record. Each schema file is generated from sources and carries its own set of reusable definitions. A name such as `positiveInt64` appears in several files, and a reader assumes it means the same thing in all of them. That assumption was the thing nobody had tested.

## What the 13 looked like

The commit message sorts them into two groups, and the sorting is the useful part.

**Accidental drift, reconciled to one body.** The worst was `positiveInt64`, with its sibling `githubPositiveDecimal`. The name means a number that fits in a 64-bit integer. Six of the seven files that defined it had no upper bound at all; only the adapter capability file had the bound. In those six places the definition set no ceiling of its own. A base URL in the same file had no length cap, while the deployment files capped it at 2048 bytes. The rule "a repository name is not `.` or `..`" was written with two different regular expressions in different files. Four more differed only in wording, one of them with a redundant `type: array`. Two navigation definitions carried empty `properties` stubs and wrote "no children" as `maxItems: 0` against `const: []`. Same outcome, but a different diagnostic code for the same violation depending on which file caught it.

**Deliberate divergence, given its own name.** Some copies differed for a real reason that nobody had ever written down. The build-input file lists adapters as a closed set of three, which is correct for what an author may configure, while the capability and record files stay open, since a future adapter is a fact for a record and not a choice for an author. Two copies shared a name and meant different things. The fix was to rename the build-input one `authoredAdapterIdentity`. The same happened with the render-policy identity: the manifest family pins its name to a constant, and the deployment record family accepts any label. They became separate manifest and record names.

Reconciling the render-policy identity exposed the second divergence, one level up and with the same shape, in the build-record definition that wraps it. The new gate caught it in the same sitting.

## The gate

The check is a script that groups every file's definitions by name and fails the build if any name has more than one distinct body. It is wired into the package's build and into the fast gate of continuous integration. It is not a clever check. It groups and compares, and the cost of not having had it was 13 differences that nothing flagged.

Two decisions in the fix are worth copying. First, we fixed the generator sources and not the generated JSON. The files in the repository are output, so editing them by hand would have been undone at the next build. Second, we did not rename our way out of every difference. A name that means two things gets two names, and a name that means one thing gets one body.

The change regenerated everything downstream: the fixture corpus went from 833 to 842 files, and the diagnostic map, the generated Java, TypeScript and browser code, the OpenAPI document and the schema inventory were rebuilt. We updated the hand-written byte-hash pins and the tests that had asserted the old shapes, each with a comment saying what changed and why. The full build passed, along with all 348 unit tests and the 842 fixtures, and none of the tightened bounds rejected any committed fixture or example. The commit describes it as tightening validation, not a behaviour change any real document would notice. We have no record of the drift reaching production, and the commit cites no incident.

## The same day, a related find

An earlier commit that day (2026-09-25, 17:29 Pacific) made three fixes to the validator core, and two of them show what the drift could have cost.

The range keyword `x-gala-maximum` returned a pass for any value it could not evaluate as a non-negative whole number: values of the wrong type, strings that were not decimal, anything the integer parser refused. The package's README describes it as fail-closed, and a range assertion that waves through what it cannot read is the opposite. The commit says why this mattered: the pass-through assumed a companion pattern or format keyword would catch bad input, and that assumption breaks when the definitions have drifted. It now rejects what it cannot evaluate.

The third fix concerned a rule that had no entry in the committed diagnostic map. The validator threw an exception on that path, and the same function sits on live request paths in the API and the App. If the map ever fell out of step with the compiled schemas, through a stale package or a partial upgrade, an ordinary invalid input would have come back as an uncaught error and not as a normal "invalid" answer. It now falls back to a stable code with its own remediation text. The commit also replaced a hard-coded slice of a version suffix off every schema identifier with a real parse of the identifier, so a schema at any other version cannot silently yield the wrong contract name.

None of this was the drift itself. It is what we found while looking at the same package that day, and it is the same family of fault: a check that quietly passes, or a name that quietly means two things.

## Use it

If you copy a definition between files, whether it is a schema type, a regular expression or a constant, add the test that proves the copies are still equal on the same day, not when someone next notices. If the language lets you define it once and reference it, do that instead. If two copies must differ, make the difference visible in the name.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
