# Drop — Reddit Posts

Each post is tuned to its sub. No cross-posting verbatim — Reddit smells that immediately.

---

## r/SideProject

**Title:** I built a tool to coordinate a surprise Venmo "flood" for a friend going through it

A friend's basement flooded last winter. I wanted to rally a group of us to help, but every option I looked at — GoFundMe, a shared spreadsheet, a Venmo group — either killed the surprise or felt clinical.

So I built **Drop**. You start a private drop for someone, invite the crew by email, everyone pledges an amount in secret, and on drop day everyone gets a one-tap email that opens Venmo with the handle/amount/note pre-filled. They send at roughly the same moment and the recipient's phone lights up.

The recipient is never a user. They never see the app. The surprise is the whole point.

Stack: AWS Amplify Gen 2, React/Vite/TS, SES for email, Lambda + satori for live progress images that render inside the invite emails.

Hardest part was the live image — making the email itself update as more people pledged. Cache headers fought me for a week.

Free right now. Would love eyes on it before I tell anyone who matters.

---

## r/InternetIsBeautiful

**Title:** Drop — coordinate a surprise Venmo flood for a friend who's going through it

Private campaigns, the recipient never knows it's organized. On drop day everyone sends at the same time and their phone just lights up. No platform fee, money goes Venmo-to-Venmo.

---

## r/Entrepreneur

**Title:** Launched a "surprise Venmo coordination" app — would love feedback on the wedge

The premise: when a friend or family member is going through it (medical bill, layoff, flood, whatever), the people around them want to help, but the existing tools all destroy the surprise. GoFundMe makes it a public charity moment. A group Venmo means the recipient sees the running total.

Drop sits in the middle. The organizer creates a private drop, invites contributors by email, everyone pledges in secret, and on drop day everyone hits send simultaneously. The recipient just experiences a wave of Venmos hitting their phone with no idea it was organized.

Business model questions I'm wrestling with:
- We don't touch the money — it's all peer-to-peer Venmo. Good for trust, bad for monetization.
- Considering optional tip-the-platform on drop day, or a paid tier for orgs (teams, classes, churches) running larger drops.
- Tempted to add Cash App / Zelle but not sure adding choice doesn't dilute the magic.

What would you charge for, if anything?

---

## r/personalfinance

**(Comment-style — drop in threads, don't post as a top-level)**

Not a financial product, but if you're trying to help a friend without making it weird: there's a tool called Drop that lets a group of people coordinate Venmos to land at the same moment so the recipient experiences it as a wave instead of a charity page. No fee, money goes person-to-person. Solved exactly this problem for me last winter.

---

## r/webdev

**Title:** Built live-rendering PNGs into transactional emails — here's how (Drop launch)

Quick context: I shipped Drop, an app that coordinates surprise Venmo "drops." Every invite email contains a live progress image showing how much has been pledged. The image updates over time without re-sending the email.

How:
- Image URL is a Lambda behind API Gateway, returns PNG
- Satori + resvg-js does the SVG → PNG rendering server-side (no headless Chrome needed)
- Cache-Control: `public, max-age=300, stale-while-revalidate=60` — survives Gmail's image proxy and still feels live
- Drop ID and a signed token are in the URL so the image can't be enumerated
- Pre-render and stash in S3 on each new pledge, return 302 if S3 has a fresh enough version

Net cold start ~250ms, warm ~40ms. Cheaper than I expected.

Happy to answer questions.

---

## r/web_design

**Title:** Designed a product where the most important user never sees the UI

Building Drop — coordinated surprise Venmo "drops" for someone going through a rough patch. The recipient is never a user. Never sees the app. The whole experience is felt through their phone going off.

Designing around an invisible user changed the brief in interesting ways:
- The hero moment is in another app (Venmo)
- The "success state" is a feeling the user we're building for can never describe back to us
- We had to make the *invite email* feel like the product, not the website

Curious how others have designed for users who never touch the surface.
