"use client";

// Utils
import styles from "./BigFormatView.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Translation
import { useLocale, useTranslations } from 'next-intl';

type Section = {
  title: string;
  content: string;
};

type Card = {
  title: string;
  description1: string;
  description2?: string;
  sections: Section[];
  infos?: string;
};

type InstallationType = Card & {
  image: string;
  logo: string;
};

const INFOS_ACHAT_LOCATION =
  "Disponible à l'achat ou à la location. Se référer à la section boutique pour l'achat. La location inclut l'installation de la structure, le déplacement et la récupération.";

const cards: Card[] = [
  {
    title: "Structure MINI RIGIDE",
    description1: "Une structure rigide personnalisée selon les dimensions de votre affichage.",
    description2:
      "Parfait pour l'événementiel, les projets temporaires ou l'affichage permanent : Affiche publicitaire, Signalisation extérieure, Pancarte de courtier immobilier, Vente ou promotion, Affiches « Nous embauchons », Autres",
    sections: [
      { title: "Affichage Rigide :", content: "Pancarte coroplast, Panneau alupanel, Enseigne rigide." },
      { title: "Différentes configurations :", content: "1 façade, 2 façades « recto-verso »" },
      { title: "Dimension suggéré :", content: "3×5 | 4×4 | 4×6 | max 6×6 |" },
    ],
    infos: INFOS_ACHAT_LOCATION,
  },
  {
    title: "Structure STANDARD RIGIDE",
    description1: "Une structure rigide personnalisée selon les dimensions de votre affichage.",
    description2:
      "Parfait pour l'événementiel, les projets temporaires ou permanents : Affiche publicitaire, Affichage commanditaire, Pancarte de courtier immobilier, Vente saisonnière, Recherche de personnel, Autres",
    sections: [
      { title: "Affichage Rigide :", content: "Pancarte coroplast, Panneau alupanel, Enseigne rigide." },
      { title: "Différentes configurations :", content: "1 façade, 2 façades « recto-verso »" },
      { title: "Dimension suggéré :", content: "4×8 | 4×6 | 6×6 | max 8×8|" },
    ],
    infos: INFOS_ACHAT_LOCATION,
  },
  {
    title: "Structure LARGE RIGIDE",
    description1: "Une structure rigide personnalisée selon les dimensions de votre affichage.",
    description2:
      "Parfait pour événement grand format extérieur : Affiche publicitaire, Affichage pour festival, Affiche d'exposant, Vente ou promotion, Affiches « Nous embauchons », Affichage sur un toit, Autres",
    sections: [
      { title: "Affichage Rigide :", content: "Pancarte coroplast, Panneau alupanel, Sintra." },
      { title: "Différentes configurations :", content: "1 façade, 2 façades « recto-verso »" },
      { title: "Dimension suggéré :", content: "5X10 | max 8X10 |" },
    ],
    infos: INFOS_ACHAT_LOCATION,
  },
  {
    title: "Structure MINI FLEXIBLE",
    description1: "Une structure flexible personnalisée selon les dimensions de votre affichage.",
    description2:
      "Parfait pour l'événementiel, les projets temporaires ou permanents : Affiche publicitaire, Signalisation extérieure, Pancarte de courtier immobilier, Vente ou promotion, Affiches « Nous embauchons », Autres",
    sections: [
      { title: "Affichage Flexible :", content: "Bannière opaque (vinylle), Bannière perforé (mesh)." },
      { title: "Différentes configurations :", content: "1 façade, 2 façades « recto-verso »" },
      { title: "Dimension suggéré :", content: "4×4 | 4×6 | max 6×6 |" },
    ],
    infos: INFOS_ACHAT_LOCATION,
  },
  {
    title: "Structure STANDARD FLEXIBLE",
    description1: "Une structure personnalisée, de type flexible, selon les dimensions de votre affichage.",
    description2:
      "Parfait pour l'événementiel, les projets temporaires et permanents : Affiche publicitaire, Affichage commanditaire, Pancarte de courtier immobilier, Vente saisonnière, Recherche de personnel, Autres",
    sections: [
      { title: "Affichage Flexible :", content: "Banniere Opaque avec aération, Banniere perforée (mesh)." },
      { title: "Différentes configurations :", content: "1 façade, 2 façades « recto-verso »" },
      { title: "Dimension suggéré :", content: "4×6 | 6×6 | 4×8 | max 7×8 |" },
    ],
    infos: INFOS_ACHAT_LOCATION,
  },
  {
    title: "Structure LARGE FLEX",
    description1:
      "Une structure flexible personnalisée selon les dimensions de votre affichage. Ancrée solidement dans le sol par des pieux en métal pour une solidité et une durabilité à toute épreuve. Résiste parfaitement aux intempéries.",
    description2:
      "Parfait pour événement grand format extérieur : Affiche publicitaire, Affichage pour festival, Affiche d'exposant, Vente ou promotion, Affiches « Nous embauchons », Affichage sur un toit, Autres",
    sections: [
      { title: "Affichage Flexible :", content: "Banniere Opaque avec aération, Banniere perforée (mesh)." },
      { title: "Différentes configurations :", content: "1 façade" },
      { title: "Dimension suggéré :", content: "5×10 pieds | À | max 7×12 pieds |" },
    ],
    infos: INFOS_ACHAT_LOCATION,
  },
  {
    title: "Structure MINI EN V",
    description1: "Une structure personnalisée selon les dimensions de votre affichage, de type rigide uniquement.",
    description2:
      "Parfait pour l'événementiel, les projets temporaires et permanents : Affiche publicitaire, Affichage commanditaire, Pancarte de courtier immobilier, Vente saisonnière, Recherche de personnel, Autres",
    sections: [
      { title: "Affichage Rigide :", content: "Panneaux coroplast, Pancarte alupanel, Enseigne rigide." },
      { title: "Différentes configurations :", content: "2 façades en V" },
      { title: "Dimension suggéré (HxL) :", content: "3×5| 4×4 | 4×6 | max 6×6 |" },
    ],
    infos: INFOS_ACHAT_LOCATION,
  },
  {
    title: "Structure EN BOIS",
    description1:
      "Construction d'une structure en bois renforcée et personnalisée selon les dimensions de votre panneau. Ancrée solidement dans le sol par des pieux en métal pour une solidité et une durabilité garanties.",
    description2:
      "Parfait pour de l'affichage commercial temporaire, qu'il s'agisse d'un terrain, d'un commerce ou d'un nouveau développement, etc.",
    sections: [
      { title: "Matériau utilisé :", content: "Bois de construction 4pc x 4pc." },
      { title: "Couleur disponible :", content: "Peinte (couleur au choix) ou non-peinte" },
      {
        title: "Dimensions pancartes :",
        content: "4pi x 4pi | 3pi x 5pi | 3pi x 6pi | 4pi x 8pi | 8pi x 8pi | 4pi x 16pi | 1 façade ou 2 façades en V",
      },
    ],
    infos: INFOS_ACHAT_LOCATION,
  },
  {
    title: "Structure Standard en V",
    description1:
      "Une structure personnalisée selon les dimensions de votre affichage, ancrée solidement dans le sol par des pieux en métal. Offre une solidité et une durabilité à toute épreuve, résistant parfaitement aux intempéries.",
    description2:
      "Parfait pour événement grand format extérieur : Affiche publicitaire, Affichage pour festival, Affiche d'exposant, Vente ou promotion, Affiches « Nous embauchons », Affichage de courtiers immobiliers, Autres",
    sections: [
      { title: "Affichage Rigide :", content: "Pancartes coroplast | Panneaux alupanel | Enseigne rigide" },
      { title: "Différentes configurations :", content: "2 façades en V" },
      { title: "Dimension suggéré :", content: "4×8 pieds | À | max 8×8 pieds |" },
    ],
    infos: INFOS_ACHAT_LOCATION,
  },
  {
    title: "Structure CHEVALET EN BOIS",
    description1:
      "Construction d'une structure en bois de style Chevalet, idéale pour de l'affichage recto-verso en bord de route.",
    sections: [
      { title: "Dimensions pancartes :", content: "4pi x 4pi à 4pi x 8pi | 1 façade ou 2 façades recto verso" },
    ],
  },
  {
    title: "Service d'installation avec Nacelle",
    description1:
      "Installation en hauteur sur bâtiment extérieur. L'installation peut être effectuée à l'aide d'équipement professionnel jusqu'à une hauteur maximale d'environ 35 pieds (3e étage environ).",
    sections: [
      {
        title: "Type d'affichage :",
        content: "Pancarte | Affiche | Panneau | Banniere | Vinylle | Autocollant vitrine | Autres",
      },
    ],
  },
  {
    title: "Installation commerciale au mur à l'échelle",
    description1:
      "La pancarte est vissée dans le mur, ou dans le joint de brique selon l'état de ce dernier, pour garantir sa durabilité. L'installation peut être effectuée à l'aide d'une échelle jusqu'à une hauteur maximale d'environ 20 pieds (2e étage environ).",
    sections: [{ title: "Dimensions pancartes :", content: "Jusqu'à 4pi x 8pi" }],
  },
];

