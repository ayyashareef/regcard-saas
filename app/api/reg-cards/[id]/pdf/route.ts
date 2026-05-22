import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRegCard } from "@/lib/actions/reg-cards";
import { prisma } from "@/lib/prisma";
import { hexToRgb, shade } from "@/lib/branding";
import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const regCard = await getRegCard(id);

  if (!regCard) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  // Log PDF download. getRegCard() already scoped the card to this tenant,
  // so session.user.orgId is the correct owner for the audit row.
  await prisma.auditLog.create({
    data: {
      orgId: session.user.orgId,
      action: "REG_CARD_PDF_DOWNLOADED",
      entity: "REG_CARD",
      entityId: regCard.id,
      entityLabel: regCard.cardNo,
      performedById: session.user.id,
    },
  });

  // Tenant branding for the document (name, logo, colors).
  const org = await prisma.organization.findUnique({
    where: { id: session.user.orgId },
    select: { name: true, logoPath: true, primaryColor: true },
  });
  const orgName = org?.name ?? "RegCard";
  const [hr, hg, hb] = hexToRgb(org?.primaryColor ?? "#b8893b");
  const [dr, dg, db] = hexToRgb(shade(org?.primaryColor ?? "#b8893b", -0.34));

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  const fmtDate = (d: Date | null | undefined) =>
    d ? d.toLocaleDateString("en-GB") : "—";

  // Load logo and convert to white version. Prefer the tenant's uploaded
  // logo; fall back to the bundled default.
  let logoBase64: string | null = null;
  let logoAspect = 1;
  try {
    const sharp = require("sharp");
    const uploadRoot = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads");
    const orgLogoPath = org?.logoPath ? path.join(uploadRoot, org.logoPath) : null;
    const logoBuffer =
      orgLogoPath && fs.existsSync(orgLogoPath)
        ? fs.readFileSync(orgLogoPath)
        : fs.readFileSync(path.join(process.cwd(), "public", "logo.png"));
    const meta = await sharp(logoBuffer).metadata();
    const { width, height } = meta;
    if (width && height) {
      logoAspect = width / height;

      // Build white logo: normalize brightness then use as alpha mask for crisp white
      const alphaMask: Buffer = await sharp(logoBuffer)
        .grayscale()
        .normalise()       // stretch contrast to full 0-255 range
        .threshold(180)    // hard threshold → pure black/white mask
        .negate()          // dark logo pixels become white (255), background → 0
        .raw()
        .toBuffer();

      const rgbaData = Buffer.alloc(width * height * 4);
      for (let i = 0; i < width * height; i++) {
        rgbaData[i * 4] = 255;
        rgbaData[i * 4 + 1] = 255;
        rgbaData[i * 4 + 2] = 255;
        rgbaData[i * 4 + 3] = alphaMask[i];
      }
      const whiteLogoBuffer = await sharp(rgbaData, {
        raw: { width, height, channels: 4 },
      }).png().toBuffer();

      logoBase64 = `data:image/png;base64,${whiteLogoBuffer.toString("base64")}`;
    }
  } catch {
    // logo not available
  }

  // Header
  const headerH = 45;
  doc.setFillColor(hr, hg, hb);
  doc.rect(0, 0, pageWidth, headerH, "F");
  if (logoBase64) {
    const logoH = 28;
    const logoW = logoH * logoAspect;
    const logoX = (pageWidth - logoW) / 2;
    const logoY = (headerH - logoH) / 2 - 3;
    doc.addImage(logoBase64, "PNG", logoX, logoY, logoW, logoH);
  }
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("GUEST REGISTRATION CARD", pageWidth / 2, headerH - 4, { align: "center" });

  // Card number
  doc.setTextColor(dr, dg, db);
  doc.setFontSize(14);
  doc.text(regCard.cardNo, pageWidth / 2, 56, { align: "center" });

  // Fields
  doc.setTextColor(44, 44, 44);
  doc.setFontSize(9);

  let y = 65;
  const leftCol = 15;
  const rightCol = pageWidth / 2 + 5;
  const lineHeight = 8;

  function addField(label: string, value: string | null | undefined, x: number) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(85, 85, 85);
    doc.text(label, x, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(44, 44, 44);
    doc.text(value || "—", x + 45, y);
  }

  function addRow(left: [string, string | null | undefined], right: [string, string | null | undefined]) {
    addField(left[0], left[1], leftCol);
    addField(right[0], right[1], rightCol);
    y += lineHeight;
  }

  // Section: Basic
  doc.setFillColor(248, 248, 248);
  doc.rect(10, y - 4, pageWidth - 20, lineHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(dr, dg, db);
  doc.setFontSize(10);
  doc.text("BASIC INFORMATION", leftCol, y);
  y += lineHeight;
  doc.setFontSize(9);

  addRow(["Date:", fmtDate(regCard.date)], ["ID Type:", regCard.idType]);
  addRow(["Check-in:", regCard.checkInTime], ["Check-out Time:", regCard.checkOutTime]);
  addRow(["Check-out Date:", fmtDate(regCard.checkOutDate)], ["", null]);

  y += 4;

  // Section: Guest
  doc.setFillColor(248, 248, 248);
  doc.rect(10, y - 4, pageWidth - 20, lineHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(dr, dg, db);
  doc.setFontSize(10);
  doc.text("GUEST INFORMATION", leftCol, y);
  y += lineHeight;
  doc.setFontSize(9);

  addRow(["Guest Name:", regCard.guestName], ["Contact:", regCard.contactNo]);
  addRow(["WhatsApp:", regCard.whatsappNo], ["Email:", regCard.email]);
  addRow(["Booking:", regCard.company], ["Nationality:", regCard.nationality]);
  addRow(["Date of Birth:", fmtDate(regCard.dateOfBirth)], ["ID Number:", regCard.idNumber]);

  y += 4;

  // Section: Stay
  doc.setFillColor(248, 248, 248);
  doc.rect(10, y - 4, pageWidth - 20, lineHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(dr, dg, db);
  doc.setFontSize(10);
  doc.text("STAY DETAILS", leftCol, y);
  y += lineHeight;
  doc.setFontSize(9);

  addRow(["Arrival:", fmtDate(regCard.arrivalDate)], ["Departure:", fmtDate(regCard.departureDate)]);
  addRow(["Room:", regCard.room?.number || null], ["Meal Plan:", regCard.mealPlan]);

  // Disclaimer
  y += 8;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(85, 85, 85);
  const disclaimer = `The safekeeping of money, jewels and other valuables brought to ${orgName} are the sole responsibility of the guests. ${orgName} accepts no liability and shall not be responsible for any loss or damage thereto, and the guest remains solely responsible for the safekeeping of any such item.`;
  const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 30);
  doc.text(disclaimerLines, leftCol, y);
  y += disclaimerLines.length * 3.5 + 4;

  // Signature
  if (regCard.signatureData) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(dr, dg, db);
    doc.setFontSize(10);
    doc.text("GUEST SIGNATURE", leftCol, y);
    y += 5;

    try {
      doc.addImage(regCard.signatureData, "PNG", leftCol, y, 60, 25);
      y += 30;
    } catch {
      // Skip if image fails
    }
  }

  // Footer
  y += 10;
  doc.setDrawColor(hr, hg, hb);
  doc.line(10, y, pageWidth - 10, y);
  y += 5;
  doc.setFontSize(7);
  doc.setTextColor(85, 85, 85);
  doc.text(`This is a computer-generated document. ${orgName}.`, pageWidth / 2, y, { align: "center" });

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${regCard.cardNo}.pdf"`,
    },
  });
}
