import type { AdminUserRow } from "@/lib/users/server/user.service";
import { ServiceBlockButton } from "./ServiceBlockButton";
import { isBilledToGroupAdmin } from "@/lib/orders/billing";
import styles from "./UsersTable.module.css";
import { GROUP_STATUS_LABELS, ROLE_LABELS } from "../../constants/labels";
import { getDisplayName, getFullName } from "@/shared/utils/displayName";
import { formatDate } from "@/shared/utils/date";
import type { GroupStatus } from "@prisma/client";
import { DeleteUserButton, type GroupMemberOption } from "./DeleteUserButton";
import { AccountTypeSelect } from "./AccountTypeSelect";

type BlockTone = "active" | "pending" | "blocked";

/** Blocage direct du compte (les blocages hérités du groupe ne sont pas affichés ici) */
function getBlockLabel(startsAt: Date | null, now: Date): { label: string; tone: BlockTone } {
  if (!startsAt) return { label: "Actif", tone: "active" };
  if (startsAt <= now) return { label: "Bloqué", tone: "blocked" };
  return { label: `Bloqué le ${formatDate(startsAt)}`, tone: "pending" };
}

const BLOCK_TONE_CLASS: Record<BlockTone, string> = {
  active: styles.blockActive,
  pending: styles.blockPending,
  blocked: styles.blockBlocked,
};

interface UsersTableProps {
  users: AdminUserRow[];
  allUsers: AdminUserRow[];
  groupStatusFilter?: GroupStatus;
}

export function UsersTable({ users, allUsers, groupStatusFilter }: UsersTableProps) {
  if (users.length === 0) {
    return <p className={styles.empty}>Aucun utilisateur inscrit.</p>;
  }

  const visibleUsers = groupStatusFilter
    ? users.filter((u) => u.groupStatus === groupStatusFilter)
    : users;
  const now = new Date();

  const membersByGroup = new Map<string, GroupMemberOption[]>();
  for (const u of allUsers) {
    if (u.role !== "user" || !u.group) continue;
    const list = membersByGroup.get(u.group.id) ?? [];
    list.push({ id: u.id, name: getDisplayName(u) });
    membersByGroup.set(u.group.id, list);
  }

  return (
    <div className={styles.wrapper}>
      
      {visibleUsers.length === 0 ? (
        <p className={styles.empty}>Aucun utilisateur pour ce statut.</p>
      ) : (
      <table className={styles.table}>
        <colgroup>
          <col className={styles.colName} />
          <col className={styles.colMail} />
          <col className={styles.colPhoneNumber} />
          <col className={styles.colCompany} />
          <col className={styles.colRole} />
          <col className={styles.colGroup} />
          <col className={styles.colStatus} />
          <col className={styles.colRegisterDate} />
          <col className={styles.colServiceBlock} />
          <col className={styles.colDeleteUser} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Nom</th>
            <th scope="col">Courriel</th>
            <th scope="col">Téléphone</th>
            <th scope="col">Entreprise</th>
            <th scope="col">Rôle</th>
            <th scope="col">Groupe</th>
            <th scope="col">Statut</th>
            <th scope="col">Inscrit le</th>
            <th scope="col">Demandes de service</th>
            <th scope="col">Supprimer</th>
          </tr>
        </thead>
        <tbody>
          {visibleUsers.map((user) => {
            const fullName = getFullName(user) || "—";
            const block = getBlockLabel(user.serviceBlockStartsAt, now);
            const isBlocked = user.serviceBlockStartsAt !== null;

            return (
              <tr key={user.id}>
                <td>{fullName}</td>
                <td>
                  <a href={`mailto:${user.email}`}>{user.email}</a>
                </td>
                <td>{user.phoneNumber ?? "—"}</td>
                <td>{user.companyName ?? "—"}</td>
                <td>
                  {user.role === "superAdmin" ? (
                    <span className={`${styles.badge} ${styles[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  ) : (
                    <AccountTypeSelect
                      userId={user.id}
                      userName={fullName}
                      role={user.role}
                      groupStatus={user.groupStatus}
                      className={styles.roleSelect}
                    />
                  )}
                </td>
                <td>{user.group?.name ?? "—"}</td>
                <td>{GROUP_STATUS_LABELS[user.groupStatus]}</td>
                <td>{formatDate(user.createdAt)}</td>
                <td>
                  <div className={styles.serviceBlock}>
                    <span className={BLOCK_TONE_CLASS[block.tone]}>{block.label}</span>
                    <ServiceBlockButton
                      userId={user.id}
                      userName={fullName}
                      isBlocked={isBlocked}
                      disabledReason={
                        !isBlocked && isBilledToGroupAdmin(user) ? "Facturé à l'admin du groupe" : undefined
                      }
                      className={styles.btnServiceBlock}
                      noteClassName={styles.blockNote}
                    />
                  </div>
                </td>
                <td>
                  <DeleteUserButton
                    userId={user.id}
                    userName={fullName}
                    isGroupAdmin={user.role === "groupAdmin"}
                    groupMembers={user.group ? membersByGroup.get(user.group.id) ?? [] : []}
                    className={styles.btnDelete}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      )}
    </div>
  );
}