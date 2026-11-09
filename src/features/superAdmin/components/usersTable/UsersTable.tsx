import { useTranslations } from "next-intl";
import type { AdminUserRow } from "@/lib/users/server/user.service";
import { ServiceBlockButton } from "./ServiceBlockButton";
import { isBilledToGroupAdmin } from "@/lib/orders/billing";
import styles from "./UsersTable.module.css";
import { getDisplayName, getFullName } from "@/shared/utils/displayName";
import { formatDate } from "@/shared/utils/date";
import { useAppLocale } from "@/shared/hooks/useAppLocale";
import type { GroupStatus } from "@prisma/client";
import { DeleteUserButton, type GroupMemberOption } from "./DeleteUserButton";
import { AccountTypeSelect } from "./AccountTypeSelect";

type BlockTone = "active" | "pending" | "blocked";

/** Blocage direct du compte (les blocages hérités du groupe ne sont pas affichés ici) */
function getBlockTone(startsAt: Date | null, now: Date): BlockTone {
  if (!startsAt) return "active";
  return startsAt <= now ? "blocked" : "pending";
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
  const t = useTranslations("superAdmin");
  const locale = useAppLocale();

  if (users.length === 0) {
    return <p className={styles.empty}>{t("usersTable.empty")}</p>;
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
        <p className={styles.empty}>{t("usersTable.emptyForStatus")}</p>
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
            <th scope="col">{t("usersTable.name")}</th>
            <th scope="col">{t("usersTable.email")}</th>
            <th scope="col">{t("usersTable.phone")}</th>
            <th scope="col">{t("usersTable.company")}</th>
            <th scope="col">{t("usersTable.role")}</th>
            <th scope="col">{t("usersTable.group")}</th>
            <th scope="col">{t("usersTable.status")}</th>
            <th scope="col">{t("usersTable.registeredOn")}</th>
            <th scope="col">{t("usersTable.serviceRequests")}</th>
            <th scope="col">{t("usersTable.delete")}</th>
          </tr>
        </thead>
        <tbody>
          {visibleUsers.map((user) => {
            const fullName = getFullName(user) || "—";
            const blockTone = getBlockTone(user.serviceBlockStartsAt, now);
            const blockLabel =
              blockTone === "active" ? t("usersTable.blockActive")
              : blockTone === "blocked" || !user.serviceBlockStartsAt ? t("usersTable.blocked")
              : t("usersTable.blockedOn", { date: formatDate(user.serviceBlockStartsAt, "medium", locale) });
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
                      {t(`roles.${user.role}`)}
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
                <td>{t(`groupStatuses.${user.groupStatus}`)}</td>
                <td>{formatDate(user.createdAt, "medium", locale)}</td>
                <td>
                  <div className={styles.serviceBlock}>
                    <span className={BLOCK_TONE_CLASS[blockTone]}>{blockLabel}</span>
                    <ServiceBlockButton
                      userId={user.id}
                      userName={fullName}
                      isBlocked={isBlocked}
                      disabledReason={
                        !isBlocked && isBilledToGroupAdmin(user) ? t("usersTable.billedToGroupAdmin") : undefined
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