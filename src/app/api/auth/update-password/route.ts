import { auth } from "@/app/auth";
import { updatePasswordSchema } from "@/features/auth/types";
import { authService } from "@/features/auth/services/auth.service";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = updatePasswordSchema.parse(body);

    await authService.updatePassword(session.user.id, data);

    return NextResponse.json(
      { success: true, message: "Password updated" },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}