/**
 * Health Check Service
 * Monitors backend and GPU server availability and updates app state
 */

import { HealthCheckApi } from '../api/health-check.js';
import { safeSleep } from '../utils/sleep.js';
import { appStateService } from './app-state.service.js';

const SUCCESS_INTERVAL = 5 * 1000; // 5 seconds
const FAILURE_INTERVAL = 1 * 1000; // 1 second

export class HealthCheckService {
  private running = false;
  private client = new HealthCheckApi();

  /**
   * Start health check monitoring
   */
  async start(): Promise<void> {
    console.log('[HealthCheckService] Starting health check service');
    if (this.running) return;
    this.running = true;

    appStateService.updateState({ isLoggedIn: null });
    try {
      const res = await this.client.pingClient();
      appStateService.updateState({
        isLoggedIn: res.status === 200,
        credits: res.data?.credits,
      });
    } catch (error) {
      console.error('[HealthCheckService] Initial client ping error:', error);
      appStateService.updateState({ isLoggedIn: false });
    }

    this.startBackendLoop();
    this.startClientLoop();
    this.startGpuLoop();
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
      while (this.running) {
        let backendLive = false;
        try {
          const pingResult = await this.client.ping();
          backendLive = pingResult.status === 200;
        } catch (error) {
          console.error('[HealthCheckService] Backend ping error:', error);
        }

        if (!backendLive) {
          console.log('[HealthCheckService] Backend not live');
        }

        // Update app state
        appStateService.updateState({ isBackendLive: backendLive });

        const next = backendLive ? SUCCESS_INTERVAL : FAILURE_INTERVAL;
        await safeSleep(next);
      }
    })();
  }

  /** Client ping loop */
  private startClientLoop(): void {
    (async () => {
      while (this.running) {
        const state = appStateService.getState();
        // if the app is idle we halt client pings until user wakes it
        if (state.isAppIdle) {
          await safeSleep(SUCCESS_INTERVAL);
          continue;
        }

        // skip if not logged in
        if (!state.isLoggedIn) {
          await safeSleep(FAILURE_INTERVAL);
          continue;
        }

        let nextInterval = SUCCESS_INTERVAL;

        try {
          const pingResponse = await this.client.pingClient();
          if (pingResponse.data?.credits !== undefined) {
            appStateService.updateState({ credits: pingResponse.data?.credits });
          }
        } catch (error) {
          console.error('[HealthCheckService] Client ping error:', error);
          nextInterval = FAILURE_INTERVAL;
        }

        await safeSleep(nextInterval);
      }
    })();
  }

  /** GPU ping loop, triggers wakeup if needed */
  private startGpuLoop(): void {
    (async () => {
      while (this.running) {
        const state = appStateService.getState();
        // if the app is idle we halt GPU pings until user wakes it
        if (state.isAppIdle) {
          await safeSleep(1);
          continue;
        }

        // skip if not logged in
        if (!state.isLoggedIn) {
          await safeSleep(FAILURE_INTERVAL);
          continue;
        }

        let gpuServerLive = false;
        try {
          // ping GPU server
          const gpuPingResult = await this.client.pingGpuServer();
          gpuServerLive = gpuPingResult.status === 200;

          // attempt wakeup if GPU not live
          if (!gpuServerLive) {
            console.log('[HealthCheckService] GPU not live, attempting wakeup');
            await this.client.wakeupGpuServer();
          }
        } catch (error) {
          console.error('[HealthCheckService] GPU ping/wakeup error:', error);
        }

        appStateService.updateState({ isGpuServerLive: gpuServerLive });

        const next = gpuServerLive ? SUCCESS_INTERVAL : FAILURE_INTERVAL;
        await safeSleep(next);
      }
    })();
  }
}

// Singleton instance
export const healthCheckService = new HealthCheckService();
