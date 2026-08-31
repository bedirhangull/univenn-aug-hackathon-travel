/**
 * Runtime configuration for the travel pipeline.
 *
 * SECURITY: `EXPO_PUBLIC_*` values are inlined into the JS bundle at build time,
 * so anyone with the app can read them. That is acceptable for a hackathon demo
 * with throwaway keys, but a shipped app must move both calls behind a server
 * (an Expo API route or any small proxy) and keep the keys there.
 */

const read = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const SERPAPI_KEY = read(process.env.EXPO_PUBLIC_SERPAPI_KEY);
export const GEMINI_KEY = read(process.env.EXPO_PUBLIC_GEMINI_API_KEY);
export const ANTHROPIC_KEY = read(process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY);

export type LlmProvider = 'gemini' | 'anthropic' | 'none';

/** Gemini wins when both are set — it is the cheaper, faster of the two here. */
export const activeProvider: LlmProvider = GEMINI_KEY
  ? 'gemini'
  : ANTHROPIC_KEY
    ? 'anthropic'
    : 'none';

/** Language the generated plan is written in. */
export const PLAN_LANGUAGE = 'English';

/** Transcript language requested from SerpAPI. */
export const TRANSCRIPT_LANGUAGE = 'en';

/** SerpAPI transcript calls took ~10s in practice; leave real headroom. */
export const SERPAPI_TIMEOUT_MS = 30_000;
export const LLM_TIMEOUT_MS = 60_000;
