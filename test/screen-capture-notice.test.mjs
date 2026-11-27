/**
 * The screen capture notice is renderer code, so these are source-level checks in the shape of
 * `interview-lock.test.mjs`. Stealth no longer hides the window from capture - the
 * `allowScreenCapture` setting alone does - so the warning before a live start and the badge
 * during one are the only things telling the candidate a screen share can see the app. Dropping
 * either is silent: nothing fails, the window simply shows up on the share.
 */
import { codeOnly, createChecker, readSource } from './helpers.mjs';

export async function run() {
  const { check, failures } = createChecker('screen-capture-notice');

  const read = (path) => codeOnly(readSource(new URL(path, import.meta.url)));
  const panel = read('../src/renderer/components/custom/control-panel/index.tsx');
  const status = read('../src/renderer/components/custom/status-panel.tsx');
  const hook = read('../src/renderer/hooks/use-screen-capture-status.ts');

  check(
    'the status is capturable whenever capture is allowed',
    /if \(enabled\) return 'capturable'/.test(hook)
  );
  check('macOS is reported as limited, not protected', /isMac \? 'limited'/.test(hook));

  const confirmed = panel.indexOf('const handleHeadphonesConfirmed');
  const confirmedBody = panel.slice(confirmed, panel.indexOf('const startAfterNotice'));
  check('the headphone notice hands off to the capture check', confirmed !== -1);
  check(
    'a capturable window opens the notice instead of starting',
    confirmedBody.includes("captureStatus === 'protected'") &&
      confirmedBody.includes('setCaptureNoticeOpen(true)')
  );
  check(
    'the headphone notice no longer starts directly',
    /onProceed=\{handleHeadphonesConfirmed\}/.test(panel)
  );
  check(
    'cancelling the capture notice backs out of the start',
    /<ScreenCaptureNoticeDialog[\s\S]*?onCancel=\{handleStartCancelled\}/.test(panel)
  );

  check('the control bar shows the capture badge', panel.includes('<ScreenCaptureBadge'));
  check('the stealth status panel shows the capture badge', status.includes('<ScreenCaptureBadge'));

  return failures;
}
