import type { ZodType } from 'zod';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function apiFetch<T>(path: string, schema: ZodType<T>): Promise<T> {
  return request(path, schema, 'GET');
}

export function apiPost<T>(path: string, schema: ZodType<T>): Promise<T> {
  return request(path, schema, 'POST');
}

async function request<T>(path: string, schema: ZodType<T>, method: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, { method });
  if (!response.ok) {
    throw new ApiError(response.status, await failureMessage(response, path));
  }
  return schema.parse(await response.json());
}

async function failureMessage(response: Response, path: string): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  const message = (body as { message?: unknown } | null)?.message;
  return typeof message === 'string'
    ? message
    : `Request to ${path} failed with ${response.status}`;
}
