import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ConnectingNotice from '@/components/custom/connecting-notice';
import ControlPanel from '@/components/custom/control-panel';
import { LoadingPage } from '@/components/custom/loading';
import ActionSuggestionsPanel from '@/components/custom/panels/action-suggestions-panel';
import DockResizeHandle from '@/components/custom/panels/dock-resize-handle';
import LiveSuggestionsPanel from '@/components/custom/panels/live-suggestions-panel';
import TranscriptPanel from '@/components/custom/panels/transcript-panel';
import PermissionGateDialog from '@/components/custom/permission-gate-dialog';
import StatusPanel from '@/components/custom/status-panel';
import { TransitionOverlay } from '@/components/custom/transition-overlay';
import TrialUserNotice from '@/components/custom/trial-user-notice';
import { useAppState } from '@/hooks/use-app-state';
import { useAssistantService } from '@/hooks/use-assistant-service';
import { useConfigStore } from '@/hooks/use-config-store';
import useIsStealthMode from '@/hooks/use-is-stealth-mode';
import { useSuggestionMode } from '@/hooks/use-suggestion-mode';
import { useTranscriptPanel } from '@/hooks/use-transcript-panel';
import {
  DOCK_HANDLE_HEIGHT,
  isMac,
  SUGGESTION_MIN_HEIGHT,
  TRANSCRIPT_DOCK_MAX_HEIGHT,
  TRANSCRIPT_DOCK_MIN_HEIGHT,
  TRANSCRIPT_DOCK_RATIO,
} from '@/lib/consts';
import { getElectron } from '@/lib/utils';
import { RunningState, UserRole } from '@/types/app-state';
import { type ActionSuggestion, type LiveSuggestion } from '@/types/suggestion';
import { type Transcript } from '@/types/transcript';

