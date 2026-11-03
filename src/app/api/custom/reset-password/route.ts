import { z } from "zod";
import { authService } from "@/lib/auth/server/auth.service";
import { passwordSchema } from "@/features/auth/types";
import { errorResponse } from "@/lib/errors/server/toClientError";
import { NextResponse } from "next/server";

const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    const data = resetPasswordSchema.parse(body);

    await authService.resetPassword(data);

    return NextResponse.json(
      { success: true, message: "Password reset successfully" },
      { status: 200 },
    );
  } catch (error: unknown) {
    return errorResponse(error, "reset-password");
  }
}
