import { Router } from "express";
import {
  auditLog,
  control,
  dispute,
  disputes,
  jobModerationQueue,
  metrics,
  ruleOnDispute,
  updateControl,
  updateJobModeration,
  updateUserStatus,
  userDetail,
  users
} from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/auth.js";
import { fail } from "../utils/response.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware);
adminRoutes.use((req, res, next) => {
  if (req.user?.role !== "admin") {
    return fail(res, "Forbidden", 403);
  }

  return next();
});

adminRoutes.get("/metrics", metrics);
adminRoutes.get("/users", users);
adminRoutes.get("/users/:id", userDetail);
adminRoutes.patch("/users/:id/status", updateUserStatus);
adminRoutes.get("/moderation/jobs", jobModerationQueue);
adminRoutes.patch("/moderation/jobs/:id", updateJobModeration);
adminRoutes.get("/disputes", disputes);
adminRoutes.get("/disputes/:id", dispute);
adminRoutes.patch("/disputes/:id/ruling", ruleOnDispute);
adminRoutes.get("/controls/:key", control);
adminRoutes.patch("/controls/:key", updateControl);
adminRoutes.get("/audit-log", auditLog);
