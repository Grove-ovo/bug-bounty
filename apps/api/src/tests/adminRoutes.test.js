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

  const { port } = server.address();
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function token(role = "admin", sub = "usr_admin_1") {
  return signAccessToken({ sub, role });
}

function authHeaders(role = "admin") {
  return {
    authorization: `Bearer ${token(role)}`,
    "content-type": "application/json"
  };
}

test("admin routes reject unauthenticated callers", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("admin routes reject authenticated non-admin callers", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: authHeaders("client")
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.deepEqual(payload, { success: false, message: "Forbidden" });
  });
});

test("admin metrics expose dashboard counts and trust distribution", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: authHeaders()
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.totalUsers, 4);
    assert.equal(payload.data.flaggedListings, 2);
    assert.equal(payload.data.trustDistribution.length, 3);
  });
});

test("admin users endpoint filters and paginates server-side", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users?role=freelancer&page=1&pageSize=1`, {
      headers: authHeaders()
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.items.length, 1);
    assert.equal(payload.data.items[0].role, "freelancer");
    assert.equal(payload.data.pagination.pageSize, 1);
    assert.equal(payload.data.pagination.total, 2);
  });
});

test("admin can update user status and audit the action", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users/usr_client_101/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: "suspended" })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.user.status, "suspended");
    assert.equal(payload.data.audit.actionType, "user_status_updated");

    const auditResponse = await fetch(`${baseUrl}/api/admin/audit-log?actionType=user_status_updated`, {
      headers: authHeaders()
    });
    const auditPayload = await auditResponse.json();

    assert.equal(auditResponse.status, 200);
    assert.equal(auditPayload.data.items.length, 1);
    assert.equal(auditPayload.data.items[0].targetId, "usr_client_101");

    const dateFiltered = await fetch(`${baseUrl}/api/admin/audit-log?actionType=user_status_updated&from=2026-01-01`, {
      headers: authHeaders()
    });
    const datePayload = await dateFiltered.json();

    assert.equal(dateFiltered.status, 200);
    assert.equal(datePayload.data.items.length, 1);
  });
});

test("platform controls require confirmation and write audit entries", async () => {
  await withServer(async (baseUrl) => {
    const rejected = await fetch(`${baseUrl}/api/admin/controls/registrations`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ enabled: false })
    });

    assert.equal(rejected.status, 400);

    const accepted = await fetch(`${baseUrl}/api/admin/controls/registrations`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ enabled: false, confirm: true })
    });
    const payload = await accepted.json();

    assert.equal(accepted.status, 200);
    assert.equal(payload.data.control.enabled, false);
    assert.equal(payload.data.audit.actionType, "platform_control_updated");
  });
});
