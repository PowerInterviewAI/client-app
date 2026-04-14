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
      isGpuServerLive: raw.isGpuServerLive,
      runningState: raw.runningState,
      isAppIdle: raw.isAppIdle ?? false,
      transcripts: raw.transcripts ?? [],
      liveSuggestions: raw.liveSuggestions ?? [],
      actionSuggestions: raw.actionSuggestions ?? [],
      credits: raw.credits,
      providedLLMModel: raw.providedLLMModel,
    };
  }

  emit() {
    for (const s of this.subscribers) s(this.state);
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;
    await this.refreshState();

    if (window.electronAPI?.onAppStateUpdated) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.unsubscribeIPC = window.electronAPI.onAppStateUpdated((raw: any) => {
        this.state = this.normalize(raw);
        this.emit();
      });
    } else {
      this.pollingId = window.setInterval(() => void this.refreshState(), 1000);
    }
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
      this.subscribers.delete(fn);
      if (this.subscribers.size === 0) {
        // stop polling/ipc when no subscribers
        if (this.pollingId) {
          clearInterval(this.pollingId);
          this.pollingId = null;
        }
        if (this.unsubscribeIPC) {
          this.unsubscribeIPC();
          this.unsubscribeIPC = null;
        }
        this.initialized = false;
      }
    };
  }
}

const manager: AppStateManager =
  globalAny[GLOBAL_KEY] ?? (globalAny[GLOBAL_KEY] = new AppStateManager());

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
