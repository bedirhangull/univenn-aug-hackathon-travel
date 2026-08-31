/**
 * A 0 -> 1 shared value that springs up once, on mount.
 *
 * Preferred over layout `entering` animations here because the caller keeps the
 * raw progress value: one spring can drive translate, scale and opacity at once,
 * which is what keeps a bubble's motion and its fade on the same frame instead
 * of two independently-timed animations that drift apart.
 */

import { useEffect } from 'react';
import {
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { SPRING, TIMING } from '../travel/motion';

export function useMountProgress(delayMs = 0): SharedValue<number> {
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // Reduced motion still gets feedback that something arrived — just a fade,
    // with no travel and no overshoot.
    progress.value = withDelay(
      delayMs,
      reducedMotion
        ? withTiming(1, TIMING.fade)
        : withSpring(1, SPRING.momentum)
    );
    // Runs once per mounted element; delay is fixed by the element's index.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return progress;
}
