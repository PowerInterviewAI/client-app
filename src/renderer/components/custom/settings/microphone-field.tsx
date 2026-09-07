import { AlertTriangle, Loader, Mic, Square } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { MicLevelMeter } from '@/components/custom/settings/mic-level-meter';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppState } from '@/hooks/use-app-state';
import { useAudioInputDevices } from '@/hooks/use-audio-devices';
import { useAudioInputDevice } from '@/hooks/use-audio-input-device';
import { useConfigStore } from '@/hooks/use-config-store';
import { micConstraints, resolveMicDeviceId } from '@/services/live-transcription.service';
import { RunningState } from '@/types/app-state';

/**
 * Choose a microphone and hear whether it actually works, on both the configuration page and the
 * first-run wizard.
 *
 * The test is the reason this is a component rather than the control bar's picker with a label on
 * it. Picking a device from a list tells the user nothing about whether the machine is listening
 * to it - which is exactly the failure this app is worst at surviving, because it shows up as
 * silence rather than as an error, ten minutes into a real interview.
 *
 * The test stream is separate from anything the assistant opens, and is torn down on unmount, on
 * a device change and when the assistant starts. It is not offered while a session is running:
 * the live services already hold the device, and a second stream on top of it buys the user
 * nothing the control bar does not already show.
 */
export function MicrophoneField() {
  const { runningState } = useAppState();
  const { config, updateConfig } = useConfigStore();
  const { devices, ready } = useAudioInputDevices();
  const { deviceName, switching, setDevice } = useAudioInputDevice();

  const [testStream, setTestStream] = useState<MediaStream | null>(null);
  const [testStarting, setTestStarting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  // The control bar applies the same filter: a virtual device is a loopback or a mixer, never the
  // physical microphone the candidate is speaking into.
  const usableDevices = devices.filter((d) => !d.name.toLowerCase().includes('virtual'));
  const firstUsableDeviceName = usableDevices[0]?.name;

  const running = runningState !== RunningState.Idle;
  const noDevices = ready && usableDevices.length === 0;
  const deviceNotFound =
    ready &&
    usableDevices.length > 0 &&
    deviceName !== '' &&
    !usableDevices.some((d) => d.name === deviceName);

  // Same shape, and the same reasons, as the control bar's `AudioGroup`: picked once, in an
  // effect rather than during render, and not re-picked after the user clears the selection.
  const pickedDefault = useRef(false);
  useEffect(() => {
    if (pickedDefault.current) return;
    if (!config) return; // '' before the config loads would not mean "unset"
    if (config.audioInputDeviceName !== '') return;
    if (!firstUsableDeviceName) return;

    pickedDefault.current = true;
    updateConfig({ audioInputDeviceName: firstUsableDeviceName }).catch((e) => {
      pickedDefault.current = false;
      console.error('Failed to select a default microphone', e);
    });
  }, [config, firstUsableDeviceName, updateConfig]);

  const stopTest = useCallback(() => {
    setTestStream((current) => {
      current?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  // A test stream left open holds the microphone - the OS indicator stays lit and, on Windows,
  // some devices refuse a second open. Released whenever this component goes away, the device
  // changes under it, or the assistant claims the device for a real session.
  useEffect(() => stopTest, [deviceName, stopTest]);
  useEffect(() => {
    if (running) stopTest();
  }, [running, stopTest]);

  const startTest = async () => {
    setTestError(null);
    setTestStarting(true);
    try {
      const deviceId = await resolveMicDeviceId(deviceName);
      // The same constraints a session opens with, so the level shown here is measured through
      // the same processing chain the session will use. Opened as `true`, the test stream could
      // run different gain and noise handling than the capture it is meant to predict.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: micConstraints(deviceId),
      });
      setTestStream(stream);
    } catch (e) {
      console.error('Microphone test failed', e);
      // Inline rather than a toast: this sits directly under the control that caused it, and the
      // user is about to try again with a different device.
      setTestError(
        'Could not open this microphone. Check it is connected and that no other app is using it.'
      );
    } finally {
      setTestStarting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label id="microphone-field-label">Microphone</Label>

      {noDevices ? (
        <p className="flex items-start gap-1.5 rounded-md border border-destructive/40 p-3 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>No microphone was detected. Connect one and it will appear here.</span>
        </p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            {/* `|| undefined` rather than the raw value: Radix reserves the empty string for
                clearing a selection, and an unset device is reported as ''. */}
            <Select
              value={deviceName || undefined}
              disabled={switching || !ready}
              onValueChange={(v) => void setDevice(v)}
            >
              <SelectTrigger aria-labelledby="microphone-field-label" className="w-full">
                <SelectValue
                  placeholder={ready ? 'Select a microphone' : 'Looking for microphones...'}
                />
              </SelectTrigger>
              <SelectContent>
                {usableDevices.map((device) => (
                  <SelectItem key={device.name} value={device.name}>
                    {device.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              disabled={running || switching || testStarting || !deviceName}
              onClick={() => (testStream ? stopTest() : void startTest())}
            >
              {testStarting ? (
                <Loader className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : testStream ? (
                <Square className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Mic className="h-4 w-4" aria-hidden="true" />
              )}
              {testStream ? 'Stop test' : 'Test'}
            </Button>
          </div>

          {deviceNotFound && (
            <p role="alert" className="flex items-start gap-1.5 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
              <span>
                &ldquo;{deviceName}&rdquo; is not connected any more. Pick another microphone.
              </span>
            </p>
          )}

          {testError && (
            <p role="alert" className="text-xs text-destructive">
              {testError}
            </p>
          )}

          {testStream ? (
            <div className="rounded-md border p-3">
              <p className="mb-2 text-xs text-muted-foreground">
                Say something - the bar should move while you speak.
              </p>
              <MicLevelMeter stream={testStream} />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {running
                ? 'The interview is using this microphone. Testing is available once it stops.'
                : 'Test it before your interview - a silent microphone looks exactly like a quiet room.'}
            </p>
          )}
        </>
      )}
    </div>
  );
}
