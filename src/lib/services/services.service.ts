import "server-only";
import type { Prisma, RequestType, ServiceStatus, ServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const adminServiceSelect = {
  id: true,
  type: true,
  status: true,
  price: true,
  draftPrice: true,
  scheduledFor: true,
  serviceAddress: {
    select: {
      kind: true,
      streetNumber: true,
      streetName: true,
      apartment: true,
      description: true,
      nearbyAddress: true,
      city: true,
      serviceRequest: {
        select: {
          requestType: true,
          order: {
            select: {
              id: true,
              orderNumber: true,
              createdAt: true,
              payments: {
                where: { kind: "SERVICES", status: "SUCCEEDED" },
                select: { id: true },
                take: 1,
              },
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.ServiceSelect;

type ServiceWithRelations = Prisma.ServiceGetPayload<{ select: typeof adminServiceSelect }>;

export interface AdminServiceRow {
  id: string;
  type: ServiceType;
  status: ServiceStatus;
  price: number | null;      // envoyé au client
  draftPrice: number | null; // brouillon
  orderId: string;
  scheduledFor: Date | null;
  address: string;
  requestType: RequestType;
  orderNumber: number;
  orderedAt: Date;
  isPaid: boolean;
}

export interface AdminClientServices {
  key: string;
  name: string;
  email: string;
  services: AdminServiceRow[];
}

function formatAddress(a: ServiceWithRelations["serviceAddress"]): string {
  if (a.kind === "civicAddress") {
    const street = [a.streetNumber, a.streetName].filter(Boolean).join(" ");
    const apt = a.apartment ? `, app. ${a.apartment}` : "";
    return `${street}${apt}, ${a.city}`;
  }
  const place = a.nearbyAddress ?? a.description ?? "Terrain";
  return `${place}, ${a.city}`;
}

export async function listServicesForAdmin(): Promise<AdminClientServices[]> {
  const services = await prisma.service.findMany({
    orderBy: { serviceAddress: { serviceRequest: { order: { createdAt: "desc" } } } },
    select: adminServiceSelect,
  });

  // Map conserve l'ordre d'insertion : clients triés par commande la plus récente
  const clients = new Map<string, AdminClientServices>();

  for (const s of services) {
    const { requestType, order } = s.serviceAddress.serviceRequest;
    const person = order.user ?? order;
    const key = order.userId ?? `guest:${order.email.toLowerCase()}`;

    const client = clients.get(key) ?? {
      key,
      name: [person.firstName, person.lastName].filter(Boolean).join(" ") || person.email,
      email: person.email,
      services: [],
    };

    client.services.push({
      id: s.id,
      type: s.type,
      status: s.status,
      price: s.price,
      draftPrice: s.draftPrice,
      orderId: order.id,
      scheduledFor: s.scheduledFor,
      address: formatAddress(s.serviceAddress),
      requestType,
      orderNumber: order.orderNumber,
      orderedAt: order.createdAt,
      isPaid: order.payments.length > 0,
    });

    clients.set(key, client);
  }

  return [...clients.values()];
}