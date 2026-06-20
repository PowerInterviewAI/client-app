import { useMediaDevices } from './use-media-devices';

export function useVideoDevices(): MediaDeviceInfo[] {
  return useMediaDevices('videoinput', (devices) => devices);
}
