# Hyperframes Composition Brief: Fewchurs

## Objective
Create a short launch-style brag video for Fewchurs — a feature-request board developers drop into their own app with an SDK.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20.5 seconds

## Source Material
- Project root: `/Users/ahmatafthal/Desktop/feature-request-web`
- Primary files read: `src/app/page.tsx` (landing copy), `src/app/globals.css` (tokens), `src/app/layout.tsx` (fonts), `public/logo-mark.svg` (logo), `src/components/features/*`, `src/app/api/v1/**`
- Product name: Fewchurs
- Tagline / strongest claim: "Let your app's users tell you what to build next."
- Key UI to recreate: the feature-request board — white card on ink, header, tabs Top · New · Roadmap, request rows with orange vote pill (▲ + count), title, status chip, comment count
- Real asset to use: `public/logo-mark.svg` (the actual logo mark, three leaf-F bars, orange→amber gradients)
- Copy that must appear verbatim:
  - "Ideas land in one place."
  - "Votes settle the argument."
  - "The loudest person stops winning."
  - "They hear back when it ships."
  - "Let your app's users tell you what to build next."
  - "Free forever for one app."
  - (one adapted line: "Feature requests get lost.")

## Creative Direction
- Tone preset: `default`
- Creative direction: indie dev-tool launch film — warm, plain-spoken, product-first
- Interpretation: 5 scenes, 3.2–5.3s each; fast entrances that settle and hold; the working board is the hero, text is support.
- Angle: the landing page's own four-chapter story (land → vote → mark → ship), shown as a working board rather than described as features. Opens on the scattered-feedback mess, which physically converges into the board — the brand's many-to-few idea.
- Hook: six scattered request chips + "Feature requests get lost."
- Outro / punchline: logo assembles → tagline → "Free forever for one app."
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals, particles, waveform bars
  - Unrelated visual redesign — use the project's real tokens
  - The site's eyebrow "get rid of guessings" (reads as a typo)

## Visual Identity
- Background: `#171614` (ink)
- Board surface: `#FFFFFF`; muted `#F5F4F2`; border `#E7E4E0`
- Accent: `#ED5F18`; strong `#D14300`; soft `#FFF2E8`
- Text: `#1C1A18` on light, `#FFFFFF` on ink, muted `#6C6865`
- Display + body font: Be Vietnam Pro (self-hosted woff2 in `assets/fonts/`, with `@font-face`)
- Radius: 10px controls, 14–18px cards
- Visual references: board rows, orange vote pill, status chips (Open / Done), the logo mark

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Scattered — 3.18s — six request chips pile up on ink; "Feature requests get lost."
2. The board assembles — 5.26s — chips converge into the real board; rows arrive one by one; "Ideas land in one place."
3. Votes settle the argument — 4.21s — counters tick, rows swap; "Votes settle the argument." / "The loudest person stops winning."
4. It ships — 4.21s — status flips to Done, "Your request shipped" email card arrives; "They hear back when it ships."
5. Logo — 3.64s — logo mark assembles, wordmark, tagline, "Free forever for one app."

## Audio
- Audio role: warm upbeat bed with sparse, motion-matched accents
- Audio arc: fades in under the mess → opens on the convergence → light ticks through voting and shipping → fades out under the final logo hold
- Music: `happy-beats-business-moves-vol-11-by-ende-dot-app.mp3` (114.84 BPM)
- Music treatment: volume ~0.35, fade-in over 0.6s, fade out from ~19.2s so the last line lands quiet
- Music cue guidance: preset `assets/music/cues/…vol-11….music-cues.json`. Strong cues: **3.18** (board assembles — primary lock), **8.44** (votes), **12.65** (Done flip), **16.86** (logo). Beat grid 0.52s apart → sequential rows use every other beat: 4.23, 5.28, 6.34.
- Audio-reactive treatment: subtle — accent glow behind the board and logo warmth may breathe with RMS. No waveform/equalizer/particles. If extraction is unavailable, skip it and note so; do not block the render.
- Audio-coupled moments:
  - Chip arrivals (0.3–1.5s) — soft low interface ticks
  - Convergence (3.18s) — whoosh + soft impact, beat-locked
  - Row arrivals (4.23 / 5.28 / 6.34s) — card sounds on the beat grid
  - Vote counters (8.44s+) — light ticks; row swap — one soft thud
  - Done chip flip (12.65s) — soft confirm; email card — notification/card sound
  - Logo landing (16.86s) — one restrained announcement hit
- SFX selection guidance: sparse, low high-frequency risk, motion-matched. The picture must always be busier than the audio.
- SFX analysis guidance: `/Users/ahmatafthal/.claude/plugins/cache/brag/brag/0.3.0/skills/brag/assets/sfx/sfx-analysis.md`
- Exact SFX choice: Hyperframes picks filenames, timestamps, density and volume after the animation exists.
- Audio files: copy chosen music and SFX into `brag-output/composition/assets/`

## Hyperframes Instructions
Load `hyperframes-core`, `hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes`, `hyperframes-cli`. This is the /brag workflow — do not enter the hyperframes intent interview or its generic launch-video workflow.

Requirements:
- Show the real board UI and the real logo asset.
- Keep every line readable: short label ≥0.8s settled, sentence ≥0.3s/word.
- Total 20.5s.
- Include the music and SFX layer.
- Beat-lock the convergence at 3.18s (±0.15s) and mark it `// beat-locked`; snap row arrivals to the beat grid and mark `// beat-grid`.
- Self-host fonts with `@font-face` (lint requires it); no `crossorigin` on media; every `<audio>` needs an `id`; never tween visibility/autoAlpha on `.clip`.
- Run `npx hyperframes check` before render — brag's single gate.
