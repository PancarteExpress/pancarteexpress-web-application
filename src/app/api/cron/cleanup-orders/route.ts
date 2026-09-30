import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { cleanupAbandonedOrders } from '@/lib/orders/server/cleanup.service';

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // secret absent : on refuse tout, plutôt que de tout accepter

  const received = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);

  // Comparaison à durée constante : ne révèle pas, par le temps de réponse, combien de caractères sont corrects
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await cleanupAbandonedOrders();
    console.info('[cleanup] Terminé', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[cleanup] Échec', error);
    return NextResponse.json({ error: 'cleanupFailed' }, { status: 500 });
  }
}