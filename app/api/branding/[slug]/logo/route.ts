import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { prisma } from "@/lib/prisma";

// Public: a tenant's logo is shown on its (unauthenticated) login page, so
// this endpoint intentionally requires no session. Logos aren't sensitive.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const org = await prisma.organization.findUnique({
    where: { slug },
    select: { logoPath: true },
  });
  if (!org?.logoPath) {
    return NextResponse.json({ message: "No logo" }, { status: 404 });
  }

  const root = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads");
  const filePath = path.resolve(root, org.logoPath);
  // Traversal guard: resolved path must stay under the upload root.
  if (!filePath.startsWith(root + path.sep)) {
    return NextResponse.json({ message: "Invalid path" }, { status: 400 });
  }

  try {
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type =
      ext === ".svg" ? "image/svg+xml" : ext === ".webp" ? "image/webp" : "image/png";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
}
