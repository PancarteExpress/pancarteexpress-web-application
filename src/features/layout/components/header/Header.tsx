"use client";

import styles from './Header.module.css';

import Image from "next/image";
import LanguageSwitcher from '@/shared/components/languageSwitcher/LanguageSwitcher';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { AuthNav } from '@/features/auth/components/authNav/AuthNav';
import { LocalLink } from '@/shared/components/LocalLink';
import { CONTACT, mailtoHref, telHref } from "@/shared/constants/contact";

import { FaPhoneAlt } from "react-icons/fa";
import { MdMail } from "react-icons/md";
import { IoMenuOutline } from "react-icons/io5";
import { IoCartOutline } from "react-icons/io5";
import { FaPaperPlane } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

export default function Header() {

    const t = useTranslations('header');
    const [isOpen, setIsOpen] = useState(false);
    const closeMenu = () => setIsOpen(false);

    return (
        <header>
            <div className={styles.topHeader}>
                <div className={styles.container}>
                    <div className={styles.contactInfo}>
                        <a href={telHref(CONTACT.mainPhone)}><FaPhoneAlt size={15}/> {CONTACT.mainPhone}</a>
                        <a href={mailtoHref(CONTACT.infoEmail)}><MdMail size={20} /> {CONTACT.infoEmail}</a>
                        <LanguageSwitcher />
                    </div>

                    <div className={styles.account}>
                        <AuthNav />
                    </div>
                </div>
            </div>

            <div className={styles.bottomHeader}>
                <div className={styles.container}>
                    <Image src="/header/Logo_PancarteExpress_Final_FR_vecteur.svg" className={styles.logo} loading="eager" alt={t('logoAlt')} width={696} height={225}/>

                    <div className={styles.infos}>
                        <div className={styles.schedule}>
                            <div>
                                <h1>{t('fastServiceTitle')}</h1>
                                <h5>{t('fastServiceSub')}</h5>
                            </div>
                            <Image src="/header/icon-horaire.png" alt={t('scheduleIconAlt')} className={styles.icon} width={40} height={40} />
                        </div>
                        <div className={styles.area}>
                            <div>
                                <h1>{t('zoneTitle')}</h1>
                                <h5>{t('zoneSub')}</h5>
                            </div>
                            <Image src="/header/icon-maps.png" alt={t('mapIconAlt')} className={styles.icon} width={30} height={35} />
                        </div>
                    </div>

                    <div className={styles.navbar}>
                        <div className={styles.links}>
                            <LocalLink href="/" className={styles.navItem} activeClassName={styles.active}>{t('navbarHome')}</LocalLink>
                            <LocalLink href="/residential" className={styles.navItem} activeClassName={styles.active}>{t('navbarResidential')}</LocalLink>
                            <LocalLink href="/bigFormat" className={styles.navItem} activeClassName={styles.active}>{t('navbarBigFormat')}</LocalLink>
                            <LocalLink href="/shop" className={styles.navItem} activeClassName={styles.active}>{t('navbarShop')}</LocalLink>
                            <LocalLink href="/contact" className={styles.navItem} activeClassName={styles.active}>{t('navbarContact')}</LocalLink>
                            <LocalLink href="/cart" className={styles.navItem} activeClassName={styles.active}><IoCartOutline size={22} /></LocalLink>
                        </div>
                        
                        <div className={styles.lastLink}>
                            <LocalLink href="/services" className={styles.navItem} activeClassName={styles.active}><FaPaperPlane />{t('navbarServices')}</LocalLink>
                        </div>
                    </div>

                    {/* Responsive Navigation Toggle - Appears on screens of width 1000px and smaller */}
                    <div className={styles.toggleResponsiveNav} onClick={() => setIsOpen(!isOpen)}>
                        <IoMenuOutline size={50}/>
                    </div>

                </div>
            </div>

            <div className={`${styles.responsiveNav} ${isOpen ? styles.visible : ""}`}>
                <div className={styles.closeBtn} >
                <IoClose onClick={() => setIsOpen(!isOpen)} />
                </div>

                <div className={styles.responsiveNavbar} >
                    <LocalLink href="/" onClick={closeMenu} className={styles.navItem} activeClassName={styles.active}>{t('navbarHome')}</LocalLink>
                    <LocalLink href="/residential" onClick={closeMenu} className={styles.navItem} activeClassName={styles.active}>{t('navbarResidential')}</LocalLink>
                    <LocalLink href="/bigFormat" onClick={closeMenu} className={styles.navItem} activeClassName={styles.active}>{t('navbarBigFormat')}</LocalLink>
                    <LocalLink href="/shop" onClick={closeMenu} className={styles.navItem} activeClassName={styles.active}>{t('navbarShop')}</LocalLink>
                    <LocalLink href="/contact" onClick={closeMenu} className={styles.navItem} activeClassName={styles.active}>{t('navbarContact')}</LocalLink>
                    <LocalLink href="/cart" onClick={closeMenu} className={styles.navItem} activeClassName={styles.active}><IoCartOutline size={22} /></LocalLink>
                    <LocalLink href="/services" onClick={closeMenu} className={styles.navItem} activeClassName={styles.active}><FaPaperPlane />{t('navbarServices')}</LocalLink>
                    
                    <AuthNav onNavigate={closeMenu} />
                </div>
            </div>
        </header>
    );
}