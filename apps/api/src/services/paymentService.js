import Stripe from "stripe";
import { env } from "../config/env.js";

export class PaymentServiceError extends Error {
  constructor(message, status = 400, cause) {
    super(message);
    this.name = "PaymentServiceError";
    this.status = status;
    this.cause = cause;
  }
}

let stripeClient;

function getStripeClient() {
  if (!env.stripeSecretKey) {
    throw new PaymentServiceError("STRIPE_SECRET_KEY is required to create payment intents.", 500);
  }

  stripeClient ??= new Stripe(env.stripeSecretKey);
  return stripeClient;
}

function normalizePaymentPayload(payload) {
  const amount = payload?.amount;
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new PaymentServiceError("Payment amount must be a positive integer in the smallest currency unit.");
  }

  const currency = typeof payload.currency === "string" && payload.currency.trim()
    ? payload.currency.trim().toLowerCase()
    : "usd";

  return {
    amount,
    currency,
    metadata: payload.metadata ?? {}
  };
}

function mapStripeError(error) {
  if (typeof error?.type === "string" && error.type.startsWith("Stripe")) {
    return new PaymentServiceError(error.message, 502, error);
  }

  return error;
}

export async function createPaymentIntent(payload, options = {}) {
  const request = normalizePaymentPayload(payload);
  const stripe = options.stripeClient ?? getStripeClient();

  try {
    const paymentIntent = await stripe.paymentIntents.create(request);
    return {
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: "stripe"
    };
  } catch (error) {
    throw mapStripeError(error);
  }
}
