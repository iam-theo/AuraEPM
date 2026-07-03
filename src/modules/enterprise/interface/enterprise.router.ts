import { Router } from "express";
import { EnterpriseController } from "./enterprise.controller.ts";

const router = Router();
const controller = new EnterpriseController();

// --- SIMULATION TESTS ---
router.post("/run-tests", controller.runSimulationTests);

// --- PROGRAMS ---
router.post("/programs", controller.createProgram);
router.patch("/programs/:id", controller.updateProgram);
router.delete("/programs/:id", controller.archiveProgram);
router.get("/programs/:id", controller.getProgram);
router.get("/programs", controller.listPrograms);
router.get("/programs/:id/dashboard", controller.getProgramDashboard);

// --- RESOURCES & ALLOCATION ---
router.post("/resources", controller.createResource);
router.get("/resources/:id", controller.getResource);
router.get("/resources", controller.listResources);
router.post("/resources/:id/skills", controller.addResourceSkill);
router.post("/resources/:id/certifications", controller.addResourceCertification);
router.post("/resources/:id/calendar", controller.addCalendarEvent);
router.post("/resources/allocations", controller.allocateResource);
router.delete("/resources/allocations/:id", controller.releaseResource);

// --- CAPACITY PLANNING ---
router.post("/resources/capacities", controller.setDepartmentCapacity);
router.get("/resources/capacities/dashboard", controller.getCapacityDashboard);

// --- FINANCIAL MANAGEMENT & EVM ---
router.post("/finances/cost-centers", controller.createCostCenter);
router.get("/finances/cost-centers", controller.listCostCenters);
router.post("/finances/expenses", controller.createExpense);
router.patch("/finances/expenses/:id/approve", controller.approveExpense);
router.get("/finances/projects/:id/expenses", controller.getProjectExpenses);
router.post("/finances/projects/:id/evm", controller.calculateProjectEVM);
router.get("/finances/projects/:id/evm/snapshots", controller.getEVMSnapshots);

// --- BASELINES ---
router.post("/baselines/projects/:id", controller.createBaseline);
router.get("/baselines/projects/:id", controller.getBaselines);
router.get("/baselines/projects/:projectId/compare/:baselineId", controller.compareBaseline);

// --- CHANGE MANAGEMENT ---
router.post("/changes", controller.createChangeRequest);
router.patch("/changes/:id/review", controller.reviewChangeRequest);
router.get("/changes", controller.listChangeRequests);

// --- PROJECT TEMPLATES ---
router.post("/templates", controller.createTemplate);
router.get("/templates", controller.listTemplates);
router.post("/templates/:id/instantiate", controller.instantiateProject);

// --- HEALTH & KPI ENGINE ---
router.post("/health/projects/:id/recalculate", controller.recalculateProjectHealth);
router.get("/kpis/enterprise", controller.getEnterpriseKPIs);

// --- AI COPILOT EXTENSIONS ---
router.get("/ai/portfolios/:id/health", controller.analyzePortfolioHealth);
router.get("/ai/projects/:id/delay-prediction", controller.predictProjectDelay);
router.get("/ai/projects/:id/budget-forecast", controller.forecastBudgetOverrun);
router.get("/ai/projects/:id/resource-recommendation", controller.recommendResourceAllocation);
router.get("/ai/projects/:id/risk-trends", controller.detectRiskTrends);
router.get("/ai/pmo/weekly-report", controller.generateWeeklyPMOReport);

export default router;
