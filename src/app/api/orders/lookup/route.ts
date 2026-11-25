import { NextResponse } from 'next/server';
import { orderLookupSchema } from '@/lib/orders/orderLookup.schema';
import { lookupOrder } from '@/lib/orders/server/orderLookup.service';
import { errorResponse } from '@/lib/errors/server/toClientError';
import { emailKey, ipKey, isRateLimited, LIMITS } from '@/lib/rateLimit/server/rateLimit';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch (error: unknown) {
    return errorResponse(error, 'order-lookup');
  }

  const parsed = orderLookupSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error, 'order-lookup');

  // Limité par IP et par courriel : on ne peut pas deviner des numéros ni essayer des courriels à l'infini
  if (await isRateLimited('orderLookup', [
    { key: await ipKey(), limit: LIMITS.lookupIp },
    { key: emailKey(parsed.data.email), limit: LIMITS.lookupEmail },
  ])) {
    return NextResponse.json({ error: 'tooManyAttempts' }, { status: 429 });
  }

  try {
    return NextResponse.json(await lookupOrder(parsed.data));
  } catch (error: unknown) {
    return errorResponse(error, 'order-lookup');
  }
}