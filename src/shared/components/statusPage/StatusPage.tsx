import type { ReactNode } from 'react';
import styles from './StatusPage.module.css';

interface Props {
  title: string;
  message: string;
  children: ReactNode; // actions proposées au visiteur
}

export default function StatusPage({ title, message, children }: Props) {
  return (
    <main className={styles.mainContainer}>
      <div className={styles.hero}>
        <h1>{title}</h1>
        <p>{message}</p>
      </div>
      <div className={styles.actions}>{children}</div>
    </main>
  );
}
