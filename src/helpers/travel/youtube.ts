/**
 * YouTube link parsing.
 *
 * People paste links inside sentences ("check this out: https://youtu.be/... 🔥"),
 * so every pattern is unanchored and we scan the whole string.
 */

const ID = '[a-zA-Z0-9_-]{11}';

const URL_PATTERNS = [
  // youtu.be/<id>
  new RegExp(`youtu\\.be/(${ID})`),
  // youtube.com/watch?v=<id> — `v` may sit after other params
  new RegExp(`youtube\\.com/watch\\?(?:[^\\s]*?&)?v=(${ID})`),
  // /shorts/<id>, /embed/<id>, /live/<id>, /v/<id>
  new RegExp(`youtube\\.com/(?:shorts|embed|live|v)/(${ID})`),
];

const BARE_ID = new RegExp(`^${ID}$`);

export function extractVideoId(input: string): string | null {
  const text = input.trim();
  if (!text) return null;

  for (const pattern of URL_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return BARE_ID.test(text) ? text : null;
}

export const watchUrl = (videoId: string) =>
  `https://www.youtube.com/watch?v=${videoId}`;

/** Collapses a pasted link to `youtu.be/<id>` so bubbles never wrap awkwardly. */
export const shortLabel = (videoId: string) => `youtu.be/${videoId}`;

/** `2:24` or `1:02:24` -> seconds, so a citation can open the video at the moment. */
export function timestampToSeconds(timeText: string): number | null {
  const parts = timeText.trim().split(':').map(Number);
  if (parts.length < 2 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }
  return parts.length === 3
    ? parts[0] * 3600 + parts[1] * 60 + parts[2]
    : parts[0] * 60 + parts[1];
}

export const watchUrlAt = (videoId: string, seconds: number) =>
  `${watchUrl(videoId)}&t=${Math.max(0, Math.floor(seconds))}s`;
