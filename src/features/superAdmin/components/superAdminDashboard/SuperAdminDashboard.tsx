"use client";

import type { AdminUserRow } from "@/lib/users/server/user.service";
import { UsersTable } from "../usersTable/UsersTable";
import styles from "./SuperAdminDashboard.module.css";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { FaUser } from "react-icons/fa";
import { FaUserGroup } from "react-icons/fa6";
import { GiSandsOfTime } from "react-icons/gi";
import { IoConstructSharp } from "react-icons/io5";
import type { GroupStatus } from "@prisma/client";
import { FilterSelect } from "./FilterSelect";
import { ADMIN_LIST_ROLES, GROUP_STATUSES, type AdminListRole } from "../../constants/labels";
import type { AdminGroupRow } from "@/lib/groups/server/groups.service";
import { GroupsTable } from "../groupsTable/GroupsTable";
import { normalize } from "@/shared/utils/normalize";
import type { AdminClientServices } from "@/lib/services/server/services.service";
import { ServicesTable } from "../servicesTable/ServicesTable";

interface AdminDashboardProps {
  users: AdminUserRow[];
  groups: AdminGroupRow[];
  services: AdminClientServices[];
}

export function AdminDashboard({ users, groups, services }: AdminDashboardProps) {
    const t = useTranslations("superAdmin");
    const [activeSection, setActiveSection] = useState<'users' | 'teams' | 'services'>('users');
    const roleLabels: Record<AdminListRole, string> = { user: t("roles.user"), groupAdmin: t("roles.groupAdmin") };
    const groupStatusLabels: Record<GroupStatus, string> = {
        SOLO: t("groupStatuses.SOLO"),
        PENDING: t("groupStatuses.PENDING"),
        JOINED: t("groupStatuses.JOINED"),
    };

    const pendingCount = users.filter((u) => u.groupStatus === "PENDING").length;

    const [search, setSearch] = useState("");
    const [groupStatus, setGroupStatus] = useState<GroupStatus | null>(null);
    const [groupSearch, setGroupSearch] = useState("");
    const [role, setRole] = useState<AdminListRole | null>(null);
  
    const filteredUsers = useMemo(() => {
        const query = normalize(search.trim());
        if (!query && !groupStatus && !role) return users;

        return users.filter((u) => {
            if (groupStatus && u.groupStatus !== groupStatus) return false;
            if (role && u.role !== role) return false;
            if (!query) return true;
            return normalize(`${u.firstName ?? ""} ${u.lastName ?? ""} ${u.email}`).includes(query);
        });
    }, [users, search, groupStatus, role]);

  return (
    <>
    <main className={styles.container}>

      <div className={styles.sidebar}>
        <div className={styles.sidebarHead}>
            <p className={styles.sidebarTitle}>{t("sidebarTitle")}</p>
            <p className={styles.sidebarSub}>Pancarte Express</p>
        </div>

        <nav className={styles.nav}>
            <div className={`${styles.navItem} ${activeSection === 'users' ? styles.active : ''}`}
                onClick={() => setActiveSection('users')}>
                <FaUser size={20} style={{color : '#D8E8F8'}} /> {t("nav.users")}
            </div>
            <div className={`${styles.navItem} ${activeSection === 'teams' ? styles.active : ''}`}
                onClick={() => setActiveSection('teams')}>
                <FaUserGroup size={20} style={{color : '#D8E8F8'}} /> {t("nav.teams")}
            </div>
            
            <div className={`${styles.navItem} ${activeSection === 'services' ? styles.active : ''}`}
                onClick={() => setActiveSection('services')}>
                <IoConstructSharp size={20} style={{color : '#D8E8F8'}} /> {t("nav.services")}
            </div>
        </nav>
      </div>
      
      <div className={styles.main}>

        {/* ─── Users ─── */}
        {activeSection === 'users' && (
        <>
        <div className={styles.topbar}>
            <p className={styles.pageTitle}>{t("users.title")}</p>
            <p className={styles.pageSub}>{t("users.subtitle")}</p>
        </div>

        <div className={styles.stats}>
            <div className={`${styles.statCard} ${pendingCount > 0 ? styles.userPending : ''}`}>
                <div className={styles.statIcon}><GiSandsOfTime size={30} style={{color : 'orange'}} /></div>
                <div className={styles.stat}>
                    <p className={styles.statValue}>{pendingCount}</p>
                    <p className={styles.statLabel}>{t("users.pendingStat", { count: pendingCount })}</p>
                </div>
            </div>

            <div className={styles.statCard}>
                <div className={styles.statIcon}><FaUser size={30} style={{color : '#0E4D9A'}} /></div>
                <div className={styles.stat}>
                    <p className={styles.statValue}>{users.length}</p>
                    <p className={styles.statLabel}>{t("users.totalStat", { count: users.length })}</p>
                </div>
            </div>

            <div className={styles.statCard}>
                <div className={styles.statIcon}><FaUserGroup size={30} style={{color : '#0E4D9A'}} /></div>
                <div className={styles.stat}>
                    <p className={styles.statValue}>{groups.length}</p>
                    <p className={styles.statLabel}>{t("users.activeTeamsStat", { count: groups.length })}</p>
                </div>
            </div>
        </div>

        <div className={styles.tableCard}>
            <div className={styles.tableHead}>
                <span className={styles.tableTitle}>{t("users.listTitle")}</span>
                <div className={styles.tableActions}>
                        <FilterSelect
                        value={role}
                        options={ADMIN_LIST_ROLES}
                        labels={roleLabels}
                        allLabel={t("users.allRoles")}
                        ariaLabel={t("users.filterByRole")}
                        onChange={setRole}
                        className={styles.filterSelect}
                    />
                    <FilterSelect
                        value={groupStatus}
                        options={GROUP_STATUSES}
                        labels={groupStatusLabels}
                        allLabel={t("users.allStatuses")}
                        ariaLabel={t("users.filterByGroupStatus")}
                        onChange={setGroupStatus}
                        className={styles.filterSelect}
                    />
                <input
                    className={styles.searchInput}
                    type="search"
                    placeholder={t("users.searchPlaceholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                </div>
            </div>
            
            {filteredUsers.length === 0 ? 
            <div className={styles.noResults}>{t("users.noResults")}</div> : <UsersTable users={filteredUsers} allUsers={users} />
            }
        </div>
        </>
        )}

        {/* ─── Teams ─── */}
        {activeSection === 'teams' && (
        <>
        <div className={styles.topbar}>
            <p className={styles.pageTitle}>{t("teams.title")}</p>
            <p className={styles.pageSub}>{t("teams.subtitle")}</p>
        </div>

        <div className={styles.tableCard}>
            <div className={styles.tableHead}>
                <span className={styles.tableTitle}>{t("teams.listTitle")}</span>
                <input
                    className={styles.searchInput}
                    type="search"
                    placeholder={t("teams.searchPlaceholder")}
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                />
            </div>

            {groups.length === 0 ? 
                <div className={styles.noResults}>{t("teams.noResults")}</div> :<GroupsTable groups={groups} users={users} search={groupSearch}/>
            }
        </div>
        </>
        )}
        
        {/* ─── Teams ─── */}
        {activeSection === 'services' && (
        <>
            <div className={styles.topbar}>
            <p className={styles.pageTitle}>{t("servicesSection.title")}</p>
            <p className={styles.pageSub}>{t("servicesSection.subtitle")}</p>
            </div>
            <ServicesTable clients={services} />
        </>
        )}
      </div>
    </main>
    
    </>
  );
}