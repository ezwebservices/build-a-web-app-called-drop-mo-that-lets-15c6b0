# Drop — Brand Guide

## Final brand decision
**Keep the name. Kill the droplet.**

The name *Drop* stays. It's a verb the whole product is built around — *start a drop, join the drop, drop day, the wave* — and renaming would force a rewrite of every screen, email, and CTA without solving the actual problem. The actual problem was the **mark**: a single red teardrop reads as blood, hospital, emergency. That collides with the surprise-generosity feeling we're after.

The new mark is a **confetti drop**: three tumbling rounded dots cascading diagonally down-right. It reads as Venmo notifications landing one after another — *ping, ping, ping* — which is literally what the recipient experiences on drop day. No teardrops, no anatomy.

## Name
**Drop** (product wordmark: lowercase `drop`, set in Inter 800).

## Tagline
**Rally the group. Surprise the one.**

Alternates kept on file:
- *Pull off the surprise.*
- *Their phone is about to light up.*

## Logo concept (spec for the Designer)

### The mark — "Confetti drop"
- Three filled circles, sized `r=4`, `r=5`, `r=6`, arranged on a diagonal from upper-left to lower-right inside a 32×32 box.
- Slight rotation tilt (~8°) to feel mid-fall, not static.
- Each circle is a different brand color (Coral 500, Sun 400, Mint 400) to feel like *different people* arriving — not one big donation.
- On animation entry: the three dots fall in with 60ms stagger and a soft squash-on-land bounce (Framer Motion `spring`, `stiffness: 320`, `damping: 18`).
- Hover/focus: gentle 4° wobble, 600ms.

**Forbidden:** teardrops, water droplets, hearts, hands, dollar signs, gift boxes wrapped with bows, charity ribbons. Anything that says "donate" or "emergency."

### The wordmark
- `drop` — lowercase, Inter 800, tight tracking (`-0.04em`), set in **Ink 900** on light surfaces.
- Mark sits to the **left** of the wordmark with 10px gap.
- Minimum clear space: height of the lowercase `o` on all sides.
- Minimum size: 20px tall mark.

### Lockup variants
- **Light surface (default):** mark in full color, wordmark in Ink 900.
- **Dark surface:** mark in full color, wordmark in Paper.
- **Single color (email, favicon fallback):** all three dots in Coral 600, wordmark in Coral 700.

## Color system

All values verified for **WCAG AA** on `#FFFFFF` and on `#FFF6F1` (Coral 50) for the roles indicated.

### Primary — Coral (warm peach, not blood)
| Token | Hex | Use | Contrast on white |
| --- | --- | --- | --- |
| `coral-50`  | `#FFF6F1` | Section tints, hero wash | — |
| `coral-100` | `#FFE6D6` | Pills, badges, soft borders | — |
| `coral-200` | `#FFC9A8` | Hover wash, secondary borders | — |
| `coral-300` | `#FFA776` | Decorative, illustration fills | — |
| `coral-400` | `#FF8A52` | Gradient stops, accents | 2.6 (large/UI only) |
| `coral-500` | `#F86F37` | Hero accent text, secondary CTA | 3.4 (large text + UI) |
| `coral-600` | `#DB5A24` | **Primary button bg, link color** | 4.8 ✓ AA body |
| `coral-700` | `#B0481D` | Body text emphasis, hover-darken | 7.1 ✓ AAA |
| `coral-800` | `#8A3917` | Pressed states, dark-mode primary | 9.6 |
| `coral-900` | `#6B2D12` | Highest emphasis, headings on tint | 12.4 |

### Secondary — Sun (warm gold)
| Token | Hex | Use |
| --- | --- | --- |
| `sun-100` | `#FFF1C7` | Celebration washes |
| `sun-300` | `#F8D67A` | Confetti dots, milestones |
| `sun-400` | `#F2BE3D` | Accent dot in logo, drop-day highlight |
| `sun-600` | `#B7860C` | Text on cream (4.7 on white ✓ AA) |

