import Footer from '@/shared/components/footer/footer';
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