"use server";

import path from "path";
import { promises as fs } from "fs";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { isValidHex } from "@/lib/branding";
import { revalidatePath } from "next/cache";

export type BrandingState = { ok?: boolean; error?: string } | undefined;

// SVG intentionally excluded: browsers execute scripts in SVG served as image/svg+xml.
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB

function uploadRoot() {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads");
}

async function requireBrandingAdmin() {
  const ctx = await requireTenant();
  if (ctx.session.user.role !== "SUPER_ADMIN") {
    throw new Error("Only an organization admin can change branding");
  }
  return ctx;
}

export async function updateBranding(
  _prev: BrandingState,
  formData: FormData
): Promise<BrandingState> {
  let orgId: string;
  try {
    ({ orgId } = await requireBrandingAdmin());
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Forbidden" };
  }

  const name = String(formData.get("name") || "").trim();
  const primaryColor = String(formData.get("primaryColor") || "").trim();
  const accentColor = String(formData.get("accentColor") || "").trim();
  const sidebarColor = String(formData.get("sidebarColor") || "").trim();
  const cardNoPrefix = String(formData.get("cardNoPrefix") || "").trim().toUpperCase();

  if (name.length < 2) return { error: "Company name is too short" };
  if (!isValidHex(primaryColor)) return { error: "Primary color must be a #rrggbb hex" };
  if (!isValidHex(accentColor)) return { error: "Accent color must be a #rrggbb hex" };
  if (!isValidHex(sidebarColor)) return { error: "Sidebar color must be a #rrggbb hex" };
  if (!/^[A-Z0-9]{1,6}$/.test(cardNoPrefix)) {
    return { error: "Card prefix must be 1–6 letters/numbers" };
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: { name, primaryColor, accentColor, sidebarColor, cardNoPrefix },
  });

  revalidatePath("/admin/branding");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function uploadBrandingLogo(
  _prev: BrandingState,
  formData: FormData
): Promise<BrandingState> {
  let orgId: string;
  try {
    ({ orgId } = await requireBrandingAdmin());
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Forbidden" };
  }

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image file" };
  }
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return { error: "Logo must be PNG, JPEG or WebP" };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { error: "Logo must be under 2MB" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const orgDir = path.join(uploadRoot(), orgId);
  await fs.mkdir(orgDir, { recursive: true });

  // Normalize all logos to a bounded PNG via sharp (strips metadata, re-encodes).
  const png = await sharp(buffer)
    .resize(512, 512, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  const relPath = path.posix.join(orgId, "logo.png");
  await fs.writeFile(path.join(uploadRoot(), relPath), png);

  await prisma.organization.update({
    where: { id: orgId },
    data: { logoPath: relPath },
  });

  revalidatePath("/admin/branding");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function removeBrandingLogo(): Promise<BrandingState> {
  let orgId: string;
  try {
    ({ orgId } = await requireBrandingAdmin());
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Forbidden" };
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { logoPath: true },
  });
  if (org?.logoPath) {
    await fs.rm(path.join(uploadRoot(), org.logoPath), { force: true });
  }
  await prisma.organization.update({
    where: { id: orgId },
    data: { logoPath: null },
  });

  revalidatePath("/admin/branding");
  revalidatePath("/dashboard");
  return { ok: true };
}
