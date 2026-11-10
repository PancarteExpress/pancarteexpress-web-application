import type { ReactNode } from 'react';
import styles from './servicesSummary.module.css';

/*
 * Briques d'affichage du résumé : purement visuelles, sans logique.
 * Les paires libellé / valeur restent un <dl> sémantique (div > dt + dd est valide en HTML).
 */

/** Grille de paires libellé / valeur (2 colonnes, 1 sur mobile) */
export function Fields({ children }: { children: ReactNode }) {
  return <dl className={styles.fields}>{children}</dl>;
}

/** Une paire : libellé en petites majuscules, valeur dessous ; `wide` occupe toute la largeur */
export function Field({ label, children, wide = false }: { label: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <div className={styles.field} data-wide={wide || undefined}>
      <dt className={styles.fieldLabel}>{label}</dt>
      <dd className={styles.fieldValue}>{children}</dd>
    </div>
  );
}

/** Valeur courte mise en évidence (ex. « Au sol », « Oui ») */
export function Pill({ tone = 'info', children }: { tone?: 'info' | 'success'; children: ReactNode }) {
  return <span className={styles.pill} data-tone={tone}>{children}</span>;
}

/** Valeur absente : « Non précisé » en italique pâle */
export function Empty({ children }: { children: ReactNode }) {
  return <span className={styles.empty}>{children}</span>;
}

/** Valeur texte, ou le libellé « Non précisé » si elle est vide */
export function TextOrEmpty({ value, emptyLabel }: { value: string | null | undefined; emptyLabel: string }) {
  return value ? <>{value}</> : <Empty>{emptyLabel}</Empty>;
}

/** Sous-section (Pancartes, Kits, Ajouts…) : titre bleu, note facultative à droite */
export function SubSection({ title, note, children }: { title: ReactNode; note?: ReactNode; children: ReactNode }) {
  return (
    <section className={styles.subSection}>
      <header className={styles.subHeader}>
        <h4 className={styles.subTitle}>{title}</h4>
        {note && <p className={styles.subNote}>{note}</p>}
      </header>
      {children}
    </section>
  );
}

/** Grille de cartes d'unités : 3 colonnes, puis 2, puis 1 selon la largeur disponible */
export function UnitGrid({ children }: { children: ReactNode }) {
  return <div className={styles.unitGrid}>{children}</div>;
}

/** Carte d'une unité (Pancarte 1, Kit 2…) avec sa bordure orange */
export function UnitCard({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <article className={styles.unitCard}>
      <h5 className={styles.unitTitle}>{title}</h5>
      {children}
    </article>
  );
}

/** Ligne libellé / valeur dans une carte d'unité, sur une seule ligne */
export function UnitRows({ children }: { children: ReactNode }) {
  return <dl className={styles.unitRows}>{children}</dl>;
}

export function UnitRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.unitRow}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** Panneau encadré (ex. visite libre) */
export function Panel({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className={styles.panel}>
      <h4 className={styles.panelTitle}>{title}</h4>
      {children}
    </section>
  );
}

/** Texte libre saisi par le client, retours à la ligne conservés */
export function Prose({ children }: { children: ReactNode }) {
  return <p className={styles.prose}>{children}</p>;
}
