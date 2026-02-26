import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ConfigurationDialog from '@/components/custom/configuration-dialog';
import ControlPanel from '@/components/custom/control-panel';
import { LoadingPage } from '@/components/custom/loading';
import CodeSuggestionsPanel from '@/components/custom/panels/code-suggestions-panel';
import ReplySuggestionsPanel from '@/components/custom/panels/reply-suggestions-panel';
import TranscriptPanel from '@/components/custom/panels/transcript-panel';
import StatusPanel from '@/components/custom/status-panel';
import { VideoPanel, type VideoPanelHandle } from '@/components/custom/video-panel';
import { useAppState } from '@/hooks/use-app-state';
import { useAssistantService } from '@/hooks/use-assistant-service';
import useAuth from '@/hooks/use-auth';
import { useConfigStore } from '@/hooks/use-config-store';
import useIsStealthMode from '@/hooks/use-is-stealth-mode';
import { RunningState } from '@/types/app-state';
import { type CodeSuggestion, type ReplySuggestion } from '@/types/suggestion';
import { type Transcript } from '@/types/transcript';

export default function MainPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { config, isLoading: configLoading, loadConfig } = useConfigStore();
  const { setVideoPanelRef, stopAssistant } = useAssistantService();
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [replySuggestions, setReplySuggestions] = useState<ReplySuggestion[]>([]);
  const [codeSuggestions, setCodeSuggestions] = useState<CodeSuggestion[]>([]);
  const videoPanelRef = useRef<VideoPanelHandle>(null);
  const [transcriptHeight, setTranscriptHeight] = useState<number | null>(null);
  const [suggestionHeight, setSuggestionHeight] = useState<number | null>(null);

  // App state from context
  const { appState } = useAppState();

  // Register videoPanelRef with assistant state
  useEffect(() => {
    setVideoPanelRef(videoPanelRef as React.RefObject<VideoPanelHandle>);
  }, [setVideoPanelRef]);

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

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const hasReplySuggestions = replySuggestions.length > 0;
  const hasCodeSuggestions = codeSuggestions.length > 0;
  const hasTranscripts = transcripts.length > 0;
  const hideVideoPanel = !config?.faceSwap;
  const hideTranscriptPanel = hasCodeSuggestions && !hasTranscripts;

  const hasSuggestions = hasReplySuggestions || hasCodeSuggestions;
  const suggestionPanelCount = (hasReplySuggestions ? 1 : 0) + (hasCodeSuggestions ? 1 : 0);

  // stable compute function so other effects can trigger a recompute
  // include `suggestionPanelCount` in deps to avoid stale closure
  const computeAvailable = useCallback(() => {
    if (typeof window === 'undefined') return;
    const title = document.getElementById('titlebar')?.getBoundingClientRect().height || 0;
    let status = document.getElementById('status-panel')?.getBoundingClientRect().height || 0;
    let control = document.getElementById('control-panel')?.getBoundingClientRect().height || 0;
    let video = document.getElementById('video-panel')?.getBoundingClientRect().height || 0;
    const extra = 12; // spacing/padding between elements

    if (status > 0) status += 4; // account for border
    if (control > 0) control += 4; // account for border
    if (video > 0) video += 4; // account for border

    setTranscriptHeight(
      Math.max(100, window.innerHeight - (title + status + control + video + extra))
    );
    if (suggestionPanelCount > 0) {
      setSuggestionHeight(
        Math.max(
          100,
          window.innerHeight - (title + status + control + extra) - (suggestionPanelCount - 1) * 4
        ) / suggestionPanelCount
      );
    } else {
      setSuggestionHeight(0);
    }
  }, [suggestionPanelCount]);

  const isStealth = useIsStealthMode();

  // Compute available space when page is navigated to
  useEffect(() => {
    setTimeout(() => {
      computeAvailable();
    }, 10);
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
    hasCodeSuggestions,
    hasReplySuggestions,
    hasTranscripts,
    hideVideoPanel,
    hideTranscriptPanel,
    computeAvailable,
  ]);

  // Recompute when stealth mode toggles
  useEffect(() => {
    computeAvailable();
  }, [isStealth, computeAvailable]);

  // Recompute when face swap setting toggles
  useEffect(() => {
    computeAvailable();
  }, [config?.faceSwap, computeAvailable]);

  // Recompute when assistant running state or appState becomes available
  useEffect(() => {
    computeAvailable();
  }, [appState?.runningState, appState, computeAvailable]);

  // Sign out handling
  const handleSignOut = async () => {
    await logout();
  };

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
  }, [appState?.transcripts]);
  useEffect(() => {
    if (appState?.replySuggestions && appState.replySuggestions !== replySuggestions) {
      setReplySuggestions(appState.replySuggestions);
    }
  }, [appState?.replySuggestions]);
  useEffect(() => {
    if (appState?.codeSuggestions && appState.codeSuggestions !== codeSuggestions) {
      setCodeSuggestions(appState.codeSuggestions);
    }
  }, [appState?.codeSuggestions]);

  // Redirect to login if not logged in
  const _redirectedToLogin = useRef(false);

  useEffect(() => {
    if (appState?.isLoggedIn === false && !_redirectedToLogin.current) {
      _redirectedToLogin.current = true;
      setTimeout(() => {
        navigate('/auth/login', { replace: true });
      }, 500);
    }
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
  if (configLoading || !appState || (appState && !appState.isBackendLive)) {
    return <LoadingPage disclaimer="Loading…" />;
  }

  return (
    <div className="flex-1 flex flex-col w-full bg-background p-1 space-y-1">
      <div className="flex-1 flex overflow-y-hidden gap-1">
        {/* Left Column: Video + Transcription */}
        <div
          className={`flex flex-col ${hasSuggestions ? 'w-80' : 'flex-1'} gap-1`}
          hidden={hideVideoPanel && hideTranscriptPanel}
        >
          {/* Video Panel - Small and compact */}
          <div id="video-panel" className="h-45 w-full max-w-80 mx-auto" hidden={hideVideoPanel}>
            <VideoPanel
              ref={videoPanelRef}
              runningState={appState?.runningState ?? RunningState.Idle}
              credits={appState?.credits ?? 0}
            />
          </div>

          {/* Transcription Panel - Fill remaining space with scroll */}
          {(!hideTranscriptPanel || !hideVideoPanel) && (
            <TranscriptPanel transcripts={transcripts} style={transcriptStyle} />
          )}
        </div>

        {/* Right Column: Main Suggestions Panel */}
        {(hasReplySuggestions || hasCodeSuggestions) && (
          <div className="flex-1 flex flex-col gap-1 h-full overflow-auto">
            {hasCodeSuggestions && (
              <CodeSuggestionsPanel codeSuggestions={codeSuggestions} style={suggestionStyle} />
            )}
            {hasReplySuggestions && (
              <ReplySuggestionsPanel suggestions={replySuggestions} style={suggestionStyle} />
            )}
          </div>
        )}
      </div>

      <ControlPanel
        assistantState={appState?.runningState ?? RunningState.Idle}
        onProfileClick={() => setIsProfileOpen(true)}
        onSignOut={handleSignOut}
      />

      {isStealth && (
        <StatusPanel
          runningState={appState?.runningState ?? RunningState.Idle}
          credits={appState?.credits ?? 0}
        />
      )}

      <ConfigurationDialog isOpen={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </div>
  );
}
