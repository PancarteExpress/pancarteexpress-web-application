import type { ReactNode } from 'react';
import styles from './RegisterView.module.css';

interface RegisterViewProps {
  children: ReactNode;
}

export default function RegisterView({ children }: RegisterViewProps) {
  return (
    <div className={styles.mainContainer}>
      <div className={styles.container}>{children}</div>
    </div>
  );
}
