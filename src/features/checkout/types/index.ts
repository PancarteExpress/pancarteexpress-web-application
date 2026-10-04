import { z } from 'zod';

const shippingAddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  postalCode: z.string(),
  province: z.string(),
});

export const checkoutSchema = z
    .object({
        firstName: z.string().trim().min(1, 'Le prénom est requis'),
        lastName: z.string().trim().min(1, 'Le nom est requis'),
        email: z.string().trim().min(1, 'Le courriel est requis').email('Courriel invalide'),
        phone: z.string().trim().refine((v) => v === '' || /^[\d\s()+.-]{10,20}$/.test(v), 'Numéro de téléphone invalide'),
        deliveryMode: z.enum(['pickup', 'delivery']),
        shippingAddress: shippingAddressSchema.nullable(),
    })
    // L'adresse n'est requise qu'en livraison
    .superRefine((data, ctx) => {
        if (data.deliveryMode !== 'delivery') return;

        if (!data.shippingAddress) {
        ctx.addIssue({
            code: 'custom',
            path: ['shippingAddress'],
            message: 'Veuillez sélectionner une adresse de livraison dans la liste',
        });
        return;
        }

        // Google renvoie parfois une adresse sans code postal : l'API la refuserait
        if (!data.shippingAddress.postalCode) {
        ctx.addIssue({
            code: 'custom',
            path: ['shippingAddress'],
            message: 'Adresse incomplète : code postal manquant',
        });
        }
    });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;