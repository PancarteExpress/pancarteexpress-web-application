"use client";

import styles from "./DashboardContent.module.css"
import { useState } from "react";
import UpdateProfile from "../updateProfile/updateProfile";

import { useSession } from "next-auth/react";
import type { UserOrder } from '@/lib/orders/server/orders.service';
import ServiceOrders from '../serviceOrders/ServiceOrders';
import { CreateGroupDialog } from "../createGroupDialog/CreateGroupDialog";
import UpdateGroup from "../updateGroup/updateGroup";
import { GroupDetails } from "@/lib/groups/server/groups.service";
import { useRouter } from "next/navigation";

interface Props {
  orders: UserOrder[];
  group: GroupDetails | null;
}

export function DashboardContent({ orders, group }: Props) {
  const router = useRouter();
  const { data: session, update } = useSession();
  
  const sessionUser = session?.user ;
  const needsGroup = sessionUser?.role === "groupAdmin" && !sessionUser.groupId;

  const [updateProfileOpen, setUpdateProfileOpen] = useState<boolean>(false);

  const [updateGroupOpen, setUpdateGroupOpen] = useState<boolean>(false);
  const canManageGroup = sessionUser?.role === "groupAdmin" && group !== null;

  return (
    <div className={styles.mainContainer}>

      {sessionUser?.role === 'groupAdmin' && sessionUser?.groupName !== null && <>
        <div className={styles.groupStateJoined}>Vous etes administrateur du groupe {sessionUser?.groupName}</div>
      </>}

      {sessionUser?.groupStatus === 'PENDING' && sessionUser?.role === 'user' && <>
        <div className={styles.groupStatePending}>La personne responsable de votre groupe doit approuver votre integration</div>
      </>}
      
      {sessionUser?.groupStatus === 'JOINED' && sessionUser?.role === 'user' && <>
        <div className={styles.groupStateJoined}>Vous faites partie de lequipe : {sessionUser?.groupName}</div>
      </>}
      
      <div className={styles.welcome}>
        <div className={styles.welcomeAvatar}>
          CFL
        </div>
        <div>
          <p className={styles.welcomeTitle}>
            Bonjour, {sessionUser?.firstName} {sessionUser?.lastName} 👋 
          </p>
          <p className={styles.welcomeSub}>
            Bienvenue dans votre espace personnel. Gérez vos commandes, adresses et
            informations de compte.
          </p>
        </div>
      </div>

      {sessionUser?.role === 'user' && 
      <div className={styles.userData}>
        <div className={styles.card} onClick={() => setUpdateProfileOpen(true)}>
          <div className={styles.qcardIcon}>👤</div>
          <div>
            <p className={styles.qcardTitle}>Mon profil</p>
            <p className={styles.qcardValue} style={{ fontSize: '13px' }}>
              Cristian Fermin Lopez
            </p>
            <p className={styles.qcardDesc}>ferminlopez_@hotmail.com</p>
          </div>
          <span className={styles.qcardLink}>Modifier mon compte →</span>
        </div>

        <div className={styles.card}>
          <div className={styles.qcardIcon}>📦</div>
          <div>
            <p className={styles.qcardTitle}>Commandes</p>
            <p className={styles.qcardValue}>Demandes de service</p>
            <p className={styles.qcardDesc}>X en cours · Y terminées · Z annulées</p>
            <p className={styles.qcardValue}>Produits de la boutique</p>
            <p className={styles.qcardDesc}>X en cours · Y terminées · Z annulées</p>
          </div>
        </div>
      </div>}
      
      {sessionUser?.role === 'groupAdmin' && 
      <div className={styles.groupAdminData}>
        <div className={styles.card} onClick={() => setUpdateProfileOpen(true)}>
          <div className={styles.qcardIcon}>👤</div>
          <div>
            <p className={styles.qcardTitle}>Mon profil</p>
            <p className={styles.qcardValue} style={{ fontSize: '13px' }}>
              Cristian Fermin Lopez
            </p>
            <p className={styles.qcardDesc}>ferminlopez_@hotmail.com</p>
          </div>
          <span className={styles.qcardLink}>Modifier mon compte →</span>
        </div>
        
        {canManageGroup && (
        <div className={styles.card} onClick={() => setUpdateGroupOpen(true)}>
          <div className={styles.qcardIcon}>👤</div>
          <div>
            <p className={styles.qcardTitle}>Information du groupe</p>
            <p className={styles.qcardValue} style={{ fontSize: '13px' }}>
              {sessionUser?.groupName}
            </p>
          </div>
          <span className={styles.qcardLink}>Modifier le groupe →</span>
        </div>
        )}

        <div className={styles.card}>
          <div className={styles.qcardIcon}>📦</div>
          <div>
            <p className={styles.qcardTitle}>Mes Commandes</p>
            <p className={styles.qcardValue}>Demandes de service</p>
            <p className={styles.qcardDesc}>X en cours · Y terminées · Z annulées</p>
            <p className={styles.qcardValue}>Produits de la boutique</p>
            <p className={styles.qcardDesc}>X en cours · Y terminées · Z annulées</p>
          </div>
        </div>
      </div>}

      <ServiceOrders orders={orders} />

      {updateProfileOpen && (
        <UpdateProfile 
          sessionUser={sessionUser}
          onClose={() => setUpdateProfileOpen(false)} 
        />
      )}
      
      {updateGroupOpen && group && (
        <UpdateGroup initialGroup={group} onClose={() => setUpdateGroupOpen(false)} />
      )}

      {needsGroup && (
        <CreateGroupDialog
          onCreated={async () => {
            await update();
            router.refresh();
          }}
        />
      )}
    </div>
  );
}