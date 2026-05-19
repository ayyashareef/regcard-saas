import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRegCards, createRegCard } from "@/lib/actions/reg-cards";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 10000);
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;

  const result = await getRegCards({ search, page, limit, from, to });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const regCard = await createRegCard(data);
    return NextResponse.json(regCard, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create" },
      { status: 400 }
    );
  }
}
