/**
 * HTTP API Client
 * Base client for making HTTP requests to backend
 */

import { app } from 'electron';

import { BACKEND_BASE_URL } from '../consts.js';
import { configStore } from '../store/config.store.js';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    data?: Record<string, unknown>;
  };
  status: number;
}

export class ApiClient {
  private baseUrl: string;
  private headers: Record<string, string> = {};

  constructor() {
    const baseUrl = BACKEND_BASE_URL;
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'; // Ensure baseUrl ends with slash
    this.headers = {
      'Content-Type': 'application/json',
      'User-Agent': `PowerInterview/${app.getVersion()}`,
    };
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    delete this.headers['Authorization'];
  }

  /**
   * Make GET request
   */
  async get<T>(path: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, params);
    return this.request<T>('GET', url);
  }

  /**
   * Make Form Data POST request
   */
  async postFormData<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    try {
      const sessionToken = configStore.getConfig().sessionToken;
      if (sessionToken) {
        this.setAuthToken(sessionToken);
      }

      // Create headers without Content-Type for FormData
      const formDataHeaders: Record<string, string> = {
        'User-Agent': `PowerInterview/${app.getVersion()}`,
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

  /**
   * Make POST request
   */
  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('POST', url, body);
  }

  /**
   * Make POST request for streaming response
   */
  async postStream(path: string, body?: unknown): Promise<ReadableStream<Uint8Array> | null> {
    const url = this.buildUrl(path);
    return this.requestStream('POST', url, body);
  }

  /**
   * Make PUT request
   */
  async put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('PUT', url, body);
  }

  /**
   * Make DELETE request
   */
  async delete<T>(path: string): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.request<T>('DELETE', url);
  }

  /**
   * Make HTTP request
   */
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

  /**
   * Make HTTP request for streaming response
   */
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
      if (!response.ok || !response.body) {
        console.error('[ApiClient] Streaming request failed:', {
          method,
          url,
          status: response.status,
          statusText: response.statusText,
        });
        return null;
      }

      return response.body;
    } catch (error) {
      console.error('[ApiClient] Streaming request error:', { method, url, error });
      return null;
    }
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(path: string, params?: Record<string, unknown>): string {
    try {
      const cleanPath = path.replace(/^\/+/, ''); // Ensure no leading slash on path

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
