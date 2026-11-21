'use client';

import styles from './ContactView.module.css';

import { useForm } from 'react-hook-form';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { type ContactFormData, contactSchema } from '../schemas/contact.schema';
import { sendContact } from '../emailSender/sendContact';
import { zodResolver } from '@hookform/resolvers/zod';
import { CONTACT, mailtoHref, telHref } from '@/shared/constants/contact';
import { formatPhone } from '@/shared/utils/phone';

import { FaPhoneAlt } from 'react-icons/fa';
import { MdOutlinePhoneAndroid, MdMail, MdLocationPin } from 'react-icons/md';

export default function Contact() {
  const t = useTranslations('contact');
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'rateLimited'>('idle');
  // Moment où le formulaire est apparu, pour mesurer la durée de remplissage
  const [startedAt] = useState(() => Date.now());
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '', lastName: '', phoneNumber: '', extension: '',
      email: '', company: '', reason: '',
    },
  });

  const hasErrors = Object.keys(errors).length > 0;

  // Un seul message à la fois : le plus pertinent gagne
  const feedback =
    isSubmitting ? 'sending'
    : hasErrors ? 'invalid'
     : status === 'rateLimited' ? 'rateLimited'
    : status === 'error' ? 'server'
    : status === 'success' ? 'success'
    : null;

  const onSubmit = async (data: ContactFormData) => {
    setStatus('idle');
    try {
      const result = await sendContact({ ...data, elapsedMs: Date.now() - startedAt });
      if (result.success) {
        setStatus('success');
        reset();
      } else {
        setStatus(result.error === 'rateLimited' ? 'rateLimited' : 'error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className={styles.mainContainer}>

      <div className={styles.hero}>
        <h1>{t('heroTitle')}</h1>
        <div className={styles.contactsContainer}>
          
            <div className={styles.responsiveContact}>
              <div className={styles.imageContainer}>
                <FaPhoneAlt size={25} color="#D8E8F8" aria-hidden="true" />
              </div>
              <div className={styles.infos}>
                <label className={styles.contactLabel}>{t('heroLabel1')}</label>
                <a href={telHref(CONTACT.mainPhone)} className={styles.contactValue}>{CONTACT.mainPhone}</a>
              </div>
            </div>

            <div className={styles.responsiveContact}>
              <div className={styles.imageContainer}>
                <MdMail size={25} color="#D8E8F8" aria-hidden="true" />
              </div>
              <div className={styles.infos}>
                <label className={styles.contactLabel}>{t('heroLabel3')}</label>
                <a href={mailtoHref(CONTACT.infoEmail)} className={styles.contactValue}>{CONTACT.infoEmail}</a>
              </div>
              
            </div>
          
            <div className={styles.contact}>
              <div className={styles.imageContainer}>
                <MdOutlinePhoneAndroid size={25} color="#D8E8F8" aria-hidden="true" />
              </div>
              <div className={styles.infos}>
                <label className={styles.contactLabel}>{t('heroLabel2')}</label>
                <a href={telHref(CONTACT.mobilePhone)} className={styles.contactValue}>{CONTACT.mobilePhone}</a>
              </div>
            </div>

            <div className={styles.contact}>
              <div className={styles.imageContainer}>
                <MdLocationPin size={25} color="#D8E8F8" aria-hidden="true" />
              </div>
              <div className={styles.infos}>
                <label className={styles.contactLabel}>{t('heroLabel4')}</label>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT.address)}`} target="_blank"
                  rel="noopener noreferrer" className={styles.contactValue}
                >
                  {CONTACT.address}
                </a>
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
              <input id="firstName" type="text" autoComplete="given-name" placeholder={t('firstnamePlaceholder')} {...register('firstName')} />
            </div>
            <div className={styles.field}>
              <label htmlFor="lastName">{t('formLastname')} <span className={styles.req}>*</span></label>
              <input id="lastName" type="text" autoComplete="family-name" placeholder={t('lastnamePlaceholder')} {...register('lastName')}/>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="telephone">{t('formPhoneNumber')} <span className={styles.req}>*</span></label>
              <input id="telephone" type="tel" inputMode="tel" autoComplete="tel" maxLength={14} placeholder="(514) 825-2709" {...register('phoneNumber')}
                onInput={(e) => {
                  e.currentTarget.value = formatPhone(e.currentTarget.value);
                }}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="bureau">{t('formExtenstion')}</label>
              <input id="bureau" type="text" inputMode="numeric" maxLength={6} placeholder=" " {...register('extension')} 
                onInput={(e) => {
                  e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '');
                }}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="courriel">{t('formEmail')} <span className={styles.req}>*</span></label>
              <input id="courriel" type="text" autoComplete="email" placeholder="pancarteexpress@gmail.com" {...register('email')} />
            </div>
            <div className={styles.field}>
              <label htmlFor="company">{t('formCompany')}</label>
              <input id="company" type="text" autoComplete="organization" placeholder="Pancarte Express" {...register('company')} />
            </div>
            {/* Champ piège : invisible pour les humains, rempli par les robots */}
            <div className={styles.honeypot} aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
            </div>
          </div>

          <div className={`${styles.row} ${styles.rowFull}`}>
            <div className={styles.field}>
              <label htmlFor="raison">{t('formReason')} <span className={styles.req}>*</span></label>
              <textarea id="raison" rows={4} placeholder=" " className={styles.textarea} {...register('reason')}/>
            </div>
          </div>

          {feedback === 'invalid' && <div className={styles.errorMessage} role="alert">{t('humanErrorFeedback')}</div>}
          {feedback === 'server' && <div className={styles.errorMessage} role="alert">{t('serverErrorFeedback')}</div>}
          {feedback === 'rateLimited' && <div className={styles.errorMessage} role="alert">{t('rateLimitFeedback', { phone: CONTACT.mainPhone })}</div>}
          {feedback === 'sending' && <div className={styles.sendingMessage} role="status">{t('sendingFeedback')}</div>}
          {feedback === 'success' && <div className={styles.messageSent} role="status">{t('successFeedback')}</div>}

          <button type="submit" disabled={isSubmitting}>{t('formSend')}</button>

        </div>
      </form>
    </div>
  );
}