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
import { AuthNav } from '@/features/auth/components/AuthNav';
//import { useAuth } from '@/app/context/AuthContext';
//import { useSession } from '@/lib/auth/useSession';


export default function Header() {

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
                        <Link href={""}>Devenir membre</Link>
                        <AuthNav />
                    </div>
                </div>
            </div>

            <div className={styles.bottomHeader}>
                <div className={styles.container}>
                    <Image src="/header/Logo_PancarteExpress.svg" className={styles.logo} loading="eager" alt="Logo Pancarte Express" width={300} height={100} />

                    <div className={styles.infos}>
                        <div className={styles.schedule}>
                            <div>
                                <h1>Service rapide 24h</h1>
                                <h5>Du lundi au vendredi</h5>
                            </div>
                            <Image src="/header/icon-horaire.png" alt="icon horaire" className={styles.icon} width={40} height={40} />
                        </div>
                        <div className={styles.area}>
                            <div>
                                <h1>Service offert</h1>
                                <h5>Dans la grande zone métropolitaine de Montréal</h5>
                            </div>
                            <Image src="/header/icon-maps.png" alt="icon maps" className={styles.icon} width={30} height={35} />
                        </div>
                    </div>

                    <div className={styles.navbar}>
                        <LocalLink href="/" className={styles.navItem}>Accueil</LocalLink>
                        <LocalLink href="/residential" className={styles.navItem}>Résidentiel</LocalLink>
                        <LocalLink href="/bigFormat" className={styles.navItem}>Grand format</LocalLink>
                        <LocalLink href="/shop" className={styles.navItem}>Boutique</LocalLink>
                        <LocalLink href="/contact" className={styles.navItem}>Contact</LocalLink>
                        <LocalLink href="/cart" className={styles.navItem}><IoCartOutline size={22} /></LocalLink>
                        <LocalLink href="/services" className={styles.navItem}><FaPaperPlane />Demande en ligne</LocalLink>
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
                    <LocalLink href="/" className={styles.navItem}>Accueil</LocalLink>
                    <LocalLink href="/residential" className={styles.navItem}>Résidentiel</LocalLink>
                    <LocalLink href="/bigFormat" className={styles.navItem}>Grand format</LocalLink>
                    <LocalLink href="/shop" className={styles.navItem}>Boutique</LocalLink>
                    <LocalLink href="/contact" className={styles.navItem}>Contact</LocalLink>
                    <LocalLink href="/cart" className={styles.navItem}><IoCartOutline size={22} /></LocalLink>
                    <LocalLink href="/services" className={styles.navItem}><FaPaperPlane />Demande en ligne</LocalLink>
                    
                    <Link href={``}>devenir membre</Link>
                    {/*session.authenticated && 
                    <button onClick={handleLogout}>
                        Déconnexion
                    </button>
                    */}
                    <Link href={``}>Mon compte</Link> 
                </div>
            </div>
        </header>
    );
}