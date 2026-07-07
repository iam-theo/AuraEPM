import { Router } from "express";
import { UserController } from "./user.controller";
import { authMiddleware } from "../../../shared/infrastructure/auth.middleware";
import { requirePermissions } from "../../authorization/infrastructure/authorization.middleware";

const router = Router();
const controller = new UserController();

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User Management Endpoints
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 */
router.get("/", authMiddleware, requirePermissions("admin.users"), controller.listUsers);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 */
router.get("/me", authMiddleware, controller.getMe);

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Search users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */
router.get("/search", authMiddleware, requirePermissions("admin.users"), controller.searchUsers);

/**
 * @swagger
 * /users/departments:
 *   get:
 *     summary: List all departments
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of departments
 */
router.get("/departments", authMiddleware, controller.getDepartments);

/**
 * @swagger
 * /users/managers:
 *   get:
 *     summary: List all managers
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of managers
 */
router.get("/managers", authMiddleware, requirePermissions("admin.users"), controller.getManagers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 */
router.get("/:id", authMiddleware, requirePermissions("admin.users"), controller.getUserById);

/**
 * @swagger
 * /users/{id}/roles:
 *   get:
 *     summary: Get user roles
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User roles
 */
router.get("/:id/roles", authMiddleware, requirePermissions("admin.users"), controller.getUserRoles);

/**
 * @swagger
 * /users/{id}/permissions:
 *   get:
 *     summary: Get user permissions
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User permissions
 */
router.get("/:id/permissions", authMiddleware, requirePermissions("admin.users"), controller.getUserPermissions);

/**
 * @swagger
 * /users/{id}/projects:
 *   get:
 *     summary: Get user projects
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User projects
 */
router.get("/:id/projects", authMiddleware, requirePermissions("admin.users"), controller.getUserProjects);

/**
 * @swagger
 * /users/{id}/tasks:
 *   get:
 *     summary: Get user tasks
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User tasks
 */
router.get("/:id/tasks", authMiddleware, requirePermissions("admin.users"), controller.getUserTasks);
router.get("/:id/risks-issues", authMiddleware, requirePermissions("admin.users"), controller.getUserRisksAndIssues);
router.get("/:id/audit-logs", authMiddleware, requirePermissions("admin.users"), controller.getUserAuditLogs);
router.get("/:id/chat-messages", authMiddleware, requirePermissions("admin.users"), controller.getUserChatMessages);
router.get("/:id/change-requests", authMiddleware, requirePermissions("admin.users"), controller.getUserChangeRequests);
router.get("/:id/security-logs", authMiddleware, requirePermissions("admin.users"), controller.getUserSecurityLogs);
router.get("/:id/login-history", authMiddleware, requirePermissions("admin.users"), controller.getUserLoginHistory);
router.get("/:id/resources", authMiddleware, requirePermissions("admin.users"), controller.getUserResources);
router.get("/:id/milestones", authMiddleware, requirePermissions("admin.users"), controller.getUserMilestones);

export default router;
