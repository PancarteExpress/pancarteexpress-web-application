import styles from './RegisterView.module.css';

interface RegisterViewProps {
  children: React.ReactNode;
}

export default function RegisterView({ children }: RegisterViewProps) {
  return (
    <div className={styles.mainContainer}>
      <div className={styles.container}>{children}</div>
    </div>
  );
}
