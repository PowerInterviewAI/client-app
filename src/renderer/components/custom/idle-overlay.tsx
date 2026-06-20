import React from 'react';

import { useAppState } from '@/hooks/use-app-state';
import { RunningState } from '@/types/app-state';

export function IdleOverlay() {
  const { appState, updateAppState } = useAppState();

  if (!appState) return null;

  // only show overlay when not running and idle flag is set
  if (appState.runningState === RunningState.Running || !appState.isAppIdle) {
    return null;
  }

  const wake = () => {
    updateAppState({ isAppIdle: false });
  };

  return (
    <div
      className="fixed inset-0 z-9999 bg-black/60 text-white flex items-center justify-center cursor-pointer"
      onClick={wake}
      onKeyDown={wake}
      tabIndex={0}
      role="button"
    >
      <p className="text-sm font-medium">App is idle - click or press any key to wake.</p>
    </div>
  );
}
