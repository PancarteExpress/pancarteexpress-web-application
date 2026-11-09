import { after, NextResponse } from "next/server";

import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { pickupSchema } from "@/lib/auth/auth.schema";
import { toPickupCreateInput } from "@/lib/auth/server/pickup";
import { sendAccountCreatedEmails } from "@/lib/auth/server/authEmails";
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
      select: {
        needsPickupInfo: true,
        firstName: true,
        lastName: true,
        email: true,
        companyName: true,
        groupStatus: true,
        provider: true,
        locale: true,
      },
    });

    if (!user?.needsPickupInfo) {
      return NextResponse.json({ error: "Ramassage déjà enregistré" }, { status: 409 });
    }

    const pickup = toPickupCreateInput(data);

    await prisma.$transaction([
      prisma.pickupInfo.create({ data: { userId, ...pickup } }),
      prisma.user.update({ where: { id: userId }, data: { needsPickupInfo: false } }),
    ]);

    // Inscription Google : bienvenue et notification interne attendaient le ramassage pour être complètes
    if (user.provider === "google") {
      
      const groupStatus = user.groupStatus === "PENDING" ? "PENDING" : "SOLO";
      const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
      after(() =>
        sendAccountCreatedEmails({
          name,
          email: user.email,
          provider: "google",
          locale: user.locale,
          groupStatus,
          companyName: user.companyName ?? undefined,
          pickup,
        }),
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "complete-pickup");
  }
}