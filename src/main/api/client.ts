import { app } from 'electron';
import os from 'os';

import { BACKEND_BASE_URL } from '../consts.js';
import { configStore } from '../store/config.store.js';

function buildUserAgent(): string {
  return `PowerInterviewAI/${app.getVersion()} (${process.platform}; ${process.arch}; ${os.release()})`;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    data?: Record<string, unknown>;
  };
  status: number;
}

export class ApiRequestError extends Error {
  status: number;
  content: unknown;

  constructor(message: string, status: number, content?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.content = content;
  }
}

export class ApiClient {
  private baseUrl: string;
  private headers: Record<string, string> = {};

  constructor() {
    const baseUrl = BACKEND_BASE_URL;
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    this.headers = {
      'Content-Type': 'application/json',
      'User-Agent': buildUserAgent(),
    };
  }

  setAuthToken(token: string): void {
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken(): void {
    delete this.headers['Authorization'];
  }

  async get<T>(
    path: string,
    params?: Record<string, unknown>,
    timeoutMs?: number
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, params);
    return this.request<T>('GET', url, undefined, timeoutMs);
  }

  async postFormData<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    try {
      const sessionToken = configStore.getConfig().sessionToken;
      if (sessionToken) {
        this.setAuthToken(sessionToken);
      }

      // FormData must not have Content-Type set — the browser sets it with the boundary
      const formDataHeaders: Record<string, string> = {
        'User-Agent': buildUserAgent(),
        Authorization: this.headers['Authorization'] || '',
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: formDataHeaders,
        body: formData,
      });
      const respBody = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = respBody.detail;
        return {
          status: response.status,
          error: {
            code: detail?.error_code || 'HTTP_ERROR',
            message: detail?.message || response.statusText,
            data: detail?.data,
          },
        };
      }

      return {
        status: response.status,
        data: respBody,
      };
    } catch (error: unknown) {
      return {
        status: 0,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
        },
      };
    }
  }

  async post<T>(path: string, body?: unknown, timeoutMs?: number): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('POST', url, body, timeoutMs);
  }

  async postStream(
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array> | null> {
    const url = this.buildUrl(path);
    return this.requestStream('POST', url, body, signal);
  }

  /**
   * POST a JSON body and read back binary bytes rather than JSON.
   *
   * `request<T>` always calls `response.json()`, which a binary body cannot satisfy - this is
   * the mock interview's `/speak` proxy, which answers audio bytes or a bare `204 No Content`.
   * That 204 is a normal result (the language has no Aura voice), not an error, so it resolves
   * to `null` rather than throwing - the caller falls back to a text-only question either way.
   */
  async postArrayBuffer(
    path: string,
    body?: unknown,
    timeoutMs?: number
  ): Promise<ArrayBuffer | null> {
    const url = this.buildUrl(path);
    try {
      const sessionToken = configStore.getConfig().sessionToken;
      if (sessionToken) {
        this.setAuthToken(sessionToken);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined,
      });

      if (response.status === 204) return null;

      if (!response.ok) {
        const responseContent = await response.text().catch(() => '');
        throw new ApiRequestError(
          response.statusText || 'HTTP request failed',
          response.status,
          responseContent
        );
      }

      return await response.arrayBuffer();
    } catch (error: unknown) {
      if (error instanceof ApiRequestError) throw error;

      const timedOut = error instanceof Error && error.name === 'TimeoutError';
      throw new ApiRequestError(
        timedOut
          ? 'The request timed out'
          : error instanceof Error
            ? error.message
            : 'Network request failed',
        0,
        null
      );
    }
  }

  async put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('PUT', url, body);
  }

  async patch<T>(path: string, body?: unknown, timeoutMs?: number): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('PATCH', url, body, timeoutMs);
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('DELETE', url);
  }

  private async request<T>(
    method: string,
    url: string,
    body?: unknown,
    timeoutMs?: number
  ): Promise<ApiResponse<T>> {
    try {
      const sessionToken = configStore.getConfig().sessionToken;
      if (sessionToken) {
        this.setAuthToken(sessionToken);
      }

      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined,
      });

      const respBody = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = respBody.detail;
        return {
          status: response.status,
          error: {
            code: detail?.error_code || 'HTTP_ERROR',
            message: detail?.message || response.statusText,
            data: detail?.data,
          },
        };
      }

      return {
        status: response.status,
        data: respBody,
      };
    } catch (error: unknown) {
      const timedOut = error instanceof Error && error.name === 'TimeoutError';
      return {
        status: 0,
        error: {
          code: timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
          message: timedOut
            ? 'The request timed out'
            : error instanceof Error
              ? error.message
              : 'Network request failed',
        },
      };
    }
  }

  // No `timeoutMs` here on purpose: AbortSignal.timeout is a total wall-clock deadline, which
  // would truncate a long-but-healthy generation mid-stream. Callers pass a signal driven by a
  // stall timer that resets on every chunk instead.
  async requestStream(
    method: string,
    url: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array> | null> {
    try {
      const sessionToken = configStore.getConfig().sessionToken;
      if (sessionToken) {
        this.setAuthToken(sessionToken);
      }

      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
        signal,
      });
      if (!response.ok) {
        const responseContent = await response.text().catch(() => '');
        throw new ApiRequestError(
          response.statusText || 'HTTP stream request failed',
          response.status,
          responseContent
        );
      }
      if (!response.body) {
        throw new ApiRequestError(
          'Empty response body for streaming request',
          response.status,
          null
        );
      }

      return response.body;
    } catch (error: unknown) {
      if (error instanceof ApiRequestError) {
        console.error('[ApiClient] Streaming request failed:', {
          method,
          url,
          status: error.status,
          content: error.content,
        });
        throw error;
      }

      // A supersede or stall abort is deliberate. Let it through untouched so callers can
      // read `signal.reason` to tell the two apart, and do not log it as a failure.
      //
      // Keyed on the signal, not the error name: an abort rejects with the *reason*, so a
      // stall abort surfaces as `TimeoutError` rather than `AbortError` and a name check
      // would miss it and wrap it as a network failure.
      if (signal?.aborted) {
        throw error;
      }

      console.error('[ApiClient] Streaming request error:', { method, url, error });
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Network request failed',
        0,
        null
      );
    }
  }

  private buildUrl(path: string, params?: Record<string, unknown>): string {
    try {
      const cleanPath = path.replace(/^\/+/, '');
      const url = new URL(cleanPath, this.baseUrl);

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      return url.toString();
    } catch (error) {
      console.error('[ApiClient] Failed to build URL:', { baseUrl: this.baseUrl, path, error });
      throw new Error(`Invalid URL: baseUrl="${this.baseUrl}", path="${path}"`);
    }
  }
}
