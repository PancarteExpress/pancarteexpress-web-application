"use client";

import { Fragment, useState } from "react";
import { useTranslations } from "next-intl";
import type { AdminClientServices } from "@/lib/services/server/services.service";
import styles from "./ServicesTable.module.css";
import { formatDate } from "@/shared/utils/date";
import { useAppLocale } from "@/shared/hooks/useAppLocale";
import { formatAddressNumber } from "@/lib/services/addressNumber";
import { ServiceStatusSelect } from "./ServiceStatusSelect";
import { ServiceDetailsSummary } from "@/features/services/components/servicesSummary/ServiceDetailsSummary";

interface ServicesTableProps {
  clients: AdminClientServices[];
}

/** Colonnes de la ligne principale : la ligne des détails les couvre toutes */
const COLUMN_COUNT = 7;

export function ServicesTable({ clients }: ServicesTableProps) {
  const t = useTranslations("superAdmin");
  const locale = useAppLocale();
  const [openServiceId, setOpenServiceId] = useState<string | null>(null);

  const toggle = (id: string) => setOpenServiceId((current) => (current === id ? null : id));

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

          {/* Invités : facturation de leur commande la plus récente qui en a */}
          {(() => {
            const billing = client.services.find((s) => s.billingAddress || s.companyName || s.additionalInfo);
            if (!billing) return null;
            return (
              <dl className={styles.guestInfo}>
                {billing.companyName && (<><dt>{t("servicesTable.companyName")}</dt><dd>{billing.companyName}</dd></>)}
                {billing.billingAddress && (<><dt>{t("servicesTable.billingAddress")}</dt><dd>{billing.billingAddress}</dd></>)}
                {billing.additionalInfo && (<><dt>{t("servicesTable.additionalInfo")}</dt><dd>{billing.additionalInfo}</dd></>)}
              </dl>
            );
          })()}

          <div className={styles.wrapper}>
            <table className={styles.table}>
              <colgroup>
                <col className={styles.colOrder} />
                <col className={styles.colAddressNo} />
                <col className={styles.colType} />
                <col className={styles.colAddress} />
                <col className={styles.colDate} />
                <col className={styles.colStatus} />
                <col className={styles.colDetails} />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">{t("servicesTable.orderNumber")}</th>
                  <th scope="col">{t("servicesTable.addressNumber")}</th>
                  <th scope="col">{t("servicesTable.type")}</th>
                  <th scope="col">{t("servicesTable.address")}</th>
                  <th scope="col">{t("servicesTable.requestedOn")}</th>
                  <th scope="col">{t("servicesTable.status")}</th>
                  <th scope="col"><span className={styles.visuallyHidden}>{t("servicesTable.details")}</span></th>
                </tr>
              </thead>
              <tbody>
                {client.services.map((s) => {
                  const isOpen = openServiceId === s.id;
                  const panelId = `service-details-${s.id}`;
                  const label = `${formatAddressNumber(s.addressNumber)} · ${t(`serviceTypes.${s.type}`)}`;

                  return (
                    <Fragment key={s.id}>
                      <tr className={isOpen ? styles.rowOpen : undefined}>
                        <td className={styles.mono}>#{s.orderNumber}</td>
                        <td>{formatAddressNumber(s.addressNumber)}</td>
                        <td>{t(`serviceTypes.${s.type}`)}</td>
                        <td title={s.address}>{s.address}</td>
                        <td>{formatDate(s.orderedAt, "medium", locale)}</td>
                        <td>
                          <ServiceStatusSelect
                            serviceId={s.id}
                            label={label}
                            status={s.status}
                            className={styles.statusSelect}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className={styles.btnDetails}
                            onClick={() => toggle(s.id)}
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                          >
                            {isOpen ? t("servicesTable.hideDetails") : t("servicesTable.details")}
                          </button>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr id={panelId} className={styles.detailsRow}>
                          <td colSpan={COLUMN_COUNT} className={styles.detailsCell}>
                            <p className={styles.detailsDelay}>
                              <strong>{t("servicesTable.delay")} :</strong> {s.delay}
                            </p>

                            <ServiceDetailsSummary type={s.type} details={s.details} />

                            {/* Fichiers en dernier : ouverts par /api/attachments/[id] (superAdmin) */}
                            <div className={styles.detailsFiles}>
                              <strong>{t("servicesTable.attachments")} :</strong>{" "}
                              {s.attachments.length === 0 ? (
                                "—"
                              ) : (
                                <ul className={styles.attachments}>
                                  {s.attachments.map((a) => (
                                    <li key={a.id}>
                                      <a href={`/api/attachments/${a.id}`} target="_blank" rel="noopener noreferrer">
                                        {a.fileName}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}