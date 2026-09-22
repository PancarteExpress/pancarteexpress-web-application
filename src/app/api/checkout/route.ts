import { NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { checkoutPayloadSchema } from '@/lib/validations/checkout';
import { createOrder, type CheckoutUser } from '@/lib/orders/server/checkout.service';
import {
  CheckoutConflictError,
  PaymentProviderError,
  ProductUnavailableError,
} from '@/lib/orders/server/errors';

export async function POST(request: Request) {
  // JSON uniquement : un formulaire cross-site ne peut pas envoyer ce Content-Type
  // sans preflight CORS, ce qui protège contre le CSRF
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'unsupportedMediaType' }, { status: 415 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalidJson' }, { status: 400 });
  }

  const parsed = checkoutPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'validationFailed',
        issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
      { status: 400 },
    );
  }

  const session = await auth();
  const user: CheckoutUser | null =
    session?.user?.id && session.user.email ? { id: session.user.id, email: session.user.email } : null;

  try {
    const result = await createOrder(parsed.data, user);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ProductUnavailableError) {
      return NextResponse.json(
        { error: 'productUnavailable', unavailableProductIds: error.productIds },
        { status: 409 },
      );
    }
    if (error instanceof CheckoutConflictError) {
      return NextResponse.json({ error: error.reason, orderNumber: error.orderNumber }, { status: 409 });
    }

    console.error('[checkout]', error);
    const status = error instanceof PaymentProviderError ? 502 : 500;
    return NextResponse.json({ error: 'serverError' }, { status });
  }
}