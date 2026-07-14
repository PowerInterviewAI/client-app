import { Ellipsis, Play, Square } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAppState } from '@/hooks/use-app-state';
import { useAssistantService } from '@/hooks/use-assistant-service';
import { useAudioInputDevices } from '@/hooks/use-audio-devices';
import { useConfigStore } from '@/hooks/use-config-store';
import useIsStealthMode from '@/hooks/use-is-stealth-mode';
import { isMac } from '@/lib/consts';
import { getElectron } from '@/lib/utils';
import { RunningState } from '@/types/app-state';

import PermissionGateDialog from '../permission-gate-dialog';
import ZoomControl from '../zoom-control';
import { AudioGroup } from './audio-group';
import { LLMGroup } from './llm-group';
import { MainGroup } from './main-group';
import { ProfileGroup } from './profile-group';
import { ToolsGroup } from './tools-group';

interface ControlPanelProps {
  onProfileClick: () => void;
  onSignOut: () => void;
}

type StateConfig = {
  onClick: () => void;
  className: string;
  icon: React.ReactNode;
  label: string;
};

export default function ControlPanel({ onProfileClick, onSignOut }: ControlPanelProps) {
  const isStealth = useIsStealthMode();
  const { startAssistant, stopAssistant } = useAssistantService();
  const { runningState, appState } = useAppState();
  const { config } = useConfigStore();
  const [permGateOpen, setPermGateOpen] = useState(false);

  const audioInputDevices = useAudioInputDevices();

  if (isStealth) return null;

  const checkCanStart = () => {
    const checks: { ok: boolean; message: string }[] = [
      { ok: !!appState?.interviewConfig?.fullName, message: 'Full name is not set' },
      { ok: !!appState?.interviewConfig?.profileData, message: 'Profile data is not set' },
      {
        ok: !audioInputDeviceNotFound,
        message: `Audio input device "${config?.audioInputDeviceName}" is not found`,
      },
    ];

    for (const { ok, message } of checks) {
      if (!ok) {
        toast.error(message);
        return false;
      }
    }
    return true;
  };

  const doStart = async () => {
    try {
      await startAssistant();
    } catch (error) {
      console.error('Failed to start assistant:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start assistant');
      await stopAssistant();
    }
  };

  const handleStartClick = async () => {
    if (!checkCanStart()) return;

    if (isMac) {
      const electron = getElectron();
      if (electron) {
        const perms = await electron.permissions.checkAll();
        const micOk = perms.mic === 'granted';
        const screenOk = perms.screen === 'granted' || perms.screen === 'not-determined';
        if (!micOk || !screenOk) {
          setPermGateOpen(true);
          return;
        }
      }
    }

    await doStart();
  };

  const stateConfig: Record<RunningState, StateConfig> = {
    [RunningState.Idle]: {
      onClick: handleStartClick,
      className: 'bg-blue-600 hover:bg-blue-600/90',
      icon: <Play className="h-3.5 w-3.5" />,
      label: 'Start',
    },
    [RunningState.Starting]: {
      onClick: () => {},
      className: 'bg-blue-600 hover:bg-blue-600/90',
      icon: <Ellipsis className="h-3.5 w-3.5 animate-pulse" />,
      label: 'Starting...',
    },
    [RunningState.Running]: {
      onClick: async () => { await stopAssistant(); },
      className: 'bg-destructive hover:bg-destructive/90 animate-pulse',
      icon: <Square className="h-3.5 w-3.5" />,
      label: 'Stop',
    },
    [RunningState.Stopping]: {
      onClick: () => {},
      className: 'bg-destructive hover:bg-destructive/90',
      icon: <Ellipsis className="h-3.5 w-3.5 animate-pulse" />,
      label: 'Stopping...',
    },
  };
  const { onClick, className, icon, label } = stateConfig[runningState];

  const audioInputDeviceNotFound =
    audioInputDevices?.find((d) => d.name === config?.audioInputDeviceName) === undefined;

  const getDisabled = (state: RunningState, disableOnRunning: boolean = true): boolean => {
    if (disableOnRunning && state === RunningState.Running) return true;
    return state === RunningState.Starting || state === RunningState.Stopping;
  };

  return (
    <>
      <div id="control-panel" className="flex items-center justify-between gap-2 pr-1 pb-0.5">
        <ProfileGroup
          config={config}
          fullName={appState?.interviewConfig?.fullName}
          onProfileClick={onProfileClick}
          onSignOut={onSignOut}
          getDisabled={getDisabled}
        />

        <div className="flex flex-1 justify-center gap-2 items-center">
          <AudioGroup
            audioInputDevices={audioInputDevices ?? []}
            audioInputDeviceNotFound={audioInputDeviceNotFound}
            getDisabled={getDisabled}
          />
          <LLMGroup getDisabled={getDisabled} />
          <MainGroup stateConfig={{ onClick, className, icon, label }} getDisabled={getDisabled} />
          <ToolsGroup getDisabled={getDisabled} />
        </div>

        <ZoomControl />
      </div>

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
