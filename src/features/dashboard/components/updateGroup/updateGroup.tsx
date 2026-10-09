"use client";

import styles from "./updateGroup.module.css";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { groupNameSchema, type GroupNameInput } from "@/lib/groups/groups.schema";
import {
  renameGroupAction,
  addGroupMembersAction,
  removeGroupMemberAction,
  type UserSearchResult,
} from "@/lib/groups/server/groups.actions";
import type { GroupDetails, GroupMember } from "@/lib/groups/server/groups.service";
import { MemberEmailSearch } from "../memberEmailSearch/MemberEmailSearch";

interface UpdateGroupProps {
  initialGroup: GroupDetails;
  onClose: () => void;
}

type Feedback = { type: "success" | "error"; message: string } | null;

const STATUS_LABELS: Record<GroupMember["groupStatus"], string> = {
  SOLO: "Solo",
  PENDING: "En attente",
  JOINED: "Membre",
};

export default function UpdateGroup({ initialGroup, onClose }: UpdateGroupProps) {
  const router = useRouter();
  const { data: session, update } = useSession();
  const isGroupAdmin = session?.user?.role === "groupAdmin";

  const [group, setGroup] = useState<GroupDetails>(initialGroup);
  const [nameFeedback, setNameFeedback] = useState<Feedback>(null);
  const [membersFeedback, setMembersFeedback] = useState<Feedback>(null);
  const [toAdd, setToAdd] = useState<UserSearchResult[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<GroupNameInput>({
    resolver: zodResolver(groupNameSchema),
    defaultValues: { name: initialGroup.name },
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const onRename = async (values: GroupNameInput) => {
    setNameFeedback(null);
    try {
      const res = await renameGroupAction(values);
      if (!res.ok) {
        setNameFeedback({ type: "error", message: res.error });
        return;
      }
      setGroup(res.group);
      reset({ name: res.group.name });
      setNameFeedback({ type: "success", message: "Nom de l'équipe mis à jour" });
      await update(); // rafraîchit groupName dans la session
      router.refresh(); // resynchronise les données serveur de la page
    } catch {
      setNameFeedback({ type: "error", message: "Une erreur est survenue" });
    }
  };

  const handleAdd = async () => {
    if (toAdd.length === 0) return;
    setIsAdding(true);
    setMembersFeedback(null);
    try {
      const res = await addGroupMembersAction({ memberIds: toAdd.map((u) => u.id) });
      if (!res.ok) {
        setMembersFeedback({ type: "error", message: res.error });
        return;
      }
      setGroup(res.group);
      setMembersFeedback({ type: "success", message: `${toAdd.length} coéquipier(s) ajouté(s)` });
      setToAdd([]);
      router.refresh();
    } catch {
      setMembersFeedback({ type: "error", message: "Une erreur est survenue" });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (member: GroupMember) => {
    if (!window.confirm(`Retirer ${member.email} de l'équipe ?`)) return;
    setRemovingId(member.id);
    setMembersFeedback(null);
    try {
      const res = await removeGroupMemberAction(member.id);
      if (!res.ok) {
        setMembersFeedback({ type: "error", message: res.error });
        return;
      }
      setGroup(res.group);
      router.refresh();
    } catch {
      setMembersFeedback({ type: "error", message: "Une erreur est survenue" });
    } finally {
      setRemovingId(null);
    }
  };

  if (!isGroupAdmin) return null;

  return (
    <div className={styles.fixedContainer}>
      <div role="dialog" aria-modal="true" aria-labelledby="update-group-title" className={styles.mainContainer}>
        <div className={styles.header}>
          <h2 id="update-group-title">Gérer mon équipe</h2>
          <button type="button" onClick={onClose}>Fermer</button>
        </div>

        <div className={styles.body}>
          {/* Nom */}
          <section className={styles.section}>
            <h3>Nom de l équipe</h3>
            <form onSubmit={handleSubmit(onRename)} noValidate>
              <div className={styles.inputs}>
                <label htmlFor="group-name">Nom</label>
                <input id="group-name" {...register("name")} aria-invalid={!!errors.name} />
                {errors.name && <p className={styles.error}>{errors.name.message}</p>}
              </div>
              {nameFeedback && (
                <p className={nameFeedback.type === "error" ? styles.error : styles.success}>
                  {nameFeedback.message}
                </p>
              )}
              <div className={styles.btnSave}>
                <button type="submit" disabled={isSubmitting || !isDirty}>
                  {isSubmitting ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </form>
          </section>

          {/* Membres */}
          <section className={styles.section}>
            <h3>Membres ({group.users.length})</h3>

            <div>
              <span className={styles.membersLabel}>Administrateur</span>
              {group.users.filter(m => m.role === 'groupAdmin').map(member => (
              <div key={member.id} className={styles.adminRow}>
                  <div>
                      <p className={styles.memberName}>{member.firstName} {member.lastName}</p>
                      <p className={styles.memberEmail}>{member.email}</p>
                  </div>
                  <span className={`${styles.badge} ${styles.badgeAdmin}`}>Administrateur</span>
              </div>
              ))}
            </div>

            <div>
              <span className={styles.membersLabel}>Membres</span>
              <div className={styles.memberListWrap}>
                  <ul className={styles.memberList}>
                      {group.users.filter(m => m.role !== 'groupAdmin').map(member => (
                          <li key={member.id} className={styles.memberRow}>
                              <div>
                                  <p className={styles.memberName}>{member.firstName} {member.lastName}</p>
                                  <p className={styles.memberEmail}>{member.email}</p>
                              </div>
                              <span className={`${styles.badge} ${member.groupStatus === 'PENDING' ? styles.badgePending : styles.badgeActive}`}>
                                  {STATUS_LABELS[member.groupStatus]}
                              </span>
                              <button type="button" className={styles.btnRemove} onClick={() => handleRemove(member)} disabled={removingId === member.id}>
                                  {removingId === member.id ? "Retrait…" : "Retirer"}
                              </button>
                          </li>
                      ))}
                  </ul>
              </div>
          </div>

            <MemberEmailSearch selected={toAdd} onChange={setToAdd} />

            {membersFeedback && (
              <p className={membersFeedback.type === "error" ? styles.error : styles.success}>
                {membersFeedback.message}
              </p>
            )}

            <div className={styles.btnSave}>
              <button type="button" onClick={handleAdd} disabled={isAdding || toAdd.length === 0}>
                {isAdding ? "Ajout…" : `Ajouter (${toAdd.length})`}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}