"use client";

import { Session } from "next-auth";
import styles from "./DashboardContent.module.css"

interface DashboardContentProps {
  user: Session["user"];
}

export function DashboardContent({ user }: DashboardContentProps) {
  return (
    <div className={styles.mainContainer}>
      <div className={styles.welcome}>
        <div className={styles.welcomeAvatar}>
          CFL
        </div>
        <div>
          <p className={styles.welcomeTitle}>Bonjour, Cristian Fermin Lopez 👋</p>
          <p className={styles.welcomeSub}>
            Bienvenue dans votre espace personnel. Gérez vos commandes, adresses et
            informations de compte.
          </p>
        </div>
      </div>

      <div className={styles.userData}>
        <div className={styles.card}>
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

      <h1 className="text-4xl font-bold mb-8">
        Bienvenue, {user.name}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-sm text-gray-600 mb-2">Email</h2>
          <p className="text-xl font-semibold">{user.email}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-sm text-gray-600 mb-2">Rôle</h2>
          <p className="text-xl font-semibold capitalize">{user.role}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-sm text-gray-600 mb-2">Groupe</h2>
          <p className="text-xl font-semibold">
            {user.groupId ? "En équipe" : "Solo"}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Contenu à venir</h2>
        <p className="text-gray-600">
          Cest le dashboard. À remplir selon tes besoins.
        </p>
      </div>
    </div>
  );
}