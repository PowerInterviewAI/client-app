/**
 * Health Check Service
 * Monitors backend and GPU server availability and updates app state
 */

import { HealthCheckApi } from '../api/health-check.js';
import { MockInterviewApi } from '../api/mock-interview.js';
import { safeSleep } from '../utils/sleep.js';
import { accountService } from './account.service.js';
import { appStateService } from './app-state.service.js';
import { authService } from './auth.service.js';
import { pushNotificationService } from './push-notification.service.js';

const SUCCESS_INTERVAL = 5 * 1000; // 5 seconds
const FAILURE_INTERVAL = 1 * 1000; // 1 second

// A backend that is down is usually down for longer than a second, and the first retry is the
// only one that benefits from being immediate. Without a ceiling the loop below polls at 1 Hz
// for as long as the app is open - a laptop left overnight on a dropped connection makes tens of
// thousands of failing requests, and every installed client comes back at the same rate the
// moment a real outage ends. Backoff is capped rather than unbounded so recovery is still
// noticed within half a minute, which is what the reconnect notice in the UI is waiting on.
const MAX_FAILURE_INTERVAL = 30 * 1000;
const FAILURE_BACKOFF_FACTOR = 2;

function nextFailureInterval(current: number): number {
  return Math.min(current * FAILURE_BACKOFF_FACTOR, MAX_FAILURE_INTERVAL);
}

export class HealthCheckService {
  private running = false;
  private client = new HealthCheckApi();
  private mockClient = new MockInterviewApi();

  /**
   * Start health check monitoring
   */
  async start(): Promise<void> {
    console.log('[HealthCheckService] Starting health check service');
    if (this.running) return;
    this.running = true;

    appStateService.updateState({ isLoggedIn: null });
    let loggedIn = false;
    try {
      const res = await this.client.pingClient();
      loggedIn = res.status === 200;
      appStateService.updateState({
        isLoggedIn: loggedIn,
        credits: res.data?.credits,
        userRole: res.data?.user_role,
        providedLLMModel: res.data?.provided_llm_model,
      });
    } catch (error) {
      console.error('[HealthCheckService] Initial client ping error:', error);
      appStateService.updateState({ isLoggedIn: false });
    }

    this.startBackendLoop();
    this.startClientLoop();

    // Remembered sessions log the user in here without going through authService.login(),
    // so this is where a returning device needs to pull its synced account config. Kicked
    // off after the loops and left unawaited on purpose: a slow /users/me must not keep
    // backend liveness and session-expiry monitoring from ever starting.
    if (loggedIn) {
      void accountService.pullFromBackend();
    }
  }

  /**
   * Stop health check monitoring
   */
  stop(): void {
    console.log('[HealthCheckService] Stopping health check service');
    this.running = false;
  }

  /** Backend ping loop */
  private startBackendLoop(): void {
    (async () => {
      let failureInterval = FAILURE_INTERVAL;
      let wasLive = false;

      while (this.running) {
        let backendLive = false;
        try {
          const pingResult = await this.client.ping();
          backendLive = pingResult.status === 200;
        } catch (error) {
          console.error('[HealthCheckService] Backend ping error:', error);
        }

        if (!backendLive) {
          console.log(`[HealthCheckService] Backend not live, next check in ${failureInterval}ms`);
        }

        // Update app state
        appStateService.updateState({ isBackendLive: backendLive });

        // On the edge into live, not on every tick: the answer only changes when the process on
        // the other end is replaced, and that is exactly what a down-then-up looks like from
        // here. Polling it at the ping rate would add a request every five seconds for the whole
        // session to learn something that almost never moves.
        //
        // Left standing while the backend is down. The last answer is the best one available,
        // and clearing it would retire the entry point over an outage - the one cause that has
        // nothing to do with what the backend supports.
        if (backendLive && !wasLive) {
          void this.refreshMockInterviewSupport();
        }
        wasLive = backendLive;

        // Reset on the way back up, so one blip does not leave the app checking slowly for the
        // rest of the session.
        const next = backendLive ? SUCCESS_INTERVAL : failureInterval;
        failureInterval = backendLive ? FAILURE_INTERVAL : nextFailureInterval(failureInterval);

        await safeSleep(next);
      }
    })();
  }

  /**
   * Ask the backend whether it serves the mock-interview routes, and record the answer.
   *
   * Only writes when the probe came back with something. A probe that never arrived returns
   * `null` and is dropped here rather than overwriting a known answer with an unknown one.
   */
  private async refreshMockInterviewSupport(): Promise<void> {
    let supported: boolean | null = null;
    try {
      supported = await this.mockClient.probeSupport();
    } catch (error) {
      console.error('[HealthCheckService] Mock interview probe error:', error);
      return;
    }

    if (supported === null) return;

    if (supported !== appStateService.getState().mockInterviewSupported) {
      console.log(`[HealthCheckService] Mock interview supported by backend: ${supported}`);
    }
    appStateService.updateState({ mockInterviewSupported: supported });
  }

  /** Client ping loop */
  private startClientLoop(): void {
    (async () => {
      let failureInterval = FAILURE_INTERVAL;

      while (this.running) {
        const state = appStateService.getState();

        // skip if not logged in. Kept at FAILURE_INTERVAL: it makes no request, so it costs a
        // timer wake-up rather than traffic, and it is what decides how soon after a sign-in the
        // credits and role reach the UI.
        if (!state.isLoggedIn) {
          await safeSleep(FAILURE_INTERVAL);
          failureInterval = FAILURE_INTERVAL;
          continue;
        }

        let nextInterval = SUCCESS_INTERVAL;

        try {
          const res = await this.client.pingClient();
          if (res.status === 401) {
            console.warn('[HealthCheckService] Session expired (401) - logging out');
            pushNotificationService.pushNotification({
              type: 'warning',
              message: 'Your session expired, please log in again.',
            });
            await authService.logout();
          } else if (res.data?.credits !== undefined) {
            console.log('client ping response:', res.data);
            appStateService.updateState({
              credits: res.data?.credits,
              providedLLMModel: res.data?.provided_llm_model,
              userRole: res.data?.user_role,
            });
          }
          failureInterval = FAILURE_INTERVAL;
        } catch (error) {
          console.error('[HealthCheckService] Client ping error:', error);
          nextInterval = failureInterval;
          failureInterval = nextFailureInterval(failureInterval);
        }

        await safeSleep(nextInterval);
      }
    })();
  }
}

// Singleton instance
export const healthCheckService = new HealthCheckService();
