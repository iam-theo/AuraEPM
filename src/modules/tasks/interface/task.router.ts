import { Router } from "express";
import { TaskController } from "./task.controller.ts";
import { TaskService } from "../application/task.service.ts";
import { DrizzleTaskRepository } from "../infrastructure/drizzle-task.repository.ts";

const router = Router();

const repository = new DrizzleTaskRepository();
const service = new TaskService(repository);
const controller = new TaskController(service);

router.get("/project/:projectId", controller.getByProject);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.patch("/:id/status", controller.updateStatus);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

export default router;
