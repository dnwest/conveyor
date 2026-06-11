import type { ZodType } from 'zod';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function apiFetch<T>(path: string, schema: ZodType<T>): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with ${response.status}`);
  }
  return schema.parse(await response.json());
}
