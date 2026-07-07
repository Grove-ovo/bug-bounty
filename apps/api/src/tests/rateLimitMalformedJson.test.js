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

function postMalformedJob(baseUrl) {
  return fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{bad json"
  });
}

test("global rate limiter counts malformed JSON before body parsing", async () => {
  await withServer(async (baseUrl) => {
    const originalConsoleError = console.error;
    console.error = () => {};

    try {
      let finalStatus = 0;
      for (let i = 0; i < 205; i += 1) {
        const response = await postMalformedJob(baseUrl);
        finalStatus = response.status;
        await response.text();
      }

      assert.equal(finalStatus, 429);
    } finally {
      console.error = originalConsoleError;
    }
  });
});
