# Fewchurs Explainer Video: Full Prompt

A ~70 second split-screen explainer. A female presenter on the **right** explains how Fewchurs helps business owners build what their users actually want. The **left** shows animated Fewchurs product UI that moves in sync with what she says.

> **Everything is AI-generated.** The presenter (right) comes from an AI avatar tool. The UI (left) comes from an image-to-video tool fed with the ready-made UI frames in [`video-frames/`](video-frames/) (see Section 9). Give the AI the real frames rather than asking it to invent the UI, because AI video garbles UI text. Combine both halves in an editor (CapCut, Premiere, DaVinci Resolve).

---

## 1. Video setup

| Setting | Value |
|---|---|
| Format | 16:9, 1920×1080, 30 fps |
| Length | ~70 seconds |
| Layout | Split screen: **left 60%** animated product UI, **right 40%** presenter |
| Sync rule | Every UI action on the left happens exactly when she says it |
| Mood | Confident, warm, founder-friendly, modern SaaS |
| Motion | Smooth eased transitions, no hard cuts on the UI side |

### Brand

| Token | Value |
|---|---|
| Accent (orange) | `#ed5f18` |
| Dark | `#111113` |
| Background (warm off-white) | `#f5f4f2` |
| Cards | White, 16–24px rounded corners, soft shadow |
| Font | Clean geometric sans (Inter / Geist), bold headlines, tight letter spacing |
| Tagline | "Stop guessing. Start listening." |
| URL | fewchurs.com |

### Master prompt (paste first into any tool)

```
Format: 16:9, 1920x1080, 30fps, ~70 seconds.
Layout: split screen. LEFT 60% = animated Fewchurs product UI. RIGHT 40% = female presenter talking to camera.
Brand colors: orange #ed5f18 (accent), near-black #111113, warm off-white #f5f4f2, white cards with 16-24px rounded corners.
Font: clean geometric sans (Inter / Geist), bold headlines, tight letter spacing.
Mood: confident, warm, founder-friendly, modern SaaS. Smooth eased motion, no hard cuts on the UI side.
Every UI action on the left happens exactly when the presenter says it.
```

---

## 2. Presenter (right side)

For HeyGen, Synthesia, Hedra, Kling, Veo or similar.

### Character prompt

```
A friendly, confident woman in her mid-20s, a startup product expert. Shoulder-length dark hair, warm brown
eyes, natural makeup, light smile. She wears a cream knit sweater with a small orange (#ed5f18) pin.
Medium close-up, chest up, facing camera, slightly angled toward the left of frame as if presenting the
screen beside her. Soft studio lighting with a warm orange rim light from the left. Background: soft blurred
modern workspace in warm off-white and orange tones, shallow depth of field.
Natural lip sync, subtle head nods, expressive eyebrows, occasional open-palm hand gesture pointing left
toward the UI. Keep the same face, hair, outfit and lighting in every shot.
```

### Negative prompt

```
No text, no logos on clothing, no extra people, no distorted hands or fingers, no camera shake, no jump cuts,
no face changes between shots, no busy background, no harsh shadows.
```

### Voice (TTS settings)

- Young female voice, warm and upbeat
- Conversational, smiling tone
- Mid pace (~150 words per minute)
- Short pause after each beat
- Light emphasis on: *guesses*, *nobody*, *your users*, *thirty seconds*, *on their own*, *Start listening*

---

## 3. Full voiceover script

```
Most products are built on guesses.

Teams spend months shipping features... and then nobody uses them.

Fewchurs puts a feature request board right inside your app, so your users tell you what to build.

First, create your app. It takes about thirty seconds.

Then add the SDK. A few lines of code for iOS, Android, Flutter, React or Laravel.

Now your users suggest features and vote on them. The best ideas rise to the top on their own.

You see exactly what matters most, plan it, build it, and let users know when it ships.

Stop guessing. Start listening. Try Fewchurs free at fewchurs.com.
```

---

## 4. Scene-by-scene breakdown

### Scene 1: Hook (0–6s)

- **She says:** "Most products are built on guesses."
- **Presenter:** Slight head tilt, knowing half-smile, open palm toward the left.
- **Left side:** A product requirements doc fades in, covered with yellow sticky notes: "CEO thinks…", "Maybe users want…", "Competitor has it". A red marker line strikes through each note one by one.

### Scene 2: Problem (6–14s)

- **She says:** "Teams spend months shipping features… and then nobody uses them."
- **Presenter:** Small shrug, slight frown on "nobody".
- **Left side:** A "Shipped 🚀" card pops in with a bounce. A usage line graph next to it draws in and flatlines. A tiny tumbleweed rolls across the bottom.

### Scene 3: Solution (14–21s)

- **She says:** "Fewchurs puts a feature request board right inside your app, so your users tell you what to build."
- **Presenter:** Brightens up, bigger smile, points left.
- **Left side:** Everything clears to the off-white background. The Fewchurs logo scales in with a soft orange glow. A phone mockup slides up from the bottom showing an app with a **"Request a feature"** button that pulses orange.

