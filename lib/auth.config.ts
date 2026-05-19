import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe NextAuth config. Contains NO Prisma/bcrypt imports so it can be
 * bundled into the Edge middleware. The Credentials provider (whose
 * `authorize` needs Prisma + bcrypt) is added in lib/auth.ts, which runs in
 * the Node runtime only. Middleware just decodes the JWT session cookie, so
 * an empty providers list here is sufficient for it.
 */
export default {
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          role?: string;
          id?: string;
          orgId?: string;
          orgSlug?: string;
        };
        token.role = u.role;
        token.id = u.id;
        token.orgId = u.orgId;
        token.orgSlug = u.orgSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.orgId = token.orgId as string;
        session.user.orgSlug = token.orgSlug as string;
      }
      return session;
    },
  },
  pages: {
    // Per-org login routing is handled by middleware; this is only a fallback.
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;
