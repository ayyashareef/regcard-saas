import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      orgId: string;
      orgSlug: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    orgId?: string;
    orgSlug?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    id?: string;
    orgId?: string;
    orgSlug?: string;
  }
}