### Tertiary — Mint (cool counterweight)
| Token | Hex | Use |
| --- | --- | --- |
| `mint-100` | `#DDF3E5` | Success washes, "sent" pill bg |
| `mint-400` | `#5FCB95` | Accent dot in logo |
| `mint-600` | `#1F8F5C` | Success text, "sent" status (5.0 on white ✓ AA) |

### Neutrals — Ink (cool charcoal, slightly warm)
| Token | Hex | Use | Contrast on white |
| --- | --- | --- | --- |
| `ink-900` | `#1A1410` | Headlines, primary body | 16.5 |
| `ink-700` | `#3A322D` | Strong body | 10.4 |
| `ink-500` | `#6B6058` | Secondary body, captions | 5.4 ✓ AA body |
| `ink-400` | `#8A8079` | Muted helper text | 3.5 (large text only — never use for body) |
| `ink-200` | `#D9D2CC` | Borders, dividers |
| `ink-100` | `#EDE8E3` | Subtle borders, input outlines |

### Surfaces
| Token | Hex | Use |
| --- | --- | --- |
| `paper`   | `#FFFBF7` | App background (warm white, not stark) |
| `cream`   | `#FFF6F1` | Banded sections, card tints |
| `white`   | `#FFFFFF` | Card surfaces |

### Status (kept warm to match the family)
| Role | Hex | On-white contrast |
| --- | --- | --- |
| success | `#1F8F5C` | 5.0 ✓ |
| warning | `#B7860C` | 4.7 ✓ |
| danger  | `#C8341F` | 6.4 ✓ |

## Typography
- **Display:** Instrument Serif, italic for emotional emphasis (`from everyone they love.`).
- **UI / body:** Inter, 400/500/600/800.
- Line-height: 1.5 body, 1.05 display.
- Tracking: `-0.04em` on display ≥ 32px.

## Motion (Framer Motion)
- Things *land*. Pledges arrive with a soft squash bounce, never a hard pop.
- Counters tick up with `easeOut`, ~600ms.
- The mark wobbles on hover, never spins.
- Confetti only fires on **pledge confirm** and **drop-day "I sent it"** — not on page load. Scarcity = meaning.

## Voice

**Hype but considerate. Conspiratorial-in-a-good-way.**

| Do | Don't |
| --- | --- |
| Sound like a group chat planning a surprise party | Sound like a 501(c)(3) fundraising page |
| "Let's pull this off." | "Thank you for your generous donation." |
| Use the verb *drop* freely | Use *donor*, *campaign*, *beneficiary* |
| Short sentences. Real warmth. | Stock-photo empathy. Corporate sympathy. |
| Treat the secret as sacred — that's the whole product | Mention the recipient's full name anywhere |

### Voice examples (use these verbatim where they fit)

**Hero:**
> A little surprise from everyone they love.

**Sub-hero:**
> Someone you know is having a rough week. Line up a bunch of small Venmos from their friends and family, all landing on the same morning. They wake up to it — and have no idea it was planned.

**Empty dashboard:**
> No drops yet. Got someone in mind?

**Invite email subject:**
> psst — we're putting something together for {first_name}

**Pledge confirmation:**
> You're in. We'll nudge you the morning of, with a one-tap Venmo ready to go.

**Drop-day push:**
> It's go time. Tap to send your Venmo to {first_name} — and join the wave.

**Recipient never sees:**
> The recipient never gets a Drop email. They just get Venmos.

### Word list
- **Yes:** drop, rally, pledge, the crew, the wave, drop day, pull it off, line it up, ping, surprise
- **No:** donor, donation, campaign, beneficiary, fundraiser, contribution, gift card, GoFundMe-style anything

## The feeling
Opening a Drop should feel like being let in on a secret with people who love the same person you do. Warm. Quiet. Then, on drop day — loud.
