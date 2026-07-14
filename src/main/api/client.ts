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

  async get<T>(path: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, params);
    return this.request<T>('GET', url);
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

  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('POST', url, body);
  }

  async postStream(path: string, body?: unknown): Promise<ReadableStream<Uint8Array> | null> {
    const url = this.buildUrl(path);
    return this.requestStream('POST', url, body);
  }

  async put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('PUT', url, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('PATCH', url, body);
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('DELETE', url);
  }

  private async request<T>(method: string, url: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const sessionToken = configStore.getConfig().sessionToken;
      if (sessionToken) {
        this.setAuthToken(sessionToken);
      }

      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
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

  async requestStream(
    method: string,
    url: string,
    body?: unknown
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
