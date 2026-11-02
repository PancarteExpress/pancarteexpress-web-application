// src/app/api/auth/store-group-status/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { storeGroupStatusSchema } from "@/features/auth/types";

export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  const parsed = storeGroupStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { intent, groupStatus } = parsed.data;
  const cookieStore = await cookies();
  const opts = { httpOnly: true, path: "/", maxAge: 300 };

  cookieStore.set("authIntent", intent, opts);
  cookieStore.set("pendingGroupStatus", groupStatus, opts);

  return NextResponse.json({ ok: true });
}
