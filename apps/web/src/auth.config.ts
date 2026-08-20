import type { NextAuthConfig } from 'next-auth';

export const ROLES = ['operator', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

const LOGIN_PATH = '/login';

// Kept free of Node-only APIs so the middleware can run on the edge runtime;
// the credentials provider (which hashes with node:crypto) lives in auth.ts.
export const authConfig = {
  pages: { signIn: LOGIN_PATH },
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      return request.nextUrl.pathname.startsWith(LOGIN_PATH) || Boolean(auth?.user);
    },
    jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      session.user.role = toRole(token.role);
      return session;
    },
  },
} satisfies NextAuthConfig;

// A token minted by an older build — or a tampered one — must never be read as
// more privileged than it is, so anything unrecognised falls back to viewer.
function toRole(value: unknown): Role {
  return ROLES.includes(value as Role) ? (value as Role) : 'viewer';
}
