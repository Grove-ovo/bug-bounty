import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("GET /health returns ok payload", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload, { ok: true, service: "api" });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /health bypasses the shared API rate limiter", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    const requests = Array.from({ length: 205 }, () =>
      fetch(`http://127.0.0.1:${port}/health`)
    );
    const responses = await Promise.all(requests);

    assert.ok(responses.every((response) => response.status === 200));

    await Promise.all(responses.map((response) => response.body?.cancel()));
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("shared API rate limiter still protects API routes", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    const responses = [];
    for (let index = 0; index < 201; index += 1) {
      responses.push(await fetch(`http://127.0.0.1:${port}/api/jobs`));
    }

    assert.equal(responses.at(-1).status, 429);

    await Promise.all(responses.map((response) => response.body?.cancel()));
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
