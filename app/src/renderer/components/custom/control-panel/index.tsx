import { Ellipsis, Play, Square } from 'lucide-react';
import { toast } from 'sonner';

import { useAppState } from '@/hooks/use-app-state';
import { useAssistantService } from '@/hooks/use-assistant-service';
import { useAudioInputDevices } from '@/hooks/use-audio-devices';
import { useConfigStore } from '@/hooks/use-config-store';
import useIsStealthMode from '@/hooks/use-is-stealth-mode';
import { useVideoDevices } from '@/hooks/use-video-devices';
import { RunningState } from '@/types/app-state';

import ZoomControl from '../zoom-control';
import { AudioGroup } from './audio-group';
import { MainGroup } from './main-group';
import { ProfileGroup } from './profile-group';
import { ToolsGroup } from './tools-group';

interface ControlPanelProps {
  assistantState: RunningState;
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
  const { runningState } = useAppState();
  const { config } = useConfigStore();

  const videoDevices = useVideoDevices();
  const audioInputDevices = useAudioInputDevices();
  // audio outputs no longer required by control panel; special hooks will be used where needed

  if (isStealth) return null;

  const stateConfig: Record<RunningState, StateConfig> = {
    [RunningState.Idle]: {
      onClick: async () => {
        if (!checkCanStart()) return;
        try {
          await startAssistant();
        } catch (error) {
          console.log('Failed to start assistant:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to start assistant');
          await stopAssistant();
        }
      },
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
      onClick: async () => {
        await stopAssistant();
      },
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
  const videoDeviceNotFound =
    videoDevices.find((d) => d.label === config?.cameraDeviceName) === undefined;

  const checkCanStart = () => {
    const checks: { ok: boolean; message: string }[] = [
      { ok: !!config?.interviewConf, message: 'Profile is not set' },
      { ok: !!config?.interviewConf?.username, message: 'Username is not set' },
      {
        ok: !config?.faceSwap || !!config?.interviewConf?.photo,
        message: 'Photo is not set (required for face swap)',
      },
      { ok: !!config?.interviewConf?.profileData, message: 'Profile data is not set' },

      {
        ok: !audioInputDeviceNotFound,
        message: `Audio input device "${config?.audioInputDeviceName}" is not found`,
      },
      // Validate video device only if face swap is enabled
      {
        ok: !config?.faceSwap || !videoDeviceNotFound,
        message: `Video device "${config?.cameraDeviceName}" is not found`,
      },
    ];

    for (const { ok, message } of checks) {
      if (!ok) {
        alert(message);
        return false;
      }
    }

    return true;
  };

  const getDisabled = (state: RunningState, disableOnRunning: boolean = true): boolean => {
    if (disableOnRunning && state === RunningState.Running) return true;
    return state === RunningState.Starting || state === RunningState.Stopping;
  };

  return (
    <div id="control-panel" className="flex items-center justify-between gap-2 pr-2 pb-0.5">
      <ProfileGroup
        config={config}
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
        {/* <VideoGroup videoDeviceNotFound={videoDeviceNotFound} getDisabled={getDisabled} /> */}
        <MainGroup stateConfig={{ onClick, className, icon, label }} getDisabled={getDisabled} />
        <hr className="h-6 border border-border" />
        <ToolsGroup getDisabled={getDisabled} />
      </div>

      <div className="w-8"></div>

      <ZoomControl />
    </div>
  );
}
