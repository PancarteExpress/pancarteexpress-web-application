import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/errors/server/toClientError";
import { AppError } from "@/lib/errors/appError";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return errorResponse(new AppError("unauthorized"), "pickup");
  }

  const [pickup, user] = await Promise.all([
    prisma.pickupInfo.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { billingAddress: true } }),
  ]);
  return NextResponse.json({ pickup, billingAddress: user?.billingAddress ?? null });
}