import { isSelectableReceptionDate } from "@/features/services/utils/holidays";
import * as z from "zod";

// Messages : clés i18n du namespace errors.validation, traduites à l'affichage

const firstNameSchema = z.string().min(2, "firstNameRequired");
const lastNameSchema = z.string().min(2, "lastNameRequired");
const emailSchema = z.string().trim().toLowerCase().email("emailRequired");
// Création et changement de mot de passe seulement : le login garde min(1)
// pour ne pas bloquer les comptes existants au mot de passe plus court.
// max(72) : bcrypt ignore tout ce qui dépasse 72 octets.
export const passwordSchema = z
  .string()
  .min(8, "passwordTooShort")
  .max(72, "passwordTooLong");
const phoneSchema = z.string().min(10, "phoneRequired");
// Code à 6 chiffres envoyé par courriel (inscription, réinitialisation du mot de passe)
export const codeSchema = z.string().length(6, "codeLength").regex(/^\d{6}$/, "codeDigits");
export const verifyCodeSchema = z.object({ code: codeSchema });

export const localeSchema = z.enum(["fr", "en"]).optional();

export const authIntentSchema = z.enum(["login", "register"]);
// JOINED exclu : seul l'ajout par un groupAdmin rattache à un groupe
export const signupGroupStatusSchema = z.enum(["SOLO", "PENDING"]);

// Forfait d'inscription passé dans l'URL (?plan=) de /register/account
export const registerPlanSchema = z.enum(["solo", "group"]);
export type RegisterPlan = z.infer<typeof registerPlanSchema>;

export const storeGroupStatusSchema = z.object({
  intent: authIntentSchema,
  groupStatus: signupGroupStatusSchema,
});

// Adresse de facturation : demandée à l'inscription (forfaits solo et équipe)
export const billingAddressSchema = z.string().trim().min(1, "billingAddressRequired").max(300);
// Courriel de facturation : facultatif ; chaîne vide = utiliser le courriel du compte (null en base)
export const billingEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "tooLong")
  .refine((v) => v === "" || z.string().email().safeParse(v).success, "emailRequired");

export const pickupFieldsSchema = z.object({
  pickupMode: z.enum(["address", "warehouse"]),
  pickupAddress: z.string().trim().max(300, "tooLong").optional(),
  pickupCity: z.string().trim().max(100, "tooLong").optional(),
  pickupPostalCode: z.string().trim().max(10, "tooLong").optional(),
  receptionDate: z.string().optional(),
  pickupNotes: z.string().trim().max(1000, "tooLong").optional(),
});

export type PickupFieldsInput = z.infer<typeof pickupFieldsSchema>;

export function applyPickupRules(data: PickupFieldsInput, ctx: z.RefinementCtx) {
  if (data.pickupMode === "address") {
    if (!data.pickupAddress?.trim()) {
      ctx.addIssue({ code: "custom", path: ["pickupAddress"], message: "addressRequired" });
    } else if (!data.pickupCity?.trim() || !data.pickupPostalCode?.trim()) {
      // Adresse tapée sans choisir de suggestion : la ville et le code postal viennent de la suggestion
      ctx.addIssue({ code: "custom", path: ["pickupAddress"], message: "chooseAddressSuggestion" });
    }
  }

  if (data.pickupMode === "warehouse") {
    if (!data.receptionDate) {
      ctx.addIssue({ code: "custom", path: ["receptionDate"], message: "dateRequired" });
    } else if (!isSelectableReceptionDate(data.receptionDate)) {
      ctx.addIssue({
        code: "custom",
        path: ["receptionDate"],
        message: "businessDayFromToday",
      });
    }
  }
}

// Page de complétion (inscription Google) : Google ne fournit ni téléphone ni agence
export const completeProfileSchema = pickupFieldsSchema
  .extend({
    billingAddress: billingAddressSchema,
    phoneNumber: phoneSchema,
    companyName: z.string().trim().max(150, "tooLong").optional(),
  })
  .superRefine(applyPickupRules);
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

export const registerSchema = z
  .object({
    firstName: firstNameSchema,
    lastName: lastNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    phoneNumber: phoneSchema,
    companyName: z.string().trim().max(150, "tooLong").optional(),
    billingAddress: billingAddressSchema,
    locale: localeSchema,
    ...pickupFieldsSchema.shape
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "passwordsMismatch",
      });
    }

    applyPickupRules(data, ctx);
  });

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: codeSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  password: passwordSchema,
  phoneNumber: phoneSchema,
  companyName: z.string().trim().max(150, "tooLong").optional(),
  billingAddress: billingAddressSchema,
  groupStatus: signupGroupStatusSchema,
  locale: localeSchema,
}).extend(pickupFieldsSchema.shape)
  .superRefine(applyPickupRules);

const loginIdentifierSchema = z.string().trim().toLowerCase().min(1, "credentialsRequired");

export const loginSchema = z.object({
  identifier: loginIdentifierSchema,
  password: z.string().min(1, "passwordRequired"),
}).refine((data) => data.identifier && data.password, {
  message: "credentialsRequired",
  path: ["root"],
});

// Nom d'utilisateur : pas de « @ », sinon ambigu avec un courriel à la connexion.
// Chaîne vide = retirer le nom d'utilisateur (converti en null côté serveur).
const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((v) => v === "" || /^[a-z0-9._-]{3,30}$/.test(v), "usernameInvalid");

export const updateProfileSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  username: usernameSchema.optional(),
  locale: z.enum(["fr", "en"]),
  phoneNumber: phoneSchema.optional(),
  companyName: z.string().trim().max(150, "tooLong").optional(),
  // Facultative ici : les comptes créés avant cette question n'en ont pas
  billingAddress: z.string().trim().max(300).optional(),
  billingEmail: billingEmailSchema.optional(),
  groupStatus: z.enum(["SOLO", "PENDING", "JOINED"]).optional(),
  pickupAddress: z.string().trim().max(300, "tooLong").optional(),
  pickupCity: z.string().trim().max(100, "tooLong").optional(),
  pickupPostalCode: z.string().trim().max(10, "tooLong").optional(),
}).superRefine((data, ctx) => {
  // Adresse tapée sans choisir de suggestion : la ville et le code postal viennent de la suggestion
  if (data.pickupAddress?.trim() && (!data.pickupCity?.trim() || !data.pickupPostalCode?.trim())) {
    ctx.addIssue({ code: "custom", path: ["pickupAddress"], message: "chooseAddressSuggestion" });
  }
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "currentPasswordRequired"),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "passwordsMismatch",
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
const PASSWORDS_MISMATCH = { message: "passwordsMismatch", path: ["confirmPassword"] };

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