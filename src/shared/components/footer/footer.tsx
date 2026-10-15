"use client";

// Utils
import Link from "next/link";
import styles from "./footer.module.css";
import Image from "next/image";
import { useLocale, useTranslations } from 'next-intl';

export default function Footer() {

    const t = useTranslations('footer');

    return (
        <div className={styles.footer}>
            <div className={styles.whitespace}></div>

            <div className={styles.details}>
                <Image src="/footer/Logo-footer.png" alt="Logo Pancarte Express" className={styles.logo} width={297} height={81} style={{ width: '100%', height: 'auto' }} />
                <p>
                    {t('availability')}
                    <br />
                    <br />
                    {t('privacyPolicy')}
                </p>
            </div>

            <div className={styles.contacts}>
                <h3>{t('contact')}</h3>
                
                <div className={styles.serviceResidentiel}>
                    <h5>{t('contactResidential')}</h5>
                    <a href="tel:4387223922">514-825-2709</a>
                    <br />
                    <a href="mailto:ferminlopez_@hotmail.com">info@pancarteexpress.com</a>
                </div>

                <div className={styles.serviceCommercial}>
                    <h5>{t('contactCommercial')}</h5>
                    <a href="tel:4387223922">514-833-2709</a>
                    <br />
                    <a href="mailto:ferminlopez_@hotmail.com">structureframd@gmail.com</a>
                </div>

                <div className={styles.serviceFacturation}>
                    <h5>{t('contactAccounting')}</h5>
                    <a href="tel:4387223922">450-543-0769</a>
                    <br />
                    <a href="mailto:ferminlopez_@hotmail.com">stephany@pancarteexpress.com</a>
                </div>
            </div>

            <div className={styles.partners}>
                <h3>{t('partners')}</h3>
                <Link href="https://superimpression.com/fr_CA/" target="_blank" rel="noopener noreferrer"><Image src="/footer/1-partenaire.png" alt="Logo Pancarte Express" className={styles.logo} width={229} height={65} /></Link>
                <Link href="https://www.toutpourlecourtier.com/" target="_blank" rel="noopener noreferrer"><Image src="/footer/2-partenaire.png" alt="Logo Pancarte Express" className={styles.logo} width={138} height={58} /></Link>
            </div>
            <div className={styles.whitespace}></div>
        </div>
    );
}