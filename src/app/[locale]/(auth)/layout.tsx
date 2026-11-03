import Footer from '@/features/layout/components/footer/Footer';
import styles from './layout.module.css';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.authLayout}>
      {children}
      <Footer />
    </div>
  );
}