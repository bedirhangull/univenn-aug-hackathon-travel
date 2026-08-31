import type { CrowdLevel } from './types';

/**
 * How crowding is shown, everywhere it is shown.
 *
 * Lives outside both the card and the map so the two cannot drift — a stop
 * marked quiet in the itinerary and amber on the map would undermine the one
 * claim this app makes. Kept out of `plan-map.tsx` as well, so the chat screen
 * does not pull the WebView into its bundle just to read a colour.
 *
 * Green / amber / red reads as go / caution / crowded without a legend, and the
 * legend is there anyway for anyone it does not.
 */
export const CROWD_COLOR: Record<CrowdLevel, string> = {
  quiet: '#16a34a',
  moderate: '#d97706',
  busy: '#dc2626',
};

export const CROWD_LABEL: Record<CrowdLevel, string> = {
  quiet: 'Quiet',
  moderate: 'Steady',
  busy: 'Crowded',
};

export const CROWD_ORDER: CrowdLevel[] = ['quiet', 'moderate', 'busy'];