### Scene 4: Step 1, create your app (21–29s)

- **She says:** "First, create your app. It takes about thirty seconds."
- **Presenter:** Holds up one finger on "First".
- **Left side:**
  1. Fewchurs dashboard slides in.
  2. Cursor glides to **New app** and clicks (soft ripple).
  3. The app name types in: "My App".
  4. Platform chips **iOS**, **Android** and **Web** toggle on one by one, turning orange.
  5. An **API key** card appears with a masked key.
  6. Cursor clicks copy and a **"Copied ✓"** toast slides in.

### Scene 5: Step 2, add the SDK (29–37s)

- **She says:** "Then add the SDK. A few lines of code for iOS, Android, Flutter, React or Laravel."
- **Presenter:** Two fingers on "Then", casual nod.
- **Left side:**
  1. A dark code editor window types 3 lines of code (use the real snippet from fewchurs.com/docs).
  2. SDK logos fan out in a row: SwiftUI, Kotlin, Flutter, React, Next.js, Laravel.
  3. A status dot pulses grey, then turns green with the label **"Connected"**.

### Scene 6: Step 3, users suggest and vote (37–49s)

- **She says:** "Now your users suggest features and vote on them. The best ideas rise to the top on their own."
- **Presenter:** Excited, leans in slightly, hand rises on "rise to the top".
- **Left side:**
  1. Phone mockup: a user types **"Dark mode"** and taps **Submit**.
  2. The request appears in a list with other requests: "Sync with calendar", "Export to CSV", "Offline mode".
  3. Vote counters tick up with small bounces (12 → 48 → 127).
  4. The list **reorders live** by votes with smooth position swaps.
  5. The top item gets an orange highlight ring.

### Scene 7: Step 4, decide and ship (49–60s)

- **She says:** "You see exactly what matters most, plan it, build it, and let users know when it ships."
- **Presenter:** Counts on fingers for "plan it, build it", big smile on "ships".
- **Left side:**
  1. The Fewchurs dashboard shows the requests sorted by votes.
  2. The status pill on the top item morphs in sync with her words:
     - **Pending** (grey) → **Planned** (blue) on "plan it"
     - **Planned** → **In progress** (amber) on "build it"
     - **In progress** → **Done ✓** (green) on "ships", with a confetti burst
  3. A **"Shipped! 🎉 Dark mode is live"** notification card slides in on the phone.

### Scene 8: CTA (60–70s)

- **She says:** "Stop guessing. Start listening. Try Fewchurs free at fewchurs.com."
- **Presenter:** Confident, direct to camera, warm smile, small nod at the end.
- **Left side:**
  1. A dark hero card (`#111113`) fills the left half.
  2. Headline animates in: "Stop guessing. **Start listening.**" (second half in orange).
  3. Fewchurs logo and **fewchurs.com** fade in below.
  4. An orange **"Start free →"** button pulses gently until the end.

---

## 5. Left-side motion prompt

Use this for a motion designer, After Effects, or a UI animation tool.

```
Animated SaaS product UI demo on a warm off-white (#f5f4f2) background, white rounded cards with soft
shadows, orange (#ed5f18) accent buttons and highlights, near-black (#111113) text. Smooth eased transitions
(ease-out, 300-500ms), a visible cursor that glides and clicks with a soft ripple. Elements slide up and fade
in with slight stagger. Vote counters count up with a small bounce. List items reorder with smooth position
swaps. Status pills morph color: grey (Pending) -> blue (Planned) -> amber (In progress) -> green (Done).
Phone mockups use a thin black bezel with a slight 3D tilt. No camera shake, no glitch effects, no stock
footage. Clean, minimal, premium product-launch feel.
```

### Motion rules

| Element | Motion |
|---|---|
| Cards / panels | Slide up 24px + fade in, 400ms ease-out, 80ms stagger |
| Cursor | Glides on a curved path, 1 click ripple per action |
| Buttons | Scale 0.96 on click, orange pulse when idle |
| Vote counters | Count up with a 1.1× bounce on each change |
| List reorder | Smooth position swap, 500ms |
| Status pills | Color + label morph, 300ms |
| Toasts / notifications | Slide in from top-right, hold 1.5s |
| Pointing moments | Orange highlight ring or subtle zoom on whatever she points to |

---

## 6. Captions

- Burned-in captions under the presenter (most people watch muted).
- White bold text with a soft dark shadow, max 2 lines, 5–7 words per line.
- Highlight key words in orange: **guesses**, **nobody**, **your users**, **vote**, **ships**, **Start listening**.

---

## 7. Vertical version (9:16 for Reels / TikTok / Shorts)

- Canvas 1080×1920.
- **Top 60%:** left-side UI animation (scaled, phone mockups centered).
- **Bottom 40%:** presenter, chest-up, centered.
- Captions sit between the two halves.
- Same script and timing.

---

