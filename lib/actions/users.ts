"use server";

import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// Roles a tenant admin may assign. PLATFORM_ADMIN is intentionally excluded —
// it must never be grantable from inside a tenant.
const ASSIGNABLE_ROLES = new Set(["SUPER_ADMIN", "MANAGER", "STAFF"]);

export async function getUsers() {
  const { session, orgId } = await requireTenant();

  if (session.user.role === "MANAGER") {
    return prisma.user.findMany({
      where: { orgId, role: "STAFF" },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });
  }

  if (session.user.role === "SUPER_ADMIN") {
    return prisma.user.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });
  }

  throw new Error("Forbidden");
}

export async function createUser(data: {
  email: string;
  name: string;
  password: string;
  role: string;
}) {
  const { session, orgId } = await requireTenant();

  if (session.user.role === "STAFF") throw new Error("Forbidden");
  if (!ASSIGNABLE_ROLES.has(data.role)) throw new Error("Invalid role");
  if (session.user.role === "MANAGER" && data.role !== "STAFF") {
    throw new Error("Managers can only create STAFF users");
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      orgId,
      email: data.email,
      name: data.name,
      password: hashedPassword,
      role: data.role,
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId,
      action: "USER_CREATED",
      entity: "USER",
      entityId: user.id,
      entityLabel: user.email,
      performedById: session.user.id,
    },
  });

  revalidatePath("/admin/users");
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function updateUser(
  id: string,
  data: { name?: string; email?: string; role?: string; isActive?: boolean; password?: string }
) {
  const { session, orgId } = await requireTenant();
  if (session.user.role === "STAFF") throw new Error("Forbidden");

  // Ownership guard: only users in the same tenant may be modified.
  const target = await prisma.user.findFirst({ where: { id, orgId } });
  if (!target) throw new Error("Not found");

  if (data.role !== undefined && !ASSIGNABLE_ROLES.has(data.role)) {
    throw new Error("Invalid role");
  }

  const updateData: Record<string, unknown> = {};
  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;
  if (data.role) updateData.role = data.role;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.password) updateData.password = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  const action = data.isActive === false ? "USER_DEACTIVATED" : "USER_UPDATED";

  await prisma.auditLog.create({
    data: {
      orgId,
      action,
      entity: "USER",
      entityId: user.id,
      entityLabel: user.email,
      performedById: session.user.id,
      metadata: { changed: Object.keys(data) },
    },
  });

  revalidatePath("/admin/users");
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
