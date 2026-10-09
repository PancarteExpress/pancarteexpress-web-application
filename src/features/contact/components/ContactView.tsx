'use client';

import styles from './ContactView.module.css';
import { FaPhoneAlt } from 'react-icons/fa';
import { MdOutlinePhoneAndroid, MdMail, MdLocationPin } from 'react-icons/md';

export default function Contact() {
  //const t = useTranslations('contact');

  return (
    <div className={styles.mainContainer}>

        <div className={styles.about}>
          <h3>Nos coordonnées</h3>

          <div className={styles.contact}>
            <div className={styles.imageContainer}>
              <FaPhoneAlt size={25} color="#0E4D9A" />
            </div>
            <div className={styles.infos}>
              <label className={styles.contactLabel}>Téléphone bureau</label>
              <label className={styles.contactValue}>514-825-2709</label>
            </div>
          </div>

          <div className={styles.contact}>
            <div className={styles.imageContainer}>
              <MdOutlinePhoneAndroid size={25} color="#0E4D9A" />
            </div>
            <div className={styles.infos}>
              <label className={styles.contactLabel}>Cellulaire representant</label>
              <label className={styles.contactValue}>438-543-0912</label>
            </div>
          </div>

          <div className={styles.contact}>
            <div className={styles.imageContainer}>
              <MdMail size={25} color="#0E4D9A" />
            </div>
            <div className={styles.infos}>
              <label className={styles.contactLabel}>Courriel</label>
              <label className={styles.contactValue}>info@pancarteexpress.com</label>
            </div>
          </div>

          <div className={styles.contact}>
            <div className={styles.imageContainer}>
              <MdLocationPin size={25} color="#0E4D9A" />
            </div>
            <div className={styles.infos}>
              <label className={styles.contactLabel}>Notre adresse</label>
              <label className={styles.contactValue}>
                2160 Rue Léger, Lasalle, QC H8N 2L8
              </label>
            </div>
          </div>
        </div>

        <form className={styles.contactForm}>
          <div className={styles.header}>
            <h2 className={styles.formTitle}>Nous contacter</h2>
          </div>

          <div className={styles.formBody}>
            <h2>
              Nom complet <span className={styles.req}>*</span>
            </h2>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="prenom">Prénom</label>
                <input id="prenom" type="text" placeholder="Jean" />
              </div>
              <div className={styles.field}>
                <label htmlFor="nom">Nom</label>
                <input id="nom" type="text" placeholder="Tremblay" />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="telephone">
                  Téléphone <span className={styles.req}>*</span>
                </label>
                <input id="telephone" type="text" placeholder="(514) 825-2709" />
              </div>
              <div className={styles.field}>
                <label htmlFor="bureau">Bureau / # poste</label>
                <input id="bureau" type="text" />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="courriel">
                  Courriel <span className={styles.req}>*</span>
                </label>
                <input id="courriel" type="text" placeholder="pancarteexpress@gmail.com" />
              </div>
              <div className={styles.field}>
                <label htmlFor="company">Nom de l entreprise</label>
                <input id="company" type="text" />
              </div>
            </div>

            <div className={`${styles.row} ${styles.rowFull}`}>
              <div className={styles.field}>
                <label htmlFor="raison">
                  Raison de votre demande <span className={styles.req}>*</span>
                </label>
                <textarea id="raison" rows={4} className={styles.textarea} />
              </div>
            </div>

            <button type="button">Envoyer ma demande</button>

          </div>
        </form>
    </div>
  );
}