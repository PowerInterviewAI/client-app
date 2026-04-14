/**
 * App State Service
 * Central manager for application runtime state shared across main process
 */

import {
  ActionSuggestion,
  AppState,
  LiveSuggestion,
  RunningState,
  Speaker,
  SuggestionState,
} from '../types/app-state.js';
import { getWindowReference } from './window-control.service.js';

const DEFAULT_STATE: AppState = {
  isStealth: false,
  isBackendLive: false,
  isGpuServerLive: false,
  isLoggedIn: false,
  runningState: RunningState.Idle,
  isAppIdle: false,
  transcripts: [],
  liveSuggestions: [],
  actionSuggestions: [],
  credits: undefined,
};

export class AppStateService {
  private state: AppState;

  constructor() {
    this.state = { ...DEFAULT_STATE };
    this.setPlaceholderState();
  }

  setPlaceholderState() {
    const tstampNow = Date.now();
    this.state = {
      ...this.state,
      // Set placeholder data to make it easier to visualize the UI during development
      transcripts: [
        {
          timestamp: tstampNow,
          text: 'Transcripts will be here',
          speaker: Speaker.Other,
          isFinal: false,
          endTimestamp: tstampNow + 5000,
        },
      ],
      liveSuggestions: [
        {
          timestamp: tstampNow,
          last_question: 'Interviewer questions will be here',
          answer: 'Suggested answers will be here in real-time',
          state: SuggestionState.Success,
          error: '',
        },
      ],
      actionSuggestions: [
        {
          timestamp: tstampNow,
          last_question: 'Interviewer questions will be here',
          answer:
            'Triggered suggestions will be here. For example, reply suggestion, coding test solution, diagram descriptions, etc.',
          image_urls: [null, null, null, null],
          state: SuggestionState.Success,
          error: '',
        },
      ],
    };
  }

  getState(): AppState {
    return { ...this.state };
  }

  updateState(updates: Partial<AppState>): AppState {
    this.state = { ...this.state, ...updates };
    const s = this.getState();
    // broadcast update to renderer if window available
    this.notifyRenderer();
    return s;
  }

  private notifyRenderer(): void {
    try {
      const win = getWindowReference();
      if (win && !win.isDestroyed()) {
        win.webContents.send('app-state-updated', this.getState());
      }
    } catch (e) {
      console.warn('Failed to broadcast app state update:', e);
    }
  }

  addLiveSuggestion(s: LiveSuggestion): void {
    this.state = { ...this.state, liveSuggestions: [...this.state.liveSuggestions, s] };
    this.notifyRenderer();
  }

  addActionSuggestion(s: ActionSuggestion): void {
    this.state = { ...this.state, actionSuggestions: [...this.state.actionSuggestions, s] };
    this.notifyRenderer();
  }
}

export const appStateService = new AppStateService();
