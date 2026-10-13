'use client';

import { useForm } from 'react-hook-form';
import styles from './ContactView.module.css';
import { FaPhoneAlt } from 'react-icons/fa';
import { MdOutlinePhoneAndroid, MdMail, MdLocationPin } from 'react-icons/md';
import { type ContactFormData, contactSchema } from '../types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { sendContact } from '../emailSender/sendContact';

export default function Contact() {

  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '', lastName: '', phoneNumber: '', extension: '',
      email: '', company: '', reason: '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setStatus('idle');
    try {
      const result = await sendContact(data);
      if (result.success) {
        setStatus('success');
        reset();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className={styles.mainContainer}>

      <div className={styles.hero}>
        <label>Nos coordonnées</label>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div className={styles.contacts}>

            <div className={styles.responsiveContact}>
              <div className={styles.imageContainer}>
                <FaPhoneAlt size={25} color="#D8E8F8" />
              </div>
              <div className={styles.infos}>
                <label className={styles.contactLabel}>Téléphone bureau</label>
                <label className={styles.contactValue}>514-825-2709</label>
              </div>
            </div>

            <div className={styles.responsiveContact}>
              <div className={styles.imageContainer}>
                <MdOutlinePhoneAndroid size={25} color="#D8E8F8" />
              </div>
              <div className={styles.infos}>
                <label className={styles.contactLabel}>Cellulaire representant</label>
                <label className={styles.contactValue}>438-543-0912</label>
              </div>
            </div>
          </div>
          
          <div className={styles.contacts}>
            <div className={styles.contact}>
              <div className={styles.imageContainer}>
                <MdMail size={25} color="#D8E8F8" />
              </div>
              <div className={styles.infos}>
                <label className={styles.contactLabel}>Courriel</label>
                <label className={styles.contactValue}>info@pancarteexpress.com</label>
              </div>
            </div>

            <div className={styles.contact}>
              <div className={styles.imageContainer}>
                <MdLocationPin size={25} color="#D8E8F8" />
              </div>
              <div className={styles.infos}>
                <label className={styles.contactLabel}>Notre adresse</label>
                <label className={styles.contactValue}>
                  2160 Rue Léger, Lasalle, QC H8N 2L8
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form className={styles.contactForm} onSubmit={handleSubmit(onSubmit, () => setStatus('idle'))} noValidate>
        <div className={styles.header}>
          <h2 className={styles.formTitle}>Ou envoyer une demande des maintenant !</h2>
        </div>

        <div className={styles.formBody}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="firstName">Prénom <span className={styles.req}>*</span></label>
              <input id="firstName" type="text" placeholder="Jean" {...register('firstName')} />
            </div>
            <div className={styles.field}>
              <label htmlFor="lastName">Nom <span className={styles.req}>*</span></label>
              <input id="lastName" type="text" placeholder="Tremblay" {...register('lastName')}/>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="telephone">Téléphone <span className={styles.req}>*</span></label>
              <input id="telephone" type="text" placeholder="(514) 825-2709" {...register('phoneNumber')}/>
            </div>
            <div className={styles.field}>
              <label htmlFor="bureau">Bureau / # poste</label>
              <input id="bureau" type="text" {...register('extension')} />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="courriel">Courriel <span className={styles.req}>*</span></label>
              <input id="courriel" type="text" placeholder="pancarteexpress@gmail.com" {...register('email')} />
            </div>
            <div className={styles.field}>
              <label htmlFor="company">Nom de l entreprise</label>
              <input id="company" type="text" placeholder="Pancarte Express" {...register('company')} />
            </div>
          </div>

          <div className={`${styles.row} ${styles.rowFull}`}>
            <div className={styles.field}>
              <label htmlFor="raison">Raison de votre demande <span className={styles.req}>*</span></label>
              <textarea id="raison" rows={4} className={styles.textarea} {...register('reason')}/>
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <div className={styles.errorMessage}>
              * Veuillez remplir tous les champs obligatoires *
            </div>
          )}
          
          { status === 'error' && (
            <div className={styles.errorMessage}>
              Une erreur coter serveur s est produite, veuillez reessayer plus tard
            </div>
          )}

          { isSubmitting && 
          <div className={styles.sendingMessage}>
            Envoi en cours...
          </div> }
          
          { status === 'success' && 
          <div className={styles.messageSent}>
            Message envoyer avec success
          </div> }

          <button type="submit" disabled={isSubmitting}>Envoyer ma demande</button>

        </div>
      </form>
    </div>
  );
}