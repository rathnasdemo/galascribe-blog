---
schemaId: urn:gala:schema:content-frontmatter:2.0.0
schemaVersion: 2.0.0
id: 01a17138-2dc9-77e0-aa2b-d7a46bacf101
kind: article
title: Outreach without spam, with a cap, a window and a person on every row
description: How we find creators and email them, with a person approving every row, sends capped at ten a weekday and a plain no ending the thread.
language: en
authors:
- 01a15c65-9a71-782f-b76c-d0f002d9c6e5
tags:
- outreach
- email
- creators
- guardrails
status: draft
publishAfter: '2026-12-20'
createdAt: '2026-10-25T04:01:09.000Z'
slug: outreach-without-spam-five-emails-a-day
redirects: []
listen:
  audio: assets/listen/outreach-without-spam-five-emails-a-day.mp3
  durationSeconds: 419
  format: conversation
extensions: {}
---

On 2026-10-21 our scheduled send job ran three times and sent nothing, and all three runs were correct. GitHub started them between 3 hours 41 minutes and 4 hours 20 minutes after their scheduled times. Our sender only mails a US creator between 09:00 and 12:00 Chicago time (the code treats the whole US as one zone), so each run woke up in the afternoon, found the window shut, skipped every row and exited cleanly. The day before, two of the three jobs never ran at all.

We built that window so that an email lands in the recipient's morning. It also meant nobody got one that day. That is how we want the brakes to behave: when the machine is late, it does nothing, and we fix the schedule instead of loosening the brake. Below is the whole machine as of 2026-10-24: how we find creators, who approves what, what the sender may do, and what we refuse to do.

## Finding is the slow part

Our design note of 2026-10-18 set the shape: find about fifty candidate channels a day and send five to ten emails a day. The gap is on purpose: a person finds some addresses by hand and reads every draft, and a low send rate protects the sending domain's reputation.

Discovery searches YouTube by topic, then collects each channel's facts: subscribers, country, recent uploads, the website, whether it has a blog, any address on its About page. Then it applies criteria written in code, not judgment. A channel passes only if every one holds:

- Its country is known and on the list of regions we may write to (US only, by default).
- It has between 2,000 and 2,000,000 subscribers and uploaded within the last 180 days.
- Any address it shows is a person's, not a role mailbox such as info or support, and not on a platform domain such as a course marketplace or a link page.
- It matches our topic check, which needs two distinct terms from one subject area, one of them in the channel name or a video title.

A channel that fails lands on a Rejected tab with every reason it failed. As of 2026-10-24 about 2% of the channels we enrich pass, under the criteria for our first market. Volume is limited by supply, not by sending.

Two of those rules came from mistakes. An early version treated a channel with no stated country as American, which would have let a creator in the EU or India through a "US only" filter. An unknown country is now unknown, and the sender refuses the row until a person sets it. A later version rejected every channel whose business address sits behind YouTube's "View email address" button. Six targeted dry runs of discovery on 2026-10-24, about 180 channels, kept one. That button needs a signed-in human, and we chose not to buy a contact database. So now those channels land on the sheet with no address, I click the button and type the address in myself, and the sender will not touch a row with an empty address.

## One row, one approval

The sheet is the only record. Discovery writes rows as `active`, and the sender never looks at an active row. A row is mailed only after a person sets it to `approved`, and the approve command refuses unless the row has an address, an enabled region, an address not on our do-not-email list, its own preview site, and a saved draft that passes the sender's checks.

Every email is about one creator's videos, so we build a small site from a few of them first, and the email links to it as "built for you". The draft is saved on the row the evening before, I read it next to the preview, and then I approve. At send time the sender uses the saved text and checks it again with the same code, so a cell edited into something the rules refuse does not go.

The rules are in code. The validator refuses prices, timelines, traffic or ranking claims and any number except the view count of a video we name, which must match its real count within 5%. It refuses quoted titles that are not exact titles from the channel, more than the two allowed links, and any run of eight words copied from the channel's own description. Two paragraphs must appear word for word: the pilot paragraph, and the closing one that says a one-word reply is plenty, "yes" or a quick "no".

Then the limits. As of 2026-10-24 the ceiling is ten emails per weekday, counted on the Pacific date; no run sends more than five; each email waits 60 seconds after the last; nothing goes at the weekend. The ceiling has moved: five when we first switched the schedule on (2026-10-20), two on 2026-10-21, ten that evening. A kill switch is one row in the sheet, and the next scheduled run reads it and stops.

We fixed the late jobs by running the send job every 30 minutes across the morning window instead of three times, and by adding one more alarm. The last send job of the day now turns red if nothing went out although an approved row with a draft and a preview was waiting. A deliberate pause does not count. A guard that quietly does nothing looks exactly like a guard that is working, so it now has to say so. On 2026-10-24 the daily machine also moved to scheduled jobs on a Mac, with the Actions schedule kept as the fallback; both obey the same window and cap.

## What we refuse to do

A "no" has to mean no, in the words people really write. Our first reply handler, which an adversarial review of the code caught on 2026-10-22, counted "not interested" as a reply, and a reply is something we answer with more email. Now a whole-reply or first-clause "no", "no thanks", "stop" or "not interested" marks the address as unsubscribed, and so does a message whose subject starts with "unsubscribe", even with an empty body. Every email also carries a List-Unsubscribe header. We scan the Spam folder as well as the inbox, because a refusal that Gmail filed as junk is still a refusal. A refusal after a yes still counts. We also never email an address twice: a send is skipped if the address is on any row already contacted, replied, bounced or unsubscribed, or on the do-not-email list. Sentences that only look like refusals, such as "I can't stop watching" or "is this spam?", are never treated as one, and anything unclear goes to a person instead of being guessed.

We do not claim the preview is private. On 2026-10-23 we removed the line "nothing is published until you approve it", because the preview is a public page. The fixed paragraph now says it is hidden from search engines, carries no ads, is not used by Galascribe in any other way, and that one email will take it down. When a creator unsubscribes, the tool prints the take-down instruction for their preview, and its status view lists previews to remove, including those whose email went out more than 14 days ago without a yes.

We do not mix this mail with our product's mail. Cold outreach goes from a separate domain with its own SPF, DKIM and DMARC records, which passed on our test sends when we set it up on 2026-10-19, and never through the provider that sends our product's transactional mail. A caveat we wrote down at the time: the links in the emails still point at our product's domain, so complaints can reach it anyway. A separate sender protects the mail that matters, not the link.

If you are about to send your own first cold campaign, copy three things before anything else. Set the ceiling well below what you could send. Write the stop rule as code and test it on real replies, including the ones that only look like refusals. And make the system complain when it does nothing.

To set up a site of your own, the start flow is at https://app.galascribe.com/
