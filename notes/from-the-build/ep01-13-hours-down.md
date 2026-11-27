# From the build, episode 1: 13 hours down, and millions of tokens on the wrong work

Show notes: the first-party record behind the video, from our own project notes. Times are UTC.

## The outage
- On 26 September 2026 the Galascribe API went down at 16:36 and was serving again at 05:37 on 27 September, about 13 hours.
- About 350 review changes had been made to the deploy path before the outage. Each had been checked only against mocks; none had ever run on a real host.
- Six layers failed on the real host, one after another: an admission gate that wanted an image digest committed to a manifest, the format of the key-escrow backup, a missing runtime directory for the candidate service unit, rootless containers that could not map user ids, an apply step that restarted a placeholder image, and the application's startup settings.
- Seven fixes, one per layer, were merged during the outage. The edge provider's bot protection blocked the CI runners' addresses, so the post-deploy health check now runs from the host itself.

## The agents, the same day
- On 27 September one incident session (a different incident from the outage, on the same day) spent several million tokens across helper agents while production stayed down and nothing had been deployed for hours.
- Two implementers were resumed four or five times, at about 700,000 tokens each; two reviewers were resumed three times, at 200,000 to 290,000 each; four auditors ran on top.
- The spending went on repeated implement, review, fix and re-review rounds.
- The rule that came out of it: fix the blocker first and deploy it; harden afterwards, and only when asked; at most one implementer and one review pass per change; do the cheap direct investigation before starting any helper.

## The redesign
- On 27 September the manifest gate was dropped and the deploy path was redesigned end to end: the infrastructure code only provisions the platform and never starts or configures the application; one script on the host does secrets, migrate, stage, promote, rollback and status; the old container keeps serving until promote succeeds.
- A failed stage leaves the old container untouched, a failed promote or health check rolls back, and running the same image again changes nothing. Any change to the host scripts must pass a throwaway real-host test before it is merged.
- The record of what production serves moved from a file in git to two registry tags, `production` and `production-previous`, written last, by the deploy only.

## Later
- On 26 November 2026 the owner set the other side of the rule: how much to spend on agents is his call, and cost is never a reason to cut quality. What is waste is repeated review rounds on polish while the blocker waits.
