import { useEffect, useRef } from 'react';

import { RunningState } from '@/types/app-state';

import { useAppState } from './use-app-state';

const IDLE_MS = 30 * 60 * 1000; // 30 minutes

export function useIdleDetector() {
  const timeout = useRef<number | null>(null);
  const { appState, updateAppState } = useAppState();

  // Sync the latest reset into a ref after every render so event listeners always
  // call the current version without causing the event-listener effect to re-run.
  const resetRef = useRef<() => void>(() => {});
  useEffect(() => {
    resetRef.current = () => {
      if (timeout.current !== null) {
        window.clearTimeout(timeout.current);
      }
      if (appState?.isAppIdle) {
        updateAppState({ isAppIdle: false });
      }
      if (appState?.runningState !== RunningState.Running) {
        timeout.current = window.setTimeout(() => {
          updateAppState({ isAppIdle: true });
        }, IDLE_MS);
      }
    };
  });

  useEffect(() => {
    const handler = () => resetRef.current();
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'];

    events.forEach((evt) => window.addEventListener(evt, handler, { passive: true }));
    handler();

    return () => {
      if (timeout.current !== null) {
        window.clearTimeout(timeout.current);
      }
      events.forEach((evt) => window.removeEventListener(evt, handler));
    };
  }, [appState?.runningState]);
}
