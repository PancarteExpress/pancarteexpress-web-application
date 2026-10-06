"use client";

// Utils
import styles from "./ResidentialView.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Translation
import { useLocale, useTranslations } from 'next-intl';

type InstallationType = {
  image: string;
  logo: string;
  title: string;
  description: string;
};

const cards = [
  {
    title: "Installation au sol",
    description:
      "La pancarte est ancrée dans le sol par un ancrage en métal pour garantir sa solidité et sa durabilité.",
  },
  {
    title: "Installation d'enseigne illuminée",
    description:
      "L'enseigne illuminée est ancrée dans le sol par un ancrage en métal pour garantir sa solidité et sa durabilité. Un câble d'alimentation est ensuite branché sur une prise électrique extérieure, permettant à l'enseigne de s'illuminer et d'être visible de jour comme de nuit.",
  },
  {
    title: "Installation sur rampe",
    description:
      "La pancarte est fixée directement à la rampe au moyen du poteau et de colliers de serrage en métal pour garantir sa solidité.",
  },
  {
    title: "Installation au balcon",
    description:
      "La pancarte est attachée directement à la balustrade, de face ou de profil (en V), à l'aide de colliers de serrage en plastique pour garantir à la fois la visibilité et la solidité. L'installation peut être effectuée à l'aide d'une échelle jusqu'à une hauteur maximale d'environ 20 pieds (2e étage environ) ou sur rendez-vous avec l'occupant.",
  },
  {
    title: "Installation résidentielle au mur",
    description:
      "La pancarte est vissée dans le mur, ou dans le joint de brique selon l'état de ce dernier, pour garantir sa durabilité. L'installation peut être effectuée à l'aide d'une échelle jusqu'à une hauteur maximale d'environ 20 pieds (2e étage environ).",
  },
  {
    title: "Installation ou retrait de boîtes à clés (cadenas)",
    description:
      "Installation d'un cadenas à code avec compartiment de rangement pour clés, généralement fixé sur la porte avant ou selon vos directives.",
  },
  {
    title: "Installation ou retrait d'ajout",
    description:
      "Installation d'un ajout de votre choix sur une pancarte pour ajouter de l'information (exemples : « vendu », « à louer », ajout personnalisé à votre image, etc.). Location d'ajout également disponible.",
  },
  {
    title: "Installation de flèches de visite libre",
    description:
      "Installation de flèches de visite libre (jusqu'à 5) pointant vers la propriété en vedette, placées à des coins de rues passants ou à des emplacements précis définis par vos soins dans le formulaire, avec retrait automatique en début de semaine suivante.",
  },
  {
    title: "Installation de drapeaux",
    description:
      "Installation de drapeaux devant la propriété pour annoncer une visite libre ou d'autres informations.",
  },
];

const installationTypes: InstallationType[] = cards.map((card, i) => ({
  image: `/residential/thumbnails/image${i + 1}.jpg`,
  logo: `/residential/logos/logo${i + 1}.png`,
  ...card,
}));

interface Props {
  locale: 'fr' | 'en';
}

export default function Residential() {
    
    // Control the language
    const locale = useLocale();
    //const t = useTranslations('residential');
    //const cards = t.raw('cards');

    // Redirection
    const router = useRouter();

    return (
        <div className={styles.mainContainer}>
            <div className={styles.hero}>
                <label>Services résidentiels</label>
            </div>

            <div className={styles.redirections}>
                <p>
                    Pour un affichage rapide de votre annonce, utilisez notre service d installation résidentiel.
                    <br />
                    Installation ou récupération de pancartes, d ajouts, de boîtes à clé ou de tout autre accessoire.
                </p>

                <div className={styles.buttons}>
                    <button onClick={() => router.push(`/shop`)}>Achetez du materiel d affichage residentiel</button>
                    <button onClick={() => router.push(`/services`)}>Effectuez une demande en ligne</button>
                </div>
            </div>

            <div className={styles.grid}>
                {installationTypes.map((type) => (
                    <div key={type.title} className={styles.card}>

                        <div className={styles.image}>
                            <Image src={type.image} alt="test" fill style={{ objectFit: 'cover' }} sizes="(max-width: 500px) 100vw, (max-width: 1500px) 50vw, 33vw"/>
                        </div>

                        <div className={styles.content}>
                            <div className={styles.logoWrapper}>
                                <div className={styles.logoInner}>
                                    <Image src={type.logo} alt="test" fill style={{ objectFit: 'contain' }} sizes="42px" />
                                </div>
                            </div>

                            <div className={styles.description}>
                                <h3>{type.title}</h3>
                                <div className={styles.text}>
                                    <p>{type.description}</p>
                                </div>
                            </div>
                        </div>
                    </div>    
                ))}        
            </div>
        </div>
    );
}