import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { path: pathSegments } = await params;

  // First segment is orgId — users may only access their own org's uploads.
  const requestedOrgId = pathSegments[0];
  if (!requestedOrgId || requestedOrgId !== session.user.orgId) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const uploadRoot = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads");
  const filePath = path.resolve(uploadRoot, pathSegments.join(path.sep));

  // Traversal guard: resolved path must stay inside the upload root.
  if (!filePath.startsWith(uploadRoot + path.sep)) {
    return NextResponse.json({ message: "Invalid path" }, { status: 400 });
  }

  try {
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    const mimeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
    };

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeMap[ext] || "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
}
