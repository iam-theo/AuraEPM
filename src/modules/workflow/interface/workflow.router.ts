import { Router } from "express";
import { WorkflowController } from "./workflow.controller.ts";
import { WorkflowService } from "../application/workflow.service.ts";
import { authMiddleware } from "../../../shared/infrastructure/auth.middleware.ts";

const router = Router();

const service = new WorkflowService();
const controller = new WorkflowController(service);

// 1. Static Paths / Templates / Statistics
router.get("/templates", controller.templates);
router.get("/statistics", controller.statistics);

// 2. Base Operations
router.get("/", controller.list);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

// 3. Diagram Visualizer
router.get("/:id/diagram", controller.getDiagram);

// 4. Instance Operations
router.post("/:id/start", controller.start);
router.post("/:id/transition", controller.transition);
router.post("/:id/approve", controller.approve);
router.post("/:id/reject", controller.reject);
router.post("/:id/escalate", controller.escalate);

// 5. History, Logs, and Instance queries
router.get("/:id/history", controller.history);
router.get("/:id/logs", controller.logs);
router.get("/:id/instances", controller.instances);

export default router;
