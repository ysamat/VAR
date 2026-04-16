# VAR — Demo Video

A 2–3 minute walkthrough of the VAR project, built with [Remotion](https://www.remotion.dev/) (React for videos).

## What it covers

Eight scenes totaling ~150 seconds at 30 fps:

1. **Hook** — You got back from a trip. Here's the email.
2. **Problem** — Why reviews today are broken.
3. **Solution** — Introducing VAR.
4. **Setup** — Picking the trip in the app.
5. **Globe** — The cinematic flight animation.
6. **AI Review** — The review card with AI-generated questions and real-time typing feedback.
7. **Sentiment** — How free-text answers become 1–10 ratings across 15 categories.
8. **Outro** — Value prop for guests, hotels, and future travelers.

## Getting started

```bash
cd video
npm install
npm start           # opens Remotion Studio in your browser
```

Remotion Studio is a hot-reloading preview. Edit any file in `src/scenes/` and the preview updates immediately.

## Rendering to MP4

```bash
npm run build
# outputs to out/var-demo.mp4
```

Remotion bundles ffmpeg, so no external install is needed. First render on a new machine downloads a Chromium build (~150 MB).

## Structure

```
src/
├── Root.tsx              # Remotion entry + composition registration
├── Video.tsx             # Scene schedule (timings live here)
├── theme.ts              # Brand palette mirroring voyage-app/tailwind.config.ts
├── components/
│   ├── AnimatedText.tsx  # Fade + slide-in text helper
│   ├── Brand.tsx         # Logo + wordmark
│   ├── Caption.tsx       # Bottom-band narration captions
│   └── MockPanel.tsx     # App UI mocks (review card, setup, etc.)
└── scenes/
    ├── Scene01_Hook.tsx
    ├── Scene02_Problem.tsx
    ├── Scene03_Solution.tsx
    ├── Scene04_Setup.tsx
    ├── Scene05_Globe.tsx
    ├── Scene06_AIReview.tsx
    ├── Scene07_Sentiment.tsx
    └── Scene08_Outro.tsx
```

## Adjusting timing

Scene durations live in `src/Video.tsx`. Change any `duration` value (in frames — 30 fps, so 300 = 10 s) and all subsequent scenes shift automatically.

## Adding voice-over

Remotion can embed audio via `<Audio src={staticFile("vo.mp3")} />`. Record narration, drop the file into `public/`, and wrap each scene in a `<Sequence>` whose timing matches the VO beats.

## Dropping in real screen recordings

The demo scenes (4–7) currently use simplified UI mocks. To replace a mock with actual app footage:

1. Record your screen at 1920×1080 (e.g. via OBS or the browser's built-in recorder).
2. Save to `public/recordings/<name>.mp4`.
3. In the relevant scene, replace the `<MockPanel>` with `<OffthreadVideo src={staticFile("recordings/<name>.mp4")} />`.

## Brand alignment

Colors and typography in `src/theme.ts` mirror `voyage-app/tailwind.config.ts` so the video reads as an extension of the product.
