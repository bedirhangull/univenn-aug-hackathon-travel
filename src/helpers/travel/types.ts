/**
 * Domain types for the video -> itinerary pipeline.
 *
 * The chat screen only ever renders these shapes, so the SerpAPI response and
 * whichever LLM produced the plan stay behind `plan-generator`.
 */

export type PlaceKind = 'sight' | 'food' | 'stay' | 'activity' | 'transit';

export type PlanPlace = {
  name: string;
  kind: PlaceKind;
  /** One short line on why this place is worth the stop. */
  note?: string;
  /** Human hint like `Morning` or `After sunset`, never a hard clock time. */
  timeHint?: string;
  /** Where in the source video this came from, e.g. `2:24`. */
  sourceTimestamp?: string;
};

export type PlanDay = {
  day: number;
  title: string;
  summary: string;
  places: PlanPlace[];
};

export type PlanSource = {
  videoId: string;
  url: string;
  /** Cue count we actually read — shown so the plan's basis is inspectable. */
  cueCount: number;
  chapterCount: number;
};

export type TravelPlan = {
  destination: string;
  tagline: string;
  durationLabel: string;
  bestSeason?: string;
  budgetLabel?: string;
  days: PlanDay[];
  tips: string[];
  source: PlanSource;
  /** `outline` means no LLM key was configured — chapters only, no synthesis. */
  generatedBy: 'ai' | 'outline';
};

// -- Transcript ---------------------------------------------------------------

export type TranscriptCue = {
  startMs: number;
  timeText: string;
  text: string;
};

export type VideoChapter = {
  title: string;
  startMs: number;
  timeText: string;
};

export type VideoTranscript = {
  videoId: string;
  cues: TranscriptCue[];
  chapters: VideoChapter[];
};

// -- Errors -------------------------------------------------------------------

export type PipelineErrorCode =
  | 'invalid-link'
  | 'missing-serpapi-key'
  | 'no-transcript'
  | 'rate-limited'
  | 'network'
  | 'not-travel'
  | 'llm-failed'
  | 'unknown';

/**
 * A failure we can explain to the user in one sentence. Anything we cannot
 * explain stays `unknown` and gets a generic message rather than a stack trace.
 */
export class PipelineError extends Error {
  readonly code: PipelineErrorCode;

  constructor(code: PipelineErrorCode, message: string) {
    super(message);
    this.name = 'PipelineError';
    this.code = code;
  }
}

export const isPipelineError = (error: unknown): error is PipelineError =>
  error instanceof PipelineError;

// -- Chat --------------------------------------------------------------------

export type ChatMessage =
  | {
      id: string;
      role: 'user';
      kind: 'text';
      text: string;
      /** Set only when the text parsed to a video — drives the bubble's chrome. */
      videoId?: string;
      createdAt: number;
    }
  | {
      id: string;
      role: 'assistant';
      kind: 'text';
      text: string;
      tone: 'default' | 'error';
      createdAt: number;
    }
  | {
      id: string;
      role: 'assistant';
      kind: 'plan';
      plan: TravelPlan;
      createdAt: number;
    };

/**
 * One stage per real unit of work — no invented steps. `link` is parsing,
 * `transcript` is the SerpAPI call, `plan` is the model call.
 */
export type StageId = 'link' | 'transcript' | 'plan';

export type StageStatus = 'pending' | 'active' | 'done' | 'failed';

export type Stage = {
  id: StageId;
  label: string;
  status: StageStatus;
};
