'use client';

import { useForm } from 'react-hook-form';
import styles from './ContactView.module.css';
import { FaPhoneAlt } from 'react-icons/fa';
import { MdOutlinePhoneAndroid, MdMail, MdLocationPin } from 'react-icons/md';
import { type ContactFormData, contactSchema } from '../types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { sendContact } from '../emailSender/sendContact';

export default function Contact() {
   const t = useTranslations('contact');
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
        <label>{t('heroTitle')}</label>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div className={styles.contacts}>

            <div className={styles.responsiveContact}>
              <div className={styles.imageContainer}>
                <FaPhoneAlt size={25} color="#D8E8F8" />
              </div>
              <div className={styles.infos}>
                <label className={styles.contactLabel}>{t('heroLabel1')}</label>
                <label className={styles.contactValue}>514-825-2709</label>
              </div>
            </div>

            <div className={styles.responsiveContact}>
              <div className={styles.imageContainer}>
                <MdOutlinePhoneAndroid size={25} color="#D8E8F8" />
              </div>
              <div className={styles.infos}>
                <label className={styles.contactLabel}>{t('heroLabel2')}</label>
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
                <label className={styles.contactLabel}>{t('heroLabel3')}</label>
                <label className={styles.contactValue}>info@pancarteexpress.com</label>
              </div>
            </div>

            <div className={styles.contact}>
              <div className={styles.imageContainer}>
                <MdLocationPin size={25} color="#D8E8F8" />
              </div>
              <div className={styles.infos}>
                <label className={styles.contactLabel}>{t('heroLabel4')}</label>
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
          <h2 className={styles.formTitle}>{t('formTitle')}</h2>
        </div>

        <div className={styles.formBody}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="firstName">{t('formFirstname')} <span className={styles.req}>*</span></label>
              <input id="firstName" type="text" placeholder="Jean" {...register('firstName')} />
            </div>
            <div className={styles.field}>
              <label htmlFor="lastName">{t('formLastname')} <span className={styles.req}>*</span></label>
              <input id="lastName" type="text" placeholder="Tremblay" {...register('lastName')}/>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="telephone">{t('formPhoneNumber')} <span className={styles.req}>*</span></label>
              <input id="telephone" type="text" placeholder="(514) 825-2709" {...register('phoneNumber')}/>
            </div>
            <div className={styles.field}>
              <label htmlFor="bureau">{t('formExtenstion')}</label>
              <input id="bureau" type="text" {...register('extension')} />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="courriel">{t('formEmail')} <span className={styles.req}>*</span></label>
              <input id="courriel" type="text" placeholder="pancarteexpress@gmail.com" {...register('email')} />
            </div>
            <div className={styles.field}>
              <label htmlFor="company">{t('formCompany')}</label>
              <input id="company" type="text" placeholder="Pancarte Express" {...register('company')} />
            </div>
          </div>

          <div className={`${styles.row} ${styles.rowFull}`}>
            <div className={styles.field}>
              <label htmlFor="raison">{t('formReason')} <span className={styles.req}>*</span></label>
              <textarea id="raison" rows={4} className={styles.textarea} {...register('reason')}/>
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <div className={styles.errorMessage}>
              {t('humanErrorFeedback')}
            </div>
          )}
          
          { status === 'error' && (
            <div className={styles.errorMessage}>
              {t('serverErrorFeedback')}
            </div>
          )}

          { isSubmitting && 
          <div className={styles.sendingMessage}>
            {t('sendingFeedback')}
          </div> }
          
          { status === 'success' && 
          <div className={styles.messageSent}>
            {t('successFeedback')}
          </div> }

          <button type="submit" disabled={isSubmitting}>{t('formSend')}</button>

        </div>
      </form>
    </div>
  );
}