import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/auth/server/auth.service";
import { verifyEmailSchema } from "@/lib/auth/auth.schema";
import { toPickupCreateInput } from "@/lib/auth/server/pickup";
import { errorResponse } from "@/lib/errors/server/toClientError";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validatedData = verifyEmailSchema.parse(body);
    const pickup = toPickupCreateInput(validatedData);

    const user = await authService.verifyEmailAndCreateUser(
      validatedData.email,
      validatedData.code,
      validatedData.firstName,
      validatedData.lastName,
      validatedData.password,
      validatedData.phoneNumber,
      validatedData.companyName,
      validatedData.groupStatus,
      validatedData.locale,
      pickup
    );

    return NextResponse.json(
      { user, message: "Email verified and user created" },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error, "verify-email");
  }
}