## 8. Production workflow (all AI, no filming)

1. **Generate the voice** from the script in Section 3 with the TTS settings in Section 2 (ElevenLabs, HeyGen or similar). Export it as one audio file.
2. **Generate the presenter** in an AI avatar tool (HeyGen, Synthesia, Hedra). Use the character prompt from Section 2 and upload the voice file so her lips sync to it. Render her on a plain background, or green screen if the tool offers it.
3. **Animate the UI frames** from Section 9 in an image-to-video tool (Kling, Runway, Veo, Luma). Upload each PNG and paste its motion prompt. Where a scene has two frames, use them as **start and end frames**.
4. **Combine** in the editor: the UI clips on the left at 60%, the presenter on the right at 40%. Trim each UI clip so its action lands on her matching line.
5. **Add captions**, a light background music bed (ducked under the voice), and soft UI click/whoosh sound effects.
6. **Export** 16:9 (1080p) and 9:16 versions.

---

## 9. UI frames to animate (left side)

Twelve ready-made PNGs in [`video-frames/`](video-frames/), 2304×2160 (the left 60% of a 1080p frame at 2× resolution). They use the real Fewchurs look: sidebar, feature rows, vote buttons, status pills, API key dialog and the Flutter SDK snippet. The demo app is "Habit Tracker".

For every frame, add this to the motion prompt so the AI doesn't rewrite the text:

```
Keep all text, logos and UI layout exactly as in the image. Do not add, remove or change any text.
Only animate the motion described. Smooth, eased, premium product-demo motion. No camera shake.
```

| # | File | Scene | Time | Motion prompt |
|---|---|---|---|---|
| 1 | `01-hook-guesses.png` | Hook | 0–6s | The sticky notes drop onto the document one at a time with a slight bounce, then a red marker line strikes through each note, left to right. |
| 2 | `02-problem-flatline.png` | Problem | 6–14s | The "Shipped" card pops in from above with a bounce. The red usage line draws from left to right, rises a little, then flattens out. The "0.4%" counts down from 100%. |
| 3 | `03-solution-intro.png` | Solution | 14–21s | The Fewchurs logo scales up with a soft orange glow, then the tagline fades in. The phone slides up from the bottom, and the orange "Request a feature" button pulses twice. |
| 4 | `04a-create-app-form.png` | Step 1 | 21–25s | "Habit Tracker" types into the app name field letter by letter. The iOS, Android and Web chips light up orange one after another. The cursor glides to "Create app" and clicks with a soft ripple. |
| 5 | `04b-api-key-copied.png` | Step 1 | 25–29s | The "Your API key" dialog scales in over the dimmed dashboard. The cursor clicks the copy button, it turns green with a check, and a "Copied" toast slides in from the bottom right. |
| 6 | `05-sdk-connected.png` | Step 2 | 29–37s | The code types in line by line in the dark editor. The tabs across the top (SwiftUI, Flutter, Next.js, Kotlin, React, Laravel) highlight in turn. Then the "SDK connected" card pops in and its green dot pulses. |
| 7 | `06a-phone-submit-request.png` | Step 3 | 37–42s | "Dark mode" types into the Title field, then the description types in. The cursor taps the orange "Submit" button, which presses down and springs back. |
| 8 | `06b-phone-votes-ranked.png` | Step 3 | 42–49s | Vote counts tick up with small bounces. "Dark mode" moves up the list to first place, passing the other rows, and its orange highlight ring glows. |
| 9 | `07a-dashboard-requests.png` | Step 4 | 49–53s | The dashboard rows slide in from below with a slight stagger, sorted by votes. The top row, "Dark mode", gets a soft highlight and its "New" badge pulses. |
| 10 | `07b-status-pills.png` | Step 4 | 53–57s | The pills light up in order: Pending → Planned → In progress → Done, one per beat, with arrows drawing between them. The "Dark mode" row turns green with a confetti burst, then the "followers notified" line fades in. |
| 11 | `07c-phone-shipped-notification.png` | Step 4 | 57–60s | The lock screen is still. The "Shipped! 🎉 Dark mode is live" notification slides down from the top with a gentle bounce. |
| 12 | `08-cta.png` | CTA | 60–70s | "Stop guessing." fades up, then "Start listening." appears in orange. The logo and "fewchurs.com" fade in, and the "Start free →" button pulses gently until the end. |

### Start and end frames

Image-to-video tools that accept two frames give the most accurate motion. Use these pairs:

| Clip | Start frame | End frame |
|---|---|---|
| Create app → API key | `04a-create-app-form.png` | `04b-api-key-copied.png` |
| Submit → ranked votes | `06a-phone-submit-request.png` | `06b-phone-votes-ranked.png` |
| Dashboard → shipped | `07a-dashboard-requests.png` | `07b-status-pills.png` |

### Phone frames in the vertical version

For 9:16, the phone frames (3, 7, 8 and 11) work best at full height in the top section. Crop the other frames to their centre card.
