/**
 * Owns the video -> itinerary conversation: message list, live stage progress,
 * and the one-at-a-time guarantee on the pipeline.
 */

import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { generatePlan } from '../travel/plan-generator';
import { fetchTranscript } from '../travel/serpapi';
import {
  isPipelineError,
  type ChatMessage,
  type Stage,
  type StageId,
} from '../travel/types';
import { extractVideoId } from '../travel/youtube';

const STAGE_LABELS: Record<StageId, string> = {
  link: 'Reading the link',
  transcript: 'Pulling the transcript',
  plan: 'Building the itinerary',
};

const STAGE_ORDER: StageId[] = ['link', 'transcript', 'plan'];

const idleStages = (): Stage[] =>
  STAGE_ORDER.map((id) => ({
    id,
    label: STAGE_LABELS[id],
    status: 'pending',
  }));

const nextId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** Long enough that a completed stage is legible before the next one starts. */
const STAGE_BEAT_MS = 260;
/** Hold a failed stage on screen so the cause of the error is visible. */
const FAILURE_HOLD_MS = 620;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useTravelChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stages, setStages] = useState<Stage[] | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const advance = useCallback((id: StageId, status: Stage['status']) => {
    if (!mountedRef.current) return;
    setStages((current) =>
      current
        ? current.map((stage) =>
            stage.id === id ? { ...stage, status } : stage
          )
        : current
    );
  }, []);

  const push = useCallback((message: ChatMessage) => {
    if (!mountedRef.current) return;
    setMessages((current) => [...current, message]);
  }, []);

  const submit = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || isBusy) return;

      const videoId = extractVideoId(text);

      push({
        id: nextId(),
        role: 'user',
        kind: 'text',
        text,
        videoId: videoId ?? undefined,
        createdAt: Date.now(),
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      if (!videoId) {
        // No pipeline to run — answer immediately rather than showing stages
        // for work that will never happen.
        await wait(220);
        push({
          id: nextId(),
          role: 'assistant',
          kind: 'text',
          tone: 'error',
          text: 'That does not look like a YouTube link. Paste a full watch, youtu.be, or shorts URL and I will read the video.',
          createdAt: Date.now(),
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
          () => {}
        );
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setIsBusy(true);
      setStages(idleStages());

      let failedStage: StageId = 'link';

      try {
        advance('link', 'active');
        await wait(STAGE_BEAT_MS);
        advance('link', 'done');

        failedStage = 'transcript';
        advance('transcript', 'active');
        const transcript = await fetchTranscript(videoId, controller.signal);
        advance('transcript', 'done');
        await wait(STAGE_BEAT_MS);

        failedStage = 'plan';
        advance('plan', 'active');
        const plan = await generatePlan(transcript, controller.signal);
        advance('plan', 'done');
        await wait(STAGE_BEAT_MS);

        if (!mountedRef.current || controller.signal.aborted) return;

        setStages(null);
        push({
          id: nextId(),
          role: 'assistant',
          kind: 'plan',
          plan,
          createdAt: Date.now(),
        });
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        ).catch(() => {});
      } catch (error) {
        if (!mountedRef.current || controller.signal.aborted) return;

        advance(failedStage, 'failed');
        await wait(FAILURE_HOLD_MS);
        if (!mountedRef.current) return;

        setStages(null);
        push({
          id: nextId(),
          role: 'assistant',
          kind: 'text',
          tone: 'error',
          text: isPipelineError(error)
            ? error.message
            : 'Something went wrong on the way to a plan. Try that link again.',
          createdAt: Date.now(),
        });
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        ).catch(() => {});
      } finally {
        if (mountedRef.current) {
          setIsBusy(false);
          if (abortRef.current === controller) abortRef.current = null;
        }
      }
    },
    [isBusy, advance, push]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setStages(null);
    setIsBusy(false);
  }, []);

  return { messages, stages, isBusy, submit, reset };
}
