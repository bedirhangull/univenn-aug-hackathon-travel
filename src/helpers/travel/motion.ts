/**
 * Motion vocabulary for the travel screens.
 *
 * Apple's fluid-interface talks describe springs with two designer-facing
 * numbers — damping ratio (how much it overshoots) and response (how quickly it
 * reaches the target). Reanimated's duration-based spring takes exactly those
 * two, as `dampingRatio` + `duration`, so the values below are the shipped iOS
 * numbers rather than hand-tuned mass/stiffness guesses.
 *
 * The rule that governs which one to reach for: overshoot has to be earned by
 * momentum. A panel that simply appeared should settle flat (dampingRatio 1); a
 * card the user flicked, or a surface arriving from a press, may overshoot.
 */

import type { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';
import { Easing } from 'react-native-reanimated';

export const SPRING = {
  /** Default for anything that moves without a gesture behind it. */
  ui: { dampingRatio: 1, duration: 400 },
  /** Momentum-driven: a flick, a throw, a drag release. */
  momentum: { dampingRatio: 0.8, duration: 400 },
  /** Sheets, drawers, expanding disclosure. */
  sheet: { dampingRatio: 0.82, duration: 300 },
  /** Press feedback — has to land well inside human reaction time. */
  press: { dampingRatio: 1, duration: 180 },
} satisfies Record<string, WithSpringConfig>;

/**
 * Opacity and colour do not need spring physics, and a spring on opacity can
 * overshoot past 1 and clip. Timing curves are the right tool for fades.
 */
export const TIMING = {
  fade: { duration: 220, easing: Easing.out(Easing.quad) },
  fadeSlow: { duration: 400, easing: Easing.out(Easing.quad) },
} satisfies Record<string, WithTimingConfig>;

/** Stagger step for list reveals — long enough to read as a sequence. */
export const STAGGER_MS = 55;

/**
 * How far a bubble travels on entry. Small: the point is to hint direction,
 * not to make the user watch something fly across the screen.
 */
export const ENTER_OFFSET = 14;
