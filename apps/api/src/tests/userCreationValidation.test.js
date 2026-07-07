import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

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

async function postUser(baseUrl, payload) {
  const response = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  return { response, payload: await response.json() };
}

test("POST /api/users rejects empty payloads", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postUser(baseUrl, {});

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid user payload" });
  });
});

test("POST /api/users rejects client-controlled ids", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postUser(baseUrl, {
      id: "usr_attacker_supplied",
      name: "Ada Lovelace",
      email: "ada@example.com",
      role: "client"
    });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid user payload" });
  });
});

test("POST /api/users rejects admin role self-assignment", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postUser(baseUrl, {
      name: "Grace Hopper",
      email: "grace@example.com",
      role: "admin"
    });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid user payload" });
  });
});

test("POST /api/users creates valid public users with server-owned ids", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postUser(baseUrl, {
      name: "Katherine Johnson",
      email: "katherine@example.com",
      role: "freelancer"
    });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^usr_\d+$/);
    assert.equal(payload.data.name, "Katherine Johnson");
    assert.equal(payload.data.email, "katherine@example.com");
    assert.equal(payload.data.role, "freelancer");
  });
});
