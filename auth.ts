import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Google from 'next-auth/providers/google';
import { cache } from 'react';
import { db } from '@/db';
import { users, accounts, sessions, verificationTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';

const nextAuth = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts as any,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // Prefer role from adapter user if present (avoids extra DB round-trip)
        const userWithRole = user as { role?: string };
        if (userWithRole.role != null) {
          (session.user as any).role = userWithRole.role;
        } else {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.id, user.id),
            columns: { role: true },
          });
          if (dbUser) (session.user as any).role = dbUser.role;
        }
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuth = nextUrl.pathname.startsWith('/auth');
      const isOnPublic = nextUrl.pathname === '/';

      if (isOnAuth || isOnPublic) {
        return true;
      }

      return isLoggedIn;
    },
  },
  trustHost: true,
});

export const { handlers, signIn, signOut, auth } = nextAuth;

/** Cached auth for server components: deduplicates within same request (layout + page). Use this in layout and pages instead of auth() to avoid 2–3x DB work per navigation. */
export const getCachedAuth = cache(auth);
