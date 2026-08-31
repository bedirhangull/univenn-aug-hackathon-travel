/**
 * Turns a video transcript into a `TravelPlan`.
 *
 * Three paths, picked by which key is present at build time:
 *   - Gemini  (EXPO_PUBLIC_GEMINI_API_KEY)    — preferred
 *   - Claude  (EXPO_PUBLIC_ANTHROPIC_API_KEY) — alternative
 *   - none    — a chapter-derived outline, badged as such so it never pretends
 *               to be a synthesised plan
 */

import {
  ANTHROPIC_KEY,
  GEMINI_KEY,
  LLM_TIMEOUT_MS,
  PLAN_LANGUAGE,
  activeProvider,
} from './config';
import {
  PipelineError,
  type AvoidedSpot,
  type CrowdLevel,
  type PlaceKind,
  type PlanDay,
  type PlanPlace,
  type TravelPlan,
  type TravelerProfile,
  type VideoTranscript,
} from './types';
import { watchUrl } from './youtube';

const PLACE_KINDS: PlaceKind[] = [
  'sight',
  'food',
  'stay',
  'activity',
  'transit',
];

const CROWD_LEVELS: CrowdLevel[] = ['quiet', 'moderate', 'busy'];

/** Transcripts run long; this keeps the prompt well inside every context window. */
const MAX_DIGEST_CHARS = 14_000;

const SYSTEM_PROMPT = `You are Ritmo. You read travel-video transcripts and build day-by-day routes that deliberately steer around overtourism.

A viral vlog sends thousands of people to the same handful of spots. Those places are now queues, and the neighbourhoods around them are buckling under the load. Your job is to keep what makes the destination worth the trip while moving the traveller onto quieter places nearby that deliver the same thing.

You receive an auto-generated transcript with [mm:ss] timestamps, the video's chapters when it has them, and sometimes a traveller profile. Auto-captions are noisy: place names are often misspelled and sentences run together. Infer the intended names.

Reply with a single JSON object and nothing else. Two shapes are valid.

If the video is not about visiting a place (fiction, gaming, music, tutorials, news, product reviews):
{"isTravel": false, "reason": "<one sentence, max 20 words, saying what the video is actually about>"}

Otherwise:
{
  "isTravel": true,
  "destination": "<city or region, title case>",
  "tagline": "<max 10 words capturing the trip's character>",
  "durationLabel": "<e.g. '3 days'>",
  "bestSeason": "<the quieter shoulder window, e.g. 'Late September to October'>",
  "budgetLabel": "<e.g. 'Mid-range'>",
  "crowdSummary": "<one sentence, max 25 words, on how this route sits against the crowds>",
  "avoided": [
    {
      "name": "<famous overcrowded spot this route skips>",
      "reason": "<max 18 words: the concrete problem — queue length, day-tripper volume, local pressure>",
      "insteadGo": "<the name of the stop in this plan that replaces it>"
    }
  ],
  "days": [
    {
      "day": 1,
      "title": "<max 6 words>",
      "summary": "<one sentence on the day's shape>",
      "places": [
        {
          "name": "<place name>",
          "kind": "sight" | "food" | "stay" | "activity" | "transit",
          "crowdLevel": "quiet" | "moderate" | "busy",
          "alternativeTo": "<the crowded landmark this stop stands in for — omit if it is not a substitution>",
          "lat": <decimal degrees>,
          "lng": <decimal degrees>,
          "note": "<max 18 words on why it is worth it>",
          "timeHint": "<e.g. 'Early morning', 'After the day-trippers leave'>",
          "sourceTimestamp": "<the [mm:ss] where it appears, or omit>"
        }
      ]
    }
  ],
  "tips": ["<max 20 words each>"]
}

Rules on crowds — these are the point of the product:
- Most stops must be "quiet" or "moderate". Include a "busy" stop only when nothing nearby substitutes for it, and then give it a timeHint that dodges the peak.
- Every substitution must set alternativeTo, naming the crowded place it replaces. That is what the traveller is trading away, so be specific.
- List 1 to 4 entries in "avoided": the well-known spots from the video, or from the destination generally, that this route routes around. Each needs a concrete reason, not a vague one.
- Prefer neighbourhoods, towns and businesses that keep the money local over the ones already saturated with visitors.

Other rules:
- Ground the route in the transcript's destination. You may introduce quieter nearby places the video never mentions — that is the substitution — but do not relocate the trip to a different region.
- 2 to 5 days, 2 to 5 places per day, 2 to 4 tips.
- Set sourceTimestamp on any stop the transcript actually mentions — it is how the traveller checks your work. Leave it off the places you introduced.
- lat and lng are best-estimate decimal degrees for the real place. If you are not reasonably sure, omit both rather than guessing.
- Order days as a route someone could actually walk or drive.
- Write every user-facing string in ${PLAN_LANGUAGE}.`;

