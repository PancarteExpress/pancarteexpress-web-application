"use client";

import { Fragment, useState } from "react";
import type { AdminUserRow } from "@/lib/users/server/user.service";
import { GROUP_STATUS_LABELS, ROLE_LABELS } from "../../constants/labels";
import styles from "./GroupsTable.module.css";
import type { AdminGroupRow } from "@/lib/groups/server/groups.service";
import { normalize } from "@/shared/utils/normalize";
import { DeleteGroupButton } from "./DeleteGroupButton";

const getDisplayName = (u: { firstName: string | null; lastName: string | null; email: string }) =>
  [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;

interface GroupsTableProps {
  groups: AdminGroupRow[];
  users: AdminUserRow[];
  search: string;
}

export function GroupsTable({ groups, users, search }: GroupsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (groups.length === 0) {
    return <p className={styles.empty}>Aucune équipe.</p>;
  }

  // Index des membres par groupe, admin en premier
  const membersByGroup = new Map<string, AdminUserRow[]>();
  
  for (const u of users) {
    if (!u.group) continue;
    const list = membersByGroup.get(u.group.id) ?? [];
    list.push(u);
    membersByGroup.set(u.group.id, list);
  }

  for (const list of membersByGroup.values()) {
    list.sort((a, b) => Number(b.role === "groupAdmin") - Number(a.role === "groupAdmin"));
  }

  const query = normalize(search.trim());

  const visibleGroups = query
    ? groups.filter((group) => {
        if (normalize(group.name ?? "").includes(query)) return true;
        const members = membersByGroup.get(group.id) ?? [];
        return members.some((m) =>
          normalize(`${m.firstName ?? ""} ${m.lastName ?? ""} ${m.email}`).includes(query)
        );
      })
    : groups;

  if (visibleGroups.length === 0) {
    return <p className={styles.empty}>Aucun résultat.</p>;
  }

  const toggle = (id: string) => setExpandedId((current) => (current === id ? null : id));

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <colgroup>
          <col className={styles.colName} />
          <col className={styles.colAdmin} />
          <col className={styles.colMembers} />
          <col className={styles.colActions} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Nom</th>
            <th scope="col">Administrateur</th>
            <th scope="col">Membres</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {visibleGroups.map((group) => {
            const isOpen = expandedId === group.id;
            const members = membersByGroup.get(group.id) ?? [];
            const panelId = `group-members-${group.id}`;

            return (
              <Fragment key={group.id}>
                <tr className={isOpen ? styles.rowOpen : undefined}>
                  <td title={group.name ?? undefined}>{group.name ?? "Sans nom"}</td>
                  <td>{group.admin ? getDisplayName(group.admin) : "—"}</td>
                  <td>{group.memberCount}</td>
                  <td>
                    <div className={styles.groupActions}>
                      <button
                        type="button"
                        className={styles.btnToggle}
                        onClick={() => toggle(group.id)}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                      >
                        {isOpen ? "Masquer" : "Voir les membres"}
                      </button>
                      <DeleteGroupButton
                        groupId={group.id}
                        groupName={group.name ?? "Sans nom"}
                        memberCount={group.memberCount}
                        className={styles.btnDelete}
                      />
                    </div>
                  </td>
                </tr>

                {isOpen && (
                  <tr id={panelId} className={styles.panelRow}>
                    <td colSpan={4}>
                      {members.length === 0 ? (
                        <p className={styles.empty}>Aucun membre.</p>
                      ) : (
                        <ul className={styles.memberList}>
                          {members.map((m) => (
                            <li key={m.id} className={styles.member}>
                              <span className={styles.memberName}>{getDisplayName(m)}</span>
                              <a href={`mailto:${m.email}`} className={styles.memberEmail}>
                                {m.email}
                              </a>
                              <span className={styles.memberRole}>{ROLE_LABELS[m.role]}</span>
                              <span className={styles.memberStatus}>
                                {GROUP_STATUS_LABELS[m.groupStatus]}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}