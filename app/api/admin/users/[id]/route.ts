import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateUser } from "@/lib/actions/users";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role === "STAFF") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const data = await req.json();
    const user = await updateUser(id, data);
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed" },
      { status: 400 }
    );
  }
}
