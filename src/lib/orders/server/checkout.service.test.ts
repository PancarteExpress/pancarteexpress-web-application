import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CheckoutPayload } from "@/lib/orders/checkout.schema";

const prismaMock = vi.hoisted(() => ({
  order: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  user: { findUniqueOrThrow: vi.fn() },
}));
const afterMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("next/server", () => ({ after: afterMock }));
vi.mock("@/lib/stripe/server", () => ({ stripe: {} }));
vi.mock("@/lib/orders/server/receipts.email", () => ({ sendReceipts: vi.fn() }));
vi.mock("@/lib/optimoroute/server/syncOrder", () => ({ syncOrderToOptimoRoute: vi.fn() }));
vi.mock("@/lib/users/server/serviceAccess.service", () => ({ getServiceAccess: vi.fn() }));
vi.mock("next-intl/server", () => ({ getTranslations: vi.fn() }));

const { createOrder } = await import("./checkout.service");

/** Commande d'invité : une adresse avec un seul service du type donné, sans produit */
function guestPayload(serviceType: string): CheckoutPayload {
  return {
    idempotencyKey: "key-1",
    locale: "fr",
    contact: { firstName: "Ana", lastName: "Test", email: "ana@example.com" },
    items: [
      {
        kind: "serviceRequest",
        requestType: "residential",
        addresses: [
          {
            type: "address",
            streetNumber: "1717",
            streetName: "Rue Berri",
            city: "Montréal",
            postalCode: "H2L 4E9",
            schedule: { delay: "standard24h" },
            attachments: [],
            services: [{ type: serviceType, details: {} }],
          },
        ],
      },
    ],
  } as unknown as CheckoutPayload;
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.order.findUnique.mockResolvedValue(null);
  prismaMock.order.create.mockResolvedValue({ id: "o1", orderNumber: 1, total: 0 });
});

describe("createOrder — services réservés aux membres", () => {
  it.each(["pickup", "delivery"])("refuse « %s » pour un invité, sans rien enregistrer", async (type) => {
    await expect(createOrder(guestPayload(type), null)).rejects.toThrow();
    expect(prismaMock.order.create).not.toHaveBeenCalled();
  });

  it("accepte une installation pour un invité", async () => {
    await expect(createOrder(guestPayload("installation"), null)).resolves.toMatchObject({ mode: "submitted" });
    expect(prismaMock.order.create).toHaveBeenCalledOnce();
  });
});