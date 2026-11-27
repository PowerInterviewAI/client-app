import { isWindows } from '@/lib/consts';

import { useAllowScreenCapture } from './use-allow-screen-capture';

/**
 * What other apps can see of the window.
 *
 * `capturable` - the user allowed capture, so screen shares and recordings show the window.
 * `limited` - protection is requested but not fully honoured. On macOS, apps built on
 *   ScreenCaptureKit (newer recorders, several meeting apps) capture the window anyway, by design;
 *   Linux has no protection at all and is not a shipped target, so it reads the same way rather
 *   than claiming a protection it does not have.
 * `protected` - Windows with protection on. Windows 10 builds before 2004 capture a black
 *   rectangle instead of omitting the window; those builds are out of support and not detected.
 */
export type ScreenCaptureStatus = 'capturable' | 'limited' | 'protected';

export function useScreenCaptureStatus(): ScreenCaptureStatus {
  const { enabled } = useAllowScreenCapture();
  if (enabled) return 'capturable';
  return isWindows ? 'protected' : 'limited';
}
