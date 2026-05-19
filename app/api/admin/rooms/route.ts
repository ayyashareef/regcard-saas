import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRooms, createRoom } from "@/lib/actions/rooms";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const rooms = await getRooms();
  return NextResponse.json(rooms);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role === "STAFF") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const room = await createRoom(data);
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed" },
      { status: 400 }
    );
  }
}
