"use client";

// Utils
import styles from './header.module.css';
import Image from "next/image";
import Link from "next/link";
import { useState } from 'react';

// Translater

// React icons
import { FaPhoneAlt } from "react-icons/fa";
import { MdMail } from "react-icons/md";
import { IoMenuOutline } from "react-icons/io5";
import { IoCartOutline } from "react-icons/io5";
import { FaPaperPlane } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import LanguageSwitcher from '../languageSwitcher/languageSwitcher';
import { LocalLink } from '../LocalLink';
import { AuthNav } from '@/features/auth/components/authNav/AuthNav';
import { useLocale, useTranslations } from 'next-intl';
import { useAppLocale } from '@/shared/hooks/useAppLocale';


export default function Header() {

    const t = useTranslations('header');
    const locale = useAppLocale(); // pour les redirections

    // Toggle de responsive Navbar
    const [isOpen, setIsOpen] = useState(false);

    // Get the current pathname

    return (
        <header>
            <div className={styles.topHeader}>
                <div className={styles.container}>
                    <div className={styles.contactInfo}>
                        <Link href="tel:5148252709"><FaPhoneAlt size={15}/> 514-825-2709</Link>
                        <Link href="mailto:info@pancarteexpress.com"><MdMail size={20} /> info@pancarteexpress.com</Link>
                        <LanguageSwitcher />
                    </div>

                    <div className={styles.account}>
                        <AuthNav locale={locale} />
                    </div>
                </div>
            </div>

            <div className={styles.bottomHeader}>
                <div className={styles.container}>
                    <Image src="/header/Logo_PancarteExpress.svg" className={styles.logo} loading="eager" alt="Logo Pancarte Express" width={300} height={100} />

                    <div className={styles.infos}>
                        <div className={styles.schedule}>
                            <div>
                                <h1>{t('fastServiceTitle')}</h1>
                                <h5>{t('fastServiceSub')}</h5>
                            </div>
                            <Image src="/header/icon-horaire.png" alt="icon horaire" className={styles.icon} width={40} height={40} />
                        </div>
                        <div className={styles.area}>
                            <div>
                                <h1>{t('zoneTitle')}</h1>
                                <h5>{t('zoneSub')}</h5>
                            </div>
                            <Image src="/header/icon-maps.png" alt="icon maps" className={styles.icon} width={30} height={35} />
                        </div>
                    </div>

                    <div className={styles.navbar}>
                        <div className={styles.links}>
                            <LocalLink href="/" className={styles.navItem}>{t('navbarHome')}</LocalLink>
                            <LocalLink href="/residential" className={styles.navItem}>{t('navbarResidential')}</LocalLink>
                            <LocalLink href="/bigFormat" className={styles.navItem}>{t('navbarBigFormat')}</LocalLink>
                            <LocalLink href="/shop" className={styles.navItem}>{t('navbarShop')}</LocalLink>
                            <LocalLink href="/contact" className={styles.navItem}>{t('navbarContact')}</LocalLink>
                            <LocalLink href="/cart" className={styles.navItem}><IoCartOutline size={22} /></LocalLink>
                        </div>
                        
                        <div className={styles.lastLink}>
                            <LocalLink href="/services" className={styles.navItem}><FaPaperPlane />{t('navbarServices')}</LocalLink>
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
                    <LocalLink href="/" className={styles.navItem}>{t('navbarHome')}</LocalLink>
                    <LocalLink href="/residential" className={styles.navItem}>{t('navbarResidential')}</LocalLink>
                    <LocalLink href="/bigFormat" className={styles.navItem}>{t('navbarBigFormat')}</LocalLink>
                    <LocalLink href="/shop" className={styles.navItem}>{t('navbarShop')}</LocalLink>
                    <LocalLink href="/contact" className={styles.navItem}>{t('navbarContact')}</LocalLink>
                    <LocalLink href="/cart" className={styles.navItem}><IoCartOutline size={22} /></LocalLink>
                    <LocalLink href="/services" className={styles.navItem}><FaPaperPlane />{t('navbarServices')}</LocalLink>
                    
                    <AuthNav locale={locale} />
                </div>
            </div>
        </header>
    );
}