/**
 * Swallow the browser's own back/forward gestures: the mouse side buttons, Alt+Left/Right
 * (Windows and Linux), Cmd+[ / Cmd+] (macOS), and the dedicated Browser Back/Forward keys.
 *
 * Every route here is entered on purpose - an interview from the home cards, a page from the rail -
 * and history traversal skips that. A stray thumb on a mouse button would walk back into an
 * onboarding step already finished or a sign-in screen for a session that is signed in. The
 * in-app Back button (`PageHeader`) is unaffected: it navigates through the router, not these.
 *
 * Capture phase on `window`, so nothing in the tree sees the event before it is cancelled.
 */
import { isMac } from '@/lib/consts';

const MOUSE_BACK = 3;
const MOUSE_FORWARD = 4;

function isHistoryKey(e: KeyboardEvent): boolean {
  if (e.key === 'BrowserBack' || e.key === 'BrowserForward') return true;
  // Not on macOS, where Option+Left/Right moves the caret by a word in every text field.
  if (
    !isMac &&
    e.altKey &&
    !e.ctrlKey &&
    !e.metaKey &&
    (e.key === 'ArrowLeft' || e.key === 'ArrowRight')
  ) {
    return true;
  }
  return e.metaKey && !e.altKey && !e.ctrlKey && (e.key === '[' || e.key === ']');
}

export function blockHistoryGestures(): void {
  const blockMouse = (e: MouseEvent) => {
    if (e.button === MOUSE_BACK || e.button === MOUSE_FORWARD) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  for (const type of ['mousedown', 'mouseup', 'auxclick'] as const) {
    window.addEventListener(type, blockMouse, true);
  }

  window.addEventListener(
    'keydown',
    (e) => {
      if (isHistoryKey(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );
}
