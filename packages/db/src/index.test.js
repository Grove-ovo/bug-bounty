import test from "node:test";
import assert from "node:assert/strict";

test("@freelanceflow/db is importable from the workspace package name", async () => {
  const db = await import("@freelanceflow/db");

  assert.equal(typeof db.PrismaClient, "function");
  assert.equal(typeof db.Prisma, "object");
});
