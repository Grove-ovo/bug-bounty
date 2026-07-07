import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

const messagePayload = {
  fromUserId: "usr_sender",
  toUserId: "usr_recipient",
  body: "Can we sync on the proposal?"
};

test("POST /api/messages rejects anonymous creation", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(messagePayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/messages accepts authenticated creation", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_message_sender", role: "client" });
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(messagePayload)
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^msg_\d+$/);
    assert.equal(payload.data.fromUserId, messagePayload.fromUserId);
    assert.equal(payload.data.toUserId, messagePayload.toUserId);
    assert.equal(payload.data.body, messagePayload.body);
    assert.match(payload.data.sentAt, /^\d{4}-\d{2}-\d{2}T/);
  });
});
