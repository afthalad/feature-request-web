# Brag Plan: Fewchurs

## What is this app?
Fewchurs is a feature-request board you drop into your own app with an SDK — users submit ideas, everyone votes, the developer marks what they're building, and every follower gets an email the day it ships.

## The angle
The product's own landing page already tells a four-chapter story: ideas land in one place → votes settle the argument → you mark what you're doing → they hear back when it ships. The video *is* that loop, shown as a working board instead of described as features. It opens on the mess Fewchurs replaces (feedback scattered across App Store reviews and DMs), then the mess physically converges into the board — the same many-to-few idea the brand is built on. No invented marketing language: four of the five on-screen lines are verbatim from the site.

## Hook (first 2-3 seconds)
Six real-sounding feature requests scatter across a dark screen at odd angles, overlapping, unreadable as a set — the "pile of App Store reviews" problem. One line cuts in: **"Feature requests get lost."**

## Key moments (the middle)
- The scattered request chips fly inward and snap into a real Fewchurs board — tabs (Top / New / Roadmap), rows with vote pills, status chips. Beat-locked to the music's first strong cue.
- Vote counters tick up and two rows physically swap position as "Add dark mode" overtakes the row above it. Line: "Votes settle the argument." / "The loudest person stops winning."
- The top row's status chip flips Open → Done, and an email notification card slides in: "Your request shipped." Line: "They hear back when it ships."

## Outro / punchline
The board recedes, the real Fewchurs logo mark assembles, wordmark and tagline land: "Let your app's users tell you what to build next." Then the quiet closer: "Free forever for one app."

