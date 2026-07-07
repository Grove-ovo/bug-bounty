import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

const baseRegistration = {
  email: "user@example.com",
  password: "password123"
};

test("registerSchema defaults omitted roles to client", () => {
  const payload = registerSchema.parse(baseRegistration);

  assert.equal(payload.role, "client");
});

test("registerSchema accepts normal public registration roles", () => {
  const clientPayload = registerSchema.parse({
    ...baseRegistration,
    role: "client"
  });
  const freelancerPayload = registerSchema.parse({
    ...baseRegistration,
    role: "freelancer"
  });

  assert.equal(clientPayload.role, "client");
  assert.equal(freelancerPayload.role, "freelancer");
});

test("registerSchema rejects admin role self-assignment", () => {
  const result = registerSchema.safeParse({
    ...baseRegistration,
    role: "admin"
  });

  assert.equal(result.success, false);
});
