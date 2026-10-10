import type { GroupStatus, UserRole } from "@prisma/client";
import type { AdminUserRow } from "@/lib/users/server/user.service";
import styles from "./UsersTable.module.css";

import { IoMdCloseCircle } from "react-icons/io";
import { DeleteUserButton, type GroupMemberOption } from "./DeleteUserButton";
import { AccountTypeSelect } from "./AccountTypeSelect";

const ROLE_LABELS: Record<UserRole, string> = {
  user: "Courtier",
  groupAdmin: "Administateur de groupe",
  superAdmin: "Super admin",
};

const GROUP_STATUS_LABELS: Record<GroupStatus, string> = {
  SOLO: "Solo",
  PENDING: "Doit rejoindre un groupe",
  JOINED: "Membre d'un groupe",
};

const dateFormatter = new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium", timeZone: "America/Toronto", });

interface UsersTableProps {
  users: AdminUserRow[];
  allUsers: AdminUserRow[];
}

const getDisplayName = (u: AdminUserRow) => [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;

export function UsersTable({ users, allUsers }: UsersTableProps) {
  if (users.length === 0) {
    return <p className={styles.empty}>Aucun utilisateur inscrit.</p>;
  }

  const membersByGroup = new Map<string, GroupMemberOption[]>();
  for (const u of allUsers) {
    if (u.role !== "user" || !u.group) continue;
    const list = membersByGroup.get(u.group.id) ?? [];
    list.push({ id: u.id, name: getDisplayName(u) });
    membersByGroup.set(u.group.id, list);
  }

  return (
    <div className={styles.wrapper}>
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
            <th scope="col">Supprimer</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "—";

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
                <td>{dateFormatter.format(user.createdAt)}</td>
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
    </div>
  );
}