import { Router } from "express";
import { EnterpriseController } from "./enterprise.controller.ts";

const router = Router();
const controller = new EnterpriseController();

// 1. Templates & Overviews
router.post("/seed", controller.seedDefaultLifecycleTemplate);
router.get("/dashboard", controller.getGovernanceDashboardMetrics);
router.post("/sla/cron", controller.runSLACronJobsSimulation);

// 2. Instances
router.post("/instances", controller.createLifecycleInstance);
router.get("/instances/:projectId", controller.getLifecycleInstance);

// 3. Document Controls
router.post("/instances/:instanceId/documents/:stageDocumentId/upload", controller.uploadLifecycleDocument);
router.post("/documents/:documentVersionId/verify", controller.verifyLifecycleDocument);

// 4. Checklist Controls
router.post("/instances/:instanceId/checklists/:checklistId/complete", controller.completeLifecycleChecklist);

// 5. Approvals
router.post("/instances/:instanceId/stages/:stageId/approve", controller.submitStageApprovalRole);

// 6. Discussions
router.post("/instances/:instanceId/stages/:stageId/comments", controller.addLifecycleCommentMessage);

// 7. Gatekeeper Control (Head of Operations Review)
router.post("/instances/:instanceId/stages/:stageId/operations-review", controller.submitHeadOfOperationsReviewGate);

// 8. Metrics
router.get("/instances/:instanceId/stages/:stageId/sla", controller.getStageSLAPerformance);

export default router;
