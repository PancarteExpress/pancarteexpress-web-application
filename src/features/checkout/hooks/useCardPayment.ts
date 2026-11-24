"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("checkout.payment");

  const [complete, setComplete] = useState<Record<CardField, boolean>>({
    number: false,
    expiry: false,
    cvc: false,
  });
  // Une erreur par champ : corriger le CVC n'efface pas l'erreur du numéro
  const [fieldErrors, setFieldErrors] = useState<Record<CardField, string | null>>({
    number: null,
    expiry: null,
    cvc: null,
  });
  // Erreur imposée de l'extérieur (ex. « carte incomplète » au moment de payer)
  const [submitCardError, setCardError] = useState<string | null>(null);

  const handleCardChange = (field: CardField) => (event: CardChangeEvent) => {
    setComplete((prev) => ({ ...prev, [field]: event.complete }));
    setFieldErrors((prev) => ({ ...prev, [field]: event.error?.message ?? null }));
    setCardError(null); // l'utilisateur corrige : on retire le message « incomplète »
  };

  // Premier message utile, dans l'ordre des champs
  const cardError = fieldErrors.number ?? fieldErrors.expiry ?? fieldErrors.cvc ?? submitCardError;

  const isComplete = complete.number && complete.expiry && complete.cvc;
  const isReady = stripe !== null && elements?.getElement(CardNumberElement) != null;

  const confirmPayment = async (
    clientSecret: string,
    billing: BillingDetails
  ): Promise<ConfirmResult> => {
    const card = elements?.getElement(CardNumberElement) ?? null;
    if (!stripe || !card) {
      return { ok: false, error: t("unavailable") };
    }

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card, billing_details: billing },
    });

    if (result.error) {
      return { ok: false, error: result.error.message ?? t("declined") };
    }
    const { status } = result.paymentIntent;
    if (status === "succeeded" || status === "processing") return { ok: true, status };
    return { ok: false, error: t("notConfirmed") };
  };

  return { handleCardChange, isComplete, isReady, cardError, setCardError, confirmPayment };
}