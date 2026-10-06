"use client";

// Utils
import Link from "next/link";
import styles from "./HomeView.module.css";
import Image from "next/image";
import { useState } from "react";

// React icons
import { FaPaperPlane } from "react-icons/fa";
import { IoIosCheckmark } from "react-icons/io";
import { IoIosArrowDropleft } from "react-icons/io";
import { IoIosArrowDropright } from "react-icons/io";

// Framer motion
import { motion } from "framer-motion";

// Translater
import { useTranslations } from 'next-intl';


// data/testimonials.ts
export type Testimonial = {
  name: string;
  texte: string;
};

export const testimonials: Testimonial[] = [
  {
    name: "Chantal Provost, Proprio Direct",
    texte:
      "Super service, professionnel et rapide. J'apprécie énormément de déléguer cette tâche à des gens de confiance et professionnels. Merci de me faciliter ma vie professionnelle. Les délais sont respectés à chaque fois, ce qui est essentiel dans mon domaine d'activité. L'équipe est non seulement compétente, mais aussi très aimable et à l'écoute de mes besoins spécifiques. Je recommande vivement leurs services à tous ceux qui cherchent un partenaire de confiance pour la gestion de leurs pancartes, ce qui peut être très difficile dans la saison d'hiver. C'est rassurant de savoir que je peux compter sur un service aussi fiable et efficace même dans les conditions les plus exigeantes.",
  },
  {
    name: "Stéphanie Gauthier, REMAX",
    texte:
      "Je tiens à remercier chaleureusement Pancarte Express pour leur excellent travail. Leur engagement envers la satisfaction du client est indéniable, et je recommande vivement leurs services d'installation à tout courtier immobilier cherchant une équipe fiable et compétente. Merci encore pour cette expérience positive !",
  },
  {
    name: "Yzabel Brisson, REMAX",
    texte:
      "Pancarte Express sans équivoque a changé ma vie! L'été, l'hiver, rain or shine en un temps record... Même juché dans une échelle ils donnent un service que j'estime incomparable et incontournable.",
  },
  {
    name: "Marc-André Francoeur, REMAX",
    texte:
      "Simplement la référence ! Ils me permettent de toujours savoir que mes affiches sont installées rapidement et correctement sans avoir à me soucier de l'entreposage et de l'entretien de mes équipements. Bravo !!",
  },
  {
    name: "Jaclyn Rabin, Keller Williams Realty",
    texte:
      "En tant que courtier immobilier occupé, ce service est extrêmement utile!! Des tarifs justes et des délais rapides. Très fiable. Je le recommande vivement!",
  },
  {
    name: "James He, REMAX",
    texte:
      "Nous travaillons avec Pancarte Express depuis environ 3 ans et nous sommes très satisfaits de tous les services qu'ils nous offrent : installation professionnelle, temps de réponse rapide, gestion d'entreprise mature et expérimentée. Je le recommande à tous les courtiers!",
  },
];

interface Props {
  locale: 'fr' | 'en';
}

