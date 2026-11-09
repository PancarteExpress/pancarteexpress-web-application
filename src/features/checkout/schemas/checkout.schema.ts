import * as z from 'zod';

// Messages : clés i18n du namespace checkout.errors, traduites à l'affichage

const shippingAddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  postalCode: z.string(),
  province: z.string(),
});

export const checkoutSchema = z
    .object({
        firstName: z.string().trim().min(1, 'firstNameRequired'),
        lastName: z.string().trim().min(1, 'lastNameRequired'),
        email: z.string().trim().toLowerCase().email('emailInvalid'),
        phone: z.string().trim().refine((v) => v === '' || /^[\d\s()+.-]{10,20}$/.test(v), 'phoneInvalid'),
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
            message: 'shippingAddressRequired',
        });
        return;
        }

        // Google renvoie parfois une adresse sans code postal : l'API la refuserait
        if (!data.shippingAddress.postalCode) {
        ctx.addIssue({
            code: 'custom',
            path: ['shippingAddress'],
            message: 'postalCodeMissing',
        });
        }
    });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;