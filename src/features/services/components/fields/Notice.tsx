import type { ReactNode } from 'react';
import styles from './fields.module.css';

interface NoticeProps {
  variant?: 'info' | 'warning';
  children: ReactNode;
}

export function Notice({ variant = 'info', children }: NoticeProps) {
  return (
    <p role="note" className={styles.notice} data-variant={variant}>
      {children}
    </p>
  );
}