import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 12);

  try {
    const oldLogs = await prisma.auditLog.findMany({
      where: {
        createdAt: { lt: cutoff },
        archivedAt: null,
      },
    });

    if (oldLogs.length === 0) {
      return NextResponse.json({ archived: 0 });
    }

    // Move to archive
    await prisma.auditLogArchive.createMany({
      data: oldLogs.map((log) => ({
        id: log.id,
        orgId: log.orgId,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        entityLabel: log.entityLabel,
        performedById: log.performedById,
        metadata: log.metadata || undefined,
        archivedAt: new Date(),
        createdAt: log.createdAt,
      })),
    });

    // Mark as archived in main table, then delete
    await prisma.auditLog.deleteMany({
      where: {
        id: { in: oldLogs.map((l) => l.id) },
      },
    });

    return NextResponse.json({ archived: oldLogs.length });
  } catch (error) {
    console.error("Archive error:", error);
    return NextResponse.json({ message: "Archive failed" }, { status: 500 });
  }
}
