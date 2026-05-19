import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRegCard, updateRegCard, deleteRegCard } from "@/lib/actions/reg-cards";

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

  return NextResponse.json(regCard);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const data = await req.json();
    const regCard = await updateRegCard(id, data);
    return NextResponse.json(regCard);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await deleteRegCard(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete" },
      { status: 400 }
    );
  }
}
