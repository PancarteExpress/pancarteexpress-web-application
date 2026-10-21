'use server';

import { z } from 'zod';
import { auth } from '@/app/auth';
import {
  createServicesPayment,
  ServicesPaymentError,
  type ServicesPaymentSession,
} from './servicesPayment.service';

export type ServicesPaymentResult =
  | ({ ok: true } & ServicesPaymentSession)
  | { ok: false; error: string };

const orderIdSchema = z.string().min(1).max(64);

export async function createServicesPaymentAction(orderId: string): Promise<ServicesPaymentResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'Vous devez être connecté.' };

  // Une Server Action reçoit des données non fiables
  const parsed = orderIdSchema.safeParse(orderId);
  if (!parsed.success) return { ok: false, error: 'Commande introuvable.' };

  try {
    const payment = await createServicesPayment(parsed.data, session.user.id);
    return { ok: true, ...payment };
  } catch (error) {
    if (error instanceof ServicesPaymentError) return { ok: false, error: error.message };
    console.error('[services-payment]', error);
    return { ok: false, error: 'Impossible de préparer le paiement. Réessayez.' };
  }
}