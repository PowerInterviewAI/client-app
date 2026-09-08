import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAppState } from '@/hooks/use-app-state';
import { useAssistantService } from '@/hooks/use-assistant-service';
import { useAudioInputDevices } from '@/hooks/use-audio-devices';
import { useConfigStore } from '@/hooks/use-config-store';
import { useEndLiveSession } from '@/hooks/use-end-live-session';
import useIsStealthMode from '@/hooks/use-is-stealth-mode';
import { useSaveHistoryGuard } from '@/hooks/use-save-history-guard';
import { isMac } from '@/lib/consts';
import { getElectron } from '@/lib/utils';
import { RunningState } from '@/types/app-state';

import HeadphoneNoticeDialog from '../headphone-notice-dialog';
import PermissionGateDialog from '../permission-gate-dialog';
import ZoomControl from '../zoom-control';
import { AudioGroup } from './audio-group';
import { LanguageGroup } from './language-group';
import { MainGroup } from './main-group';
import { SuggestionModeGroup } from './suggestion-mode-group';
import { ToolsGroup } from './tools-group';

export default function ControlPanel() {
  const isStealth = useIsStealthMode();
  const navigate = useNavigate();
  const location = useLocation();
  const { startAssistant } = useAssistantService();
  const endLiveSession = useEndLiveSession();
  const { runningState, appState } = useAppState();
  const { config } = useConfigStore();
  const { confirmDiscard } = useSaveHistoryGuard();
  const [permGateOpen, setPermGateOpen] = useState(false);
  const [headphoneNoticeOpen, setHeadphoneNoticeOpen] = useState(false);

  const { devices: audioInputDevices, ready: audioDevicesReady } = useAudioInputDevices();

  // Arriving here is how a live session gets started: the home screen and the command palette
  // ask for it through router state rather than owning a copy of the sequence below.
  //
  // Guarded per history entry, not per mount. The state is cleared by the replace below, so a
  // Back to this entry finds nothing to re-trigger; the key is what stops StrictMode's double
  // effect acting twice before that replace lands. A ref that latched for the life of the mount
  // would also swallow the *second* request - the palette firing Start again from `/main`, which
  // is the same route and therefore the same mount.
  const consumedNavKey = useRef<string | null>(null);
  const autoStartLiveRequested = useRef(false);
  useEffect(() => {
    const navState = location.state as { autoStartLive?: boolean } | null;
    if (!navState?.autoStartLive) return;
    if (consumedNavKey.current === location.key) return;

    consumedNavKey.current = location.key;
    autoStartLiveRequested.current = true;
    navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  const selectedAudioInputDeviceName = config?.audioInputDeviceName ?? '';

  // Three states, not two. Until enumerateDevices() has settled the list is empty because
  // nothing has been asked yet, and a bare `find(...) === undefined` reports the configured
  // microphone as missing for the first frames after mount - a red badge on a working device,
  // and a start that is refused if the user is quick. An unset name is not "missing" either:
  // AudioGroup is picking the default at that moment.
  const noAudioInputDevices = audioDevicesReady && audioInputDevices.length === 0;
  const audioInputDeviceNotFound =
    audioDevicesReady &&
    audioInputDevices.length > 0 &&
    selectedAudioInputDeviceName !== '' &&
    !audioInputDevices.some((d) => d.name === selectedAudioInputDeviceName);

  const checkCanStart = () => {
    const checks: { ok: boolean; message: string; onFail?: () => void }[] = [
      // Checked first: an unsynced config reads as empty, and blaming the user for not
      // setting a name they did set sends them into a dialog that cannot save either.
      {
        ok: appState?.interviewConfigLoaded ?? false,
        message: 'Could not load your saved configuration. Reconnecting - try again in a moment.',
        // Nothing else re-pulls after a failed startup fetch, so "try again" has to actually
        // retry: without this the same toast repeats forever however often Start is pressed.
        onFail: () => void getElectron()?.account?.refresh(),
      },
      {
        ok: !!appState?.interviewConfig?.fullName,
        message: 'Full name is not set',
        onFail: () => navigate('/account'),
      },
      {
        ok: appState?.interviewConfig?.hasProfileData ?? false,
        message: 'Profile data is not set',
        onFail: () => navigate('/account'),
      },
      {
        ok: !noAudioInputDevices,
        message: 'No microphone was detected. Connect one and try again.',
      },
      {
        ok: !audioInputDeviceNotFound,
        message: `Audio input device "${selectedAudioInputDeviceName}" is not found`,
      },
    ];

    for (const { ok, message, onFail } of checks) {
      if (!ok) {
        toast.error(message);
        onFail?.();
        return false;
      }
    }
    return true;
  };

  const doStart = async () => {
    try {
      await startAssistant();
    } catch (error) {
      // No stopAssistant() here. startAssistant's own catch has already torn both services down
      // and put runningState back to Idle; calling it again only walks the button through a
      // three-second "Stopping" for a session that never started, and its own failure would
      // land here as an unhandled rejection.
      console.error('Failed to start assistant:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start assistant');
    }
  };

  // Everything after the headphone notice. Split out so the notice can hand the start back once
  // the user acknowledges it, without duplicating what follows.
  const startAfterNotice = async () => {
    // `startAssistant` opens with `clearAll()`, so the previous interview is gone the moment
    // this goes ahead. Asked before the permission gate rather than after: a user who is about
    // to be sent into System Settings should not have answered a question first that the trip
    // makes moot.
    if (!(await confirmDiscard('start'))) return;

    if (isMac) {
      const electron = getElectron();
      if (electron) {
        const perms = await electron.permissions.checkAll();
        const micOk = perms.mic === 'granted';
        const screenOk =
          (perms.screen === 'granted' || perms.screen === 'not-determined') &&
          !perms.screenNeedsRelaunch;
        if (!micOk || !screenOk) {
          setPermGateOpen(true);
          return;
        }
      }
    }

    await doStart();
  };

  const handleStartClick = async () => {
    if (!checkCanStart()) return;

    // Before the permission gate, and before anything opens a socket: on speakers the echo is
    // already in the audio by the time the first question is asked, and the failure it causes
    // is silent. Nothing here can detect the output route, so the user is asked - every session,
    // since whether the call is on speakers is a property of the machine and the meeting, not a
    // setting that stays true once answered.
    setHeadphoneNoticeOpen(true);
  };

  // Backing out of the headphone notice backs out of the whole start, and this screen only
  // exists for a session that is starting or running - the console reached this way carries no
  // Start of its own, so cancelling used to leave the candidate on an inert bar with the one
  // enabled control being the way back they had not asked for. Home is where both kinds of
  // session are chosen, which is the decision cancelling here actually re-opens.
  //
  // Nothing to tear down: the notice is the first thing Start asks, ahead of the save prompt and
  // the permission gate, so no service has been touched and `runningState` is still Idle.
  const handleStartCancelled = () => {
    navigate('/');
  };

  // Deferred rather than fired the moment the intent arrives. `checkCanStart` reads the account
  // config and the enumerated microphones, neither of which has resolved on the first frames
  // after a route change - starting there would greet the user with "could not load your saved
  // configuration" for a config that was about to arrive. If they never resolve, nothing happens
  // and the user is left on an idle console with a way back to the home screen, which is the
  // honest outcome.
  const autoStartLiveReady =
    autoStartLiveRequested.current &&
    runningState === RunningState.Idle &&
    audioDevicesReady &&
    // Undefined until `config:get` resolves, and `startAssistant` reads the session token,
    // microphone and language straight off it. A hand-pressed Start was always well clear of
    // that; a start that fires on arrival is not, and starting on an unloaded config opens the
    // ASR socket with an empty token.
    config !== undefined &&
    (appState?.interviewConfigLoaded ?? false);

  useEffect(() => {
    // The ref is re-checked here, not just folded into `autoStartLiveReady` above: StrictMode
    // runs this effect twice on mount without a render in between, so the recomputed condition
    // is not what stops the second run - the ref is.
    if (!autoStartLiveReady || !autoStartLiveRequested.current) return;
    autoStartLiveRequested.current = false;
    void handleStartClick();
    // handleStartClick is redefined every render and is not a dependency of when this should
    // fire; the ref above is what makes it happen exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartLiveReady]);

  if (isStealth) return null;

  const getDisabled = (state: RunningState, disableOnRunning: boolean = true): boolean => {
    if (disableOnRunning && state === RunningState.Running) return true;
    return state === RunningState.Starting || state === RunningState.Stopping;
  };

  return (
    <>
      {/* Reading order is the order of use: end the session, then the things that shape it while
          it runs. Grouping is carried by spacing - gap-1 inside a group, gap-4 between - rather than by a
          rule between every cluster, so the row stays quiet at 32px tall. The one hairline earns
          its place by marking the only boundary that matters, between the action and the settings.

          Zoom is held at the right edge by ml-auto: it changes how the app is viewed rather than
          what it does, and mixing it into the run would make it read as another interview control. */}
      <div id="control-panel" className="flex items-center gap-4 px-1 pb-1 pt-0.5">
        <MainGroup onStop={endLiveSession} />

        <div className="h-5 w-px bg-border" aria-hidden="true" />

        {/* What the session runs on. Both stay live while the assistant runs, because audio and
            language are things an interview can get wrong in progress and neither can be fixed
            by restarting without losing the transcript. Language sits here rather than with the
            presentation toggles because it is an input as much as an output: it picks the speech
            model before it picks the answer's language. */}
        <div className="flex items-center gap-1">
          <AudioGroup
            audioInputDevices={audioInputDevices}
            audioInputDeviceNotFound={audioInputDeviceNotFound}
            getDisabled={getDisabled}
          />
          <LanguageGroup getDisabled={getDisabled} />
        </div>

        {/* What the interview produces: how suggestions read, and what to do with the session */}
        <div className="flex items-center gap-1">
          <SuggestionModeGroup />
          <ToolsGroup getDisabled={getDisabled} />
        </div>

        <div className="ml-auto">
          <ZoomControl />
        </div>
      </div>

      <HeadphoneNoticeDialog
        open={headphoneNoticeOpen}
        onOpenChange={setHeadphoneNoticeOpen}
        onProceed={() => void startAfterNotice()}
        onCancel={handleStartCancelled}
      />

      {isMac && (
        <PermissionGateDialog
          open={permGateOpen}
          onOpenChange={setPermGateOpen}
          onProceed={doStart}
        />
      )}
    </>
  );
}
