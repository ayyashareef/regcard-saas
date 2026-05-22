"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { validateSlug, slugify } from "@/lib/slug";

const signupSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is too short").max(100),
  slug: z.string().trim().toLowerCase().max(40),
  adminName: z.string().trim().min(2, "Your name is too short").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export type SignupState = { error?: string } | undefined;

/**
 * Self-serve company signup. Creates an ACTIVE Organization + its first
 * SUPER_ADMIN user, then signs the user in and lands them in their new
 * workspace. Public — no tenant context required.
 */
export async function signupOrganization(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    companyName: formData.get("companyName"),
    slug: formData.get("slug"),
    adminName: formData.get("adminName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Fall back to a slug derived from the company name if none was supplied.
  const slug = parsed.data.slug || slugify(parsed.data.companyName);
  const check = validateSlug(slug);
  if (!check.ok) return { error: check.reason };

  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (existing) return { error: "That workspace address is already taken" };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.organization.create({
    data: {
      slug,
      name: parsed.data.companyName,
      status: "ACTIVE",
      users: {
        create: {
          email: parsed.data.email,
          name: parsed.data.adminName,
          password: passwordHash,
          role: "SUPER_ADMIN",
        },
      },
    },
  });

  // Auto sign-in: throws a redirect to the new workspace on success.
  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    org: slug,
    redirectTo: `/${slug}/dashboard`,
  });
}
