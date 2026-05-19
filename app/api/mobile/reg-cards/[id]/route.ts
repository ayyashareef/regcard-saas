import { NextResponse } from "next/server";

// Mobile API DEFERRED. Per the SaaS plan the mobile client must become
// org-aware (login carries an org, token carries orgId). Until that work is
// done these endpoints are disabled so they cannot serve or leak
// cross-tenant data. Re-enable in the mobile phase.
const disabled = () =>
  NextResponse.json(
    { message: "Mobile API temporarily unavailable" },
    { status: 503 }
  );

export const GET = disabled;
export const POST = disabled;
export const PATCH = disabled;
export const PUT = disabled;
export const DELETE = disabled;
