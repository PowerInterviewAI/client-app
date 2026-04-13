/**
 * Health Check API
 */

import { appStateService } from '../services/app-state.service.js';
import { RunningState } from '../types/app-state.js';
import { ClientPingRequest, ClientPingResponse } from '../types/healthceck.js';
import { ApiClient, ApiResponse } from './client.js';

export class HealthCheckApi extends ApiClient {
  /**
   * Health check / ping
   */
  async ping(): Promise<ApiResponse<string>> {
    return this.get('/api/health-check/ping');
  }

  /**
   * Ping client to backend with device info
   */
  async pingClient(): Promise<ApiResponse<ClientPingResponse>> {
    const appState = appStateService.getState();
    return this.post<ClientPingResponse>('/api/health-check/ping-client', {
      is_assistant_running: appState.runningState === RunningState.Running,
    } as ClientPingRequest);
  }

  /**
   * Ping GPU server
   */
  async pingGpuServer(): Promise<ApiResponse<string>> {
    return this.get('/api/health-check/ping-gpu-server');
  }

  /**
   * Wake up GPU server
   */
  async wakeupGpuServer(): Promise<ApiResponse<void>> {
    return this.get('/api/health-check/wakeup-gpu-server', {});
  }
}
