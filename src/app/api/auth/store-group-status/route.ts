// src/app/api/auth/store-group-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { intent, groupStatus } = await req.json();
  const cookieStore = await cookies();
  const opts = { httpOnly: true, path: "/", maxAge: 300 };

  cookieStore.set("authIntent", intent, opts);
  cookieStore.set("pendingGroupStatus", groupStatus, opts);

  return NextResponse.json({ ok: true });
}