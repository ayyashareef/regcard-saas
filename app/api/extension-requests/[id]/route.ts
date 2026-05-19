import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { reviewExtensionRequest } from "@/lib/actions/extension-requests";

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
    const { action } = await req.json();
    if (action !== "APPROVED" && action !== "REJECTED") {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

    await reviewExtensionRequest(id, action);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed" },
      { status: 400 }
    );
  }
}
