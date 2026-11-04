import * as z from "zod";

const firstNameSchema = z.string().min(2, "First name required");
const lastNameSchema = z.string().min(2, "Last name required");
const emailSchema = z.string().trim().toLowerCase().email("Adresse courriel requise");
// Création et changement de mot de passe seulement : le login garde min(1)
// pour ne pas bloquer les comptes existants au mot de passe plus court.
// max(72) : bcrypt ignore tout ce qui dépasse 72 octets.
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");
const phoneSchema = z.string().min(10, "Phone number required");
// Code à 6 chiffres envoyé par courriel (inscription, réinitialisation du mot de passe)
export const codeSchema = z.string().length(6, "Code must be 6 digits").regex(/^\d{6}$/, "Code must contain only digits");
export const verifyCodeSchema = z.object({ code: codeSchema });

export const localeSchema = z.enum(["fr", "en"]).optional();

export const authIntentSchema = z.enum(["login", "register"]);
// JOINED exclu : seul l'ajout par un groupAdmin rattache à un groupe
export const signupGroupStatusSchema = z.enum(["SOLO", "PENDING"]);

export const storeGroupStatusSchema = z.object({
  intent: authIntentSchema,
  groupStatus: signupGroupStatusSchema,
});

export const registerSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  phoneNumber: phoneSchema,
  companyName: z.string().optional(),
  locale: localeSchema,
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
  email: emailSchema,
  code: codeSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  password: passwordSchema,
  phoneNumber: phoneSchema,
  companyName: z.string().optional(),  
  groupStatus: signupGroupStatusSchema,
  locale: localeSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mot de passe requis"),
}).refine((data) => data.email && data.password, {
  message: "Veuillez saisir vos identifiants",
  path: ["root"],
});

export const updateProfileSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  phoneNumber: phoneSchema.optional(),
  companyName: z.string().optional(),
  groupStatus: z.enum(["SOLO", "PENDING", "JOINED"]).optional(),
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
  locale: localeSchema,
});

export const verifyResetCodeSchema = z.object({
  email: emailSchema,
  code: codeSchema,
});

const newPasswordFields = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
});
const passwordsMatch = (data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword;
const PASSWORDS_MISMATCH = { message: "Passwords don't match", path: ["confirmPassword"] };

export const resetPasswordSchema = newPasswordFields.refine(passwordsMatch, PASSWORDS_MISMATCH);
// API : le formulaire, plus le courriel et le code vérifiés à l'étape précédente
export const resetPasswordRequestSchema = newPasswordFields
  .extend({ email: emailSchema, code: codeSchema })
  .refine(passwordsMatch, PASSWORDS_MISMATCH);

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;