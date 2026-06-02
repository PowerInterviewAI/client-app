import { useEffect, useState } from 'react';

import type { AudioDevice } from '@/types/audio-device';

import { useAudioOutputDevices } from './use-audio-devices';
import { useVideoDevices } from './use-video-devices';

/**
 * Returns the first VB-Audio "CABLE Input" device if one is present.
 * This is the device used for routing received audio back into the virtual
 * cable.  The hook recomputes whenever the set of output devices changes.
 */
export function useVbCableInputDevice(): AudioDevice | null | undefined {
  const outputs = useAudioOutputDevices();
  const [vbDevice, setVbDevice] = useState<AudioDevice | null>();

  useEffect(() => {
    const prefix = 'CABLE Input (VB-Audio Virtual';
    const found =
      outputs.length > 0 ? outputs.find((d) => d.name.startsWith(prefix)) || null : undefined;
    setVbDevice(found);
  }, [outputs]);

  return vbDevice;
}

/**
 * Returns the first video input device whose label indicates an OBS virtual
 * camera is installed.  Currently we just look for the "OBS Virtual" prefix.
 * The hook updates whenever the list of video devices changes.
 */
export function useObsCameraDevice(): MediaDeviceInfo | null | undefined {
  const videoDevices = useVideoDevices();
  const [obsDevice, setObsDevice] = useState<MediaDeviceInfo | null>();

  useEffect(() => {
    const prefix = 'OBS Virtual';
    const found =
      videoDevices.length > 0
        ? videoDevices.find((d) => d.label.includes(prefix)) || null
        : undefined;
    setObsDevice(found);
  }, [videoDevices]);

  return obsDevice;
}