const installationTypes: InstallationType[] = cards.map((card, i) => ({
  image: `/commercial/thumbnails/image${i + 1}.jpg`,
  logo: `/commercial/logos/logo${(i % 4) + 1}.png`,
  ...card,
}));

export default function BigFormat() {

    // Control the language
    //const locale = useLocale();
    //const t = useTranslations('commercial');
    //const cards = t.raw('cards');

    // Redirection
    const router = useRouter();

    return (
        <div className={styles.mainContainer}>
            <div className={styles.hero}>
                <label>Services Grand Format</label>
            </div>

            <div className={styles.redirections}>
                <p>
                    Chez Pancarte Express, nous sommes experts dans l installation d affichages grand format. Qu il s agisse de panneaux, enseignes, bannières ou pancartes,
                    <br />
                    grand format ou résidentiel, nous vous offrons des solutions pour vous afficher avec la meilleure visibilité possible. Nous offrons même un tout nouveau
                    <br />
                    service de location de structures en aluminium, parfait pour de l affichage temporaire. Contactez-nous pour plus d informations.
                </p>

                <div className={styles.buttons}>
                    <button onClick={() => router.push(`/shop`)}>Achetez du materiel d affichage commercial</button>
                    <button onClick={() => router.push(`/services`)}>Effectuez une demande en ligne</button>
                </div>
            </div>

            <div className={styles.grid}>
                {installationTypes.map((type) => (
                    <div key={type.title} className={styles.card}>

                        <div className={styles.image}>
                            <Image src={type.image} alt="test" fill style={{ objectFit: 'cover' }} sizes="(max-width: 500px) 100vw, (max-width: 1500px) 50vw, 33vw" />
                        </div>

                        <div className={styles.content}>
                            <div className={styles.logoWrapper}>
                                <div className={styles.logoInner}>
                                    <Image src={type.logo} alt="test" fill style={{ objectFit: 'contain' }} sizes="42px"/>
                                </div>
                            </div>

                            <div className={styles.description}>
                                <h3>{type.title}</h3>
                                <div className={styles.text}>
                                    <p>
                                        {type.description1}
                                        <br />
                                        <br />
                                        {type.description2}
                                    </p>
                                </div>
                            </div>

                            {type.sections && type.sections.map((section) => (
                            <div key={type.title} className={styles.text}>
                                <h4><strong>{section.title}</strong></h4>
                                <p>{section.content}</p>
                            </div>
                            ))}

                            <div className={styles.infos}>
                            <p>
                                {type.infos}
                            </p>
                            </div>
                        </div>
                    </div>    
                ))}        
            </div>
        </div>
    );
}