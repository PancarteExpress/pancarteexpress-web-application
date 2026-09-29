import { z } from "zod";

const firstNameSchema = z.string().min(2, "First name required");
const lastNameSchema = z.string().min(2, "Last name required");
const emailSchema = z.string().email("Adresse courriel requise");
const passwordSchema = z.string().min(8, "Min 8 characters");
const phoneSchema = z.string().min(10, "Phone number required");

export const registerSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  password: z.string().min(3, "Min 3 characters"),
  confirmPassword: z.string(),
  phoneNumber: phoneSchema,
  companyName: z.string().optional(),
  isGroup: z.boolean(),
  groupName: z.string().optional(),
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})
.refine((data) => data.firstName && data.lastName && data.email && data.password && data.phoneNumber, {
  message: "Veuillez remplir tous les champs requis",
  path: ["root"],
});

export const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email"),
  code: z.string().length(6, "Code must be 6 digits"),
  firstName: z.string().min(2, "First name required"),
  lastName: z.string().min(2, "Last name required"),
  password: z.string().min(3, "Min 3 characters"),
  phoneNumber: z.string().min(10, "Phone number required"),
  companyName: z.string().optional(),  
  isGroup: z.boolean(),
  groupName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Adresse courriel requise"),
  password: z.string().min(1, "Mot de passe requis"),
}).refine((data) => data.email && data.password, {
  message: "Veuillez saisir vos identifiants",
  path: ["root"],
});

export const updateProfileSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
  locale: z.enum(["fr", "en"]),
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

export interface SignInParams {
  user: { 
    id?: string; 
    email?: string; 
    name?: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  account: { 
    provider?: string;
    providerAccountId?: string;
    type?: string;
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    token_type?: string;
    scope?: string;
    id_token?: string;
    session_state?: string;
  } | null;
}