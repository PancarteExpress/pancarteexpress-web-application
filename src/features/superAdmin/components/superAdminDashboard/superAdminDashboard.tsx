"use client";

import type { AdminUserRow } from "@/lib/users/server/user.service";
import { UsersTable } from "../usersTable/UsersTable";
import styles from "./superAdminDashboard.module.css";
import { useMemo, useState } from "react";

import { FaUser } from "react-icons/fa";
import { FaUserGroup } from "react-icons/fa6";
import { GiSandsOfTime } from "react-icons/gi";
import type { AdminGroupRow } from "@/lib/groups/server/groups.service";
import { GroupsTable } from "../groupsTable/GroupsTable";
import { normalize } from "@/shared/utils/normalize";

interface AdminDashboardProps {
  users: AdminUserRow[];
  groups: AdminGroupRow[];
}

export function AdminDashboard({ users, groups }: AdminDashboardProps) {
    const [activeSection, setActiveSection] = useState<'users' | 'teams'>('users');

    const pendingCount = users.filter((u) => u.groupStatus === "PENDING").length;

    const [search, setSearch] = useState("");
    const [groupSearch, setGroupSearch] = useState("");
  
    const filteredUsers = useMemo(() => {
        const query = normalize(search.trim());
        if (!query) return users;

        return users.filter((u) => { const haystack = normalize( `${u.firstName ?? ""} ${u.lastName ?? ""} ${u.email}` );
            return haystack.includes(query);
        });
    }, [users, search]);

  return (
    <>
    <main className={styles.container}>

      <div className={styles.sidebar}>
        <div className={styles.sidebarHead}>
            <p className={styles.sidebarTitle}>Super Admin</p>
            <p className={styles.sidebarSub}>Pancarte Express</p>
        </div>

        <nav className={styles.nav}>
            <div className={`${styles.navItem} ${activeSection === 'users' ? styles.active : ''}`}
                onClick={() => setActiveSection('users')}>
                <FaUser size={20} style={{color : '#D8E8F8'}} /> Utilisateurs
            </div>
            <div className={`${styles.navItem} ${activeSection === 'teams' ? styles.active : ''}`}
                onClick={() => setActiveSection('teams')}>
                <FaUserGroup size={20} style={{color : '#D8E8F8'}} /> Équipes
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
            <div className={`${styles.statCard} ${pendingCount > 0 ? styles.userPending : ''}`}>
                <div className={styles.statIcon}><GiSandsOfTime size={30} style={{color : 'orange'}} /></div>
                <div className={styles.stat}>
                    <p className={styles.statValue}>{pendingCount}</p>
                    <p className={styles.statLabel}>Utilisateur{pendingCount > 1 ? "s" : ""} en attente de rejoindre une équipe</p>
                </div>
            </div>

            <div className={styles.statCard}>
                <div className={styles.statIcon}><FaUser size={30} style={{color : '#0E4D9A'}} /></div>
                <div className={styles.stat}>
                    <p className={styles.statValue}>{users.length}</p>
                    <p className={styles.statLabel}>utilisateur{users.length > 1 ? "s" : ""} total</p>
                </div>
            </div>

            <div className={styles.statCard}>
                <div className={styles.statIcon}><FaUserGroup size={30} style={{color : '#0E4D9A'}} /></div>
                <div className={styles.stat}>
                    <p className={styles.statValue}>{groups.length}</p>
                    <p className={styles.statLabel}>Équipe{groups.length > 1 ? "s" : ""} active{groups.length > 1 ? "s" : ""}</p>
                </div>
            </div>
        </div>

        <div className={styles.tableCard}>
            <div className={styles.tableHead}>
                <span className={styles.tableTitle}>Liste des utilisateurs</span>
                <input
                    className={styles.searchInput}
                    type="search"
                    placeholder="Rechercher par nom ou courriel…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            
            {filteredUsers.length === 0 ? 
            <div className={styles.noResults}>Aucun résultat.</div> : <UsersTable users={filteredUsers} allUsers={users} />
            }
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
                    type="search"
                    placeholder="Rechercher une équipe ou un membre…"
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                />
            </div>

            {groups.length === 0 ? 
                <div className={styles.noResults}>Aucun résultat.</div> :<GroupsTable groups={groups} users={users} search={groupSearch}/>
            }
        </div>
        </>
        )}
      </div>
    </main>
    
    </>
  );
}