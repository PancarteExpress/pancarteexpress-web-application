"use client";

import styles from "./DashboardContent.module.css"
import { useState } from "react";
import UpdateProfile from "../updateProfile/updateProfile";
import ProductOrders from "../productOrders/ProductOrders";

import { useSession } from "next-auth/react";


export function DashboardContent() {
  
  const { data: session } = useSession();
  
  const sessionUser = session?.user ;

  const [updateProfileOpen, setUpdateProfileOpen] = useState<boolean>(false);

  return (
    <div className={styles.mainContainer}>

      {sessionUser?.groupStatus === 'PENDING' && <>
        <div className={styles.groupStatePending}>La personne responsable de votre groupe doit approuver votre integration</div>
      </>}
      
      {sessionUser?.groupStatus === 'JOINED' && <>
        <div className={styles.groupStateJoined}>Vous faites partie de lequipe : {sessionUser?.group?.name}</div>
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
      </div>

      <ProductOrders />
      

      {updateProfileOpen && (
        <UpdateProfile 
          sessionUser={sessionUser}
          onClose={() => setUpdateProfileOpen(false)} 
        />
      )}
    </div>
  );
}