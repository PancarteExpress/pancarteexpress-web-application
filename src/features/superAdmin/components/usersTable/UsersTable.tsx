import type { GroupStatus, UserRole } from "@prisma/client";
import type { AdminUserRow } from "@/lib/users/server/user.service";
import styles from "./UsersTable.module.css";

const ROLE_LABELS: Record<UserRole, string> = {
  user: "Courtier",
  groupAdmin: "Chef de groupe",
  superAdmin: "Super admin",
};

const GROUP_STATUS_LABELS: Record<GroupStatus, string> = {
  SOLO: "Solo",
  PENDING: "En attente",
  JOINED: "Membre",
};

const dateFormatter = new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium" });

interface UsersTableProps {
  users: AdminUserRow[];
}

export function UsersTable({ users }: UsersTableProps) {
  if (users.length === 0) {
    return <p className={styles.empty}>Aucun utilisateur inscrit.</p>;
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <caption className={styles.caption}>
          {users.length} utilisateur{users.length > 1 ? "s" : ""}
        </caption>
        <thead>
          <tr>
            <th scope="col">Nom</th>
            <th scope="col">Courriel</th>
            <th scope="col">Téléphone</th>
            <th scope="col">Entreprise</th>
            <th scope="col">Rôle</th>
            <th scope="col">Groupe</th>
            <th scope="col">Statut</th>
            <th scope="col">Connexion</th>
            <th scope="col" className={styles.numeric}>Commandes</th>
            <th scope="col">Inscrit le</th>
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
                  <span className={`${styles.badge} ${styles[user.role]}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                </td>
                <td>{user.group?.name ?? "—"}</td>
                <td>{GROUP_STATUS_LABELS[user.groupStatus]}</td>
                <td>{user.provider === "google" ? "Google" : "Courriel"}</td>
                <td className={styles.numeric}>{user._count.orders}</td>
                <td>{dateFormatter.format(user.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}