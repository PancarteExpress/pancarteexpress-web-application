"use client";

import type { AdminUserRow } from "@/lib/users/server/user.service";
import { UsersTable } from "../usersTable/UsersTable";
import styles from "./superAdminDashboard.module.css";
import { useState } from "react";

interface AdminDashboardProps {
  users: AdminUserRow[];
}

export function AdminDashboard({ users }: AdminDashboardProps) {

  const [activeSection, setActiveSection] = useState<'users' | 'teams'>('users');

  return (
    <>
    <main className={styles.container}>

      <div className={styles.sidebar}>
        <div className={styles.sidebarHead}>
            <p className={styles.sidebarTitle}>Super Admin</p>
            <p className={styles.sidebarSub}>Pancarte Express</p>
        </div>

        <nav className={styles.nav}>
            <div
                className={`${styles.navItem} ${activeSection === 'users' ? styles.active : ''}`}
                onClick={() => setActiveSection('users')}
            >
                👥 Utilisateurs
            </div>
            <div
                className={`${styles.navItem} ${activeSection === 'teams' ? styles.active : ''}`}
                onClick={() => setActiveSection('teams')}
            >
                🏢 Équipes
            </div>

        </nav>
      </div>
      
      <div className={styles.main}>

        {/* ─── Users ─── */}
        {activeSection === 'users' && (
        <>
        <div className={styles.topbar}>
            <p className={styles.pageTitle}>Utilisateurs</p>
            <p className={styles.pageSub}>Gérez tous les utilisateurs de la plateforme.</p>
        </div>

        <div className={styles.stats}>
            <div className={styles.statCard}>
                <div className={styles.statIcon}>👥</div>
                <div>
                    <p className={styles.statValue}>—</p>
                    <p className={styles.statLabel}>Utilisateurs total</p>
                </div>
            </div>
            <div className={styles.statCard}>
                <div className={styles.statIcon}>🏢</div>
                <div>
                    <p className={styles.statValue}>—</p>
                    <p className={styles.statLabel}>Équipes actives</p>
                </div>
            </div>
            <div className={styles.statCard}>
                <div className={styles.statIcon}>⏳</div>
                <div>
                    <p className={styles.statValue}>—</p>
                    <p className={styles.statLabel}>En attente</p>
                </div>
            </div>
        </div>

        <div className={styles.tableCard}>
            <div className={styles.tableHead}>
                <span className={styles.tableTitle}>Liste des utilisateurs</span>
                <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Rechercher par nom ou courriel…"
                />
            </div>
            <UsersTable users={users} />
        </div>
        </>
        )}

        {/* ─── Teams ─── */}
        {activeSection === 'teams' && (
        <>
        <div className={styles.topbar}>
            <p className={styles.pageTitle}>Équipes</p>
            <p className={styles.pageSub}>Gérez toutes les équipes de la plateforme.</p>
        </div>

        <div className={styles.tableCard}>
            <div className={styles.tableHead}>
                <span className={styles.tableTitle}>Liste des équipes</span>
                <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Rechercher une équipe…"
                />
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Administrateur</th>
                        <th>Membres</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
        </>
        )}
      </div>
    </main>
    
    </>
  );
}