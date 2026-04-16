# VAR — Voyage Adaptive Reviews
**Ask what matters. Ask it once. Make it feel like the end of the trip.**
Link: [expedia-var.vercel.app](expedia-var.vercel.app)

VAR is a working Next.js + Supabase + OpenAI prototype built for the **2026 Wharton AI & Analytics Hack-AI-Thon** (presented by Expedia). Instead of forcing travelers through a static post-trip review form, VAR turns the review into the closing beat of the trip: a cinematic JFK → destination → property flight, two AI-generated questions grounded in that property's *own* review history, and a one-click AI-synthesized review (title + body + per-category ratings) at the end.

The core bet: **one gap-targeted question + one verification question** generated from a property-specific review corpus outperforms a generic multi-field form on every dimension that matters — submission rate, data freshness, and structured signal per review.

---

## Table of Contents

1. [What VAR Actually Does](#what-var-actually-does)
2. [The User Flow](#the-user-flow)
3. [Architecture at a Glance](#architecture-at-a-glance)
4. [Tech Stack](#tech-stack)
5. [Quick Start](#quick-start)
6. [Environment Variables](#environment-variables)
7. [Data Layer — Supabase Schema](#data-layer--supabase-schema)
8. [The AI Pipeline](#the-ai-pipeline)
9. [The Animation State Machine](#the-animation-state-machine)
10. [Project Layout](#project-layout)
11. [API Routes](#api-routes)
12. [Design System](#design-system)
13. [How VAR Maps to the Hackathon Brief](#how-var-maps-to-the-hackathon-brief)
14. [Contributing / Extending](#contributing--extending)
15. [Troubleshooting](#troubleshooting)

---

## What VAR Actually Does

Traditional post-trip review forms suffer from five pain points (per the hackathon brief):

1. Some topics are over-covered while important details are missing.
2. Reviews go stale — amenities, policies, and renovations change.
3. Updates come reactively from suppliers, not proactively from reviewers.
4. Static prompts ask travelers about things the platform already knows (*"how great was the pool?"*).
5. Long forms crush submission rates.

VAR addresses all five with one idea: **read the existing review corpus first, compute what's missing and what's stale, then ask one targeted question and one structured verification question.** The output is a complete AI-synthesized review with inferred per-category ratings, written back into the database and immediately usable for discovery and ranking.

Everything is wrapped in a continuous globe-to-map-to-globe animation so the review never feels like homework.

---

## The User Flow

```
┌────────┐     ┌──────────────┐     ┌──────────────┐     ┌────────┐     ┌──────────────┐     ┌────────┐     ┌─────────┐
│ Setup  │ ──▶ │ Globe        │ ──▶ │ Crossfade    │ ──▶ │ Map    │ ──▶ │ Crossfade    │ ──▶ │ Globe  │ ──▶ │ Summary │
│ Picker │     │ Outbound     │     │ globe → map  │     │ Review │     │ map → globe  │     │ Return │     │ + Share │
└────────┘     └──────────────┘     └──────────────┘     └────────┘     └──────────────┘     └────────┘     └─────────┘
   pick         JFK → DEST            opacity tween        2 Qs            opacity tween        DEST →       AI review
   property    + review card                               per stop                             JFK          + clipboard
```

1. **Setup (yellow landing screen).** The user picks one of 13 real Supabase properties from a dropdown. Every trip always departs JFK.
2. **Globe outbound.** Camera flies from JFK to the destination airport along a yellow great-circle arc with animated dash. A review card slides in on arrival with the first AI-generated question.
3. **Crossfade to map.** Globe and Mapbox dark-v11 map are mounted simultaneously and tweened via Framer Motion opacity so there's no hard cut.
4. **Map review.** Camera lands on the property marker. User answers the gap question, then the verification question (voice or text).
5. **Crossfade back to globe.** Map fades out, globe fades in, already centered on the destination.
6. **Globe return.** Reverse arc to JFK. While the plane is in the air, `submitAIReviews()` POSTs every answered stop to `/api/reviews/submit` in parallel.
7. **Summary card.** The AI-synthesized review title, body, and inferred ratings appear per stop, alongside the raw Q&A. Share-to-Instagram-Story / SMS / clipboard buttons close the loop.

The whole thing fits in a 3–4 minute real-time demo — no speed-ups, no cuts — exactly as the hackathon rules require.

---

## Architecture at a Glance

```
┌──────────────────────────── BROWSER ────────────────────────────┐
│                                                                 │
│   TripSetupPanel  ──▶  ExperienceFlow (phase state machine)     │
│                               │                                 │
│        ┌──────────────────────┼──────────────────────┐          │
│        ▼                      ▼                      ▼          │
│   GlobeExperience      DestinationMap          TripSummaryCard  │
│   (react-globe.gl)     (Mapbox GL JS)          (recap + share)  │
│                                                                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │ fetch
                               ▼
┌────────────────────────── NEXT.JS API ──────────────────────────┐
│                                                                 │
│  GET  /api/properties               → list (DB join lookup)     │
│  GET  /api/properties/[id]/insights → gap/freshness vector      │
│  GET  /api/properties/[id]/questions→ gap + verification Qs     │
│  GET  /api/properties/[id]/reviews  → recent reviews            │
│  POST /api/reviews/submit           → synthesize + persist      │
│  POST /api/reviews/analyze-typing   → typing cadence signal     │
│                                                                 │
└────────────────────┬────────────────────────┬───────────────────┘
                     │                        │
                     ▼                        ▼
            ┌────────────────┐        ┌────────────────┐
            │    Supabase    │        │   OpenAI API   │
            │  (Postgres)    │        │  gpt-4o-mini   │
            └────────────────┘        └────────────────┘
                description                insights.ts
                properties_aggregated      questions.ts
                property_reviews           review-synthesis.ts
```

**Key principle:** the pipeline is stateless per request. One API key, one DB, one model — no custom infra, no fine-tuning, no over-engineering.

---

## Tech Stack

| Layer        | Tech                                                                |
|--------------|---------------------------------------------------------------------|
| Framework    | **Next.js 16** (App Router, Turbopack) · **TypeScript**             |
| Styling      | **Tailwind CSS** with custom `brand.*` tokens · **Framer Motion**   |
| 3D / Maps    | **react-globe.gl** (Three.js, blue-marble Earth) · **Mapbox GL JS** |
| State        | React hooks · phase state machine (`lib/experience.ts`)             |
| Validation   | **Zod v4** end-to-end (`TripConfig`, review submission payloads)    |
| Backend      | Next.js Route Handlers (App Router)                                 |
| Database     | **Supabase** (Postgres) — 3 tables, typed accessors                 |
| LLM          | **OpenAI** `gpt-4o-mini` — insights, questions, review synthesis    |
| Recency      | Half-life weighted decay (1-year half-life) in `lib/backend/halflife.ts` |

---

## Quick Start

```bash
# 1. Install
npm install

# 2. Environment
cp .env.example .env.local
# Edit .env.local (see Environment Variables section below)

# 3. Run
npm run dev
# → open http://localhost:3000
```

The dev server runs under Turbopack. The home page is the yellow Setup panel; pick any property from the dropdown and click **Start trip →**.

Other scripts:

```bash
npm run build   # Production build
npm start       # Serve the production build
npm run lint    # ESLint (Next config)
```

---

## Environment Variables

Create `.env.local` in `voyage-app/` with:

```bash
# ── Public (shipped to the client) ──
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...   # required for the city map

# ── Server only ──
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>    # used by the API route handlers only

OPENAI_API_KEY=sk-...                      # gpt-4o-mini
```

Files that read these:

| Variable                     | File                            |
|------------------------------|---------------------------------|
| `NEXT_PUBLIC_MAPBOX_TOKEN`   | `components/DestinationMapExperience.tsx` |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | `lib/backend/supabase.ts`  |
| `OPENAI_API_KEY`             | `lib/backend/openai.ts`         |

---

## Data Layer — Supabase Schema

VAR connects to a Supabase Postgres instance with three tables that mirror the hackathon challenge dataset:

| Table                    | Purpose                                                      |
|--------------------------|--------------------------------------------------------------|
| `description`            | One row per property: `eg_property_id`, city, province, country, star rating, Expedia guest rating |
| `properties_aggregated`  | Rollup metrics per property (avg ratings, topic coverage) |
| `property_reviews`       | Every individual review with text, timestamp, category ratings, synthesized title (from VAR)  |

Typed data access lives in **`lib/backend/database.ts`**:

```ts
getAllProperties()                  // drives the setup dropdown
getPropertyInsights(id)             // topic coverage + staleness
getRecentReviews(id, { limit })     // half-life-weighted
insertReview(id, payload)           // writes AI-synthesized review
```

Because the `description` table has no lat/lng columns, VAR ships a static in-code lookup at **`lib/propertyLocations.ts`** keyed on `eg_property_id`. It contains 13 real properties + their nearest major airport (IATA, name, coordinates). The `/api/properties` route INNER JOINS the live DB rows against this lookup so the dropdown only ever shows properties that have both a DB row and a known location.

### The 13 Properties

| City                      | Country      | Airport |
|---------------------------|--------------|---------|
| Pompei                    | Italy        | NAP     |
| Rome                      | Italy        | FCO     |
| Monterey, CA              | USA          | MRY     |
| Frisco, TX                | USA          | DFW     |
| Broomfield, CO            | USA          | DEN     |
| Bangkok                   | Thailand     | BKK     |
| Mbombela                  | South Africa | MQP     |
| Freudenstadt              | Germany      | STR     |
| San Isidro de El General  | Costa Rica   | SJO     |
| Bochum                    | Germany      | DUS     |
| Bell Gardens, CA          | USA          | LAX     |
| New Smyrna Beach, FL      | USA          | DAB     |
| Ocala, FL                 | USA          | MCO     |

---

## The AI Pipeline

VAR uses OpenAI `gpt-4o-mini` in three strict-JSON stages. Each stage is a single request with a system prompt that locks the response format.

### Stage 1 · Insight Extraction — `lib/backend/insights.ts`

**Input:** recent reviews for a property, weighted by `lib/backend/halflife.ts` using a 1-year half-life.
**Output:** a structured coverage vector — which topics are over-covered, which are missing, which are stale.

This is how VAR formalizes *"missing"* and *"stale"* as computable properties rather than gut calls.

### Stage 2 · Question Generation — `lib/backend/questions.ts`

**Input:** the Stage 1 insight vector.
**Output:**

```jsonc
{
  "gap_question": "...",          // targets a missing / stale topic
  "verification_question": "...", // short, structured confirmation
  "verification_type": "yes_no" | "multiple_choice" | "short_answer",
  "reasoning": "why this gap, why now, for this property"
}
```

The verification type rotates deterministically across reviewers so the property's review stream collects yes/no signal, multi-choice signal, and free-text signal over time — not all free-text. The `reasoning` field is surfaced to the user as the review-card subtitle and makes the *"why this question"* requirement from the brief trivially auditable.

### Stage 3 · Review Synthesis — `lib/backend/review-synthesis.ts`

**Input:** the two user answers + the two questions.
**Output:**

```jsonc
{
  "review_title": "Charming Trastevere pocket, thin walls",
  "review_body": "...",
  "inferred_ratings": {
    "cleanliness": 4,
    "staff": 5,
    "amenities": 3,
    "location": 5,
    "value": 4
  }
}
```

A full Expedia-style review — headline, prose, per-category 1–5 ratings — built from two short answers. The output is persisted to `property_reviews` via `insertReview()` and returned to the client so the summary card can show the AI-generated headline the user effectively authored.

### Supporting signals

- **`lib/backend/sentiment.ts`** — sentiment analysis on the answer body.
- **`lib/backend/translation.ts`** — language detection + passthrough translation.
- **`lib/backend/typing-analysis.ts`** — cadence analysis (exposed via `POST /api/reviews/analyze-typing`), used to gauge confidence and effort.

---

## The Animation State Machine

The entire UX is driven by a 7-state machine defined in **`lib/experience.ts`**:

```ts
type ExperiencePhase =
  | "setup"
  | "globe-outbound"
  | "transition-to-map"
  | "map-review"
  | "transition-to-globe"
  | "globe-return"
  | "summary";
```

`components/ExperienceFlow.tsx` is the orchestrator. It mounts the globe and the map simultaneously during transition phases and opacity-tweens between them using Framer Motion. The tween duration is centralized in `lib/animation.ts` as `GLOBE_TO_MAP_CROSSFADE_MS`.

**Globe modes.** `components/GlobeExperience.tsx` accepts a `mode: "outbound" | "return"` prop:

- **Outbound:** intro pause → departure camera beat → arc flight → destination emphasis → stop reveal → review card.
- **Return:** opens already centered on the destination (no intro), plays the reverse arc (start/end swapped so the dash direction reverses visually), holds briefly at origin, then calls `onReturnComplete()`.

**Parallel review submission.** When `handleItineraryComplete()` fires, the return flight starts *and* `submitAIReviews()` POSTs every stop to `/api/reviews/submit` in parallel via `Promise.allSettled`. By the time the user lands back at JFK, the synthesized title + body are already back from the server. A "Saving reviews to database…" indicator appears in the bottom-right if the network is slow.

---

## Project Layout

```
voyage-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                        # mounts ExperienceFlow + CinematicOverlay
│   └── api/
│       ├── properties/
│       │   ├── route.ts                # GET list
│       │   └── [id]/
│       │       ├── insights/route.ts   # GET coverage vector
│       │       ├── questions/route.ts  # GET gap + verification Qs
│       │       └── reviews/route.ts    # GET recent reviews
│       └── reviews/
│           ├── submit/route.ts         # POST synthesize + persist
│           └── analyze-typing/route.ts # POST typing cadence
│
├── components/
│   ├── ExperienceFlow.tsx              # phase state machine orchestrator
│   ├── TripSetupPanel.tsx              # yellow landing screen, dropdown picker
│   ├── GlobeExperience.tsx             # react-globe.gl; outbound + return modes
│   ├── DestinationMapExperience.tsx    # Mapbox GL JS; per-stop camera beats
│   ├── ReviewCard.tsx                  # gap + verification question UI
│   ├── StopReviewCard.tsx              # per-stop review panel
│   ├── TripSummaryCard.tsx             # AI review display + share menu
│   ├── RecapHighlightsPanel.tsx        # local recap section
│   ├── CinematicOverlay.tsx            # vignette + grain (z-5)
│   └── VarLogo.tsx                     # inline SVG wordmark fallback
│
├── lib/
│   ├── experience.ts                   # ExperiencePhase enum
│   ├── animation.ts                    # camera timings, crossfade duration
│   ├── propertyLocations.ts            # static lat/lng + airport lookup (13 props)
│   ├── presets.ts                      # buildTripFromProperty, fallback config
│   ├── tripSchema.ts                   # Zod TripConfig schema
│   ├── tripImportExport.ts             # JSON import / download
│   ├── tripAdapters.ts                 # TripConfig ↔ Itinerary / globe Trip
│   ├── itineraryData.ts                # client-side itinerary types
│   ├── tripData.ts                     # client-side globe Trip types
│   ├── map.ts                          # Mapbox style constants, route colors
│   ├── recap.ts                        # local recap narrative builder
│   ├── ids.ts                          # stop ID helpers
│   └── backend/
│       ├── supabase.ts                 # service-role client
│       ├── openai.ts                   # OpenAI client
│       ├── database.ts                 # typed accessors
│       ├── insights.ts                 # Stage 1: coverage/staleness vector
│       ├── questions.ts                # Stage 2: gap + verification Qs
│       ├── review-synthesis.ts         # Stage 3: title + body + ratings
│       ├── halflife.ts                 # recency decay weighting
│       ├── sentiment.ts
│       ├── translation.ts
│       ├── typing-analysis.ts
│       └── types.ts
│
├── public/
│   ├── logo.png                        # navy VAR wordmark (transparent)
│   └── var-logo.svg                    # fallback wordmark
│
├── styles/
│   └── globals.css                     # Tailwind layers + dark body default
│
├── tailwind.config.ts                  # brand.* color tokens
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## API Routes

All routes are Next.js App Router Route Handlers. Service-role keys never leave the server.

| Method | Path                                  | Purpose                                              |
|--------|---------------------------------------|------------------------------------------------------|
| GET    | `/api/properties`                     | List properties joined with `propertyLocations.ts`   |
| GET    | `/api/properties/[id]/insights`       | Stage 1 coverage + staleness vector                  |
| GET    | `/api/properties/[id]/questions`      | Stage 2 gap + verification questions (with `reasoning`) |
| GET    | `/api/properties/[id]/reviews`        | Recent reviews (half-life weighted)                  |
| POST   | `/api/reviews/submit`                 | Stage 3 synthesis + persist to `property_reviews`    |
| POST   | `/api/reviews/analyze-typing`         | Typing cadence analysis                              |

### `POST /api/reviews/submit` request shape

```jsonc
{
  "eg_property_id": "abc...",
  "gap_question": "...",
  "gap_answer": "...",
  "verification_question": "...",
  "verification_answer": "...",
  "verification_type": "yes_no" | "multiple_choice" | "short_answer"
}
```

### Response

```jsonc
{
  "ok": true,
  "synthesized": {
    "review_title": "...",
    "review_body": "...",
    "inferred_ratings": { "cleanliness": 4, "staff": 5, ... }
  }
}
```

---

## Design System

VAR's palette is codified as Tailwind `brand.*` tokens in **`tailwind.config.ts`** so there are no inline hex codes scattered across components.

| Token                   | Value     | Used for                                    |
|-------------------------|-----------|---------------------------------------------|
| `brand-yellow`          | `#FBCC33` | Expedia primary yellow — landing bg, accents|
| `brand-yellow-light`    | `#FDD85D` | Hover states on yellow buttons              |
| `brand-yellow-dark`     | `#E5B800` | Pressed / border variants                   |
| `brand-yellow-soft`     | `#FFF3C2` | Soft highlight panels on yellow             |
| `brand-navy`            | `#1A1F3A` | Matches the logo.png navy                   |
| `brand-navy-light`      | `#2A2F55` | Hover on the Start Trip button              |
| `brand-navy-dark`       | `#0F1223` | Pressed variants                            |
| `brand-dark`            | `#191A1F` | Body default (globe + map phases)           |
| `brand-dark-card`       | `#222328` | Summary card surface                        |
| `brand-dark-surface`    | `#2A2B31` | Inner surfaces on dark                      |

**Phase-dependent palettes.**

- **Setup phase (landing):** yellow background, navy content, white translucent card. The navy logo reads at maximum contrast here.
- **Globe / map phases:** dark `#191A1F` base — Mapbox dark-v11 and the blue-marble Earth texture look wrong on anything lighter. Start Trip is the deliberate "takeoff moment" from yellow to dark.
- **Summary phase:** dark card with yellow accents, same contrast as the review card on the map.

---

| Requirement                                    | VAR implementation                                              |
|--------------------------------------------------------|-----------------------------------------------------------------|
| Identify missing / outdated property information       | Stage 1 coverage vector + half-life decay (`insights.ts`, `halflife.ts`) |
| Generate 1–2 personalized, targeted questions          | Stage 2 gap + verification with deterministic type rotation (`questions.ts`) |
| Support voice and text input                           | `ReviewCard.tsx` wires the Web Speech API                       |
| Enrich the property knowledge base                     | Stage 3 synthesized review written via `insertReview()`         |
| Clear reasoning — *why this, why now*                  | Stage 2 returns an explicit `reasoning` field, shown in UI      |
| Low-friction interaction                               | Exactly 2 questions per stop, one dropdown landing, no forms    |
| "Complexity alone does not win"                        | 2 API routes, 1 DB, 1 model, flat architecture                  |


| Criterion                  | VAR's answer                                                                 |
|----------------------------|------------------------------------------------------------------------------|
| Innovation & Creativity    | Review reframed as the closing beat of a travel animation                    |
| Technical Implementation   | Real Supabase + real OpenAI + Zod end-to-end, half-life decay, verified IDs  |
| UX & Design                | Yellow Expedia landing, voice/text, 2 Qs, cinematic crossfades               |
| Opportunity & Impact       | Schema already production-shaped; swap-in ready                              |
| Feasibility & Scalability  | 1 Postgres + 1 key + 1 Next.js app; stateless per request; cheap model       |
| Presentation               | Entire flow fits a 3–4 min real-time demo with no cuts                       |

---

## License

MIT License · Built for the 2026 Wharton AI & Analytics Hack-AI-Thon, presented by Expedia.

**Ask what matters. Ask it once. Make it feel like the end of the trip.**
