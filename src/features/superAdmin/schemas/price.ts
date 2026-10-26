import { z } from "zod";

/** "150", "150,5", "150.50" → 15050 ; "" → null (prix retiré) */
export const priceInputSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(",", "."))
  .refine((v) => v === "" || /^\d{1,6}(\.\d{1,2})?$/.test(v), {
    message: "Montant invalide (ex. 150 ou 150,50).",
  })
  .transform((v) => (v === "" ? null : Math.round(Number(v) * 100)));