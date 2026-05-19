import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findReturningGuest } from "@/lib/actions/reg-cards";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const result = await findReturningGuest(data);
    return NextResponse.json(result || { type: null });
  } catch {
    return NextResponse.json({ type: null });
  }
}
