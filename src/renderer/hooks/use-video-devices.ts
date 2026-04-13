import { useEffect, useState } from 'react';

export function useVideoDevices() {
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    async function fetchDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(cameras);
      } catch (err) {
        console.error('Failed to enumerate devices', err);
      }
    }

    fetchDevices();
    navigator.mediaDevices.addEventListener('devicechange', fetchDevices);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', fetchDevices);
    };
  }, []);

  return videoDevices;
}
