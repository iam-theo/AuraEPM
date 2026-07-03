import { Router } from "express";
import { authMiddleware } from "../../../shared/infrastructure/auth.middleware.ts";
import { requirePermissions } from "../infrastructure/authorization.middleware.ts";
import { AuthorizationController } from "./authorization.controller.ts";

const router = Router();
const controller = new AuthorizationController();

// 1. Get calling user's own security footprint (Open to any authenticated account)
router.get("/users/me/profile", authMiddleware, controller.getOwnSecurityProfile);

// 2. Dictionary list & search actions (Requires admin.permissions)
router.get("/permissions", authMiddleware, requirePermissions("admin.permissions"), controller.listPermissions);
router.get("/permissions/search", authMiddleware, requirePermissions("admin.permissions"), controller.searchPermissions);
router.get("/matrix", authMiddleware, requirePermissions("admin.permissions"), controller.getPermissionMatrix);

// 3. Administer authorization roles configurations (Requires admin.roles)
router.get("/roles", authMiddleware, requirePermissions("admin.roles"), controller.listRoles);
router.post("/roles", authMiddleware, requirePermissions("admin.roles"), controller.createCustomRole);
router.put("/roles/:code", authMiddleware, requirePermissions("admin.roles"), controller.updateCustomRole);
router.delete("/roles/:code", authMiddleware, requirePermissions("admin.roles"), controller.deleteCustomRole);

// 4. Assigning/removing roles to user accounts (Requires admin.role_assignment)
router.post("/users/:userId/roles", authMiddleware, requirePermissions("admin.role_assignment"), controller.assignRoleToUser);
router.delete("/users/:userId/roles/:roleCode", authMiddleware, requirePermissions("admin.role_assignment"), controller.removeRoleFromUser);

// 5. Hardcoding direct overrides allowances/denials (Requires admin.user_assignment)
router.post("/users/:userId/permissions", authMiddleware, requirePermissions("admin.user_assignment"), controller.assignDirectPermissionToUser);
router.delete("/users/:userId/permissions/:permissionName", authMiddleware, requirePermissions("admin.user_assignment"), controller.removeDirectPermissionFromUser);

// 6. Accessing other users security footprints (Requires admin.users)
router.get("/users/:userId/profile", authMiddleware, requirePermissions("admin.users"), controller.getUserSecurityProfile);

// 7. Security and access changes audit history logs (Requires admin.logs)
router.get("/logs", authMiddleware, requirePermissions("admin.logs"), controller.getSecurityAuditLogs);

export default router;