## User flow worth showing
Entry → key action → result, all from the real product:
1. A request lands on the board (submitted from inside someone's app via the SDK).
2. Votes accumulate and reorder the board — the ranked list is the product's core output.
3. The owner marks it Done and every follower gets the "it shipped" email.

## Tone
- Preset: `default`
- Creative direction: indie dev-tool launch film — warm, plain-spoken, product-first
- Interpretation: 5 scenes, comfortable 3.2–5.3s holds, motion that is snappy in and then settles. Confidence comes from showing the working board, not from hype. No exclamation marks, no "revolutionize", no stat-card flex.

## Format: landscape — 1920x1080
## Duration: 20.5 seconds

## Visual identity (from the project)
- Background: `#171614` (the project's `--ink` token, used for code blocks and the auth page)
- Surface / board card: `#FFFFFF`, muted surface `#F5F4F2`
- Accent: `#ED5F18` (`--primary`, oklch(0.66 0.19 42)); strong `#D14300`; soft `#FFF2E8`
- Text: `#1C1A18` on light, `#FFFFFF` on ink, muted `#6C6865`
- Corner radius: 10px (`--radius: 0.625rem`), cards 14px
- Display + body font: Be Vietnam Pro (600/700 display, 400/500 body) — the site's real font
- Strongest visual element: the feature-request board rows with the orange vote pill, and `public/logo-mark.svg` (the real logo)

## Copy used (traceable to the source)
| Line | Source |
|---|---|
| "Feature requests get lost." | adapted from the testimonial "I used to lose feature requests in a pile of App Store reviews." |
| "Ideas land in one place." | verbatim, landing page chapter 01 |
| "Votes settle the argument." | verbatim, chapter 02 |
| "The loudest person stops winning." | verbatim, chapter 02 body |
| "They hear back when it ships." | verbatim, chapter 04 |
| "Let your app's users tell you what to build next." | verbatim, H1 |
| "Free forever for one app." | verbatim, hero sub-line |

Note: the site's eyebrow "get rid of guessings" is deliberately not used — it reads as a typo to native speakers (already flagged in `BRAND_PSYCHOLOGY.md`). Board content (request titles, vote counts, the notification email) is plausible fiction, not real user data.

## Share copy (draft)
Your users already know what to build next. Fewchurs is a feature-request board you drop into your app with three lines of code — they vote, you ship, everyone who asked gets an email the day it lands.

## Audio direction
- Role: warm upbeat bed with motion-matched accents
- Music: `happy-beats-business-moves-vol-11-by-ende-dot-app.mp3` (114.84 BPM, 87.6s)
- Music treatment: start at 0, bed at ~0.35 volume, quick fade-in over the first 0.6s, fade out under the final logo hold from ~19.2s
- Music cue guidance: preset read from `assets/music/cues/…vol-11….music-cues.json`. Strong cues to target: **3.18s** (board assembles — the major lock), **8.44s** (votes begin ticking), **12.65s** (status flips to Done), **16.86s** (logo lands). Beat grid is 0.52s apart, which is too fast for readable text — sequential rows snap to **every other beat** (~1.05s: 4.23, 5.28, 6.34).
- Audio-reactive treatment: subtle — the accent glow behind the board card and the logo's warmth may breathe with music RMS. No waveform bars, no equalizer, no particles.
- SFX posture: sparse and motion-matched — a whoosh on the convergence, soft ticks on vote counters, a card sound on the email notification, one restrained announcement on the logo. Nothing on every beat.
- Audio-coupled moments: chip convergence (3.18s), vote counter ticks (8.44–10.5s), row swap, Done chip flip (12.65s), email card arrival, logo landing (16.86s)
- Restraint rule: the audio must never get busier than the picture. No layered stingers, no riser into every scene, and nothing loud enough to make this feel like an ad.

## Storyboard

### Scene 1 — Scattered — 3.18s (0 → 3.18)
Dark ink field. Six request chips ("Add dark mode", "iPad app please", "Widget when??", "Export to CSV", "Dark mode!!", "Sync across devices") fade/drift in at odd angles, overlapping, slightly dimmed — a pile, not a list. Headline slams in at 0.55s and holds: **"Feature requests get lost."**
Sequential/interaction: yes — chips arrive one by one, fast (0.12s apart), as clutter rather than readable items.
Audio intent: quiet, slightly unsettled; bed fading in.
Audio-coupled idea: soft paper/interface ticks under chip arrivals, kept low.
Music: warm intro.
Transition mood: hard → Scene 2 (the convergence is the cut)

### Scene 2 — The board assembles — 5.26s (3.18 → 8.44)
The chips fly inward and collapse into the Fewchurs board card: white card on ink, header with app name, tabs **Top · New · Roadmap**, then three request rows arrive with orange vote pills, titles, status chips and comment counts. Small line above the card: **"Ideas land in one place."**
Sequential/interaction: yes — rows arrive one by one on every other beat (4.23, 5.28, 6.34), each with a card sound.
Audio intent: the payoff — bed opens up on the strong cue.
Audio-coupled idea: single whoosh + soft impact at 3.18s (beat-locked), card sound per row.
Transition mood: clean → Scene 3

### Scene 3 — Votes settle the argument — 4.21s (8.44 → 12.65)
Camera stays on the board. Vote counters tick up (14→31, 22→24, 9→11); the "Add dark mode" row lifts and swaps above the row that was on top, its vote pill filling orange. Lines: **"Votes settle the argument."** then **"The loudest person stops winning."**
Sequential/interaction: yes — counters tick digit by digit, then a physical row swap.
Audio intent: momentum without noise.
Audio-coupled idea: light ticks on the counters, one soft thud on the row swap.
Transition mood: clean → Scene 4

### Scene 4 — It ships — 4.21s (12.65 → 16.86)
The top row's status chip flips Open → **Done** (green), and an email notification card slides in over the board's lower right: subject "Your request shipped", body "Add dark mode is now live." Line: **"They hear back when it ships."**
Sequential/interaction: yes — chip flip at 12.65s (beat-locked), email card slides in ~0.6s later.
Audio intent: satisfaction, a small arrival.
Audio-coupled idea: soft confirm on the chip flip, card/notification sound on the email.
Transition mood: soft → Scene 5

### Scene 5 — Logo — 3.64s (16.86 → 20.5)
Board fades back into the ink. The real Fewchurs logo mark (its three leaf-F bars) assembles bar by bar, wordmark **fewchurs** beside it, then the tagline **"Let your app's users tell you what to build next."** and a quiet last line **"Free forever for one app."**
Sequential/interaction: yes — three logo bars land on consecutive beats from 16.86s, wordmark with them.
Audio intent: land it, then get out of the way — bed fades under the hold.
Audio-coupled idea: one restrained announcement hit on the logo landing (16.86s, beat-locked).
Transition mood: hold to black

**Music mood for this video:** upbeat, warm, unhurried
**Audio summary:** A warm bed fades in under the scattered-mess opening, opens up on the strong cue as the board assembles, carries light motion-matched ticks and card sounds through the voting and shipping beats, then fades out under the logo so the final line lands in near-quiet.
