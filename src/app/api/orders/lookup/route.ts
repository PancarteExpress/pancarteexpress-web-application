import { NextResponse } from 'next/server';
import { orderLookupSchema } from '@/lib/orders/orderLookup.schema';
import { lookupOrder } from '@/lib/orders/server/orderLookup.service';
import { errorResponse } from '@/lib/errors/server/toClientError';
import { clientIp, takeToken } from '@/lib/security/server/rateLimit';

// 10 recherches par 15 minutes et par IP : assez pour un client, trop peu pour deviner des courriels
const LOOKUP_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 };

export async function POST(req: Request) {
  if (!takeToken(`order-lookup:${clientIp(req)}`, LOOKUP_LIMIT)) {
    return NextResponse.json({ error: 'tooManyAttempts' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (error: unknown) {
    return errorResponse(error, 'order-lookup');
  }

  const parsed = orderLookupSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error, 'order-lookup');

  try {
    return NextResponse.json(await lookupOrder(parsed.data));
  } catch (error: unknown) {
    return errorResponse(error, 'order-lookup');
  }
}
