import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("registerUser signs the returned user id as the token subject", async () => {
  const originalNow = Date.now;
  let now = 1720000000000;
  Date.now = () => now++;

  try {
    const user = await registerUser({
      email: "client@example.com",
      role: "client"
    });
    const claims = verifyAccessToken(user.token);

    assert.equal(user.id, "usr_1720000000000");
    assert.equal(claims.sub, user.id);
    assert.equal(claims.role, "client");
  } finally {
    Date.now = originalNow;
  }
});