export default function MainPage() {
  const navigate = useNavigate();

  const { config, isLoading: configLoading, loadConfig, updateConfig } = useConfigStore();
  const { stopAssistant } = useAssistantService();
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [liveSuggestions, setLiveSuggestions] = useState<LiveSuggestion[]>([]);
  const [actionSuggestions, setActionSuggestions] = useState<ActionSuggestion[]>([]);
  const [transcriptHeight, setTranscriptHeight] = useState<number | null>(null);
  const [suggestionHeight, setSuggestionHeight] = useState<number | null>(null);
  const [trialNoticeClosed, setTrialNoticeClosed] = useState(false);

  // The height the user dragged the dock to, null while it is sized automatically. Held here
  // rather than read straight off the config so a drag stays smooth: it updates every frame and
  // only reaches the store on release.
  const [dockPref, setDockPref] = useState<number | null>(null);
  const [dockMax, setDockMax] = useState<number>(TRANSCRIPT_DOCK_MAX_HEIGHT);

  // App state from context
  const { appState } = useAppState();

  const { visible: transcriptDockEnabled, toggle: toggleTranscriptDock } = useTranscriptPanel();
  const { toggle: toggleSuggestionMode } = useSuggestionMode();

  // Listen for hotkey to stop assistant
  useEffect(() => {
    if (!window?.electronAPI?.onHotkeyStopAssistant) return;

    const cleanup = window.electronAPI.onHotkeyStopAssistant(() => {
      stopAssistant().catch((err) => {
        console.error('Failed to stop assistant from hotkey:', err);
      });
    });

    return cleanup;
  }, [stopAssistant]);

  // Listen for hotkey to toggle the transcription dock. Stealth mode hides the control panel
  // that carries the button, so the hotkey is the only way to reach the dock there.
  useEffect(() => {
    if (!window?.electronAPI?.onHotkeyToggleTranscript) return;

    return window.electronAPI.onHotkeyToggleTranscript(toggleTranscriptDock);
  }, [toggleTranscriptDock]);

  // Same reasoning for the suggestion mode: the control panel button is gone in stealth mode,
  // and this is a control the candidate may want to flip mid-question.
  useEffect(() => {
    if (!window?.electronAPI?.onHotkeyToggleSuggestionMode) return;

    return window.electronAPI.onHotkeyToggleSuggestionMode(toggleSuggestionMode);
  }, [toggleSuggestionMode]);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Adopt the stored dock height once config arrives. Writes go the other way on release only,
  // so this settles on the value we just persisted rather than fighting the drag.
  useEffect(() => {
    if (config?.transcriptDockHeight !== undefined) {
      setDockPref(config.transcriptDockHeight);
    }
  }, [config?.transcriptDockHeight]);

  const commitDockHeight = useCallback(
    (height: number | null) => {
      setDockPref(height);
      updateConfig({ transcriptDockHeight: height }).catch((e) =>
        console.error('Failed to persist transcript dock height', e)
      );
    },
    [updateConfig]
  );

  const hasLiveSuggestions = liveSuggestions.length > 0;
  const hasActionSuggestions = actionSuggestions.length > 0;
  const hasTranscripts = transcripts.length > 0;
  // An empty transcript dock is not worth the vertical space while screenshots need it.
  const hideTranscriptPanel = hasActionSuggestions && !hasTranscripts;

  const hasSuggestions = hasLiveSuggestions || hasActionSuggestions;

  const showTranscriptDock = transcriptDockEnabled && !hideTranscriptPanel;

  // stable compute function so other effects can trigger a recompute
  // include the panel flags in deps to avoid stale closure
  const computeAvailable = useCallback(() => {
    if (typeof window === 'undefined') return;
    const title = document.getElementById('titlebar')?.getBoundingClientRect().height || 0;
    let status = document.getElementById('status-panel')?.getBoundingClientRect().height || 0;
    let control = document.getElementById('control-panel')?.getBoundingClientRect().height || 0;
    const extra = 8; // spacing/padding between elements

    if (status > 0) status += 4; // account for border
    if (control > 0) control += 4; // account for border

    const available = Math.max(100, window.innerHeight - (title + status + control + extra));

    // Border plus the drag handle, which only exists when the two share the area.
    const between = 4 + DOCK_HANDLE_HEIGHT;
    const maxDock = Math.max(
      TRANSCRIPT_DOCK_MIN_HEIGHT,
      available - SUGGESTION_MIN_HEIGHT - between
    );
    setDockMax(maxDock);

    // Docked alone the transcript takes everything; sharing, it takes a slice and never
    // squeezes the suggestion row below SUGGESTION_MIN_HEIGHT.
    let dock = 0;
    if (showTranscriptDock) {
      if (!hasSuggestions) {
        dock = available;
      } else if (dockPref !== null) {
        // A dragged height is a decision, so it is clamped only to what fits. The automatic
        // MAX exists to stop the dock helping itself to the panel, not to overrule a choice.
        dock = Math.min(Math.max(TRANSCRIPT_DOCK_MIN_HEIGHT, dockPref), maxDock);
      } else {
        dock = Math.min(
          Math.max(
            TRANSCRIPT_DOCK_MIN_HEIGHT,
            Math.min(TRANSCRIPT_DOCK_MAX_HEIGHT, Math.round(available * TRANSCRIPT_DOCK_RATIO))
          ),
          maxDock
        );
      }
    }
    setTranscriptHeight(dock);

    // Suggestion panels sit side by side, so they share the full height left above the dock.
    setSuggestionHeight(
      hasSuggestions
        ? Math.max(SUGGESTION_MIN_HEIGHT, available - dock - (dock > 0 ? between : 0))
        : 0
    );
  }, [hasSuggestions, showTranscriptDock, dockPref]);

  const isStealth = useIsStealthMode();

  const [startupPermGateOpen, setStartupPermGateOpen] = useState(false);
  const startupPermChecked = useRef(false);

  useEffect(() => {
    if (!isMac || startupPermChecked.current) return;
    if (configLoading || !appState?.isBackendLive || appState.isLoggedIn !== true) return;
    startupPermChecked.current = true;
    getElectron()
      ?.permissions.checkAll()
      .then((perms) => {
        const micBlocked = perms.mic === 'denied' || perms.mic === 'restricted';
        const screenBlocked = perms.screen === 'denied' || perms.screen === 'restricted';
        if (micBlocked || screenBlocked) setStartupPermGateOpen(true);
      })
      .catch(() => {});
  }, [configLoading, appState?.isBackendLive, appState?.isLoggedIn]);

  // Compute available space when page is navigated to. Deferred a tick so the titlebar, status
  // and control rows it measures have been laid out, and cleared on unmount so a navigation
  // away mid-tick does not measure a torn-down tree.
  useEffect(() => {
    const id = window.setTimeout(() => {
      computeAvailable();
    }, 10);
    return () => window.clearTimeout(id);
  }, [computeAvailable]);

  // compute panel height by subtracting hotkeys/control/video heights from viewport
  // placed here so hooks order is stable across renders (avoids conditional-hook errors)
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    computeAvailable();
    window.addEventListener('resize', computeAvailable, { passive: true });

    return () => {
      window.removeEventListener('resize', computeAvailable);
    };
  }, [computeAvailable]);

  // Recompute when panels mount/unmount
  useEffect(() => {
    computeAvailable();
  }, [
    hasActionSuggestions,
    hasLiveSuggestions,
    hasTranscripts,
    hideTranscriptPanel,
    showTranscriptDock,
    computeAvailable,
  ]);

  // Recompute when stealth mode toggles
  useEffect(() => {
    computeAvailable();
  }, [isStealth, computeAvailable]);

  // Recompute when the assistant's running state changes.
  //
  // Keyed on `runningState` alone. `appState` is a fresh object on every push from main, which
  // during an interview is every streamed suggestion chunk and every ASR partial - several times
  // a second. Each run does three getBoundingClientRect() calls, so having it in the dependency
  // list forced a synchronous layout on the renderer for every token that arrived, while the
  // panel it was measuring had not changed size at all. None of the other inputs to the layout
  // live on appState; they all have effects of their own above.
  useEffect(() => {
    computeAvailable();
  }, [appState?.runningState, computeAvailable]);

  // Memoized styles to prevent unnecessary re-renders
  const transcriptStyle = useMemo(
    () => ((transcriptHeight ?? 0) > 0 ? { height: `${transcriptHeight}px` } : undefined),
    [transcriptHeight]
  );
  const suggestionStyle = useMemo(() => ({ height: `${suggestionHeight}px` }), [suggestionHeight]);

  // Sync app state to local state - remove local state from deps to avoid infinite loops
  useEffect(() => {
    if (appState?.transcripts && appState.transcripts !== transcripts) {
      setTranscripts(appState.transcripts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState?.transcripts]);
  useEffect(() => {
    if (appState?.liveSuggestions && appState.liveSuggestions !== liveSuggestions) {
      setLiveSuggestions(appState.liveSuggestions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState?.liveSuggestions]);
  useEffect(() => {
    if (appState?.actionSuggestions && appState.actionSuggestions !== actionSuggestions) {
      setActionSuggestions(appState.actionSuggestions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState?.actionSuggestions]);

  // Redirect to login if not logged in
  const _redirectedToLogin = useRef(false);

  useEffect(() => {
    if (appState?.isLoggedIn !== false || _redirectedToLogin.current) return;

    _redirectedToLogin.current = true;
    const id = window.setTimeout(() => {
      navigate('/auth/login', { replace: true });
    }, 500);
    return () => window.clearTimeout(id);
  }, [appState?.isLoggedIn, navigate]);

  // Show loading if not logged in (fallback)
  if (appState?.isLoggedIn === false) {
    return <LoadingPage disclaimer="Redirecting to login…" />;
  }

  // Show loading if auth status is unknown
  if (appState?.isLoggedIn === null) {
    return <LoadingPage disclaimer="Authenticating…" />;
  }

  // Show loading if config or app state is not loaded yet
  if (configLoading || !appState) {
    return <LoadingPage disclaimer="Loading…" />;
  }

  return (
    <div className="flex-1 flex flex-col w-full bg-background p-1 space-y-1">
      {appState.isBackendLive === false && <ConnectingNotice />}

      <div className="flex-1 flex flex-col overflow-y-hidden gap-1">
        {/* Top: Suggestions, side by side */}
        {hasSuggestions && (
          <div className="flex-1 min-h-0 flex gap-1">
            {hasLiveSuggestions && (
              <div className="flex-1 min-w-0">
                <LiveSuggestionsPanel
                  suggestions={liveSuggestions}
                  style={suggestionStyle}
                  isRunning={appState?.runningState === RunningState.Running}
                />
              </div>
            )}
            {hasActionSuggestions && (
              <div className="flex-1 min-w-0">
                <ActionSuggestionsPanel
                  actionSuggestions={actionSuggestions}
                  style={suggestionStyle}
                  isRunning={appState?.runningState === RunningState.Running}
                />
              </div>
            )}
          </div>
        )}

        {/* Show trial user notice */}
        {appState?.userRole === UserRole.TrialUser && !trialNoticeClosed && (
          <TrialUserNotice onClick={() => setTrialNoticeClosed(true)} />
        )}

        {!hasSuggestions && !showTranscriptDock && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Transcription is hidden</p>
          </div>
        )}

        {/* Bottom dock: Transcription, spanning the full width. The handle only appears when the
            dock shares the area with suggestions - docked alone it already fills it, so there is
            nothing to trade height against. */}
        {showTranscriptDock && (
          <>
            {hasSuggestions && (
              <DockResizeHandle
                height={transcriptHeight ?? TRANSCRIPT_DOCK_MIN_HEIGHT}
                min={TRANSCRIPT_DOCK_MIN_HEIGHT}
                max={dockMax}
                onResize={setDockPref}
                onCommit={commitDockHeight}
              />
            )}
            <div className="shrink-0" style={transcriptStyle}>
              <TranscriptPanel
                transcripts={transcripts}
                isRunning={appState?.runningState === RunningState.Running}
              />
            </div>
          </>
        )}
      </div>

      <ControlPanel />

      {isStealth && (
        <StatusPanel
          runningState={appState?.runningState ?? RunningState.Idle}
          credits={appState?.credits ?? 0}
          llmModel={appState?.providedLLMModel ?? ''}
          userRole={appState?.userRole}
        />
      )}

      <PermissionGateDialog
        open={startupPermGateOpen}
        onOpenChange={setStartupPermGateOpen}
        onProceed={() => {}}
        proceedLabel="Continue"
      />
      <TransitionOverlay />
    </div>
  );
}
