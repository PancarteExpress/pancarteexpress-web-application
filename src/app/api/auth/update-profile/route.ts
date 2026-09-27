import { auth } from "@/app/auth";
import { updateProfileSchema } from "@/features/auth/types";
import { authService } from "@/features/auth/services/auth.service";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = updateProfileSchema.parse(body);

    const user = await authService.updateProfile(session.user.id, data);

    return NextResponse.json({ success: true, data: user }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}