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
        <div className={styles.package} onClick={() => handleSelectPackage('none')}>
          <div className={styles.header}>
            <h2 className={styles.title}>Non-membre</h2>
            
            <label>0$</label>
            <br />
            <label>CAD/an</label>
          </div>

          <p className={styles.price}>
            <label>Tarifs preferentiel : 45$ / 50$</label>
          </p>

          <ul>
            <li style={{ color: '#0E4D9A', opacity: '0.5'}}>x Entreposage</li>
            <li style={{ color: '#0E4D9A', opacity: '0.5'}}>x Entretien et gestion de votre inventaire</li>
            <li style={{ color: '#0E4D9A', opacity: '0.5'}}>x Alertes quand votre inventaire est bas ou endommagé</li>
            <li style={{ color: '#0E4D9A', opacity: '0.5'}}>x Code promotionnel chez Tout Pour Le Courtier</li>
            <li style={{ color: '#0E4D9A', opacity: '0.5'}}>x Rabais sur vos commandes de matériel daffichage</li>
            <li style={{ color: '#0E4D9A'}}>✓ Facture sur commandes / crédit ou interac</li>
            <li style={{ color: '#0E4D9A'}}>✓ Installation en 24h</li>
          </ul>

          <button className={styles.selectPackageButton}>
            Sélectionner ce forfait
          </button>
        </div>
        
        <div className={styles.package} onClick={() => handleSelectPackage("group")}>
          <div className={styles.header}>
            
            <h2 className={styles.title}>Forfait équipe</h2>

            <label>119.99$</label>
            <br />
            <label>CAD/an</label>

          </div>

          <p className={styles.price}>
            <label>Tarifs preferentiel : 30$ / 35$</label>
          </p>

          <ul style={{ color: '#C8DAEC', textAlign: 'center', listStyle: 'none', padding: 0 }}>
            <li>✓ Entreposage illimité</li>
            <li>✓ Entretien et gestion de votre inventaire (boîtes à clés, visites libres,  drapeaux)</li>
            <li>✓ Alertes quand votre inventaire est bas ou endommagé</li>
            <li>✓ Code promotionnel chez Tout Pour Le Courtier</li>
            <li>✓ Rabais sur vos commandes de matériel daffichage</li>
            <li style={{color: 'yellow'}}>✓ Facture sur commande et mensuel</li>
            <li style={{color: 'yellow'}}>✓ Paiement par crédit ou interac</li>
            <li>✓ installation en 24h / service d urgence</li>
            <li>✓ Photo de confirmation</li>
            <li>✓ Idéal pour les équipes de courtiers</li>
          </ul>

          <button className={styles.selectPackageButton}>
            Sélectionner ce forfait
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
            <label>Tarifs preferentiel : 30$ / 35$</label>
          </p>

          <ul style={{ color: '#0E4D9A', textAlign: 'center', listStyle: 'none', padding: 0 }}>
            <li>✓ Entreposage jusqu à 10 pancartes</li>
            <li>✓ Entretien et gestion de votre inventaire (boîtes à clés, visites libres,  drapeaux)</li>
            <li>✓ Alertes quand votre inventaire est bas ou endommagé</li>
            <li>✓ Code promotionnel chez Tout Pour Le Courtier</li>
            <li>✓ Rabais sur vos commandes de matériel daffichage</li>
            <li style={{color: 'red'}}>✓ Facture mensuel / crédit ou interac (Facture sur commande)</li>
            <li>✓ Installation en 24h / service d urgence</li>
            <li>✓ Photo de confirmation</li>
            <li>✓ Idéal pour les courtiers seul</li>
          </ul>

          <button className={styles.selectPackageButton}>
            Sélectionner ce forfait"
          </button>
        </div>
      </div>
    </div>
  );
}