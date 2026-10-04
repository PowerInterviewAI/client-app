import { DialogDescription } from '@radix-ui/react-dialog';
import { AlertTriangle, Loader, Mic } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppState } from '@/hooks/use-app-state';
import { useAudioInputDevice } from '@/hooks/use-audio-input-device';
import { useConfigStore } from '@/hooks/use-config-store';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { RunningState } from '@/types/app-state';
import { type AudioDevice } from '@/types/audio-device';

import { BAR_GHOST, BAR_ICON_BUTTON } from './bar';

interface AudioGroupProps {
  audioInputDevices: AudioDevice[];
  audioInputDeviceNotFound: boolean;
  getDisabled: (state: RunningState, disableOnRunning?: boolean) => boolean;
}

/**
 * Microphone selection, live mid-interview.
 *
 * It used to lock while the assistant ran, which made the one case it is needed for
 * unreachable: a headset that dies, is unplugged, or was the wrong device to begin with, noticed
 * only once the interviewer cannot hear the answer. Restarting the assistant to fix it drops the
 * transcript and the suggestion history with it.
 *
 * Unlike the language picker, nothing reconnects. The device is only what feeds the worklet, not
 * a connection parameter, so the socket and any utterance in flight survive - which is why this
 * carries no warning about a gap in the transcript, because there is not one.
 */
export function AudioGroup({
  audioInputDevices,
  audioInputDeviceNotFound,
  getDisabled,
}: AudioGroupProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const { runningState } = useAppState();
  const { config, updateConfig } = useConfigStore();
  const { deviceName, switching, failedDeviceName, setDevice, clearFailedDevice } =
    useAudioInputDevice();
  const usableAudioInputDevices = audioInputDevices.filter((d) => {
    if (d.name.toLowerCase().includes('virtual')) return false;
    return true;
  });

  // First usable device as the default, once. In an effect rather than in the render body: a
  // store write during render re-enters React mid-commit, and because `updateConfig` rolls the
  // optimistic value back when the IPC call fails, the condition that triggered it is true again
  // on the very next render - a failed write repeated for every frame, each one an unhandled
  // rejection. `pickedDefault` also stops it re-picking after the user clears the selection or
  // unplugs the chosen device mid-session.
  //
  // Deliberately still `updateConfig` rather than the hook's `setDevice`: this is the store
  // reaching a valid initial state, not a device change, and routing it through the live swap
  // would put a spinner on a control the user has not touched.
  const pickedDefault = useRef(false);
  const firstUsableDeviceName = usableAudioInputDevices[0]?.name;

  useEffect(() => {
    if (pickedDefault.current) return;
    if (!config) return; // config not loaded yet; '' here would not mean "unset"
    if (config.audioInputDeviceName !== '') return;
    if (!firstUsableDeviceName) return;

    pickedDefault.current = true;
    updateConfig({ audioInputDeviceName: firstUsableDeviceName }).catch((e) => {
      pickedDefault.current = false;
      console.error('Failed to select a default microphone', e);
    });
  }, [config, firstUsableDeviceName, updateConfig]);

  // A failed swap only disagrees with the stored device for the life of that session: the next
  // start reads the store fresh. Leaving the warning up past the stop would describe a state
  // that no longer exists.
  const running = runningState === RunningState.Running;
  useEffect(() => {
    if (!running) clearFailedDevice();
  }, [running, clearFailedDevice]);

  // `false`, so the control locks only through the transient Starting and Stopping states, where
  // the graph it would rewire is being built or torn down anyway.
  const disabled = getDisabled(runningState, false);
  const swapFailed = running && failedDeviceName !== null;

  return (
    <div className="flex items-center">
      <div className="relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(BAR_ICON_BUTTON, BAR_GHOST)}
              disabled={disabled}
              onClick={() => setOpen(true)}
              // The warning state is carried by a badge drawn over the corner of this button,
              // which is colour and position and nothing else. Folding it into the name is what
              // makes the conditions this control reports reachable without seeing it.
              aria-label={
                swapFailed
                  ? t.audioGroup.optionsSwapFailed
                  : audioInputDeviceNotFound
                    ? t.audioGroup.optionsDeviceNotFound
                    : t.audioGroup.options
              }
              aria-busy={switching}
            >
              {switching ? (
                <Loader className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Mic className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t.audioGroup.options}</p>
          </TooltipContent>
        </Tooltip>
        {/* A failed swap raises the same badge as a missing device. Nobody opens a dialog
            spontaneously mid-interview, and this is the state where the interviewer has just
            said they cannot hear you - the button has to carry it. */}
        {(audioInputDeviceNotFound || swapFailed) && (
          <Badge
            variant="destructive"
            aria-hidden="true"
            className="absolute -bottom-1 -right-1 h-4 min-w-4 rounded-full px-1 flex items-center justify-center text-[10px] border"
          >
            !
          </Badge>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex flex-col w-72 p-4">
          <DialogTitle>{t.audioGroup.dialogTitle}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t.audioGroup.dialogDescription}
          </DialogDescription>

          {/* Microphone Select */}
          <div className="mb-3">
            <label id="audio-input-label" className="text-xs text-muted-foreground mb-1 block">
              {t.audioGroup.microphone}
            </label>
            {/* `|| undefined` keeps the pre-existing binding exactly as it was. Radix reserves
                the empty string for clearing a selection, and the hook reports an unset device as
                `''` rather than as undefined, so passing it straight through would hand Select a
                value it treats specially rather than the "nothing chosen yet" it means here. */}
            <Select
              value={deviceName || undefined}
              disabled={switching}
              onValueChange={(v) => void setDevice(v)}
            >
              <SelectTrigger aria-labelledby="audio-input-label" className="h-8 w-full text-xs">
                <SelectValue placeholder={t.audioGroup.selectPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {usableAudioInputDevices.map((device) => (
                  <SelectItem key={device.name} value={`${device.name}`}>
                    {device.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* One chain rather than sibling conditions, so every running state says something.
                Written as two `&&` blocks it left a hole: retrying after a failure is both
                `switching` and `failedDeviceName`, which satisfied neither, and the line vanished
                at exactly the moment the user was waiting to hear whether it had worked.

                Order is by what the user needs most. A failed swap outranks the reassurance
                because the control is naming a device the session is not using, and that is the
                one thing a candidate being told they cannot be heard needs to know - it survives
                the toast, which does not. */}
            {running &&
              (switching ? (
                <p className="mt-1.5 text-xs text-muted-foreground">{t.audioGroup.switching}</p>
              ) : failedDeviceName ? (
                <p
                  role="alert"
                  className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive"
                >
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                  <span>{t.audioGroup.swapFailed(failedDeviceName)}</span>
                </p>
              ) : (
                // Says what will not happen, which is the question a candidate mid-interview
                // actually has before touching a control on a live session.
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t.audioGroup.takesEffectImmediately}
                </p>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
