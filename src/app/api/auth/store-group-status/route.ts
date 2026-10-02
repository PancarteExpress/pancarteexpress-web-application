// src/app/api/auth/store-group-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { groupStatus } = await request.json();
    
    const cookieStore = await cookies();
    cookieStore.set('pendingGroupStatus', groupStatus, {
      maxAge: 60 * 5, // 5 minutes
      httpOnly: true,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}