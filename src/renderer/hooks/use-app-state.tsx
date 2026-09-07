/**
 * App State Context
 * Lightweight state management using React Context
 * All state is stored in Electron and accessed via IPC
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { type AppState, RunningState } from '@/types/app-state';

interface AppStateContextType {
  runningState: RunningState;
  appState: AppState | null;
  updateAppState: (updates: Partial<AppState>) => Promise<void>;
}

// Singleton manager persisted across HMR to provide a single source of truth
const GLOBAL_KEY = '__APP_STATE_MANAGER__';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalAny = globalThis as any;

type Subscriber = (s: AppState | null) => void;

class AppStateManager {
  state: AppState | null = null;
  subscribers = new Set<Subscriber>();
  pollingId: number | null = null;
  unsubscribeIPC: (() => void) | null = null;
  initialized = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  normalize(raw: any): AppState | null {
    if (!raw) return null;
    return {
      isLoggedIn: raw.isLoggedIn,
      isBackendLive: raw.isBackendLive,
      runningState: raw.runningState,
      transcripts: raw.transcripts ?? [],
      liveSuggestions: raw.liveSuggestions ?? [],
      actionSuggestions: raw.actionSuggestions ?? [],
      credits: raw.credits,
      userRole: raw.userRole,
      providedLLMModel: raw.providedLLMModel,
      interviewConfig: raw.interviewConfig ?? { fullName: '', hasProfileData: false },
      interviewConfigLoaded: raw.interviewConfigLoaded ?? false,
      // Defaults false, which is the safe direction: a main process that does not send it offers
      // the wizard rather than silently retiring it.
      onboardingCompleted: raw.onboardingCompleted ?? false,
      accountEmail: raw.accountEmail ?? '',
      // Defaults false, which is the safe direction: an older main that does not send it makes
      // the save prompt silent rather than making it fire on every Clear with nothing to save.
      hasHistory: raw.hasHistory ?? false,
      mockInterview: raw.mockInterview ?? null,
      hasMockContent: raw.hasMockContent ?? false,
      // Defaults null rather than false, which is the safe direction here: a main process that
      // does not send it leaves the feature reachable instead of retiring it over a field it was
      // never going to set.
      mockInterviewSupported: raw.mockInterviewSupported ?? null,
    };
  }

  emit() {
    for (const s of this.subscribers) s(this.state);
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    // Subscribe BEFORE the first fetch. refreshState is an IPC round-trip, and main only
    // pushes - it never replays - so any broadcast landing during that await was lost.
    // Guarding on unsubscribeIPC rather than `initialized` also makes this idempotent under
    // HMR, where the manager survives on globalThis and init can run again.
    if (window.electronAPI?.onAppStateUpdated) {
      if (!this.unsubscribeIPC) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.unsubscribeIPC = window.electronAPI.onAppStateUpdated((raw: any) => {
          this.state = this.normalize(raw);
          this.emit();
        });
      }
    } else if (!this.pollingId) {
      this.pollingId = window.setInterval(() => void this.refreshState(), 1000);
    }

    await this.refreshState();
  }

  async refreshState() {
    try {
      if (!window.electronAPI?.appState) return;
      const raw = await window.electronAPI.appState.get();
      this.state = this.normalize(raw);
      this.emit();
    } catch (err) {
      console.error('[AppStateManager] refreshState failed', err);
    }
  }

  async updateAppState(updates: Partial<AppState>) {
    try {
      if (!window.electronAPI?.appState) return;
      const raw = await window.electronAPI.appState.update(updates);
      this.state = this.normalize(raw);
      this.emit();
    } catch (err) {
      console.error('[AppStateManager] updateAppState failed', err);
    }
  }

  subscribe(fn: Subscriber) {
    this.subscribers.add(fn);
    // lazy init when first subscriber registers
    void this.init();
    // emit current value synchronously
    fn(this.state);
    return () => {
      // Deliberately keep the IPC subscription for the app's lifetime. Tearing it down at zero
      // subscribers reopened the drop window on every re-init, and StrictMode's double mount
      // plus ordinary route changes both drive the count to zero routinely.
      this.subscribers.delete(fn);
    };
  }
}

const manager: AppStateManager =
  globalAny[GLOBAL_KEY] ?? (globalAny[GLOBAL_KEY] = new AppStateManager());

/**
 * The current app state without subscribing to it - for call sites that are not React components
 * (a Zustand store action, for instance) and so cannot call the `useAppState` hook below.
 */
export function getAppStateSnapshot(): AppState | null {
  return manager.state;
}

export const useAppState = (): AppStateContextType => {
  const [appState, setAppState] = useState<AppState | null>(manager.state);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const unsub = manager.subscribe((s) => {
      if (isMounted.current) setAppState(s);
    });
    return () => {
      isMounted.current = false;
      unsub();
    };
  }, []);

  const updateAppState = useCallback(async (updates: Partial<AppState>) => {
    await manager.updateAppState(updates);
  }, []);

  return useMemo(
    () => ({ runningState: appState?.runningState || RunningState.Idle, appState, updateAppState }),
    [appState, updateAppState]
  );
};
