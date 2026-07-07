import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema, updateJobSchema } from "../validators/job.js";

const validJob = {
  title: "Build a support widget",
  description: "Create a production-ready AI support widget.",
  budgetMin: 500,
  budgetMax: 1500,
  categoryId: "engineering",
  skills: ["Node.js"]
};

test("createJobSchema rejects inverted budget ranges", () => {
  const result = createJobSchema.safeParse({
    ...validJob,
    budgetMin: 1500,
    budgetMax: 500
  });

  assert.equal(result.success, false);
});

test("createJobSchema accepts ordered budget ranges", () => {
  const result = createJobSchema.safeParse(validJob);

  assert.equal(result.success, true);
});

test("updateJobSchema rejects inverted budget ranges when both fields are present", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 900,
    budgetMax: 100
  });

  assert.equal(result.success, false);
});

test("updateJobSchema accepts partial budget updates with one field", () => {
  const result = updateJobSchema.safeParse({
    budgetMin: 900
  });

  assert.equal(result.success, true);
});
