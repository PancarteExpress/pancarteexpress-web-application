import type { BillingMode, GroupStatus, UserRole } from '@prisma/client';

export interface BillingAccount {
  id: string;
  groupStatus: GroupStatus;
  group: { billingMode: BillingMode; adminId: string | null } | null;
}

/** Qui doit payer les services d'une nouvelle commande */
export function resolveBilledToId(account: BillingAccount): string {
  const { group } = account;
  // PENDING : pas encore membre. Groupe sans admin : personne d'autre ne peut payer.
  if (account.groupStatus === 'JOINED' && group?.billingMode === 'GROUP' && group.adminId) {
    return group.adminId;
  }
  return account.id;
}

/* ── Blocage manuel des demandes de service ───────────────────── */

const DAY_MS = 24 * 60 * 60 * 1000;
export const SERVICE_BLOCK_GRACE_DAYS = 3;

export const addDays = (date: Date, days: number): Date => new Date(date.getTime() + days * DAY_MS);

/** Jours restants, arrondis vers le haut : 2 j et 3 h → 3 */
export const daysUntil = (date: Date, now: Date): number => Math.ceil((date.getTime() - now.getTime()) / DAY_MS);

/** Membre dont les factures vont à l'admin : on ne peut pas le bloquer, on bloque l'admin */
export function isBilledToGroupAdmin(user: {
  role: UserRole;
  groupStatus: GroupStatus;
  group: { billingMode: BillingMode } | null;
}): boolean {
  return user.role === 'user' && user.groupStatus === 'JOINED' && user.group?.billingMode === 'GROUP';
}

/** D'où vient le blocage : le compte lui-même, l'admin qui paie pour l'équipe, ou un membre à relancer */
export type BlockSource = 'self' | 'groupAdmin' | 'member';

export interface ServiceBlock {
  startsAt: Date;
  source: BlockSource;
}

export type ServiceAccess =
  | { status: 'ok' }
  | { status: 'warning'; startsAt: Date; source: BlockSource }
  | { status: 'blocked'; source: BlockSource };

export interface BlockableUser {
  id: string;
  role: UserRole;
  groupStatus: GroupStatus;
  serviceBlockStartsAt: Date | null;
}

export interface AccessViewer extends BlockableUser {
  group: { billingMode: BillingMode; users: BlockableUser[] } | null;
}

/** Blocages qui touchent cet utilisateur, selon le mode actuel de son groupe */
export function collectServiceBlocks(viewer: AccessViewer): ServiceBlock[] {
  const blocks: ServiceBlock[] = [];
  if (viewer.serviceBlockStartsAt) blocks.push({ startsAt: viewer.serviceBlockStartsAt, source: 'self' });

  const { group } = viewer;
  if (!group || viewer.groupStatus !== 'JOINED') return blocks;

  for (const other of group.users) {
    const startsAt = other.serviceBlockStartsAt;
    if (!startsAt || other.id === viewer.id) continue;

    // L'admin paie tout : son blocage s'étend à toute l'équipe
    if (group.billingMode === 'GROUP' && viewer.role === 'user' && other.role === 'groupAdmin') {
      blocks.push({ startsAt, source: 'groupAdmin' });
    }

    // Chacun paie : un membre bloqué bloque aussi l'admin, qui doit le relancer
    if (
      group.billingMode === 'INDIVIDUAL' &&
      viewer.role === 'groupAdmin' &&
      other.role === 'user' &&
      other.groupStatus === 'JOINED'
    ) {
      blocks.push({ startsAt, source: 'member' });
    }
  }
  return blocks;
}

const SOURCE_PRIORITY: readonly BlockSource[] = ['self', 'groupAdmin', 'member'];
const bySourcePriority = (a: ServiceBlock, b: ServiceBlock) =>
  SOURCE_PRIORITY.indexOf(a.source) - SOURCE_PRIORITY.indexOf(b.source);

export function computeServiceAccess(blocks: readonly ServiceBlock[], now: Date): ServiceAccess {
  // Déjà bloqué : son propre blocage d'abord, puis celui de l'admin, puis celui d'un membre
  const [active] = blocks.filter((b) => b.startsAt <= now).sort(bySourcePriority);
  if (active) return { status: 'blocked', source: active.source };

  // Avertissement : le blocage le plus proche fait foi
  const [next] = [...blocks].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  return next ? { status: 'warning', startsAt: next.startsAt, source: next.source } : { status: 'ok' };
}