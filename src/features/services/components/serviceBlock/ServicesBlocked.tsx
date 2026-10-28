import type { BlockSource } from '@/lib/orders/billing';
import styles from './ServiceBlock.module.css';

const MESSAGES: Record<BlockSource, string> = {
  self: 'Votre compte présente un défaut de paiement. Réglez vos factures pour pouvoir de nouveau faire des demandes de service.',
  groupAdmin:
    'Les factures de votre équipe, que votre administrateur de groupe doit régler, sont impayées. Communiquez avec lui pour lever le blocage.',
  member: 'Un membre de votre équipe a des factures impayées. Relancez-le pour lever le blocage.',
};

export function ServicesBlocked({ source }: { source: BlockSource }) {
  return (
    <section className={styles.blocked} aria-labelledby="services-blocked-title">
      <span className={styles.blockedIcon} aria-hidden="true">⛔</span>
      <h1 id="services-blocked-title" className={styles.blockedTitle}>
        Demandes de service suspendues
      </h1>
      <p className={styles.blockedText}>{MESSAGES[source]}</p>
      <p className={styles.blockedNote}>Les achats en boutique restent possibles.</p>
      <a href="tel:+15148252709" className={styles.phone}>
        📞 514-825-2709
      </a>
    </section>
  );
}