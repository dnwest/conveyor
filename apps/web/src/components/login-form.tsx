'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export function LoginForm({
  githubEnabled,
  demoEmail,
}: {
  githubEnabled: boolean;
  demoEmail: string;
}) {
  const [email, setEmail] = useState(demoEmail);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFailed(false);

    const result = await signIn('demo', { email, password, redirect: false });
    if (result?.error) {
      setFailed(true);
      setSubmitting(false);
      return;
    }
    window.location.href = '/';
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      {githubEnabled && (
        <>
          <button
            type="button"
            onClick={() => void signIn('github', { redirectTo: '/' })}
            className="rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium hover:border-neutral-500"
          >
            Sign in with GitHub
          </button>
          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-neutral-600">
            <span className="h-px flex-1 bg-neutral-800" />
            or
            <span className="h-px flex-1 bg-neutral-800" />
          </div>
        </>
      )}

      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-400">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-400">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2"
          />
        </label>

        {failed && <p className="text-sm text-red-300">Those credentials were not accepted.</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950 disabled:opacity-50"
        >
          {submitting ? 'Signing in…' : 'Sign in as viewer'}
        </button>
      </form>

      <p className="text-xs text-neutral-500">
        Viewers can read every panel. Replaying a dead letter requires an operator account.
      </p>
    </div>
  );
}
