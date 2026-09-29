
import styles from './page.module.css';

import { RegisterForm } from "@/features/auth/components/registerForm/RegisterForm";
import { GoogleLoginButton } from "@/features/auth/components/googleLoginButton/GoogleLoginButton";
import Link from "next/link";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  console.log("RegisterPage locale:", locale);

  return (
    <div className={styles.mainContainer}>
      <div className={styles.container}>
        <div className={styles.about}>
          <h2 className={styles.aboutTitle}>
            Devenir membre chez PANCARTE EXPRESS cest bénéficier de nombreux avantages
          </h2>

          <div className={styles.ctaSolo}>
            <span className={styles.ctaText}>Pour un courtier seul</span>
            <span className={styles.ctaPrice}>89.99$ par an</span>
          </div>

          <div className={styles.ctaGroup}>
            <span className={styles.ctaText}>Pour une équipe de courtier</span>
            <span className={styles.ctaPrice}>119.99$ par an</span>
          </div>

          <div className={styles.aboutBlock}>
            <span className={styles.blockLabel}>Gestion dinventaire</span>
            <p className={styles.blockText}>
              Lentreposage, lentretien et la gestion de votre inventaire Vous recevez une alerte quand votre inventaire est bas ou que les pancartes sont endommagées, ainsi quun code promotionnel chez notre partenaire Tout Pour Le Courtier pour obtenir des rabais sur vos commandes de matériel daffichage.
            </p>
          </div>

          <div className={styles.aboutBlock}>
            <span className={styles.blockLabel}>Tarifs préférentiels</span>
            <div className={styles.priceRows}>
              <div className={styles.priceRow}>
                <span className={styles.priceLabel}>Tarif non-membre</span>
                <span className={styles.priceValue}>45 $</span>
              </div>
              <div className={styles.priceRow}>
                <span className={styles.priceLabel}>Tarif membre</span>
                <span className={`${styles.priceValue} ${styles.priceHighlight}`}>30 $</span>
              </div>
            </div>
          </div>

          <div className={styles.aboutBlock}>
            <span className={styles.blockLabel}>Emplacement</span>
            <p className={styles.blockText}>
              En plus de ce tarif, vous bénéficiez dun territoire géographique qui vous est propre et dans lequel les prix sont encore plus avantageux ! (contactez nous pour plus dinformation)
            </p>
          </div>

          <div className={styles.aboutBlock}>
            <span className={styles.blockLabel}>Service durgence</span>
            <p className={styles.blockText}>
              Un service durgence pour obtenir des installations la journée même
              <br />
              <em>certaines conditions sappliquent</em>
            </p>
          </div>

          <div className={styles.aboutBlock}>
            <span className={styles.blockLabel}>Et plus encore !</span>
            <p className={styles.blockText}>
              Une liste de correction à un tarif avantageux peut être demandé deux fois par année pour sassurer que toutes vos installations soient droites et solides
              <br />
              <br />
              Des photos de confirmations sont envoyées pour chaque installation, ainsi quun historique des commandes et une facture mensuelle regroupant toutes les demandes
            </p>
          </div>
        </div>

        <div className={styles.credentials}>
          <h1 className="text-3xl font-bold mb-8 text-center">
            Créer un compte
          </h1>
          
          <GoogleLoginButton locale={locale} />
          
          <div className="my-4 flex items-center">
            <div className="flex-1 border-t"></div>
            <span className="px-2 text-sm text-gray-500">ou</span>
            <div className="flex-1 border-t"></div>
          </div>
          
          <RegisterForm locale={locale} />
          
          <p className="text-center text-sm mt-4">
            Déjà inscrit?{" "}
            <Link href={`/${locale}/login`} className="text-blue-600 hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}