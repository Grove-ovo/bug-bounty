import { ok } from "../utils/response.js";
import { fail } from "../utils/response.js";
import {
  getAdminMetrics,
  getAuditLog,
  getControl,
  getDispute,
  getDisputes,
  getJobModerationQueue,
  getUserDetail,
  getUsers,
  setControl,
  setDisputeRuling,
  setJobModerationStatus,
  setUserStatus
} from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function users(req, res) {
  return ok(res, await getUsers(req.query));
}

export async function userDetail(req, res) {
  const result = await getUserDetail(req.params.id);
  if (!result) {
    return fail(res, "User not found", 404);
  }

  return ok(res, result);
}

export async function updateUserStatus(req, res) {
  let result;
  try {
    result = await setUserStatus(req.params.id, req.body.status, req.user.sub);
  } catch (error) {
    return fail(res, error.message, 400);
  }

  if (!result) {
    return fail(res, "User not found", 404);
  }

  return ok(res, result);
}

export async function jobModerationQueue(req, res) {
  return ok(res, await getJobModerationQueue(req.query));
}

export async function updateJobModeration(req, res) {
  let result;
  try {
    result = await setJobModerationStatus(req.params.id, req.body, req.user.sub);
  } catch (error) {
    return fail(res, error.message, 400);
  }

  if (!result) {
    return fail(res, "Flagged listing not found", 404);
  }

  return ok(res, result);
}

export async function disputes(req, res) {
  return ok(res, await getDisputes(req.query));
}

export async function dispute(req, res) {
  const result = await getDispute(req.params.id);
  if (!result) {
    return fail(res, "Dispute not found", 404);
  }

  return ok(res, result);
}

export async function ruleOnDispute(req, res) {
  let result;
  try {
    result = await setDisputeRuling(req.params.id, req.body, req.user.sub);
  } catch (error) {
    return fail(res, error.message, 400);
  }

  if (!result) {
    return fail(res, "Dispute not found", 404);
  }

  return ok(res, result);
}

export async function control(req, res) {
  const result = await getControl(req.params.key);
  if (!result) {
    return fail(res, "Platform control not found", 404);
  }

  return ok(res, result);
}

export async function updateControl(req, res) {
  let result;
  try {
    result = await setControl(req.params.key, req.body, req.user.sub);
  } catch (error) {
    return fail(res, error.message, 400);
  }

  if (!result) {
    return fail(res, "Platform control not found", 404);
  }

  return ok(res, result);
}

export async function auditLog(req, res) {
  return ok(res, await getAuditLog(req.query));
}
