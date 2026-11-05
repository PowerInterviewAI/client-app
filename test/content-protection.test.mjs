/**
 * Content protection follows the `allowScreenCapture` setting, and stealth overrides it. The
 * override is the half a later change could quietly drop: a window the user made capturable for
 * a demo would then stay capturable in stealth mode, on the screen share stealth exists for.
 */
import { createChecker, loadMainAs } from './helpers.mjs';

export async function run() {
  const { check, failures } = createChecker('content-protection');

  // A fresh instance, so the stealth state other tests leave behind does not leak in.
  const windowControl = await loadMainAs('win32', 'services/window-control.service.js');

  const protection = [];
  windowControl.setWindowReference({
    isDestroyed: () => false,
    on: () => {},
    setContentProtection: (enabled) => protection.push(enabled),
    setAlwaysOnTop: () => {},
    setSkipTaskbar: () => {},
    setMinimizable: () => {},
    setVisibleOnAllWorkspaces: () => {},
    setIgnoreMouseEvents: () => {},
    setFocusable: () => {},
    setOpacity: () => {},
    isMinimized: () => false,
    restore: () => {},
    webContents: { send: () => {} },
  });

  check('the window is protected by default', protection.at(-1) === true);

  windowControl.setAllowScreenCapture(true);
  check('allowing capture lifts the protection', protection.at(-1) === false);

  const calls = protection.length;
  windowControl.setAllowScreenCapture(true);
  check('an unchanged setting is not re-applied', protection.length === calls);

  windowControl.enableStealth();
  check('stealth protects a capturable window', protection.at(-1) === true);

  windowControl.disableStealth();
  check('leaving stealth returns to the setting', protection.at(-1) === false);

  // The app's own screenshot is of what is behind the window, so it protects the window for the
  // capture even when the user allowed other apps to see it, and settles before capturing.
  protection.length = 0;
  let duringCapture;
  const result = await windowControl.withContentProtection(async () => {
    duringCapture = protection.at(-1);
    return 'shot';
  });
  check('an own capture protects a capturable window', duringCapture === true);
  check('an own capture returns what the capture returned', result === 'shot');
  check('an own capture restores the setting afterwards', protection.at(-1) === false);

  protection.length = 0;
  await windowControl
    .withContentProtection(async () => {
      throw new Error('capture failed');
    })
    .catch(() => {});
  check('a failed own capture still restores the setting', protection.at(-1) === false);

  windowControl.setAllowScreenCapture(false);
  check('turning the setting off protects again', protection.at(-1) === true);

  protection.length = 0;
  await windowControl.withContentProtection(async () => {});
  check('an own capture on a protected window changes nothing', protection.length === 0);

  return failures;
}
