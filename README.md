# HeroUI Native Example App

This is a React Native project with [HeroUI Native](https://github.com/heroui-inc/heroui-native) - a modern UI library that provides beautiful and customizable components for React Native applications.

## Wayfare — turn a travel video into a route

Paste a YouTube travel vlog into the chat screen and get back a day-by-day
itinerary, with every stop traceable to the timestamp it came from in the video.

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
   normalises it defensively: unknown place kinds fall back, dayless or
   placeless days are dropped, days are renumbered, and a video that is not
   about travel comes back as a plain explanation instead of a fake plan.

### Code map

| Path | Role |
| --- | --- |
| `src/app/(home)/travel/index.tsx` | The chat screen |
| `src/components/travel/` | Composer, bubbles, stage progress, itinerary card |
| `src/helpers/travel/` | Pipeline: link parsing, SerpAPI, plan generation |
| `src/helpers/travel/motion.ts` | Spring presets (damping ratio + response) |
| `src/helpers/hooks/use-travel-chat.ts` | Conversation state and stage machine |

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
