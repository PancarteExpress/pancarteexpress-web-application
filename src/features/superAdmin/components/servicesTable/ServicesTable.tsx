import { useTranslations } from "next-intl";
import type { AdminClientServices } from "@/lib/services/server/services.service";
import styles from "./ServicesTable.module.css";
import { formatDate } from "@/shared/utils/date";
import { useAppLocale } from "@/shared/hooks/useAppLocale";

interface ServicesTableProps {
  clients: AdminClientServices[];
}

export function ServicesTable({ clients }: ServicesTableProps) {
  const t = useTranslations("superAdmin");
  const locale = useAppLocale();

  if (clients.length === 0) {
    return <p className={styles.empty}>{t("servicesTable.empty")}</p>;
  }

  return (
    <div className={styles.clients}>
      {clients.map((client) => (
        <section key={client.key} className={styles.client} aria-label={client.name}>
          <header className={styles.clientHead}>
            <p className={styles.clientName}>{client.name}</p>
            <a href={`mailto:${client.email}`} className={styles.clientEmail}>{client.email}</a>
            <span className={styles.clientCount}>
              {t("servicesTable.serviceCount", { count: client.services.length })}
            </span>
          </header>

          <div className={styles.wrapper}>
            <table className={styles.table}>
              <colgroup>
                <col className={styles.colOrder} />
                <col className={styles.colType} />
                <col className={styles.colAddress} />
                <col className={styles.colDate} />
                {/*<col className={styles.colStatus} />*/}
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">{t("servicesTable.orderNumber")}</th>
                  <th scope="col">{t("servicesTable.type")}</th>
                  <th scope="col">{t("servicesTable.address")}</th>
                  <th scope="col">{t("servicesTable.requestedOn")}</th>
                  <th scope="col">{t("servicesTable.delay")}</th>
                </tr>
              </thead>
              <tbody>
                {client.services.map((s) => (
                  <tr key={s.id}>
                    <td className={styles.mono}>#{s.orderNumber}</td>
                    <td>{t(`serviceTypes.${s.type}`)}</td>
                    <td title={s.address}>{s.address}</td>
                    <td>{formatDate(s.orderedAt, "medium", locale)}</td>
                    <td>{s.delay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}