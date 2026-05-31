import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import type { Provider } from 'next-auth/providers';
import { userRepository } from './application/wiring';

const providers: Provider[] = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  }),
];

if (process.env.NODE_ENV !== 'production' && process.env.E2E_TEST_EMAIL) {
  providers.push(
    Credentials({
      id: 'test-credentials',
      name: 'Test Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (
          credentials.email === process.env.E2E_TEST_EMAIL &&
          credentials.password === (process.env.E2E_TEST_PASSWORD ?? 'e2e-test')
        ) {
          return {
            id: '',
            email: credentials.email as string,
            name: process.env.E2E_TEST_NAME ?? 'E2E Test User',
          };
        }
        return null;
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {return false;}

      let dbUser = await userRepository.findByEmail(user.email);
      if (dbUser && !dbUser.isActive) {return false;}
      if (!dbUser) {
        dbUser = await userRepository.create({
          email: user.email,
          name: user.name ?? '',
          picture: user.image ?? '',
        });
      } else {
        await userRepository.updateLastLogin(dbUser.id);
      }

      return true;
    },
    async jwt({ token, user }) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (user?.email) {
        const dbUser = await userRepository.findByEmail(user.email);
        if (dbUser) {
          token.id = dbUser.id;
          token.isActive = dbUser.isActive;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.AUTH_SECRET,
});
