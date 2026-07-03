import { Router } from "express";
import { ProjectController } from "./project.controller.ts";
import { ProjectService } from "../application/project.service.ts";
import { DrizzleProjectRepository } from "../infrastructure/drizzle-project.repository.ts";
import { authMiddleware } from "../../../shared/infrastructure/auth.middleware.ts";

const router = Router();

// Dependency Injection (Poor man's version for now)
const repository = new DrizzleProjectRepository();
const service = new ProjectService(repository);
const controller = new ProjectController(service);

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.post("/", authMiddleware, controller.create);
router.put("/:id", authMiddleware, controller.update);
router.delete("/:id", authMiddleware, controller.delete);

export default router;
