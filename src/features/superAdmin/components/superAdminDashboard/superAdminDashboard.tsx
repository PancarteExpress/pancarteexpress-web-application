import type { AdminUserRow } from "@/lib/users/server/user.service";
import { UsersTable } from "../usersTable/UsersTable";
import styles from "./superAdminDashboard.module.css";

interface AdminDashboardProps {
  users: AdminUserRow[];
}

export function AdminDashboard({ users }: AdminDashboardProps) {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Utilisateurs</h1>
      </header>

      <UsersTable users={users} />
    </main>
  );
}