import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe/server';
import { handlePaymentFailed, handlePaymentSucceeded } from '@/lib/orders/server/payment.service';



export async function POST(request: Request) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET manquante');
    return NextResponse.json({ error: 'misconfigured' }, { status: 500 });
  }
  console.log('[stripe-webhook] secret utilisé :', webhookSecret.slice(0, 14));

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'missingSignature' }, { status: 400 });
  }

  // Corps brut obligatoire : la signature porte sur les octets exacts reçus
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.warn('[stripe-webhook] Signature invalide', error);
    return NextResponse.json({ error: 'invalidSignature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        handlePaymentFailed(event.data.object);
        break;
      default:
        break;
    }
  } catch (error) {
    // 500 : Stripe réessaiera plus tard (ex. BD momentanément indisponible)
    console.error('[stripe-webhook] Échec du traitement', { type: event.type, id: event.id }, error);
    return NextResponse.json({ error: 'handlerFailed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}