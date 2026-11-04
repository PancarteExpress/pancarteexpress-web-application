import styles from './DeferredLoading.module.css';

/** Indicateur discret pour un composant chargé via next/dynamic (visible après 200 ms). */
export function DeferredLoading({ overlay = false }: { overlay?: boolean }) {
  return (
    <div className={overlay ? styles.overlay : styles.inline} role="status" aria-busy="true">
      <div className={styles.spinner} />
    </div>
  );
}

export const modalLoading = () => <DeferredLoading overlay />;
export const inlineLoading = () => <DeferredLoading />;
