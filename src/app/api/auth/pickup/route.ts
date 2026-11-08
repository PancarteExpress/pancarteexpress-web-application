import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { pickupSchema } from "@/lib/auth/auth.schema";
import { toPickupCreateInput } from "@/lib/auth/server/pickup";
import { errorResponse } from "@/lib/errors/server/toClientError";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pickup = await prisma.pickupInfo.findUnique({ where: { userId } });
  return NextResponse.json({ pickup });
}

export async function PUT(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = pickupSchema.parse(body);
    const pickup = toPickupCreateInput(data);

    const [saved] = await prisma.$transaction([
      prisma.pickupInfo.upsert({
        where: { userId },
        create: { userId, ...pickup },
        update: pickup,
      }),
      prisma.user.update({
        where: { id: userId },
        data: { needsPickupInfo: false },
      }),
    ]);

    return NextResponse.json({ pickup: saved });
  } catch (error) {
    return errorResponse(error, "pickup");
  }
}