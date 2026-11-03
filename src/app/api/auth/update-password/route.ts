import { auth } from "@/app/auth";
import { updatePasswordSchema } from "@/features/auth/types";
import { authService } from "@/lib/auth/server/auth.service";
import { AppError } from "@/lib/errors/appError";
import { errorResponse } from "@/lib/errors/server/toClientError";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new AppError("unauthorized"), "update-password");
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
    return errorResponse(error, "update-password");
  }
}
