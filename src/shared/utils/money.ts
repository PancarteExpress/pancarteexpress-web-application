const cadFormatter = new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" });

export const formatCents = (cents: number) => cadFormatter.format(cents / 100);

/** Valeur d'input : 15050 → "150,50" */
export const centsToInput = (cents: number | null) =>
  cents === null ? "" : (cents / 100).toFixed(2).replace(".", ",");