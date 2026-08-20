import type { Role } from '@/auth.config';
import { auth, signOut } from '@/auth';

const ROLE_BADGE: Record<Role, string> = {
  operator: 'bg-emerald-400/10 text-emerald-300',
  viewer: 'bg-sky-400/10 text-sky-300',
};

export async function SessionBar() {
  const session = await auth();
  if (!session?.user) return null;

  const { email, role } = session.user;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-neutral-400">{email}</span>
      <span className={`rounded px-2 py-0.5 text-xs ${ROLE_BADGE[role]}`}>{role}</span>
      <form
        action={async () => {
          'use server';
          await signOut({ redirectTo: '/login' });
        }}
      >
        <button
          type="submit"
          className="rounded-md border border-neutral-800 px-3 py-1 text-xs hover:border-neutral-600"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
