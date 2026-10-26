"use client";

import type { FormEvent } from "react";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IoMdCloseCircle } from "react-icons/io";
import { deleteUserAction } from "@/lib/users/server/user.actions";
import styles from "./DeleteUserButton.module.css";

export interface GroupMemberOption {
  id: string;
  name: string;
}

interface DeleteUserButtonProps {
  userId: string;
  userName: string;
  isGroupAdmin: boolean;
  groupMembers: GroupMemberOption[];
  className?: string;
}

export function DeleteUserButton({
  userId,
  userName,
  isGroupAdmin,
  groupMembers,
  className,
}: DeleteUserButtonProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = `delete-user-title-${userId}`;
  const [newAdminId, setNewAdminId] = useState("");
  const [isPending, startTransition] = useTransition();

  const needsSuccessor = isGroupAdmin && groupMembers.length > 0;

  const runDelete = (successorId?: string) => {
    startTransition(async () => {
      const result = await deleteUserAction(userId, successorId);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      dialogRef.current?.close();
      router.refresh();
    });
  };

  const handleClick = () => {
    if (needsSuccessor) {
      setNewAdminId("");
      dialogRef.current?.showModal();
      return;
    }
    if (!window.confirm(`Supprimer ${userName} ? Cette action est irréversible.`)) return;
    runDelete();
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newAdminId) runDelete(newAdminId);
  };

  return (
    <>
      <button
      style={{all: 'unset', cursor: 'pointer'}}
        type="button"
        className={className}
        onClick={handleClick}
        disabled={isPending}
        aria-label={`Supprimer ${userName}`}
      >
        <IoMdCloseCircle size={20} style={{ color: isPending ? "#999" : "red" }} />
      </button>

      {needsSuccessor && (
        <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId}>
          <form onSubmit={handleSubmit}>
            <h2 id={titleId} className={styles.title}>Supprimer {userName}</h2>
            <p className={styles.text}>
              {userName} est administrateur de son groupe. Choisissez qui le remplace.
            </p>

            <fieldset className={styles.members} disabled={isPending}>
              <legend className={styles.legend}>Nouvel administrateur</legend>
              {groupMembers.map((member) => (
                <label key={member.id} className={styles.member}>
                  <input
                    type="radio"
                    name="newAdmin"
                    value={member.id}
                    checked={newAdminId === member.id}
                    onChange={() => setNewAdminId(member.id)}
                  />
                  {member.name}
                </label>
              ))}
            </fieldset>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => dialogRef.current?.close()}
                disabled={isPending}
              >
                Annuler
              </button>
              <button
                type="submit"
                className={styles.btnDanger}
                disabled={!newAdminId || isPending}
              >
                {isPending ? "Suppression…" : "Supprimer et transférer"}
              </button>
            </div>
          </form>
        </dialog>
      )}
    </>
  );
}