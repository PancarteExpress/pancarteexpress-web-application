import type { AdminClientServices } from "@/lib/services/services.service";
import styles from "./ServicesTable.module.css";
import { SERVICE_STATUS_LABELS, SERVICE_TYPE_LABELS } from "@/lib/constants/labels";

const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  dateStyle: "medium",
  timeZone: "America/Toronto",
});

interface ServicesTableProps {
  clients: AdminClientServices[];
}

export function ServicesTable({ clients }: ServicesTableProps) {
  if (clients.length === 0) {
    return <p className={styles.empty}>Aucune demande de service.</p>;
  }

  return (
    <div className={styles.clients}>
      {clients.map((client) => (
        <section key={client.key} className={styles.client} aria-label={client.name}>
          <header className={styles.clientHead}>
            <p className={styles.clientName}>{client.name}</p>
            <a href={`mailto:${client.email}`} className={styles.clientEmail}>{client.email}</a>
            <span className={styles.clientCount}>
              {client.services.length} service{client.services.length > 1 ? "s" : ""}
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
                  <th scope="col"># Commande</th>
                  <th scope="col">Type</th>
                  <th scope="col">Adresse</th>
                  <th scope="col">Demandé le</th>
                  {/*<th scope="col">Statut</th>*/}
                </tr>
              </thead>
              <tbody>
                {client.services.map((s) => (
                  <tr key={s.id}>
                    <td className={styles.mono}>#{s.orderNumber}</td>
                    <td>{SERVICE_TYPE_LABELS[s.type]}</td>
                    <td title={s.address}>{s.address}</td>
                    <td>{dateFormatter.format(s.orderedAt)}</td>
                    {/*<td>{SERVICE_STATUS_LABELS[s.status]}</td>*/}
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