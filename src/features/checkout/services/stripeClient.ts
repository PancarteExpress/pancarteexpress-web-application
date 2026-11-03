import { loadStripe } from "@stripe/stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Une seule instance pour toute l'application
export const stripePromise = publishableKey ? loadStripe(publishableKey) : null;