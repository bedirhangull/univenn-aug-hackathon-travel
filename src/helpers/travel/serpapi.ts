/**
 * SerpAPI `youtube_video_transcript` client.
 *
 * MCP is a build-time tool and is not reachable from a running app, so the app
 * talks to SerpAPI over plain HTTP.
 */

import {
  SERPAPI_KEY,
  SERPAPI_TIMEOUT_MS,
  TRANSCRIPT_LANGUAGE,
} from './config';
import { PipelineError, type VideoTranscript } from './types';

const ENDPOINT = 'https://serpapi.com/search.json';

type RawCue = {
  start_ms?: number;
  snippet?: string;
  start_time_text?: string;
};

type RawChapter = {
  chapter?: string;
  start_ms?: number;
  start_time_text?: string;
};

type RawResponse = {
  error?: string;
  search_metadata?: { status?: string };
  transcript?: RawCue[];
  chapters?: RawChapter[];
};

const msToTimeText = (ms: number) => {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export async function fetchTranscript(
  videoId: string,
  signal?: AbortSignal
): Promise<VideoTranscript> {
  if (!SERPAPI_KEY) {
    throw new PipelineError(
      'missing-serpapi-key',
      'No SerpAPI key found. Add EXPO_PUBLIC_SERPAPI_KEY to .env.local and restart the dev server.'
    );
  }

  const query = [
    'engine=youtube_video_transcript',
    `v=${encodeURIComponent(videoId)}`,
    `language_code=${encodeURIComponent(TRANSCRIPT_LANGUAGE)}`,
    `api_key=${encodeURIComponent(SERPAPI_KEY)}`,
  ].join('&');

  // Two independent aborts: the caller's (user navigated away) and our timeout.
  const timeoutController = new AbortController();
  const timeout = setTimeout(
    () => timeoutController.abort(),
    SERPAPI_TIMEOUT_MS
  );
  const onCallerAbort = () => timeoutController.abort();
  if (signal) {
    if (signal.aborted) timeoutController.abort();
    else signal.addEventListener?.('abort', onCallerAbort);
  }

  let response: Response;
  try {
    response = await fetch(`${ENDPOINT}?${query}`, {
      signal: timeoutController.signal,
    });
  } catch {
    throw new PipelineError(
      signal?.aborted ? 'unknown' : 'network',
      'Could not reach SerpAPI. Check the connection and try again.'
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener?.('abort', onCallerAbort);
  }

  if (response.status === 429) {
    throw new PipelineError(
      'rate-limited',
      'SerpAPI rate limit reached. Wait a moment before the next link.'
    );
  }

  let json: RawResponse;
  try {
    json = (await response.json()) as RawResponse;
  } catch {
    throw new PipelineError(
      'unknown',
      'SerpAPI returned a response we could not read.'
    );
  }

  if (json.error) {
    // SerpAPI reports "no transcript" as a 200 with an error string.
    const noTranscript = /transcript/i.test(json.error);
    throw new PipelineError(
      noTranscript ? 'no-transcript' : 'unknown',
      noTranscript
        ? 'That video has no transcript, so there is nothing to read. Try a vlog with captions turned on.'
        : json.error
    );
  }

  if (!response.ok) {
    throw new PipelineError(
      'unknown',
      `SerpAPI request failed (${response.status}).`
    );
  }

  const cues = (json.transcript ?? [])
    .map((cue) => ({
      startMs: cue.start_ms ?? 0,
      text: (cue.snippet ?? '').trim(),
      timeText: cue.start_time_text ?? msToTimeText(cue.start_ms ?? 0),
    }))
    .filter((cue) => cue.text.length > 0);

  if (cues.length === 0) {
    throw new PipelineError(
      'no-transcript',
      'That video has no transcript, so there is nothing to read. Try a vlog with captions turned on.'
    );
  }

  const chapters = (json.chapters ?? [])
    .map((chapter) => ({
      title: (chapter.chapter ?? '').trim(),
      startMs: chapter.start_ms ?? 0,
      timeText: chapter.start_time_text ?? msToTimeText(chapter.start_ms ?? 0),
    }))
    .filter((chapter) => chapter.title.length > 0);

  return { videoId, cues, chapters };
}
