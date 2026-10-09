"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MdGroups2 } from "react-icons/md";
import { FaRegLightbulb } from "react-icons/fa";
import { groupNameSchema, type GroupNameInput } from "@/lib/groups/groups.schema";
import { createGroupAction, type UserSearchResult } from "@/lib/groups/server/groups.actions";
import { MemberEmailSearch } from "../memberEmailSearch/MemberEmailSearch";
import styles from "./CreateGroupDialog.module.css";

interface Props {
  onCreated: () => Promise<unknown>;
}

export function CreateGroupDialog({ onCreated }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [members, setMembers] = useState<UserSearchResult[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GroupNameInput>({
    resolver: zodResolver(groupNameSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = async (values: GroupNameInput) => {
    setServerError(null);
    const res = await createGroupAction({ ...values, memberIds: members.map((m) => m.id) });
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    await onCreated();
  };

  return (
    <div className={styles.fixedContainer}>
      <div role="dialog" aria-modal="true" aria-labelledby="create-group-title" className={styles.mainContainer}>
        <div className={styles.header}>
          <MdGroups2 size={70} style={{ color: "#B6C9E1" }} />
          <h1 id="create-group-title">Veuillez inscrire un nom d équipe pour débuter</h1>
          <h3>En tant que responsable, vous devez nommer votre équipe avant de continuer.</h3>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <label htmlFor="group-name">Nom de l équipe</label>
          <input
            id="group-name"
            placeholder="Ex : PancarteExpress"
            autoFocus
            {...register("name")}
            aria-invalid={!!errors.name}
          />

          <div className={styles.info}>
            <FaRegLightbulb /> Vous pouvez aussi ajouter des maintenant les membres de votre equipe qui ont deja un compte utilisateur
          </div>
          
          <MemberEmailSearch selected={members} onChange={setMembers} />

          {(errors.name || serverError) &&
            <div style={{ color: 'red', fontWeight: '700', border: '2px solid red', borderRadius: '10px', textAlign: 'center' }}>
              {errors.name && <p className={styles.error}>{errors.name.message}</p>}
              {serverError && <p className={styles.error}>{serverError}</p>}
            </div>
          }

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Création…" : "Créer l'équipe"}
          </button>
        </form>
      </div>
    </div>
  );
}