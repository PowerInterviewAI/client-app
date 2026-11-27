import { isMac } from '@/lib/consts';

import { useAllowScreenCapture } from './use-allow-screen-capture';

/**
 * What other apps can see of the window.
 *
 * `capturable` - the user allowed capture, so screen shares and recordings show the window.
 * `limited` - protection is on, but macOS honours it only for older capture APIs: apps built on
 *   ScreenCaptureKit (newer recorders, several meeting apps) capture the window anyway, by design.
 * `protected` - protection is on and the OS honours it.
 *
 * Linux is reported as `protected` although Electron has no protection there; it is not a
 * supported target for this check.
 */
export type ScreenCaptureStatus = 'capturable' | 'limited' | 'protected';

export function useScreenCaptureStatus(): ScreenCaptureStatus {
  const { enabled } = useAllowScreenCapture();
  if (enabled) return 'capturable';
  return isMac ? 'limited' : 'protected';
}
