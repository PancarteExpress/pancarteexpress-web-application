import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { pickupSchema } from "@/lib/auth/auth.schema";
import { toPickupCreateInput } from "@/lib/auth/server/pickup";
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

export async function PUT(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return errorResponse(new AppError("unauthorized"), "pickup");
  }

  try {
    const body = await request.json();
    const data = pickupSchema.parse(body);
    const pickup = toPickupCreateInput(data);

    const saved = await prisma.pickupInfo.upsert({
      where: { userId },
      create: { userId, ...pickup },
      update: pickup,
    });

    return NextResponse.json({ pickup: saved });
  } catch (error) {
    return errorResponse(error, "pickup");
  }
}