// -- Prompt input -------------------------------------------------------------

/**
 * The onboarding answers, as prompt text. Allergies are stated as hard rules
 * because getting them wrong is a safety problem, not a taste problem.
 */
function buildProfileBlock(profile?: TravelerProfile): string {
  if (!profile) return '';

  const lines: string[] = [];

  if (profile.companion) {
    const kids = profile.kidAges.length
      ? ` (children: ${profile.kidAges.join(', ')})`
      : '';
    lines.push(`Travelling as: ${profile.companion}${kids}`);
  }
  if (profile.accessNeeds.length) {
    lines.push(
      `Must work for: ${profile.accessNeeds.join(', ')} — drop any stop that does not.`
    );
  }
  if (profile.allergies.length) {
    lines.push(
      `HARD RULE, allergies: ${profile.allergies.join(', ')}. Never suggest a food stop that cannot safely accommodate these.`
    );
  }
  if (profile.diets.length) {
    // Stated as a requirement on the food stops, not a note about the person.
    // Phrased loosely ("Eats: Vegetarian") the model still recommended a
    // restaurant famous for offal.
    lines.push(
      `Every food stop must have real options for: ${profile.diets.join(', ')}. Do not suggest a place whose menu works against this.`
    );
  }

  return lines.length ? `TRAVELLER PROFILE\n${lines.join('\n')}\n\n` : '';
}

function buildDigest(
  transcript: VideoTranscript,
  profile?: TravelerProfile
): string {
  const profileBlock = buildProfileBlock(profile);

  const chapterBlock = transcript.chapters.length
    ? `CHAPTERS\n${transcript.chapters
        .map((chapter) => `[${chapter.timeText}] ${chapter.title}`)
        .join('\n')}\n\n`
    : '';

  const lines: string[] = [];
  let budget = MAX_DIGEST_CHARS - chapterBlock.length - profileBlock.length;

  for (const cue of transcript.cues) {
    const line = `[${cue.timeText}] ${cue.text}`;
    if (line.length > budget) break;
    lines.push(line);
    budget -= line.length + 1;
  }

  return `${profileBlock}${chapterBlock}TRANSCRIPT\n${lines.join('\n')}`;
}

// -- Providers ----------------------------------------------------------------

