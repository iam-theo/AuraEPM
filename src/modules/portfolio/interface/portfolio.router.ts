import { Router } from "express";
import { PortfolioController } from "./portfolio.controller.ts";
import { PortfolioService } from "../application/portfolio.service.ts";

const router = Router();
const service = new PortfolioService();
const controller = new PortfolioController(service);

router.get("/", controller.list);
router.post("/", controller.create);

export default router;
