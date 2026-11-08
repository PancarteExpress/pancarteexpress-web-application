import type { Prisma } from "@prisma/client";
import type { PickupFieldsInput } from "@/lib/auth/auth.schema";

export type PickupCreateData = Omit<Prisma.PickupInfoUncheckedCreateInput, "userId">;

export function toPickupCreateInput(data: PickupFieldsInput): PickupCreateData {
  if (data.pickupMode === "address") {
    return {
      mode: "ADDRESS",
      address: data.pickupAddress ?? null,
      city: data.pickupCity ?? null,
      postalCode: data.pickupPostalCode ?? null,
      receptionDate: null,
      notes: null,
    };
  }

  return {
    mode: "WAREHOUSE",
    address: null,
    city: null,
    postalCode: null,
    receptionDate: data.receptionDate ? new Date(data.receptionDate) : null,
    notes: data.pickupNotes ?? null,
  };
}