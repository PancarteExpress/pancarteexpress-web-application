import type { Prisma } from "@prisma/client";

// Liste blanche des champs d'un user renvoyables au client (jamais le mot de passe ni les infos de provider)
export const publicUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phoneNumber: true,
  companyName: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;
