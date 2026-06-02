import { useEffect, useState } from 'react';

import { type AudioDevice } from '@/types/audio-device';

function useAudioDevices(kind: 'audioinput' | 'audiooutput', deviceType: string) {
  const [devices, setDevices] = useState<AudioDevice[]>([]);

  useEffect(() => {
    async function fetchDevices() {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const filtered = allDevices
          .filter((device) => device.kind === kind)
          .filter((device) => {
            const label = device.label.toLowerCase();
            return !label.includes('default') && !label.includes('communications');
          })
          .map((device, index) => ({
            name: device.label || `${deviceType} Device ${index + 1}`,
            index,
          }));
        setDevices(filtered);
      } catch (error) {
        console.error(`Error enumerating ${kind} devices:`, error);
      }
    }

    fetchDevices();
    navigator.mediaDevices.addEventListener('devicechange', fetchDevices);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', fetchDevices);
    };
  }, [kind, deviceType]);

  return devices;
}

export function useAudioInputDevices() {
  return useAudioDevices('audioinput', 'Input');
}

export function useAudioOutputDevices() {
  return useAudioDevices('audiooutput', 'Output');
}
