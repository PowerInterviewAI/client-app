/**
 * Action Lock Service
 * Manages blocking of long-running action suggestion actions (screenshot capture, suggestion generation)
 */

import { ACTION_LOCK_MAX_HOLD_MS } from '../consts.js';
import { uiStrings } from '../utils/ui-strings.js';
import { pushNotificationService } from './push-notification.service.js';

export enum ActionType {
  ScreenshotCapture = 'screenshot_capture',
  CaptureSuggestion = 'capture_suggestion',
}

class ActionLockService {
  private currentAction: ActionType | null = null;
  private holdTimer: NodeJS.Timeout | null = null;

  /**
   * Try to acquire lock for an action
   * @returns true if lock acquired, false if blocked
   */
  tryAcquire(action: ActionType): boolean {
    if (this.currentAction !== null) {
      this.notifyBlocked(action, this.currentAction);
      return false;
    }
    this.currentAction = action;

    // A held lock blocks all three action hotkeys with no recovery short of restarting the
    // app, so never let one outlive its holder. Callers still release explicitly; this only
    // fires if that fails.
    this.holdTimer = setTimeout(() => {
      console.error(
        `[ActionLockService] Lock held by ${this.currentAction} for more than ` +
          `${ACTION_LOCK_MAX_HOLD_MS}ms, force-releasing. This indicates a leaked lock.`
      );
      this.currentAction = null;
      this.holdTimer = null;
    }, ACTION_LOCK_MAX_HOLD_MS);

    return true;
  }

  /**
   * Release the lock
   */
  release(action: ActionType): void {
    // Only the holder may release. Clearing the timer on a mismatched call would strip the
    // backstop from a lock that is still held by someone else.
    if (this.currentAction !== action) {
      return;
    }

    this.currentAction = null;
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
  }

  /**
   * Check if any action is currently running
   */
  isLocked(): boolean {
    return this.currentAction !== null;
  }

  /**
   * Get the current running action
   */
  getCurrentAction(): ActionType | null {
    return this.currentAction;
  }

  /**
   * Notify user that action is blocked
   */
  private notifyBlocked(requestedAction: ActionType, runningAction: ActionType): void {
    const strings = uiStrings();
    const actionNames: Record<ActionType, string> = {
      [ActionType.ScreenshotCapture]: strings.actionNames.screenshotCapture,
      [ActionType.CaptureSuggestion]: strings.actionNames.captureSuggestion,
    };

    const requested = actionNames[requestedAction];
    const running = actionNames[runningAction];

    console.log(`${requested} is blocked because ${running} is in progress.`);

    pushNotificationService.pushNotification({
      type: 'warning',
      message: strings.actionBlocked(running),
    });
  }
}

export const actionLockService = new ActionLockService();
