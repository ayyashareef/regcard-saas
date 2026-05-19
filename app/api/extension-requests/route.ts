import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createExtensionRequest, getExtensionRequests } from "@/lib/actions/extension-requests";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const requests = await getExtensionRequests();
  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const request = await createExtensionRequest(data);
    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed" },
      { status: 400 }
    );
  }
}
