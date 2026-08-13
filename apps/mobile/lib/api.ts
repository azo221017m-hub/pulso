import { Platform } from 'react-native';

const DEFAULT_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_BASE_URL;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

const RETRYABLE_METHODS = new Set(['GET', 'PUT']);

async function request<T>(path: string, options: RequestInit = {}, attempt = 0): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      throw new ApiError(response.status, data?.message ?? 'Ocurrió un error inesperado.');
    }
    return data as T;
  } catch (error) {
    // Render's free tier spins the API down after idling and takes a few seconds to wake up
    // on the next request — a transient failure/timeout there, not a real API error. One
    // retry for idempotent methods smooths that over.
    const method = (options.method ?? 'GET').toUpperCase();
    if (attempt === 0 && !(error instanceof ApiError) && RETRYABLE_METHODS.has(method)) {
      return request<T>(path, options, attempt + 1);
    }
    throw error;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
