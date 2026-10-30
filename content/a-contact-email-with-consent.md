---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a17138-2dc3-7b1c-8c33-89c1d6e903d4
kind: article
title: A contact email with consent you can withdraw
description: We keep a verified GitHub email sealed in the database, use it only for account and security notices, and delete it when you switch it off.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- privacy
- email
- consent
- security
status: draft
publishAfter: '2026-12-13'
createdAt: '2026-10-25T04:01:09.000Z'
slug: a-contact-email-with-consent
redirects: []
listen:
  audio: assets/listen/a-contact-email-with-consent.mp3
  durationSeconds: 405
  format: conversation
extensions: {}
---

On 2026-10-13, Galascribe stored an email address for nobody. Sign-in asked GitHub for no scope, the API never read GitHub's email, and a guard in our database migrations refused any indexed column named like an email unless its name said it held ciphertext, a digest or a hash. That was a clean position, and it had a cost we only felt when we wanted to reach someone. The only way to tell a person about their account, a security problem or a billing matter was an issue in their site repository, and hoping they looked. That day I decided we would collect an address properly. What follows is what the code on our main branches does as of 2026-10-24: what we keep, what we never keep, and why the person it belongs to holds the switch.

## What we keep, and in what form

One address per person: the primary, verified address from GitHub's list of that person's emails. We read the list rather than the profile's email field, which is not guaranteed to be verified, take the entry marked both primary and verified, and ignore every other. If GitHub offers none, we store nothing, and a failure to read emails never fails a sign-in.

The address is sealed before it reaches the table. We reuse the envelope we already use for GitHub tokens: AES-GCM encryption with a fresh data key per row, that key wrapped under a master key, and the ciphertext bound to the person's id, so a copied row will not open under someone else's. Beside it sits a digest, an HMAC of the lower-cased address under a server-side secret. It exists so we can ask "is this address already on file?" without decrypting anything. The browser only ever receives a masked form: the first and last character before the @, an ellipsis between them, and the whole domain.

"Sealed" means encrypted at rest and nothing more. Our API holds the key it needs to open the address and send mail, so the claim is not that we cannot read it. The claim is narrower: the address is opened in two places, to build the masked form you see and, at the moment of sending, to address the message. The outbox stores the person's id and never a copy of the address. The audit trail records that a change happened and names no address. An error from the mail provider has the address replaced with `[address]` before we store it.

The digest has since picked up a second job. When a payment arrives through our plan checkout, we match its email to an account by digest, and only against addresses that are on file with consent. Withdraw the address and the digest goes with it, so that automatic match stops working for you.

## Consent is a switch with a memory

There are two layers of consent. The first is GitHub's: it asks the person to share their verified primary email, and our privacy page says exactly that. We chose to treat that as consent to store, with no second prompt of our own. The alternative on the table was a one-time "Yes" or "Not now" card on the home screen after sign-in. We took the option that reaches more people, and the cost is plain: someone who clicked through GitHub's screen can have an address on file without ever having seen a Galascribe screen about it. That is why the second layer matters.

The second layer is the Contact email card on the Account page. It shows whether an address is on file, the masked address, a sentence saying it is used only for account and security notices and is never shown to other members or sold, and one switch: "Use my GitHub email for account and security notices". Turn it off and the row is emptied. The ciphertext, the keys and the digest are set to null, and only the state `WITHDRAWN` and its timestamps remain. A database constraint enforces that a withdrawn row can hold none of the encrypted columns. We keep the refusal on purpose, so the next sign-in does not quietly capture the address again. Closing your account deletes the row, and the account export lists the state, the masked address and when you agreed.

Turning it back on works less well than we designed. The switch tries to re-read the address from GitHub at once, with a token we hold. The sign-in token is not kept, and the GitHub App tokens we do keep do not carry the email permission, so in practice the switch clears the withdrawal and the card says: "Turned on. Your GitHub email is stored the next time you sign in. Sign out and back in to share it now." One sign-out and sign-in is the price. Both directions need a recent sign-in and are audited.

## What the operator can and cannot do

On the operators' Users page, each person's email column reads "On file" or "None". That is a yes or no worked out in the database without decrypting anything, and it is all an operator sees. The privacy page says so in the same terms: operators see whether an address is on file, not the address itself.

An operator can send one message to one person who has an address on file, in one of three categories: account, security or service. The form takes a subject of up to 200 characters, a body of up to 5,000 and a reason code. It needs a recent sign-in, and every send leaves an audit entry. Sending to someone with no address on file is refused. One wording gap is ours to close: the Account card says account and security notices, while the operator form and our privacy page also name a third category, service.

The message is queued, not sent: a row in an outbox that holds the person's id. A sender inside the API process picks it up, polling every 15 seconds, opens the address, prefixes the subject with "Galascribe: " and wraps the operator's text in a fixed line saying why the person is receiving it and where to turn it off: "Manage this in Account → Contact email." A failed send is retried after 30 seconds, then after longer waits doubling up to an hour, five attempts in all. If you withdrew between the queueing and the send, the message fails and nothing goes out.

That is the whole surface. There are no bulk sends and no marketing category, and newsletter delivery stays deferred; the decision record says so. The mail goes out through a transactional email provider, from a sending subdomain of ours. We planned on Resend and shipped with Brevo as the default; one setting chooses between them. Our cold outreach never goes through it. Capture and sending are each off unless a setting turns them on, and a message queued while sending is off simply stays queued.

## What to check, and what to copy

If you sign in to Galascribe, the Contact email card on the Account page tells you what is on file and lets you remove it. If you are adding email to a product that never had it, these are the three rules we would copy:

- Store only what a verified source vouches for, and nothing from the field that does not.
- Make withdrawal delete the secret and keep the refusal.
- Let staff see that an address exists, never the address, and route every send through a queue that holds ids.

To set up a site of your own, the start flow is at https://app.galascribe.com/
