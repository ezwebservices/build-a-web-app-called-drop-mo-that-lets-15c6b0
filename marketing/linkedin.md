# Drop — LinkedIn Posts

## Founder launch post

Last winter, a friend's basement flooded.

I wanted to help. I knew a dozen mutual friends did too. But every option felt wrong.

GoFundMe turned it into a public charity moment — the last thing she wanted.
A group spreadsheet felt like a tax filing.
Just texting "hey everyone Venmo her $20" guaranteed half the group would forget.

What I actually wanted was for her phone to light up one morning with a wave of Venmos from everyone who loved her, with no one having to organize it in front of her.

So I built that.

**Drop** lets one person quietly coordinate a surprise Venmo "flood" for someone going through it. You invite the crew by email. Everyone pledges privately. On drop day, everyone gets a one-tap email that opens Venmo with the handle, amount, and note pre-filled.

The recipient is never a user of Drop. They never see the app. They just feel the wave.

A few notes for builders:
— Built on AWS Amplify Gen 2. Two engineers, six weeks.
— No money flows through us. It's peer-to-peer Venmo, end to end.
— The invite emails contain live progress images that update as more people pledge — your crew watches the energy build without opening the app.

We're free while we're launching. If you've ever had a moment where you wished you could rally for someone without making it A Whole Thing — give it a look.

Rally the group. Surprise the one.

🔗 [link]

---

## Shorter network post

A friend's basement flooded last winter. I wanted to help, and so did a dozen other people. We didn't want to make a GoFundMe — we wanted her phone to just start lighting up.

So we built Drop. It coordinates a surprise Venmo flood for someone going through it. The recipient never sees the app.

Free during launch. If this resonates, the link is in the comments.

---

## "Lessons from the build" post (week 2 follow-up)

Three things I learned shipping Drop:

**1. Designing for a user who never sees your product is clarifying.**
Our most important user is the *recipient* — and they never log in, never get a notification, never see a UI. That forced every feature debate into one question: "does this make the surprise better or worse?"

**2. The email IS the product.**
For most users (contributors), the experience lives in their inbox. We invested more in the rendered HTML email — including live progress images that update over time — than in the actual website.

**3. Not holding the money was the right call.**
We don't pool funds. Money goes Venmo-to-Venmo. We give up obvious monetization and gain something better: nobody has to trust us with their cash to use the product.

---

## Hiring / build-in-public follow-up

We've run 40+ drops in the first month. Total moved across them: just over $58,000 — none of which touched our infrastructure.

The recipients still don't know how it happened. That's the design.

If you're building something where the win condition is *invisible delight*, I'd love to compare notes.
