/**
 * Stealth mode hides the window from screen capture, but the surfaces around it - a desktop
 * shortcut, a taskbar button, a Dock icon - are what a screen share exposes first. The taskbar
 * button and the Dock icon follow stealth mode; the desktop shortcut is never created. These are
 * one-line settings that a merge can silently flip back, and none of them show up until someone
 * builds an installer on the right OS.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

import { createChecker } from './helpers.mjs';

export async function run() {
  const { check, failures } = createChecker('stealth-surface');

  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  check('installer creates no desktop shortcut', pkg.build.nsis.createDesktopShortcut === false);
  check(
    'installer still creates a start menu shortcut',
    pkg.build.nsis.createStartMenuShortcut === true
  );
  // LSUIElement would make the packaged app an accessory app from launch, with no Dock icon at
  // all. The Dock icon now belongs to normal mode, so the policy is switched at runtime instead.
  check('packaged mac app is not pinned to accessory', !pkg.build.mac.extendInfo.LSUIElement);

  // createDesktopShortcut only covers fresh installs; upgrades have to delete the old icon.
  const nsh = fs.readFileSync(path.join(ROOT, 'build', 'installer.nsh'), 'utf8');
  check('upgrade deletes the previous desktop shortcut', /!macro customInstall/.test(nsh));
  check(
    'both recorded shortcut names are removed',
    /\$oldDesktopLink/.test(nsh) && /\$newDesktopLink/.test(nsh)
  );

  // Read the compiled output rather than the source: this is what actually ships.
  const main = fs.readFileSync(path.join(ROOT, 'electron-dist', 'index.js'), 'utf8');
  check('window is not pinned off the taskbar at creation', !/skipTaskbar:\s*true/.test(main));

  // Both halves of the macOS switch have to be there: dock.hide() alone does not lift the app
  // back out of accessory, and the policy alone leaves a stale icon behind.
  const windowControl = fs.readFileSync(
    path.join(ROOT, 'electron-dist', 'services', 'window-control.service.js'),
    'utf8'
  );
  check('stealth drops the Dock icon', /dock\?\.hide\(\)/.test(windowControl));
  check('stealth makes the app an accessory app', /'accessory'/.test(windowControl));
  check('normal mode brings the Dock icon back', /dock\?\.show\(\)/.test(windowControl));
  check('normal mode makes the app a regular app', /'regular'/.test(windowControl));

  // These surfaces follow stealth OR a running assistant, not stealth alone. Both inputs have to
  // reach the same predicate, or one of them silently stops hiding anything.
  check(
    'the taskbar button follows the surface predicate',
    /setSkipTaskbar\(hidden\)/.test(windowControl)
  );
  check(
    'the surface predicate covers stealth and running',
    /_stealth \|\| \(_hideTaskbarWhileRunning && isAssistantRunning\(\)\)/.test(windowControl)
  );
  check(
    'the Dock icon follows the same predicate',
    /wantVisible = !shouldHideSurfaces\(\)/.test(windowControl)
  );

  // In stealth mode there is no taskbar button and no Dock icon: without this, closing or
  // minimizing the window leaves a running process with no way back to it.
  const onAllClosed = main.slice(main.indexOf("'window-all-closed'"));
  check(
    'closing the last window quits on every platform',
    /^[\s\S]{0,120}app\.quit\(\)/.test(onAllClosed) && !/^[\s\S]{0,120}darwin/.test(onAllClosed)
  );
  const hotkeys = fs.readFileSync(path.join(ROOT, 'electron-dist', 'hotkeys.js'), 'utf8');

  // The restore hotkey is gone: relaunching the app is the recovery path. F8 was freed by that
  // removal and now carries the transcript toggle, so the key itself no longer proves anything -
  // what has to stay true is that no hotkey reaches restoreWindow.
  check('no hotkey restores the window', !/restoreWindow/.test(hotkeys));

  // Stealth mode hides the control panel that carries the transcription toggle, so the hotkey
  // is the only route to it there. It takes both halves to work, and neither fails loudly.
  check('a transcript toggle hotkey is registered', /hotkey:toggle-transcript/.test(hotkeys));
  const preload = fs.readFileSync(path.join(ROOT, 'electron-dist', 'preload.cjs'), 'utf8');
  check('the renderer can subscribe to it', /hotkey:toggle-transcript/.test(preload));

  return failures;
}
