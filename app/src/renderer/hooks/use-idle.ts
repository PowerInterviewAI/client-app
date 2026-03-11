import { useEffect, useRef } from 'react';

import { RunningState } from '@/types/app-state';

import { useAppState } from './use-app-state';

const IDLE_MS = 10 * 60 * 1000; // 10 minutes

export function useIdleDetector() {
  const timeout = useRef<number | null>(null);
  const { appState, updateAppState } = useAppState();

  const reset = () => {
    if (timeout.current !== null) {
      window.clearTimeout(timeout.current);
    }

    // if we were idle and the app is no longer idle, clear flag
    if (appState?.isAppIdle) {
      updateAppState({ isAppIdle: false });
    }

    // only start the timer if assistant isn't running
    if (appState?.runningState !== RunningState.Running) {
      timeout.current = window.setTimeout(() => {
        updateAppState({ isAppIdle: true });
      }, IDLE_MS);
    }
  };

  useEffect(() => {
    // include wheel/scroll activity as user interaction
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'];

    events.forEach((evt) => window.addEventListener(evt, reset, { passive: true }));

    // whenever running state changes we may need to stop/start the timer
    reset();

    return () => {
      if (timeout.current !== null) {
        window.clearTimeout(timeout.current);
      }
      events.forEach((evt) => window.removeEventListener(evt, reset));
    };
  }, [appState?.runningState]);
}
