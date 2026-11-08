import 'server-only';
import * as z from 'zod';
import type { OptimoPriority } from '../scheduling';
import type { IsoDate } from '../calendar';

const API_URL = 'https://api.optimoroute.com/v1/create_order';
const TIMEOUT_MS = 15_000;

export type OptimoOrderPayload = {
  operation: 'SYNC';
  orderNo: string;
  type: 'T';
  date: IsoDate;
  location: { address: string; locationName: string; acceptPartialMatch?: boolean };
  notes: string;
  priority: OptimoPriority;
  email?: string;
  phone?: string;
  customField1?: string;
  customField2?: string;
  customField3?: string;
};

const responseSchema = z.object({
  success: z.boolean(),
  id: z.string().optional(),
  code: z.string().optional(),
  message: z.string().optional(),
});

export type OptimoResult = { ok: true; id: string | null } | { ok: false; error: string };

export async function sendOptimoOrder(payload: OptimoOrderPayload): Promise<OptimoResult> {
  const key = process.env.OPTIMOROUTE_API_KEY;
  if (!key) return { ok: false, error: 'OPTIMOROUTE_API_KEY manquante' };

  try {
    const res = await fetch(`${API_URL}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    });

    const parsed = responseSchema.safeParse(await res.json().catch(() => null));
    if (!parsed.success) return { ok: false, error: `HTTP ${res.status} : réponse illisible` };
    if (!parsed.data.success) {
      return { ok: false, error: `${parsed.data.code ?? 'ERR'} : ${parsed.data.message ?? ''}`.trim() };
    }
    return { ok: true, id: parsed.data.id ?? null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur réseau' };
  }
}
