import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import authConfig from "@/lib/auth.config";

/**
 * Full (Node-runtime) NextAuth instance. Login is tenant-scoped: the same
 * email may exist in many organizations, so credentials carry the org `slug`
 * (injected by the login form from the URL) and the user is resolved by the
 * composite (orgId, email) unique. Suspended orgs cannot authenticate.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        org: { label: "Organization", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const slug = credentials?.org as string | undefined;
        if (!email || !password || !slug) return null;

        const org = await prisma.organization.findUnique({
          where: { slug },
        });
        if (!org || org.status !== "ACTIVE") return null;

        const user = await prisma.user.findUnique({
          where: { orgId_email: { orgId: org.id, email } },
        });
        if (!user || !user.isActive) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: org.id,
          orgSlug: org.slug,
        };
      },
    }),
  ],
});
