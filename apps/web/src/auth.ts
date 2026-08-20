import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import { authConfig } from './auth.config';
import { operatorEmails, serverEnv } from './lib/env';
import { verifyPassword } from './lib/password';

export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  ...authConfig,
  providers: providers(),
  callbacks: {
    ...authConfig.callbacks,
    signIn({ user, account }) {
      return account?.provider !== 'github' || user.role === 'operator';
    },
  },
}));

function providers(): NextAuthConfig['providers'] {
  const env = serverEnv();

  const demo = Credentials({
    id: 'demo',
    name: 'Demo access',
    credentials: { email: {}, password: {} },
    async authorize(credentials) {
      const email = String(credentials.email ?? '')
        .trim()
        .toLowerCase();
      const password = String(credentials.password ?? '');

      // Both checks always run: short-circuiting on the address would leak,
      // through response time, whether an account exists.
      const emailMatches = email === env.DEMO_EMAIL.toLowerCase();
      const passwordMatches = await verifyPassword(password, env.DEMO_PASSWORD_HASH);
      if (!emailMatches || !passwordMatches) return null;

      return { id: 'demo', email: env.DEMO_EMAIL, name: 'Demo viewer', role: 'viewer' };
    },
  });

  if (!env.AUTH_GITHUB_ID || !env.AUTH_GITHUB_SECRET) {
    return [demo];
  }

  const github = GitHub({
    clientId: env.AUTH_GITHUB_ID,
    clientSecret: env.AUTH_GITHUB_SECRET,
    profile(profile) {
      const email = profile.email?.toLowerCase() ?? '';
      return {
        id: String(profile.id),
        name: profile.name ?? profile.login,
        email: profile.email,
        image: profile.avatar_url,
        role: operatorEmails().includes(email) ? 'operator' : 'viewer',
      };
    },
  });

  return [github, demo];
}
