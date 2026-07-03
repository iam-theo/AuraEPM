import { Router } from "express";
import { DashboardController } from "./controller.ts";
import { requireAuth } from "../../shared/middleware.ts";

const router = Router();
const controller = new DashboardController();

// GET /api/project-tracker/dashboard/summary?projectId=...
router.get("/summary", requireAuth, controller.getSummary);

export default router;
