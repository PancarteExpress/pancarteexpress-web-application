import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { pickupSchema } from "@/lib/auth/auth.schema";
import { toPickupCreateInput } from "@/lib/auth/server/pickup";
import { errorResponse } from "@/lib/errors/server/toClientError";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = pickupSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { needsPickupInfo: true },
    });

    if (!user?.needsPickupInfo) {
      return NextResponse.json({ error: "Ramassage déjà enregistré" }, { status: 409 });
    }

    const pickup = toPickupCreateInput(data);

    await prisma.$transaction([
      prisma.pickupInfo.create({ data: { userId, ...pickup } }),
      prisma.user.update({ where: { id: userId }, data: { needsPickupInfo: false } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "complete-pickup");
  }
}