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
      className="idle-overlay"
      onClick={wake}
      onKeyDown={wake}
      tabIndex={0}
      role="button"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        cursor: 'pointer',
      }}
    >
      <div>App is idle — click or press any key to wake.</div>
    </div>
  );
}