async function postJson(
  url: string,
  init: RequestInit,
  signal?: AbortSignal
): Promise<unknown> {
  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), LLM_TIMEOUT_MS);
  const onCallerAbort = () => timeoutController.abort();
  if (signal) {
    if (signal.aborted) timeoutController.abort();
    else signal.addEventListener?.('abort', onCallerAbort);
  }

  try {
    const response = await fetch(url, {
      ...init,
      signal: timeoutController.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new PipelineError(
        response.status === 429 ? 'rate-limited' : 'llm-failed',
        response.status === 429
          ? 'The AI provider is rate limiting us. Try again in a moment.'
          : `The AI provider rejected the request (${response.status}). ${body.slice(0, 160)}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof PipelineError) throw error;
    throw new PipelineError(
      'network',
      'Could not reach the AI provider. Check the connection and try again.'
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener?.('abort', onCallerAbort);
  }
}

async function callGemini(
  digest: string,
  signal?: AbortSignal
): Promise<string> {
  const json = (await postJson(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(GEMINI_KEY!)}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: digest }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4,
          // Extraction, not reasoning. Measured on a real transcript, turning
          // thinking off cut the call from 15.6s to 10.6s and the model stopped
          // omitting bestSeason/budgetLabel — faster and better here.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    },
    signal
  )) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = json.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('');

  if (!text) {
    throw new PipelineError('llm-failed', 'Gemini returned an empty response.');
  }
  return text;
}

async function callClaude(
  digest: string,
  signal?: AbortSignal
): Promise<string> {
  const json = (await postJson(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_KEY!,
        'anthropic-version': '2023-06-01',
        // Needed only when the app runs on web, harmless on native.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-opus-5',
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        // Low effort keeps the chat responsive; the task is extraction, not reasoning.
        output_config: { effort: 'low' },
        messages: [{ role: 'user', content: digest }],
      }),
    },
    signal
  )) as { content?: { type?: string; text?: string }[] };

  const text = (json.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('');

  if (!text) {
    throw new PipelineError('llm-failed', 'Claude returned an empty response.');
  }
  return text;
}

// -- Parsing ------------------------------------------------------------------

/** Models occasionally wrap JSON in prose or a fence; take the outermost object. */
function extractJsonObject(raw: string): unknown {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new PipelineError(
      'llm-failed',
      'The AI response was not valid JSON. Try that link again.'
    );
  }

  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    throw new PipelineError(
      'llm-failed',
      'The AI response was not valid JSON. Try that link again.'
    );
  }
}

const str = (value: unknown, fallback = ''): string =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

const optionalStr = (value: unknown): string | undefined => {
  const text = str(value);
  return text || undefined;
};

/**
 * The transcript is fed in as `[mm:ss] text`, and the model often copies the
 * brackets straight into sourceTimestamp. Left alone that renders a citation
 * reading "[5:55]" whose deep link is dead, so strip the notation and only keep
 * values that are actually a timestamp — a bad citation is worse than none.
 */
const timestamp = (value: unknown): string | undefined => {
  const raw = str(value).replace(/[[\]\s]/g, '');
  return /^\d{1,3}(:[0-5]\d){1,2}$/.test(raw) ? raw : undefined;
};

/** Only accept coordinates that are real numbers inside the real range. */
const coordinate = (value: unknown, limit: number): number | undefined => {
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) return undefined;
  if (Math.abs(parsed) > limit) return undefined;
  // 0,0 is in the Atlantic — it is the shape a missing value takes, not a place.
  return parsed === 0 ? undefined : parsed;
};

function normalizePlaces(value: unknown): PlanPlace[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry): PlanPlace | null => {
      if (typeof entry !== 'object' || entry === null) return null;
      const record = entry as Record<string, unknown>;
      const name = str(record.name);
      if (!name) return null;

      const rawKind = str(record.kind).toLowerCase() as PlaceKind;
      const rawCrowd = str(record.crowdLevel).toLowerCase() as CrowdLevel;

      const lat = coordinate(record.lat, 90);
      const lng = coordinate(record.lng, 180);

      return {
        name,
        kind: PLACE_KINDS.includes(rawKind) ? rawKind : 'sight',
        // Default to 'moderate', never 'quiet': claiming a place is empty when
        // the model did not say so is the one error this app must not make.
        crowdLevel: CROWD_LEVELS.includes(rawCrowd) ? rawCrowd : 'moderate',
        alternativeTo: optionalStr(record.alternativeTo),
        // A half-known position cannot be pinned, so keep the pair together.
        ...(lat !== undefined && lng !== undefined ? { lat, lng } : {}),
        note: optionalStr(record.note),
        timeHint: optionalStr(record.timeHint),
        sourceTimestamp: timestamp(record.sourceTimestamp),
      };
    })
    .filter((place): place is PlanPlace => place !== null)
    .slice(0, 6);
}

function normalizeAvoided(value: unknown): AvoidedSpot[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry): AvoidedSpot | null => {
      if (typeof entry !== 'object' || entry === null) return null;
      const record = entry as Record<string, unknown>;
      const name = str(record.name);
      const insteadGo = str(record.insteadGo);
      // Without a replacement it is just a complaint, so it earns no row.
      if (!name || !insteadGo) return null;

      return { name, reason: str(record.reason), insteadGo };
    })
    .filter((spot): spot is AvoidedSpot => spot !== null)
    .slice(0, 4);
}

function normalizeDays(value: unknown): PlanDay[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry, index): PlanDay | null => {
      if (typeof entry !== 'object' || entry === null) return null;
      const record = entry as Record<string, unknown>;
      const places = normalizePlaces(record.places);
      if (places.length === 0) return null;

      return {
        day: typeof record.day === 'number' ? record.day : index + 1,
        title: str(record.title, `Day ${index + 1}`),
        summary: str(record.summary),
        places,
      };
    })
    .filter((day): day is PlanDay => day !== null)
    .slice(0, 7)
    .map((day, index) => ({ ...day, day: index + 1 }));
}

function toPlan(raw: unknown, transcript: VideoTranscript): TravelPlan {
  if (typeof raw !== 'object' || raw === null) {
    throw new PipelineError('llm-failed', 'The AI response had no plan in it.');
  }

  const record = raw as Record<string, unknown>;

  if (record.isTravel === false) {
    throw new PipelineError(
      'not-travel',
      str(
        record.reason,
        'That video is not about visiting a place, so there is no itinerary to build.'
      )
    );
  }

  const days = normalizeDays(record.days);
  if (days.length === 0) {
    throw new PipelineError(
      'not-travel',
      'I could not find any places worth planning around in that video.'
    );
  }

  const tips = Array.isArray(record.tips)
    ? record.tips
        .map((tip) => str(tip))
        .filter(Boolean)
        .slice(0, 5)
    : [];

  return {
    destination: str(record.destination, 'Your trip'),
    tagline: str(record.tagline, 'Pulled from the video you shared'),
    durationLabel: str(record.durationLabel, `${days.length} days`),
    bestSeason: optionalStr(record.bestSeason),
    budgetLabel: optionalStr(record.budgetLabel),
    crowdSummary: optionalStr(record.crowdSummary),
    days,
    avoided: normalizeAvoided(record.avoided),
    tips,
    source: {
      videoId: transcript.videoId,
      url: watchUrl(transcript.videoId),
      cueCount: transcript.cues.length,
      chapterCount: transcript.chapters.length,
    },
    generatedBy: 'ai',
  };
}

// -- Outline fallback ---------------------------------------------------------

const NOT_A_PLACE = new Set([
  'the',
  'and',
  'but',
  'this',
  'that',
  'they',
  'them',
  'then',
  'there',
  'here',
  'what',
  'when',
  'where',
  'which',
  'with',
  'your',
  'yeah',
  'okay',
  'well',
  'just',
  'like',
  'really',
  'actually',
  'chapter',
  'more',
  'scenes',
  'because',
  'about',
  'from',
  'into',
  'over',
  'after',
  'before',
  'today',
  'tomorrow',
  'guys',
  'welcome',
  'subscribe',
  'channel',
  'video',
]);

/**
 * A rough pass over the transcript for capitalised phrases that look like
 * proper nouns. Single words need to repeat before we trust them; a multi-word
 * phrase is distinctive enough on its own.
 */
function guessPlaceNames(transcript: VideoTranscript): string[] {
  const counts = new Map<string, { count: number; firstAt: string }>();
  const pattern = /\b[A-Z][a-z]{2,}(?:\s+(?:[A-Z][a-z]{2,}|of|de|del|la|le)){0,2}\b/g;

  for (const cue of transcript.cues) {
    for (const match of cue.text.match(pattern) ?? []) {
      const phrase = match.trim();
      const words = phrase.split(/\s+/);
      if (words.every((word) => NOT_A_PLACE.has(word.toLowerCase()))) continue;
      if (NOT_A_PLACE.has(words[0].toLowerCase())) continue;

      const existing = counts.get(phrase);
      if (existing) existing.count += 1;
      else counts.set(phrase, { count: 1, firstAt: cue.timeText });
    }
  }

  return [...counts.entries()]
    .filter(([phrase, meta]) => phrase.includes(' ') || meta.count >= 3)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 12)
    .map(([phrase]) => phrase);
}

function buildOutline(transcript: VideoTranscript): TravelPlan {
  const names = guessPlaceNames(transcript);
  const segments = transcript.chapters.length >= 2 ? transcript.chapters : [];

  const days: PlanDay[] = segments.length
    ? segments.slice(0, 5).map((chapter, index) => ({
        day: index + 1,
        title: chapter.title.replace(/^Chapter\s*\d+:\s*/i, '').slice(0, 60),
        summary: `From the video's chapter at ${chapter.timeText}.`,
        places: names.slice(index * 2, index * 2 + 2).map((name) => ({
          name,
          kind: 'sight' as PlaceKind,
          crowdLevel: 'moderate' as CrowdLevel,
          sourceTimestamp: chapter.timeText,
        })),
      }))
    : [
        {
          day: 1,
          title: 'Mentioned in the video',
          summary: 'Names picked out of the transcript, in the order they came up.',
          places: names.slice(0, 5).map((name) => ({
            name,
            kind: 'sight' as PlaceKind,
            crowdLevel: 'moderate' as CrowdLevel,
          })),
        },
      ];

  const withPlaces = days.filter((day) => day.places.length > 0);

  if (withPlaces.length === 0) {
    throw new PipelineError(
      'not-travel',
      'Without an AI key I can only read chapters and proper nouns, and this video has neither. Add EXPO_PUBLIC_GEMINI_API_KEY for real plans.'
    );
  }

  return {
    destination: names[0] ?? 'Unnamed trip',
    tagline: 'Outline only — no AI key configured',
    durationLabel: `${withPlaces.length} segments`,
    // No model, so no honest claim about crowds and no substitutions to offer.
    crowdSummary: undefined,
    days: withPlaces.map((day, index) => ({ ...day, day: index + 1 })),
    avoided: [],
    tips: [
      'This is a transcript outline, not a real itinerary. Add EXPO_PUBLIC_GEMINI_API_KEY to .env.local to get a planned route.',
    ],
    source: {
      videoId: transcript.videoId,
      url: watchUrl(transcript.videoId),
      cueCount: transcript.cues.length,
      chapterCount: transcript.chapters.length,
    },
    generatedBy: 'outline',
  };
}

// -- Entry point --------------------------------------------------------------

export async function generatePlan(
  transcript: VideoTranscript,
  profile?: TravelerProfile,
  signal?: AbortSignal
): Promise<TravelPlan> {
  if (activeProvider === 'none') {
    return buildOutline(transcript);
  }

  const digest = buildDigest(transcript, profile);
  const raw =
    activeProvider === 'gemini'
      ? await callGemini(digest, signal)
      : await callClaude(digest, signal);

  return toPlan(extractJsonObject(raw), transcript);
}
