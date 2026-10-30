---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740c-9f8a-7d39-b935-0c95bb0e2e7c
kind: article
title: A green deploy with every secret empty
description: A deploy migrated, promoted and reported SUCCESS with seven credentials empty. Now every required name is checked at once, before anything is written.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- deploys
- secrets
- github-actions
- incidents
status: draft
publishAfter: '2027-02-12'
createdAt: '2026-10-25T17:12:26.000Z'
slug: a-green-deploy-with-every-secret-empty
redirects: []
listen:
  audio: assets/listen/a-green-deploy-with-every-secret-empty.mp3
  durationSeconds: 399
  format: conversation
extensions: {}
---

In the small hours of 2026-09-25 (Pacific time) production went live: the API was serving and the frontend loaded. The deploy had migrated the database, promoted the container and reported SUCCESS. Then a person opened the site in a browser and was told "This capability is not available". The product was unusable, and every light in our pipeline was green.

## Seven values, one wrong place

The API needs seven values to talk to GitHub. We had set all seven on the GitHub Environment of the infrastructure code's repository. We had not set them on the API's repository, and the API's is the one that is read.

The reason is how reusable workflows resolve secrets. The deploy workflow lives with the infrastructure code, but the API calls it with `secrets: inherit`. Every `secrets.*` and `vars.*` reference inside it therefore resolves against the calling repository's environment of that name. The values we had so carefully entered were in the wrong place, so each one arrived as an empty string. The script that assembles the secrets file wrote them as empty `NAME=` lines, and nothing downstream objected.

Nothing objected because the API tolerates a missing GitHub App identity by design. The configuration binds each value through a placeholder with an empty default, the identity object returns null rather than refusing to start, and the signer only raises a "configuration unavailable" error at the moment someone tries to mint a token. Nothing crashes. App installation, token minting and webhook ingestion simply become permanently, silently unavailable. The OAuth client is the exception: it throws as soon as either of its values is blank, and that was the live incident.

So a deploy can pass a health check and still ship a product that cannot do its job. Our readiness probe asked "does the process answer?", not "can it do what it exists for?".

## Check everything at once, and check what the product needs

The fix, committed that same night, moved the check to the first moment we could do it. The script now verifies a list of required names before it writes a single byte of the secrets file, calls the key escrow or opens an SSH connection. The list is the three database role passwords plus six GitHub values. Three properties of it are the part worth copying:

- **All at once.** One failed run reports every empty name. The alternative is a full deploy per name, each one rediscovering the next.
- **The list is what the product needs, not what the assembly step needs.** This is the commit's own phrase: "that distinction is the whole point". The assembly step would happily write a blank. Only knowing that the API tolerates a blank GitHub App identity, and why that is dangerous, puts those names on the list.
- **The message names the repository and the environment.** Inside a reusable workflow, `GITHUB_REPOSITORY` is the calling repository. A message saying only "GH_APP_ID is empty" is what had sent someone to the infrastructure code's environment settings, where the value was already correctly set. The error now says which repository and which environment the value belongs in.

Optional names stay optional, but they are omitted rather than sent empty. That sounds like a nicety and it is not, which we had learned earlier that night.

## Empty is not absent

On 2026-09-24 an optional name with no value was emitted as `API_CREDENTIAL_KEK_VERSION=`, and it reached the container as a set-but-empty variable. A Spring placeholder default applies only to an absent variable, so the empty string won, the integer setting could not be bound, and the process exited before opening a listener. We reproduced it against the production image: the empty value "dies in bean creation", while the same image with the name omitted "starts in 4.2s and answers 200" on the readiness path.

Between that and the secrets incident, the rule we ended up with is short: treat empty as missing for anything required, and omit anything optional rather than sending it blank. Both halves matter. Treating an empty required value as present gave us the silent outage. Treating an empty optional value as present killed a container.

The same probe taught us a smaller lesson. The deploy's probe script wrote nothing at all to stderr when the connection failed, so the deploy's last-probe block "printed nothing for 120 attempts". It now prints the URL it dialled and redacted unit diagnostics. If a gate can fail without saying why, it will fail at the worst time.

## A key file that never existed

A related mistake from 2026-09-23 belongs here only briefly. The host script read the credential encryption key from a file that our own documentation said "an out-of-band custody step" would place. No such step existed anywhere, and the host accepts only a closed set of deploy verbs, so there was no channel through which it could have been placed. Every server failed closed from the day that script shipped. Another document claimed the file was provisioned at first boot, also never true. We replaced it with an escrow: the key is generated once, stored with server-side encryption in an object bucket, restored byte for byte on every deploy and never regenerated, because data encrypted under it outlives any server.

Its sequel is a reminder that fixing the delivery does not fix the format. A later change started requiring the escrowed object to be a wrapped JSON envelope, and did not account for the production object, which had been written in the older plain format three days before the change shipped. The commit, dated 2026-09-26, says every deploy since the format change had failed closed with `INFRA_KEK_ESCROW_VALUE_INVALID`. Restore now recognises that exact legacy shape, keeps a backup copy, re-wraps the same bytes, reads the result back and logs the migration once. Anything that is neither shape still fails as before.

How long the site was unusable, and whether any user saw it, is not stated in our records.

If your pipeline passes secrets into a reusable workflow, list the names your product cannot work without, in one place, and fail the deploy before the first side effect if any is empty. Make the message say which repository and environment to fix. Then add a check that exercises the capability, not just the process, so the next gap shows up in your pipeline instead of in front of a person.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
