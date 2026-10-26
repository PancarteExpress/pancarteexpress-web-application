"use client";

import { useState } from "react";
import { CardNumberElement, useElements, useStripe } from "@stripe/react-stripe-js";

export type CardField = "number" | "expiry" | "cvc";

type CardChangeEvent = { complete: boolean; error?: { message?: string } };

export interface BillingDetails {
  name: string;
  email?: string;
  phone?: string;
}

export type ConfirmResult =
  | { ok: true; status: "succeeded" | "processing" }
  | { ok: false; error: string };

export function useCardPayment() {
  const stripe = useStripe();
  const elements = useElements();

  const [complete, setComplete] = useState<Record<CardField, boolean>>({
    number: false,
    expiry: false,
    cvc: false,
  });
  const [cardError, setCardError] = useState<string | null>(null);

  const handleCardChange = (field: CardField) => (event: CardChangeEvent) => {
    setComplete((prev) => ({ ...prev, [field]: event.complete }));
    setCardError(event.error?.message ?? null);
  };

  const isComplete = complete.number && complete.expiry && complete.cvc;
  const isReady = stripe !== null && elements?.getElement(CardNumberElement) != null;

  const confirmPayment = async (
    clientSecret: string,
    billing: BillingDetails
  ): Promise<ConfirmResult> => {
    const card = elements?.getElement(CardNumberElement) ?? null;
    if (!stripe || !card) {
      return { ok: false, error: "Le module de paiement est indisponible. Rechargez la page." };
    }

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card, billing_details: billing },
    });

    if (result.error) {
      return { ok: false, error: result.error.message ?? "Le paiement a été refusé." };
    }
    const { status } = result.paymentIntent;
    if (status === "succeeded" || status === "processing") return { ok: true, status };
    return { ok: false, error: "Le paiement n'a pas pu être confirmé. Réessayez." };
  };

  return { handleCardChange, isComplete, isReady, cardError, setCardError, confirmPayment };
}