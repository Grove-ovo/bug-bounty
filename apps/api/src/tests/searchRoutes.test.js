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
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/search trims and sanitizes the query before searching", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=%20%20alpha%00%1Fbeta%7F%20`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "alphabeta");
  });
});

test("GET /api/search rejects overlong queries", async () => {
  await withServer(async (baseUrl) => {
    const longQuery = "a".repeat(201);
    const response = await fetch(`${baseUrl}/api/search?q=${longQuery}`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /200 characters or fewer/);
  });
});

test("GET /api/search rejects repeated query parameters", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=alpha&q=beta`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /single string/);
  });
});
