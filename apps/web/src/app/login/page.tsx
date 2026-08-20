import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { LoginForm } from '@/components/login-form';
import { githubEnabled, serverEnv } from '@/lib/env';

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect('/');

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Conveyor — Ops Console</h1>
        <p className="text-sm text-neutral-400">Sign in to reach the console.</p>
      </header>
      <LoginForm githubEnabled={githubEnabled()} demoEmail={serverEnv().DEMO_EMAIL} />
    </main>
  );
}
