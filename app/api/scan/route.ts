import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { scanPassport, scanIdCard } from "@/lib/scan";
import sharp from "sharp";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const TARGET_PHOTO_SIZE = 300 * 1024; // 300KB

async function optimizePhoto(buffer: Buffer): Promise<string> {
  // Start with quality 80, reduce until under 300KB
  let quality = 80;
  let optimized = await sharp(buffer)
    .resize(1200, undefined, { withoutEnlargement: true })
    .jpeg({ quality })
    .toBuffer();

  while (optimized.length > TARGET_PHOTO_SIZE && quality > 20) {
    quality -= 10;
    optimized = await sharp(buffer)
      .resize(1200, undefined, { withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();
  }

  // If still too large, resize further
  if (optimized.length > TARGET_PHOTO_SIZE) {
    optimized = await sharp(buffer)
      .resize(800, undefined, { withoutEnlargement: true })
      .jpeg({ quality: 30 })
      .toBuffer();
  }

  return `data:image/jpeg;base64,${optimized.toString("base64")}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const { success } = rateLimit(ip, 10, 60000);
  if (!success) {
    return NextResponse.json({ message: "Too many requests. Try again later." }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: "Invalid file type. Only JPEG, PNG, and WebP are accepted." },
        { status: 415 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { message: "File too large. Maximum size is 5MB." },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const idType = formData.get("idType") as string | null;

    // Optimize photo for storage (≤300KB JPEG)
    const passportPhoto = await optimizePhoto(buffer);

    const result = idType === "MALDIVIAN"
      ? await scanIdCard(buffer)
      : await scanPassport(buffer);

    if (result.success) {
      return NextResponse.json({ ...result, passportPhoto });
    }

    // Even if MRZ fails, still return the photo
    return NextResponse.json({ ...result, passportPhoto });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json({ success: false, reason: "parse_error", message: "Failed to process image" }, { status: 500 });
  }
}
