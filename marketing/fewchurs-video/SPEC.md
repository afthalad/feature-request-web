# Fewchurs explainer: SPEC

Follows the person's script and scene plan in `../fewchurs-explainer-video-prompt.md`, extended to about 2 minutes.

```text
GOAL:    a founder finishes the video knowing they can let their own users rank what to build, and visits fewchurs.com
OUTPUT:  HyperFrames, 1920 x 1080, 30 fps
TIME:    ~118 s x 30 = ~3540 frames; the voice is the clock (beats anchored to word times in transcript.json)
LAYOUT:  left stage x 0-1152 (UI), right presenter panel x 1176-1896, y 24-1056, radius 28, the avatar video cover-fit
LOOK:    ground #f5f4f2 flat; ink #2a2826; muted #77736e; accent #ed5f18 (the clicked control, the winning request,
         one word per title, the end card only); status colours grey #8a8680, blue #3b82f6, amber #f59e0b, green #10b981.
         Display face Be Vietnam Pro 800, 64-88 px, tracking -0.03em; UI text Be Vietnam Pro 500-600, 15-20 px at 1x;
         code Geist Mono 19 px.
         Medium: the real Fewchurs product UI (white cards, radius 22, shadow 0 30px 70px -40px rgba(0,0,0,.35),
         1px #e7e6e4 borders) and an iPhone (black bezel 13 px, radius 56).
OBJECTS: product doc with sticky notes; "Shipped" card + usage graph; phone running Habit Tracker; Fewchurs dashboard
         window (sidebar, create-app form, API key dialog, request list with vote buttons and status pills);
         dark code editor with the real Flutter snippet; lock screen with a push notification; dark end card.
MOTION:  arrivals expo.out 0.6-0.9 s; moves power2.inOut 0.5-0.8 s; exits power3.in, 40-50% of the entry;
         springs back.out(1.4) on vote counts and pills only; list stagger 60 ms; typing 22 chars/s;
         cursor glides power2.inOut 0.6 s, click = 0.12 s press to 0.94 scale.
SOUND:   voiceover (HeyGen voice) at 1.0; catalog music bed, warm and light, ~100 bpm, at 0.12 under the voice,
         lifting to 0.2 for the end card; clicks only on real cursor clicks, key ticks on typing, pops on votes and
         pills, one whoosh per scene change (2-3 takes rotated), one riser into the end card.
BANNED:  dark void ground with floating UI; glow/particles; purple/blue gradients; everything fading and sliding up;
         titles that move after landing; three cards in a row; corner logos; click rings; breathing loops on UI.
QA:      each scene's hero action lands on its word; text >= 28 px when it must be read at 1080;
         no UI enters the presenter panel; the end card holds >= 3 s.
```

## Scenes (left stage)

| # | id | Anchor words | Hero move |
|---|---|---|---|
| 1 | s01-guesses | "guesses", "hunch", "competitor", "opinion" | sticky notes slap onto the roadmap doc one per phrase |
| 2 | s02-flatline | "launch", "flat", "Nobody" | Shipped card lands, usage line draws then flattens, 0.4% counts down |
| 3 | s03-reveal | "Fewchurs", "inside your app" | the doc is struck through, the logo lands, the phone rises with the request button |
| 4 | s04-create | "create", "name", "iOS, Android or web", "API key" | name types, chips light, cursor clicks Create, API key dialog, Copied |
| 5 | s05-sdk | "SDK", the six platform names, "whole setup" | code types, tabs step through, SDK connected lands |
| 6 | s06-submit | "suggest", "dark mode" | "Dark mode" typed on the phone, Submit tapped |
| 7 | s07-votes | "votes", "rise to the top" | counters tick, Dark mode climbs to first |
| 8 | s08-dashboard | "dashboard", "ranked", "comments and followers" | rows stagger in by votes, meta highlights |
| 9 | s09-status | "planned", "in progress", "done" | the top row's pill steps through each status on its word, confetti on done |
| 10 | s10-shipped | "ships", "notified" | lock screen, notification drops in |
| 11 | s11-claim | "assumptions", "actually want" | type line, struck "assumptions" becomes "what people actually want" |
| 12 | s12-cta | "Stop guessing", "Start listening", "fewchurs.com" | full-width dark end card (presenter panel slides out), button lands |
