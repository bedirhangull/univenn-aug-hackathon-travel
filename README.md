# HeroUI Native Example App

This is a React Native project with [HeroUI Native](https://github.com/heroui-inc/heroui-native) - a modern UI library that provides beautiful and customizable components for React Native applications.

## Ritmo — travel routes that skip the crowds

A vlog with a million views turns four places into a bottleneck. Paste one into
Ritmo and it swaps the overrun landmarks for quieter places nearby that give you
the same thing, then puts the result on a map.

Every stop carries a crowd level, every substitution names the crowded place it
replaces, and the plan lists what it deliberately routed around — so the trade
is visible rather than implied.

### The flow

`Ritmo card on the home screen → onboarding → planner → map`

1. **Onboarding** asks who is travelling, what has to work on the ground, and
   how you eat. The answers become a profile in `TravelSessionProvider`, and
   every plan is built against it — allergies are passed to the model as hard
   rules, access needs remove stops that will not work.
2. **The planner** is the chat screen. Paste a link, watch three honest stages
   run, get an itinerary card.
3. **The map** (`View my plan`) drops every located stop on OpenStreetMap,
   coloured by how busy it is, joined in route order.

The profile lives in memory only — the app ships no storage dependency, so a
cold start runs the flow again. The onboarding screen stays usable as a showcase
too: without `?flow=ritmo` it backs out instead of handing off to the planner.

### Setup

```bash
cp .env.example .env.local   # then fill in the keys and restart the dev server
```

| Variable | Required | What it does |
| --- | --- | --- |
| `EXPO_PUBLIC_SERPAPI_KEY` | yes | Fetches the video transcript ([get one](https://serpapi.com/manage-api-key)) |
| `EXPO_PUBLIC_GEMINI_API_KEY` | one of the two | Writes the itinerary with Gemini 2.5 Flash ([get one](https://aistudio.google.com/apikey)) |
| `EXPO_PUBLIC_ANTHROPIC_API_KEY` | one of the two | Writes it with Claude Opus 5 instead ([get one](https://console.anthropic.com/settings/keys)) |

Gemini wins if both are set. With neither, the app degrades to a transcript
outline (chapters plus proper nouns) rather than pretending to plan a trip.

> **`EXPO_PUBLIC_*` values are inlined into the JS bundle**, so anyone with the
> app can read them. Fine for a hackathon with throwaway keys; before shipping,
> move both calls behind a server and keep the keys there.

### How it works

`link → transcript → plan`, and the UI shows exactly those three stages while
they run — no invented progress steps.

1. `helpers/travel/youtube.ts` pulls the video id out of whatever was pasted
   (watch, `youtu.be`, shorts, embed, live, bare id, or a link mid-sentence).
2. `helpers/travel/serpapi.ts` calls SerpAPI's `youtube_video_transcript`
   engine over plain HTTP — MCP is a build-time tool and is not reachable from
   a running app.
3. `helpers/travel/plan-generator.ts` asks the model for strict JSON, then
   normalises it defensively. What it defends against, all seen in real
   responses: unknown place kinds, an unknown crowd level (defaults to
   `moderate`, never `quiet` — claiming a place is empty is the one error this
   app must not make), coordinates at `0,0` or out of range or missing half a
   pair, timestamps copied back with the transcript's `[mm:ss]` brackets
   (stripped and shape-checked, because a dead citation is worse than none), and
   an `avoided` entry with no replacement (dropped — it is a complaint, not a
   substitution). A video that is not about travel comes back as a plain
   explanation instead of a fake plan.

### Code map

| Path | Role |
| --- | --- |
| `src/app/(home)/travel/index.tsx` | The planner (chat) screen |
| `src/app/(home)/travel/map.tsx` | The route map |
| `src/app/(home)/showcases/travel-onboarding.tsx` | The profile questions |
| `src/components/travel/` | Composer, bubbles, stage progress, itinerary card, map |
| `src/contexts/travel-session-context.tsx` | Profile and active plan, shared across the three screens |
| `src/helpers/travel/` | Pipeline: link parsing, SerpAPI, plan generation |
| `src/helpers/travel/crowd.ts` | The one crowd palette both the card and the map read |
| `src/helpers/travel/motion.ts` | Spring presets (damping ratio + response) |
| `src/helpers/hooks/use-travel-chat.ts` | Conversation state and stage machine |

The map is Leaflet in a WebView, not a native map module: `react-native-maps`
and `expo-maps` both need a native rebuild and, on Android, a Google Maps key.
OpenStreetMap tiles need neither. Swapping to a native map later only touches
`plan-map.tsx`.

Motion follows Apple's fluid-interface guidance: springs rather than fixed
durations so anything on screen stays interruptible, overshoot only where a
gesture earned it, one shared progress value per interaction so a drawer and
its chevron cannot drift apart, and a reduced-motion path that cross-fades
instead of sliding.

## Get started

1. Clone the repository

   ```bash
   git clone https://github.com/heroui-inc/heroui-native-example.git
   cd heroui-native-example
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Start the app

   ```bash
   npx expo start
   ```

4. (Optional) Clean git history for a fresh start

   ```bash
   rm -rf .git
   git init
   git add .
   git commit -m "Initial commit"
   ```

You can start developing by editing the files inside the **src/app** directory. This project uses file-based routing with Expo Router.

## Get a fresh project

When you're ready to start with a clean slate, run:

```bash
npm run reset-project
```

This command will move the current **src** directory to **app-example-src** and create a new **src/app** directory with basic HeroUI Native setup where you can start developing.

## About HeroUI Native

HeroUI Native is a comprehensive UI library built for React Native that provides:

- Beautiful, accessible components out of the box
- Consistent design system
- TypeScript support
- Customizable theming
- Modern styling with Uniwind/Tailwind CSS

Learn more about HeroUI Native at: https://github.com/heroui-inc/heroui-native
