import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/auth/auth.schema";
import { authService } from "@/lib/auth/server/auth.service";
import { errorResponse } from "@/lib/errors/server/toClientError";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { pickupAddress, pickupCity, pickupPostalCode, ...profileData } =
      updateProfileSchema.parse(body);

    const user = await authService.updateProfile(userId, profileData);

    // Adresse de ramassage : seulement si une adresse complète est fournie
    if (pickupAddress?.trim() && pickupCity?.trim() && pickupPostalCode?.trim()) {
      await prisma.pickupInfo.upsert({
        where: { userId },
        create: {
          userId,
          mode: "ADDRESS",
          address: pickupAddress,
          city: pickupCity,
          postalCode: pickupPostalCode,
        },
        update: {
          mode: "ADDRESS",
          address: pickupAddress,
          city: pickupCity,
          postalCode: pickupPostalCode,
          receptionDate: null,
          notes: null,
        },
      });
      await prisma.user.update({
        where: { id: userId },
        data: { needsPickupInfo: false },
      });
    }

    return NextResponse.json({ success: true, data: user }, { status: 200 });
  } catch (error) {
    return errorResponse(error, "update-profile");
  }
}