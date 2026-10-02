// src/features/auth/components/RegisterPackages.tsx
'use client';

import { useRouter } from 'next/navigation';
import styles from './RegisterPackages.module.css';

interface RegisterPackagesProps {
  locale: string;
  packageChoice: "group" | "solo" | 'none';
  setPackageChoice: (value: "group" | "solo" | 'none') => void;
  setStep: (step: "packages" | "register") => void;
}

export default function RegisterPackages({ locale, packageChoice, setPackageChoice, setStep }: RegisterPackagesProps) {
  const router = useRouter();
  
  const handleSelectPackage = (packageType: "solo" | "group" | 'none' ) => {
    setPackageChoice(packageType);
   
    if (packageType === 'none') {
      router.push(`/${locale}/services`);
    } else {
      setStep("register");
    }
  };

  return (
    <div className={styles.mainContainer}>
      <label className={styles.title}>Choisissez votre forfait !</label>
      <div className={styles.packages}>
        <div className={styles.package}>
          <div className={styles.header}>
            <h2 className={styles.title}>Non-membre</h2>
            <p className={styles.price}>
              <label>0$</label>
              <br />
              <label>CAD/an</label>
            </p>
            <p className={styles.price}>
              <label>Tarifs preferentiel : 45$</label>
            </p>
          </div>

          <div className={styles.aboutPackage}>
            <p className={styles.aboutPackageText} style={{ color: 'red'}}>
              Vous pouvez commander des pancartes sans être membre, mais vous ne bénéficierez pas de nos tarifs préférentiels et de nos services exclusifs.
            </p>
          </div>

          <button className={styles.selectPackageButton} onClick={() => handleSelectPackage('none')}>
            Sélectionner ce forfait
          </button>
        </div>
        
        <div className={styles.package}>
          <div className={styles.header}>
            <h2 className={styles.title}>Forfait équipe</h2>
            <p className={styles.price}>
              <label>119.99$</label>
              <br />
              <label>CAD/an</label>
            </p>
          </div>

          <p className={styles.price}>
            <label>Tarifs preferentiel : 30$</label>
          </p>

          <p className={styles.aboutPackageText} style={{ color: 'red'}}>
            Inclus Lentreposage, lentretien et la gestion de votre inventaire 
            <br />
            <br />
            Vous recevez une alerte quand votre inventaire est bas ou que les pancartes sont endommagées, ainsi quun code promotionnel chez notre partenaire 
            <br />
            <br />
            Tout Pour Le Courtier pour obtenir des rabais sur vos commandes de matériel daffichage.
          </p>

          <button className={styles.selectPackageButton} onClick={() => handleSelectPackage("group")}>
            {packageChoice === "group" ? "Forfait sélectionné" : "Sélectionner ce forfait"}
          </button>
        </div>  

        <div className={styles.package}>
          <div className={styles.header}>
            <h2 className={styles.title}>Forfait individuel</h2>
            <p className={styles.price}>
              <label>89.99$</label>
              <br />
              <label>CAD/an</label>
            </p>
            <p className={styles.price}>
              <label>Tarifs preferentiel : 30$</label>
            </p>

            <p className={styles.aboutPackageText} style={{ color: 'red'}}>
              Inclus Lentreposage, lentretien et la gestion de votre inventaire 
              <br />
              <br />
              Vous recevez une alerte quand votre inventaire est bas ou que les pancartes sont endommagées, ainsi quun code promotionnel chez notre partenaire 
              <br />
              <br />
              Tout Pour Le Courtier pour obtenir des rabais sur vos commandes de matériel daffichage.
            </p>

            <button className={styles.selectPackageButton} onClick={() => handleSelectPackage("solo")}>
              {packageChoice === "solo" ? "Forfait sélectionné" : "Sélectionner ce forfait"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}