import { z } from 'zod';

const serverEnvSchema = z.object({
  AUTH_SECRET: z.string().min(1),
  AUTH_GITHUB_ID: z.string().min(1).optional(),
  AUTH_GITHUB_SECRET: z.string().min(1).optional(),
  AUTH_OPERATOR_EMAILS: z.string().default(''),
  DEMO_EMAIL: z.string().email(),
  DEMO_PASSWORD_HASH: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

// Validated on first use rather than at import time: the module graph is walked
// during `next build`, where these secrets are legitimately absent.
export function serverEnv(): ServerEnv {
  cached ??= serverEnvSchema.parse(process.env);
  return cached;
}

export function githubEnabled(): boolean {
  const env = serverEnv();
  return Boolean(env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET);
}

export function operatorEmails(): string[] {
  return serverEnv()
    .AUTH_OPERATOR_EMAILS.split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
