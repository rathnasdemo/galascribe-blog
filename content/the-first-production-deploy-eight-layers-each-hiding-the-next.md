---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a1740d-15e4-72d8-a611-2832c14f4a98
kind: article
title: 'The first production deploy: eight layers, each hiding the next'
description: Our deploy path had only run against fakes, so the first real run found eight defects one at a time; a disposable production-shaped droplet stopped the cycle.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- deploys
- infrastructure
- testing
- incidents
status: draft
publishAfter: '2027-02-07'
createdAt: '2026-10-25T17:12:57.000Z'
slug: the-first-production-deploy-eight-layers-each-hiding-the-next
redirects: []
listen:
  audio: assets/listen/the-first-production-deploy-eight-layers-each-hiding-the-next.mp3
  durationSeconds: 421
  format: conversation
extensions: {}
---

Between 2026-09-22 and 2026-09-25 the infrastructure code took 30, 21, 29 and then 66 commits a day, counted by author date in local time. Much of that work was one thing: getting the API onto a real server for the first time. The deploy path's container-based tests passed every time. It had simply never run against a real host or a real database cluster, only against fakes.

We count eight layers. Each was invisible until the one above it was fixed. The three failed deploys of 2026-09-24 each cost a replacement server and a full CI run.

## Layers one to three: nothing could start

**1. The first apply could not succeed.** On 2026-09-22 the first production apply failed on "two independent gaps". The firewall referred to a tag that nothing had created, because the server would only create its own tag after the firewall already needed it. And the object-storage credentials were reaching the job under names the provider never reads, so bucket creation failed with "Spaces credentials not configured". The same day, a third: the release script demanded the deploy host's address before the first apply, but the address is a reserved IP that only that first apply creates. We made the script detect a genuine first run from the state backend rather than from a flag someone sets.

**2. sshd was masked for the server's whole life.** At first boot our script stops and masks the SSH service so it stays off until the hardening is in place, and unmasks it at the end. Two files were written with a group owner that did not exist yet, because cloud-init writes files before it creates groups. The write step aborted on the first of them and skipped the rest, including the bundle of deploy scripts. Extraction failed, the script runs under `set -eu`, and so it stopped before reaching the unmask. The server answered nothing on port 22. Two consecutive host-key checks each tried it 97 times over 480 seconds, every attempt refused at once, which meant the firewall was open and nothing was listening. Moving the unmask earlier "only shrank that window". The fix that held was to arm the restore as an EXIT trap before the first command that can fail, so a broken boot is still recorded as broken but leaves a host a person can log into. Placeholder scripts also fail closed now, so a deploy cannot succeed against a host whose real scripts were never extracted.

**3. The database could not be reached, then rejected us.** Convergence ran `psql` with no connection settings, so it fell back to a local socket on the CI runner. And the managed cluster's firewall admitted only the server anyway. We changed the runner to open a temporary rule for its own address, converge over TLS, and always close the rule again. The next day the release failed on a password authentication error because we had been generating the cluster's admin password ourselves; the provider generates it when the cluster is created, and a value we chose could never match. We now read it from the provider.

## Layers four to six: it started, and did nothing

**4. The container was never given its configuration.** The service unit started every container with an image digest and a port: no datasource, no encryption key, no GitHub App settings. The container exited on every restart. We added a deploy verb that sends the secrets over the existing SSH channel and installs them with strict permissions.

**5. The image pull used a name no registry can resolve.** The workflow let callers write the candidate as a bare `sha256:` digest and passed it straight to `podman pull`. The commit message says plainly: "This is why the candidate image pull has failed on every deploy attempt so far."

**6. Rootless Podman, five times.** The deploy runs containers as an unprivileged user, and five ways for it to go wrong turned up on 2026-09-24, one deploy at a time. One error code, `INFRA_MIGRATION_CANDIDATE_IMAGE_PULL_FAILED`, covered at least three causes: no registry credential installed yet, because the step that pulled ran before the step that installed it; no runtime directory for the unprivileged user; and a working directory inherited from the deploy login that the dropped user "has no access to at all". Two more surfaced under other errors: an image named without a registry, which Podman refused with `short-name ... did not resolve to an alias`, and a staging directory created by root with mode 0700. The commit for that last one calls it "the third outage of one class" and says why we changed approach: "fix the class rather than the instance". It added one helper that is the single place a staging directory is made, owned by the user who must work in it. A sixth followed around 2026-09-27: a setuid helper that could not gain privileges under `NoNewPrivileges` on a freshly replaced host.

**7. The boot script was too big.** The host provider caps a server's user data at 65,536 bytes, and ours rendered at 154,212. Compressing brought it under, but by 2026-09-25 it sat 508 bytes from the cap again, so we moved the scripts out of user data altogether. The full story is in Sixty-four kilobytes: the boot script that kept hitting a hard limit.

**8. The health gate probed the old container.** The deploy restarted the serving unit and then probed "the new container". But the unit read its image digest from a file that only the promote step writes, so the probe measured the previous image. The commit that found it says the canary "passed unconditionally" and that "a broken candidate would have been promoted on the strength of the old one answering". It was masked on a fresh server only because first boot seeds that file. The fix starts the candidate under its own unit on a loopback port, so the gate measures the candidate and users cannot reach it.

## What stopped the cycle

By 2026-09-24 three production API deploys had failed in a single day, "each revealing one instance of a single bug class, each costing a droplet replacement and a full CI run". The container-based tests had passed every time, because they faked sudo, Podman, runuser and systemctl and ran from an interactive root shell. Every bug lived in the gap between that and the real context.

So we built the thing we should have built first: a disposable harness that renders the real boot configuration, boots a real throwaway server with it, and calls each deploy verb the way SSH does, as the restricted deploy user with the verb arriving only as the forced command. It pulls the real image and migrates a real throwaway database. Everything is named and tagged as scratch, and the teardown verifies with the provider's own CLI that everything is gone before it reports success. The same day a single pass fixed the health gate and a batch of siblings, "found by four read-only audits and one scratch-droplet harness, all in one pass so the next test cycle is the only one".

It did not end the incidents. Fixes to the deploy path kept landing after 2026-09-24, including the setuid failure above. How many hours this first cascade took, or what it cost in CI minutes, is not stated in our records.

Before the first real deploy of anything, boot a disposable copy of the real target and run every verb on it, from the identity and shell it will really use. Your first real deploy is a test suite whether you planned one or not; the question is whether it runs against production.

To build a site from your own videos, the start flow is at https://app.galascribe.com/
