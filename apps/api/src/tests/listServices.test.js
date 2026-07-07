import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";
import { createJob, listJobs } from "../services/jobService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

async function assertListIsDefensive({ create, list, payload, idPrefix }) {
  const created = await create(payload);
  const exposed = await list();
  const exposedRecord = exposed.find((record) => record.id === created.id);

  assert.ok(exposedRecord, `${idPrefix} record should be listed`);

  exposed.push({ id: `${idPrefix}_injected`, injected: true });
  exposedRecord.externalMutation = true;

  const afterMutation = await list();

  assert.equal(
    afterMutation.some((record) => record.id === `${idPrefix}_injected`),
    false
  );

  const storedRecord = afterMutation.find((record) => record.id === created.id);
  assert.ok(storedRecord, `${idPrefix} record should remain listed`);
  assert.equal(storedRecord.externalMutation, undefined);
}

test("list services return defensive copies", async () => {
  await assertListIsDefensive({
    create: createUser,
    list: listUsers,
    payload: { email: "copy-user@example.com", role: "client" },
    idPrefix: "usr"
  });

  await assertListIsDefensive({
    create: createJob,
    list: listJobs,
    payload: { title: "Copy-safe job", budget: 500 },
    idPrefix: "job"
  });

  await assertListIsDefensive({
    create: createProposal,
    list: listProposals,
    payload: { jobId: "job_copy_safe", freelancerId: "usr_copy_safe" },
    idPrefix: "prp"
  });

  await assertListIsDefensive({
    create: createReview,
    list: listReviews,
    payload: { targetId: "usr_copy_safe", rating: 5, comment: "copy safe" },
    idPrefix: "rev"
  });

  await assertListIsDefensive({
    create: sendMessage,
    list: listMessages,
    payload: { from: "usr_a", to: "usr_b", body: "copy safe" },
    idPrefix: "msg"
  });

  await assertListIsDefensive({
    create: createNotification,
    list: listNotifications,
    payload: { userId: "usr_copy_safe", type: "copy-safe" },
    idPrefix: "ntf"
  });
});
