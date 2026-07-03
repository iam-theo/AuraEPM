import { Router } from "express";
import { TimeIssuesRisksController } from "./controller.ts";
import { requireAuth, auditLogger } from "../../shared/middleware.ts";
import { validateSchema, schemas } from "../../shared/validation.ts";

const router = Router();
const controller = new TimeIssuesRisksController();

// ==========================================
// TIME TRACKING ROUTES
// ==========================================
router.get("/project/:projectId", requireAuth, controller.listTimeLogs);
router.get("/project/:projectId/summary", requireAuth, controller.getTimesheetSummary);

router.post(
  "/",
  requireAuth,
  validateSchema(schemas.timeLogCreate),
  auditLogger("TIME_LOG"),
  controller.createTimeLog
);

router.patch(
  "/:id/approve",
  requireAuth,
  auditLogger("TIME_LOG_APPROVE"),
  controller.approveTimeLog
);

// ==========================================
// ISSUES REGISTER ROUTES
// ==========================================
router.get("/project/:projectId/issues", requireAuth, controller.listIssues);

router.post(
  "/issue",
  requireAuth,
  validateSchema(schemas.issueCreate),
  auditLogger("ISSUE"),
  controller.createIssue
);

router.patch(
  "/issue/:id",
  requireAuth,
  validateSchema(schemas.issueUpdate),
  auditLogger("ISSUE"),
  controller.updateIssue
);

router.delete(
  "/issue/:id",
  requireAuth,
  auditLogger("ISSUE"),
  controller.deleteIssue
);

// ==========================================
// RISKS REGISTER ROUTES
// ==========================================
router.get("/project/:projectId/risks", requireAuth, controller.listRisks);

router.post(
  "/risk",
  requireAuth,
  validateSchema(schemas.riskCreate),
  auditLogger("RISK"),
  controller.createRisk
);

router.patch(
  "/risk/:id",
  requireAuth,
  validateSchema(schemas.riskUpdate),
  auditLogger("RISK"),
  controller.updateRisk
);

router.delete(
  "/risk/:id",
  requireAuth,
  auditLogger("RISK"),
  controller.deleteRisk
);

export default router;