export default function Home() {

  //const t = useTranslations('home');
  //const testimonials = t.raw('testimonials');

  const [leftTestimonial, setLeftTestimonial] = useState(0);
  const [rightTestimonial, setRightTestimonial] = useState(1);
  
  const changeRight = () => {
    if (rightTestimonial == testimonials.length-1) {
      setLeftTestimonial(rightTestimonial);
      setRightTestimonial(0);
    } else {
      setLeftTestimonial(rightTestimonial);
      setRightTestimonial(rightTestimonial+1);
    }
  }
  
  const changeLeft = () => {
      if (leftTestimonial == 0) {
          setRightTestimonial(leftTestimonial);
          setLeftTestimonial(testimonials.length - 1);
      } else {
          setRightTestimonial(leftTestimonial);
          setLeftTestimonial(leftTestimonial - 1);
      }
  }

  return ( 
    <div className={styles.mainContainer}>
      <div className={styles.homeHero}>
        <div className={styles.leftContent}>
          <div className={styles.heroText}>
            <motion.h3 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>Installation de</motion.h3>
            <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>Pancartes</motion.h1>
            <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>Résidentielles et</motion.h2>
            <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>Commerciales</motion.h2>
            
            <br />
            <br />
            
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.8 }}>
              <Link href="/services" className={styles.demandeButton}>
                <FaPaperPlane className={styles.demandeButtonLogo}/> Effectuez une demande en ligne
              </Link>
            </motion.div>
          </div>
        </div>

        <div className={styles.rightContent}>
          <Image src="/home/pancarte-slider-v2.png" alt="Hero Pancarte" className={styles.logoPancarte} width={800} height={800} priority sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"/>
        </div>
      </div>

      <div className={styles.membershipContainer}>
        <div className={styles.advantages}>
          <div className={styles.logoContainer}>
            <Image src="/home/membership.jpg" alt="Hero Pancarte" className={styles.memberLogo} width={287} height={197} priority/>
          </div>

          <div className={styles.advantagesList}>
            <h1>Profitez de nombreux avantages en devenant membre !</h1>
            
            <div className={styles.listItem}>
              <ul>
                <li><IoIosCheckmark className={styles.checkIcon} />Entreposage et entretien de votre affichage (pancartes, poteaux, ancrages, etc.)</li>
                <li><IoIosCheckmark className={styles.checkIcon} />Rabais sur les installations résidentielles et commerciales</li>
              </ul>
              <ul>
                <li><IoIosCheckmark className={styles.checkIcon} />Zone personnalisée avec tarifs préférentiels</li>
                <li><IoIosCheckmark className={styles.checkIcon} />Installation d urgence en moins de 24h</li>
                <li><IoIosCheckmark className={styles.checkIcon} />Et bien plus encore !</li>
              </ul>
            </div>
          </div>

          <div className={styles.buttonContainer}>
            <Link href="/register" className={styles.becomeMemberButton}>
              Devenez membre
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.aboutcontainer}>
        
        <div className={styles.about}>
          <h1><span>Pancarte Express</span> vous offre un service complet d’installation de pancartes</h1>
          <p>
            En effet, nous sommes spécialisés dans l installation, l entreposage et la gestion du matériel d affichage des courtiers immobiliers depuis près de 15 ans. Nous offrons un service fiable et rapide dans la grande région métropolitaine de Montréal et ses alentours à des clients qui cherchent à optimiser leur temps et qui recherchent une prestation de qualité. Que vous soyez courtier immobilier, promoteur, organisateur d événements ou autre professionnel, nous avons des solutions pour simplifier la gestion de votre affichage et vous permettre de vous concentrer sur ce qui compte vraiment : la gestion de vos projets.
            <br/>
            <br/>
            En ouvrant un compte chez Pancarte Express, vous aurez accès à tous nos services d installation, de stockage et de gestion pour vos pancartes, panneaux, enseignes, boîtes à clé, drapeaux, poteaux, ancrages, grandes structures commerciales, affichages temporaires, installations au balcon et au mur, ainsi que bien d autres solutions. Bénéficiez également d offres personnalisées pour votre secteur et d options d installation flexibles adaptées à vos besoins. Nous sommes fiers d avoir gagné la confiance de plus de 300 clients et nous nous engageons à maintenir cette relation grâce à notre professionnalisme et notre attachement à la qualité.
          </p>
          <div className={styles.contactContainer}>
            <Link href="/contact" className={styles.contactButton}>
              <FaPaperPlane className={styles.contactButtonLogo}/> Contactez-nous pour en apprendre davantage !
            </Link>
          </div>
        </div>

        <div className={styles.examples}>
          <div className={styles.exampleItem}>
            <div className={styles.logo}>
              <Image src="/home/pancarte-rampe.png" alt="Hero Pancarte" className={styles.logoPancarte} width={94} height={94} priority/>
            </div>
            <div className={styles.texte}>Pancartes et enseignes illuminées<br /><span className={styles.bold}>sur sol ou rampe</span></div>
          </div>
           <div className={styles.exampleItem}>
            <div className={styles.logo}>
              <Image src="/home/pancarte-structure.png" alt="Hero Pancarte" className={styles.logoPancarte} width={94} height={94} priority/>
            </div>
            <div className={styles.texte}>Pancarte sur structure<br /><span className={styles.bold}>en bois ou aluminium</span></div>
          </div>
           <div className={styles.exampleItem}>
            <div className={styles.logo}>
              <Image src="/home/pancarte-mur.png" alt="Hero Pancarte" className={styles.logoPancarte} width={94} height={94} priority/>
            </div>
            <div className={styles.texte}>Pancarte  <br /><span className={styles.bold}>sur mur ou balcon</span></div>
          </div>
        </div>
      </div>

      <div className={styles.testimonialsContainer}>
        <div className={styles.testimonialsTitle}>
          <div className={styles.whiteSpace}></div>
          <h1 className={styles.title}>Témoignages de clients</h1>
          <div className={styles.arrows}>
            <button type="button" onClick={changeLeft}>
              <IoIosArrowDropleft className={styles.left}/>
            </button>

            <button type="button" onClick={changeRight}>
              <IoIosArrowDropright  className={styles.right}/>
            </button>
          </div>
        </div>
        
        <div className={styles.cardsContainer}>
          <div className={styles.cardLeft}>
            <div className={styles.logo}>
              <Image src="/home/logo_commentaires.png" alt="Hero Pancarte" className={styles.logoPancarte} width={69} height={71} priority/>
            </div>
            <p className={styles.texte}>
              {testimonials[leftTestimonial].texte}
            </p>
            <h3 className={styles.name}>{testimonials[leftTestimonial].name}</h3>
            <div className={styles.rate}>
              <Image src="/home/ratings.png" alt="Logo Ratings" className={styles.logoPancarte} width={98} height={18} priority/>
            </div>
          </div>

          <div className={styles.cardRight}>
            <div className={styles.logo}>
              <Image src="/home/logo_commentaires.png" alt="Logo Commentaire" className={styles.logoPancarte} width={69} height={71} priority/>
            </div>
            <p className={styles.texte}>
              {testimonials[rightTestimonial].texte}
            </p>
            <h3 className={styles.name}>{testimonials[rightTestimonial].name}</h3>
            <div className={styles.rate}>
              <Image src="/home/ratings.png" alt="Logo Ratings" className={styles.logoPancarte} width={98} height={18} priority/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}