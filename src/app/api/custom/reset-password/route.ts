import { z } from "zod";
import { authService } from "@/features/auth/services/auth.service";
import { NextResponse } from "next/server";

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Reset password request:", body);

    const data = resetPasswordSchema.parse(body) as ResetPasswordInput;
    console.log("Validated data:", data);

    await authService.resetPassword(data);
    console.log("Password reset successful");

    return NextResponse.json(
      { success: true, message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Reset password error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed";
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}