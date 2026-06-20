import { useEffect, useState } from 'react';

export function useMediaDevices<T>(
  kind: MediaDeviceKind,
  transform: (devices: MediaDeviceInfo[]) => T[]
): T[] {
  const [result, setResult] = useState<T[]>([]);

  useEffect(() => {
    async function fetch() {
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        setResult(transform(all.filter((d) => d.kind === kind)));
      } catch {
        // enumerateDevices is not available in all environments
      }
    }

    fetch();
    navigator.mediaDevices.addEventListener('devicechange', fetch);
    return () => navigator.mediaDevices.removeEventListener('devicechange', fetch);
  }, [kind]); // eslint-disable-line react-hooks/exhaustive-deps

  return result;
}
