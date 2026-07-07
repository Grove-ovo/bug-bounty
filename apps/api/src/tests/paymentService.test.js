import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { createPaymentIntent, PaymentServiceError } from "../services/paymentService.js";

function stripeMock(paymentIntent = {}) {
  const create = mock.fn(async (request) => ({
    id: "pi_benchmark_123",
    client_secret: "pi_benchmark_123_secret_test",
    amount: request.amount,
    currency: request.currency,
    ...paymentIntent
  }));

  return {
    create,
    client: {
      paymentIntents: { create }
    }
  };
}

test("createPaymentIntent calls Stripe with validated payment fields", async () => {
  const stripe = stripeMock();

  const result = await createPaymentIntent({
    amount: 2500,
    currency: "USD",
    metadata: { jobId: "job_123", clientId: "usr_123" }
  }, { stripeClient: stripe.client });

  assert.deepEqual(stripe.create.mock.calls[0].arguments[0], {
    amount: 2500,
    currency: "usd",
    metadata: { jobId: "job_123", clientId: "usr_123" }
  });
  assert.deepEqual(result, {
    paymentId: "pi_benchmark_123",
    clientSecret: "pi_benchmark_123_secret_test",
    amount: 2500,
    currency: "usd",
    provider: "stripe"
  });
});

test("createPaymentIntent defaults currency to usd", async () => {
  const stripe = stripeMock();

  await createPaymentIntent({ amount: 500 }, { stripeClient: stripe.client });

  assert.equal(stripe.create.mock.calls[0].arguments[0].currency, "usd");
});

test("createPaymentIntent rejects missing or invalid amounts", async () => {
  await assert.rejects(
    () => createPaymentIntent({ amount: 0 }, { stripeClient: stripeMock().client }),
    (error) => error instanceof PaymentServiceError
      && error.message === "Payment amount must be a positive integer in the smallest currency unit."
  );

  await assert.rejects(
    () => createPaymentIntent({ amount: 10.5 }, { stripeClient: stripeMock().client }),
    PaymentServiceError
  );
});

test("createPaymentIntent preserves Stripe API error messages", async () => {
  const stripeError = new Error("Your card was declined.");
  stripeError.type = "StripeCardError";
  const create = mock.fn(async () => {
    throw stripeError;
  });

  await assert.rejects(
    () => createPaymentIntent({ amount: 2500 }, { stripeClient: { paymentIntents: { create } } }),
    (error) => error instanceof PaymentServiceError
      && error.status === 502
      && error.message === "Your card was declined."
  );
});

test("stripe smoke creates a real test-mode PaymentIntent when enabled", {
  skip: process.env.RUN_STRIPE_SMOKE_TEST !== "true" || !process.env.STRIPE_SECRET_KEY
}, async () => {
  const result = await createPaymentIntent({
    amount: 100,
    currency: "usd",
    metadata: { source: "smoke-test" }
  });

  assert.match(result.paymentId, /^pi_/);
  assert.match(result.clientSecret, /_secret_/);
  assert.equal(result.amount, 100);
  assert.equal(result.currency, "usd");
});
