import { Router } from "express";
import { RiskIssueController } from "./risk-issue.controller.ts";
import { RiskIssueService } from "../application/risk-issue.service.ts";
import { DrizzleRiskIssueRepository } from "../infrastructure/drizzle-risk-issue.repository.ts";

const router = Router();
const repository = new DrizzleRiskIssueRepository();
const service = new RiskIssueService(repository);
const controller = new RiskIssueController(service);

router.get("/project/:projectId", controller.getByProject);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

export default router;
