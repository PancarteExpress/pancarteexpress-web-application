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
      <div className={styles.packages}>
        <div className={styles.package}>
          <div className={styles.header}>
            <h2 className={styles.title}>Non-membre</h2>
            
            <label>0$</label>
            <br />
            <label>CAD/an</label>
          </div>

          <p className={styles.price}>
            <label>Tarifs preferentiel : 45$</label>
          </p>

          <ul>
            <li style={{ color: 'red', opacity: '0.5'}}>x Entreposage, entretien et gestion de votre inventaire</li>
            <li style={{ color: 'red', opacity: '0.5'}}>x Alertes quand votre inventaire est bas ou endommagé</li>
            <li style={{ color: 'red', opacity: '0.5'}}>x Code promotionnel chez Tout Pour Le Courtier</li>
            <li style={{ color: 'red', opacity: '0.5'}}>x Rabais sur vos commandes de matériel d'affichage</li>
            <li style={{ color: 'red'}}>✓ Idéal pour les équipes de courtiers</li>
          </ul>

          <button className={styles.selectPackageButton} onClick={() => handleSelectPackage('none')}>
            Sélectionner ce forfait
          </button>
        </div>
        
        <div className={styles.package}>
          <div className={styles.header}>
            
            <h2 className={styles.title}>Forfait équipe</h2>

            <label>119.99$</label>
            <br />
            <label>CAD/an</label>

          </div>

          <p className={styles.price}>
            <label>Tarifs preferentiel : 30$</label>
          </p>

          <ul>
            <li style={{ color: 'red'}}>✓ Entreposage, entretien et gestion de votre inventaire</li>
            <li style={{ color: 'red'}}>✓ Alertes quand votre inventaire est bas ou endommagé</li>
            <li style={{ color: 'red'}}>✓ Code promotionnel chez Tout Pour Le Courtier</li>
            <li style={{ color: 'red'}}>✓ Rabais sur vos commandes de matériel d'affichage</li>
            <li style={{ color: 'red'}}>✓ Idéal pour les équipes de courtiers</li>
          </ul>

          <button className={styles.selectPackageButton} onClick={() => handleSelectPackage("group")}>
            {packageChoice === "group" ? "Forfait sélectionné" : "Sélectionner ce forfait"}
          </button>
        </div>  

        <div className={styles.package} onClick={() => handleSelectPackage("solo")}>
          <div className={styles.header}>
            <h2 className={styles.title}>Forfait individuel</h2>
            
            <label>89.99$</label>
            <br />
            <label>CAD/an</label>
          </div>
          
          <p className={styles.price}>
            <label>Tarifs preferentiel : 30$</label>
          </p>

          <ul>
            <li style={{ color: 'red'}}>✓ Entreposage, entretien et gestion de votre inventaire</li>
            <li style={{ color: 'red'}}>✓ Alertes quand votre inventaire est bas ou endommagé</li>
            <li style={{ color: 'red'}}>✓ Code promotionnel chez Tout Pour Le Courtier</li>
            <li style={{ color: 'red'}}>✓ Rabais sur vos commandes de matériel d'affichage</li>
            <li style={{ color: 'red'}}>✓ Idéal pour les équipes de courtiers</li>
          </ul>

          <button className={styles.selectPackageButton} onClick={() => handleSelectPackage("solo")}>
            {packageChoice === "solo" ? "Forfait sélectionné" : "Sélectionner ce forfait"}
          </button>
        </div>
      </div>
    </div>
  );
}