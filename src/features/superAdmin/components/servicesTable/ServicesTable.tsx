"use client";

import type { AdminClientServices, AdminServiceRow } from "@/lib/services/services.service";
import { formatCents } from "@/shared/utils/money";
import { ServicePriceInput } from "./ServicePriceInput";
import styles from "./ServicesTable.module.css";
import { SERVICE_STATUS_LABELS, SERVICE_TYPE_LABELS } from "@/lib/constants/labels";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishPricesAction } from "@/lib/services/services.actions";

const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  dateStyle: "medium",
  timeZone: "America/Toronto",
});

interface ServicesTableProps {
  clients: AdminClientServices[];
}

export function ServicesTable({ clients }: ServicesTableProps) {

  const router = useRouter();
  const [isPublishing, startPublishing] = useTransition();
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  // Commandes complètes avec au moins un brouillon différent du prix envoyé
  const readyCount = useMemo(() => {
    const byOrder = new Map<string, AdminServiceRow[]>();
    for (const client of clients) {
      for (const s of client.services) {
        if (s.isPaid || s.status === "CANCELLED") continue;
        byOrder.set(s.orderId, [...(byOrder.get(s.orderId) ?? []), s]);
      }
    }
    let count = 0;
    for (const services of byOrder.values()) {
      const complete = services.every((s) => s.draftPrice !== null);
      const changed = services.some((s) => s.draftPrice !== s.price);
      if (complete && changed) count++;
    }
    return count;
  }, [clients]);

  const handlePublish = () => {
    if (!window.confirm(`Envoyer ${readyCount} facture${readyCount > 1 ? "s" : ""} aux clients ?`)) return;
    setPublishMessage(null);

    startPublishing(async () => {
      const result = await publishPricesAction();
      if (!result.ok) {
        setPublishMessage(result.error);
        return;
      }
      const parts = [`${result.published} facture${result.published > 1 ? "s" : ""} envoyée${result.published > 1 ? "s" : ""}`];
      if (result.skipped > 0) parts.push(`${result.skipped} incomplète${result.skipped > 1 ? "s" : ""} ignorée${result.skipped > 1 ? "s" : ""}`);
      if (result.failed > 0) parts.push(`${result.failed} en échec (paiement en cours), réessayez`);
      setPublishMessage(parts.join(" · "));
      router.refresh();
    });
  };

  if (clients.length === 0) {
    return <p className={styles.empty}>Aucune demande de service.</p>;
  }

  return (<>
    <div className={styles.publishBar}>
        <button
          type="button"
          className={styles.btnPublish}
          onClick={handlePublish}
          disabled={readyCount === 0 || isPublishing}
        >
          {isPublishing ? "Envoi…" : `Envoyer les factures (${readyCount})`}
        </button>
        {publishMessage && <p className={styles.publishMessage} role="status">{publishMessage}</p>}
      </div>
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
                <col className={styles.colStatus} />
                <col className={styles.colPrice} />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Commande</th>
                  <th scope="col">Type</th>
                  <th scope="col">Adresse</th>
                  <th scope="col">Demandé le</th>
                  <th scope="col">Statut</th>
                  <th scope="col">Prix</th>
                </tr>
              </thead>
              <tbody>
                {client.services.map((s) => (
                  <tr key={s.id}>
                    <td className={styles.mono}>#{s.orderNumber}</td>
                    <td>{SERVICE_TYPE_LABELS[s.type]}</td>
                    <td title={s.address}>{s.address}</td>
                    <td>{dateFormatter.format(s.orderedAt)}</td>
                    <td>{SERVICE_STATUS_LABELS[s.status]}</td>
                    <td>
                      {s.isPaid ? (
                        <span className={styles.pricePaid}>
                          {s.price !== null ? formatCents(s.price) : "—"} · payé
                        </span>
                      ) : (
                        <ServicePriceInput
                          key={`${s.id}-${s.draftPrice}`}
                          serviceId={s.id}
                          draftPrice={s.draftPrice}
                          isSent={s.draftPrice !== null && s.draftPrice === s.price}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  </>);
}