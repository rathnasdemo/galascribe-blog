---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740d-15e2-7f4c-9cda-fb5889a75091
kind: article
title: 'Sixty-four kilobytes: the boot script that kept hitting a hard limit'
description: A server's boot configuration rendered at 154,212 bytes against a 65,536-byte cap. We compressed it twice before moving it out and fixing what replaced servers.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- cloud-init
- infrastructure
- limits
- terraform
status: draft
publishAfter: '2027-03-26'
createdAt: '2026-10-25T17:12:57.000Z'
slug: sixty-four-kilobytes-the-boot-script-that-kept-hitting-a-hard-limit
redirects: []
listen:
  audio: assets/listen/sixty-four-kilobytes-the-boot-script-that-kept-hitting-a-hard-limit.mp3
  durationSeconds: 407
  format: conversation
extensions: {}
---

On 2026-09-22 our production boot configuration rendered at 154,212 bytes. Our host provider rejects anything above 65,536 bytes of user data, a hard limit. Three days later production sat at 65,028 bytes, 508 under the cap, and the provider rejects a create above the cap with an HTTP 422, as a cited run showed. In between we had shrunk the thing twice, and each time it grew back to the wall.

## Why it was big

A new server is configured by cloud-init, which reads a document handed over at creation time: user data. We had put everything the server needs in that document. Every deploy script, the backup entry points and their library modules were embedded as files, each with its owner, mode and content. That is a sensible way to build the first version, because the document is the whole truth about the machine and one file renders it. It also meant that every script we added to the repository made the boot document bigger.

The first fix, on 2026-09-22, was the obvious one. Cloud-init's native encoding is gzip plus base64 per file, and that only got us to 78,413 bytes, still over, because compressing files one at a time cannot exploit how similar the scripts are. So we bundled every static script into one archive, compressed it once with Brotli so the whole bundle shared a dictionary, and embedded the base64 of that. The measured result was 56,840 bytes, "comfortably under the limit". A first-boot step decodes, decompresses and extracts it, restoring each file's bytes, ownership and mode.

## Compression bought two days

On 2026-09-24 we added a seventh privileged deploy verb, to install the registry credential. That pushed the render to 65,447 bytes: 89 under the cap on our staging fixture, and over it once production's slightly larger manifest was applied, so droplet creation would have failed outright. The bundle accounted for 49,260 of those bytes, three quarters of the document.

The scripts are heavily commented, for the people who read the repository. So the second fix stripped comments and blank lines from a copy of each script for the bundle only, taking care with heredoc bodies and with linter and scanner directives, and leaving the checked-in sources untouched. The render dropped to 52,919 bytes against our staging test fixture and the bundle from 49,260 to 36,732, which the commit counts as 12,617 bytes of headroom.

The headroom did not last. Three hours later an unrelated commit about SSH recovery recorded the rendered document at 53,641 bytes: 722 bytes larger already. This is the nature of a limit you fix by compressing. The thing that is growing keeps growing, and you have bought a number of commits, not a different outcome.

The check that worried us was not the staging fixture. By 2026-09-25 the production document rendered at 65,028 bytes, of which the Brotli bundle alone was 42,940. The commit cites the 422 and says the next droplet-side change "would have made production uncreatable". Production is bigger than staging because it renders with its full manifest and a full-size certificate authority bundle, which is why we kept being surprised by it.

## Remove the thing that grows

The change we should have made on the first day moved the bundle out of user data. It is now an object in a dedicated storage bucket, named by its own SHA-256 digest. The digest is computed from the very bytes uploaded, and the user data carries the digest and the step that fetches and checks it. The bucket is private and HTTPS-only. The object is publicly readable, because first boot has no storage credential and must not be given one, and the bundle is non-secret code that is checked into the repository anyway.

That makes the fetch a security control, because the bundle runs as root. After download, first boot runs `sha256sum --check --strict` against the rendered digest and only then decompresses and extracts. We put the fetch inside the same EXIT-trap window that restores SSH, so an unreachable object or a wrong digest leaves a server a person can log into, with every deploy verb failing closed and no completion marker written. We booted all three paths, happy, unreachable and wrong digest, in a container running real cloud-init, and the happy path also on a scratch server against a real scratch object.

Production user data now renders at 22,420 bytes. The size guard in our tests moved to its real line, 49,152 bytes, measured in bytes against the production manifest, and it prints every file's size when it trips. The scripts no longer count against the limit at all.

## The second problem was the same shape

Separate from size, there was a second defect in how the same document was used. Any change to the environment manifest, even a flag that nothing on the server reads, changed the user data, and a changed user data replaced the production droplet. Two production infrastructure runs did exactly that; the fix commit cites both and is dated 2026-09-26. The second of them was caused purely by toggling an option about the origin certificate. The module embedded the whole manifest into user data, so an unrelated setting was a reason to destroy and rebuild a machine, with a new host key and a deploy that then had to learn the key.

The fix mirrors the size fix. Everything that feeds the script had also decided "replace this machine". Now replacement is decided from a digest of host identity alone: the base image, region, size, network, SSH keys and the bundle's own digest. Changes to user data itself are ignored by the droplet resource. Tests prove that a runtime-only toggle and an unrelated manifest field leave the digest untouched, and that a base image or bundle change still moves it. The release also records the droplet's id before and after its own apply, and logs `INFRA_HOST_KEY_ROTATED_BY_REPLACEMENT` with the old and new ids when it authorises a new host key on that evidence. Previously a force flag had to be set by hand after a replacement, though that was already partly self-healing.

How many servers were replaced across the whole period, and what that cost, is not stated in our records. The commits cite two production runs.

Look at the size of your user data or equivalent boot payload today, and at how much it grows per commit. If it is within a factor of two of the cap, do not compress it again: move the payload out, fetch it by content hash and verify before running. Then look at what your infrastructure tool considers a reason to replace a machine, and make sure the answer is a short list you chose, not everything that happens to be rendered into the machine.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
