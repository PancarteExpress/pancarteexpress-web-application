"use client";

import type { StripeElementStyle } from "@stripe/stripe-js";
import { CardCvcElement, CardExpiryElement, CardNumberElement } from "@stripe/react-stripe-js";
import type { CardField } from "../../hooks/useCardPayment";

const CARD_STYLE: StripeElementStyle = {
  base: { fontSize: "16px", color: "#424770", "::placeholder": { color: "#9ca3af" } },
  invalid: { color: "#fa755a" },
};

type CardChangeHandler = (event: { complete: boolean; error?: { message?: string } }) => void;

interface CardFieldsProps {
  onFieldChange: (field: CardField) => CardChangeHandler;
  labels: { cardNumber: string; expiry: string; cvc: string };
  groupClassName?: string;
}

export function CardFields({ onFieldChange, labels, groupClassName }: CardFieldsProps) {
  return (
    <>
      <div className={groupClassName}>
        <label>{labels.cardNumber}</label>
        <CardNumberElement options={{ style: CARD_STYLE }} onChange={onFieldChange("number")} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div className={groupClassName}>
          <label>{labels.expiry}</label>
          <CardExpiryElement options={{ style: CARD_STYLE }} onChange={onFieldChange("expiry")} />
        </div>
        <div className={groupClassName}>
          <label>{labels.cvc}</label>
          <CardCvcElement options={{ style: CARD_STYLE }} onChange={onFieldChange("cvc")} />
        </div>
      </div>
    </>
  );
}