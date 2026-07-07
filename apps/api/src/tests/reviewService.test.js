import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview generates unique server-owned ids in the same millisecond", async () => {
  const originalNow = Date.now;
  Date.now = () => 1720000000000;

  try {
    const first = await createReview({
      id: "rev_attacker_supplied",
      reviewerId: "usr_a",
      revieweeId: "usr_b",
      rating: 5,
      comment: "fast"
    });
    const second = await createReview({
      reviewerId: "usr_c",
      revieweeId: "usr_d",
      rating: 4,
      comment: "clear"
    });

    assert.match(first.id, /^rev_1720000000000_\d+$/);
    assert.match(second.id, /^rev_1720000000000_\d+$/);
    assert.notEqual(first.id, second.id);
    assert.notEqual(first.id, "rev_attacker_supplied");
  } finally {
    Date.now = originalNow;
  }
});
