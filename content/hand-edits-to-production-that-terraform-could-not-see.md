---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740c-9f90-7dee-8c1f-ed1c01a70c95
kind: article
title: Hand edits to production that Terraform could not see
description: A registry, an IP and six DNS records existed outside Terraform state, and a manual apply hit permissions it never should have tried. How we adopted them.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- terraform
- infrastructure
- dns
- incidents
status: draft
publishAfter: '2027-04-11'
createdAt: '2026-10-25T17:12:26.000Z'
slug: hand-edits-to-production-that-terraform-could-not-see
redirects: []
listen:
  audio: assets/listen/hand-edits-to-production-that-terraform-could-not-see.mp3
  durationSeconds: 380
  format: conversation
extensions: {}
---

By 2026-09-25 a production apply had tried to create six DNS records that already existed, and Cloudflare refused all six as duplicates. We had made them ourselves, by hand. The tool that manages production did not know they were there.

This was the third time in four days that production held something our infrastructure code had no record of. We handled the first two one at a time, and only on the third did we write the adoption as a pattern.

## Three things that existed already

Our infrastructure is described in OpenTofu, a Terraform-compatible tool. Its idea of the world is a state file. If a resource is in the state, the tool manages it. If the resource exists but is not in the state, the tool will try to create it, and the provider will either refuse or make a duplicate.

**The registry.** On 2026-09-22, before the first real production apply, we noticed that our host provider allows exactly one container registry per account and that production's account already had one. The first apply would have failed trying to create a second. We added an import block that adopts the existing registry, gated so it fires only for the production environment in live activation mode. That gate matters: staging, recovery and local environments do not provision a registry, and an import block that fires there would be wrong.

**The reserved IP.** The same day, a run created the production droplet and then failed on the reserved IP with a provider-side "inconsistent result after apply" error. The owner checked the provider's console: the address existed and was assigned to the droplet, but it was never recorded in state. The commit calls it "real but orphaned". A plain re-apply would have tried to create a second address. Reading the rest of the log showed the droplet and the database firewall had completed and been recorded, and the DNS records had never started, because they depend on the IP. We wrote a second adoption module on the same pattern, with the address kept as optional environment data rather than a literal in code.

**The DNS records.** We deleted production's six records to stop live traffic, and then re-created them by hand from an export. State no longer knew about them, so the next apply tried to create all six and Cloudflare refused each as a duplicate. This one needed a different kind of module. A DNS record's import id is a hash that Cloudflare assigns, not something we can write in the manifest. So the module reads the live zone through a data source, matches by hostname and record type, and adopts only what already exists. A zone with none of the six records selects nothing, so a brand-new environment is unaffected.

There is a testing wrinkle common to all three. OpenTofu's test framework panics when an import block is exercised, even under a mock provider. We could not test the import itself. So each adoption is split into a small module that does pure selection (which ids to import, in which environment and mode), which we can test, and an import block that we cannot.

## The apply that tried something it was never meant to

Adoption fixed things that were missing from state. The next incident was the opposite: a routine action that tried to change things we had never intended to change in a routine run.

On 2026-09-26 a manual apply from the main branch attempted the module that manages Cloudflare's origin certificate against production. It failed: the certificate request was refused with a 401 and two zone-setting changes with a 403, because our API token lacked the permissions for SSL certificates and zone settings. The cause was not the token. The module's own comment said applying it is an explicit owner action, but the root module wired its `enabled` input to "cloud is enabled", which is true for every cloud environment. A routine apply could never have been intended to run it.

The fix is a manifest flag that defaults to off, so every manifest is closed unless someone opens it, with production and recovery carrying an explicit false. The host-side strict mode that requires the origin certificate now fails plan validation when the flag is off, because that combination is a state no host could recover from except by flipping the flag and applying. We also wrote down the exact token permissions the failed run was missing and the corrected sequence. The partial apply had left a private key and certificate request in state, which are harmless, and the zone's SSL mode untouched on Full.

The general version: when a step needs a human decision, make the human decision a switch in the data, not a comment in the code. A comment that says "do not apply this routinely" does not stop a routine apply.

## The public canary that failed good deployments

The last item belongs to the same family, though no one edited anything by hand. Our deploy ends with a canary that polls the public hostname. Cloudflare's bot protection, on the Free plan where the setting cannot be exempted, blocks GitHub-hosted runners, so the canary failed good deployments with `INFRA_API_DEPLOY_PUBLIC_CANARY_NOT_READY`, and printed nothing about what it had seen.

The canary now logs each failed attempt, rate-limited to one every 30 seconds, and the final status and body on timeout. It also has a new outcome: edge-blocked runner. We are careful about what counts. Cloudflare sets `Server: cloudflare` on every proxied response, so that header alone is not evidence. The response must be a 403 or 503 with that header and either a mitigation header or a challenge marker in the body. If every attempt was an edge block, the step succeeds with a warning, because the host's own gate has already confirmed the promotion from inside. Any other terminal outcome still fails.

## What the bill looked like

The failed applies are cited by run number in three commits. How many deploys were delayed, how long, and whether the traffic we stopped was real users, are not stated in our records.

If you have ever fixed production by hand, you have a list like ours. Start with what the state does not contain: list the resources in the provider's console against the resources in state. Then, for each difference, decide whether to adopt, delete or document it, and write the decision in a commit. Finally, find every apply that can be triggered by someone who is not thinking about production, and put anything that needs a human behind an explicit switch that defaults off.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
