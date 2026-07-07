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

function postProposal(baseUrl, body) {
  return fetch(`${baseUrl}/api/proposals`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

const validProposal = {
  jobId: "job_123",
  freelancerId: "usr_456",
  coverLetter: "I can complete this safely.",
  bidAmount: 250,
  estDuration: "2 weeks"
};

test("POST /api/proposals rejects missing estimated duration", async () => {
  await withServer(async (baseUrl) => {
    const { estDuration, ...withoutDuration } = validProposal;
    const response = await postProposal(baseUrl, withoutDuration);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/proposals rejects blank estimated duration", async () => {
  await withServer(async (baseUrl) => {
    const response = await postProposal(baseUrl, {
      ...validProposal,
      estDuration: "   "
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/proposals creates a valid proposal with estimated duration", async () => {
  await withServer(async (baseUrl) => {
    const response = await postProposal(baseUrl, validProposal);
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.id, /^prp_/);
    assert.equal(payload.data.estDuration, validProposal.estDuration);
  });
});
