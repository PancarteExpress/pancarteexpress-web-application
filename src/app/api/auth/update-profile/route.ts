import { auth } from "@/app/auth";
import { updateProfileSchema } from "@/features/auth/types";
import { authService } from "@/features/auth/services/auth.service";
import { AppError } from "@/lib/errors/appError";
import { errorResponse } from "@/lib/errors/server/toClientError";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(new AppError("unauthorized"), "update-profile");
  }

  try {
    const body = await req.json();
    const data = updateProfileSchema.parse(body);

    const user = await authService.updateProfile(session.user.id, data);

    return NextResponse.json({ success: true, data: user }, { status: 200 });
  } catch (error: unknown) {
    return errorResponse(error, "update-profile");
  }
}
