import { eq, and, inArray, sql, or, like } from "drizzle-orm";
import { db } from "../../../shared/database/index.ts";
import { 
  roles, 
  userRoles, 
  rolePermissions, 
  permissions, 
  userPermissions, 
  permissionAuditLogs,
  permissionGroups,
  permissionCategories
} from "../../../db/schema.ts";
import logger from "../../../shared/infrastructure/logger.ts";

export interface CreateRoleInput {
  name: string;
  code: string;
  description?: string;
  permissionNames: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissionNames?: string[];
}

export class AuthorizationService {

  /**
   * Compiles the complete list of effective permission codes for a user.
   * Leverages: Roles permissions + Direct ALLOW overrides - Direct DENY overrides.
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      // 1. Fetch user's roles
      const userRolesList = await db
        .select({
          roleId: roles.id,
          roleCode: roles.code,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId));

      if (userRolesList.length === 0 && userId) {
        // Fallback or guest user? Let's check direct overrides first.
      }

      // Check if user is Super Admin
      const isSuperAdmin = userRolesList.some((r) => r.roleCode === "super_admin");
      
      // If Super Admin, they have all permissions unless explicitly DENIED
      let rolePermissionCodes: string[] = [];
      
      if (isSuperAdmin) {
        const allPermsList = await db.select({ name: permissions.name }).from(permissions);
        rolePermissionCodes = allPermsList.map((p) => p.name);
      } else if (userRolesList.length > 0) {
        const roleIds = userRolesList.map((ur) => ur.roleId);
        
        // Fetch permissions for all assigned roles
        const rolePerms = await db
          .select({
            permName: permissions.name,
          })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(inArray(rolePermissions.roleId, roleIds));
        
        rolePermissionCodes = Array.from(new Set(rolePerms.map((rp) => rp.permName)));
      }

      // 2. Fetch Direct User Overrides (ALLOW / DENY)
      const directOverrides = await db
        .select({
          permName: permissions.name,
          type: userPermissions.type,
        })
        .from(userPermissions)
        .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
        .where(eq(userPermissions.userId, userId));

      const allows = directOverrides.filter((o) => o.type === "ALLOW").map((o) => o.permName);
      const denies = new Set(directOverrides.filter((o) => o.type === "DENY").map((o) => o.permName));

      // 3. Compile final list: (Role Perms + Direct Allows) - Direct Denies
      const combined = new Set([...rolePermissionCodes, ...allows]);
      const finalPermissions = Array.from(combined).filter((pName) => !denies.has(pName));

      return finalPermissions;
    } catch (error) {
      logger.error({ error, userId }, "Error compiling user permissions");
      throw error;
    }
  }

  /**
   * Checks if a user has specific permission(s).
   */
  async hasPermission(
    userId: string, 
    requiredPermissions: string | string[], 
    options?: { logical?: "AND" | "OR" }
  ): Promise<boolean> {
    const logical = options?.logical ?? "AND";
    const userPerms = await this.getUserPermissions(userId);
    const userPermSet = new Set(userPerms);

    const reqPermList = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

    if (reqPermList.length === 0) return true;

    if (logical === "AND") {
      return reqPermList.every((p) => userPermSet.has(p));
    } else {
      return reqPermList.some((p) => userPermSet.has(p));
    }
  }

  /**
   * Assign a role to a user.
   */
  async assignRoleToUser(actorId: string, userId: string, roleCode: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      const [role] = await db.select().from(roles).where(eq(roles.code, roleCode)).limit(1);
      if (!role) {
        throw new Error(`Role with code '${roleCode}' not found`);
      }

      // Check if already assigned
      const [existing] = await db
        .select()
        .from(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, role.id)))
        .limit(1);

      if (existing) {
        return; // Already assigned
      }

      await db.transaction(async (tx) => {
        await tx.insert(userRoles).values({
          userId,
          roleId: role.id,
          assignedBy: actorId,
          createdAt: new Date(),
        });

        await tx.insert(permissionAuditLogs).values({
          actorId,
          action: "USER_ROLE_ASSIGN",
          targetType: "USER",
          targetId: userId,
          details: JSON.stringify({ roleCode, roleName: role.name }),
          ipAddress,
          userAgent,
          createdAt: new Date(),
        });
      });

      logger.info(`User ${userId} was assigned role ${roleCode} by actor ${actorId}`);
    } catch (error) {
      logger.error({ error, userId, roleCode }, "Error assigning role to user");
      throw error;
    }
  }

  /**
   * Remove a role from a user.
   */
  async removeRoleFromUser(actorId: string, userId: string, roleCode: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      const [role] = await db.select().from(roles).where(eq(roles.code, roleCode)).limit(1);
      if (!role) {
        throw new Error(`Role with code '${roleCode}' not found`);
      }

      const [existing] = await db
        .select()
        .from(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, role.id)))
        .limit(1);

      if (!existing) {
        return; // Not assigned anyway
      }

      await db.transaction(async (tx) => {
        await tx
          .delete(userRoles)
          .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, role.id)));

        await tx.insert(permissionAuditLogs).values({
          actorId,
          action: "USER_ROLE_REMOVE",
          targetType: "USER",
          targetId: userId,
          details: JSON.stringify({ roleCode, roleName: role.name }),
          ipAddress,
          userAgent,
          createdAt: new Date(),
        });
      });

      logger.info(`User ${userId} had role ${roleCode} removed by actor ${actorId}`);
    } catch (error) {
      logger.error({ error, userId, roleCode }, "Error removing role from user");
      throw error;
    }
  }

  /**
   * Assign a direct override permission (ALLOW or DENY) directly to a user account.
   */
  async assignDirectPermissionToUser(
    actorId: string, 
    userId: string, 
    permissionName: string, 
    type: "ALLOW" | "DENY",
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const [perm] = await db.select().from(permissions).where(eq(permissions.name, permissionName)).limit(1);
      if (!perm) {
        throw new Error(`Permission '${permissionName}' does not exist`);
      }

      // Check if an override already exists
      const [existing] = await db
        .select()
        .from(userPermissions)
        .where(and(eq(userPermissions.userId, userId), eq(userPermissions.permissionId, perm.id)))
        .limit(1);

      await db.transaction(async (tx) => {
        if (existing) {
          if (existing.type === type) return; // Unchanged
          await tx
            .update(userPermissions)
            .set({ type, assignedBy: actorId, createdAt: new Date() })
            .where(eq(userPermissions.id, existing.id));
        } else {
          await tx.insert(userPermissions).values({
            userId,
            permissionId: perm.id,
            type,
            assignedBy: actorId,
            createdAt: new Date(),
          });
        }

        await tx.insert(permissionAuditLogs).values({
          actorId,
          action: "USER_DIRECT_PERMISSION_ASSIGN",
          targetType: "USER",
          targetId: userId,
          details: JSON.stringify({ permissionName, type }),
          ipAddress,
          userAgent,
          createdAt: new Date(),
        });
      });

      logger.info(`User ${userId} assigned direct override ${type} for '${permissionName}' by ${actorId}`);
    } catch (error) {
      logger.error({ error, userId, permissionName, type }, "Error assigning direct permission override");
      throw error;
    }
  }

  /**
   * Remove direct override permission from user.
   */
  async removeDirectPermissionFromUser(
    actorId: string, 
    userId: string, 
    permissionName: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const [perm] = await db.select().from(permissions).where(eq(permissions.name, permissionName)).limit(1);
      if (!perm) {
        throw new Error(`Permission '${permissionName}' does not exist`);
      }

      const [existing] = await db
        .select()
        .from(userPermissions)
        .where(and(eq(userPermissions.userId, userId), eq(userPermissions.permissionId, perm.id)))
        .limit(1);

      if (!existing) return;

      await db.transaction(async (tx) => {
        await tx.delete(userPermissions).where(eq(userPermissions.id, existing.id));

        await tx.insert(permissionAuditLogs).values({
          actorId,
          action: "USER_DIRECT_PERMISSION_REMOVE",
          targetType: "USER",
          targetId: userId,
          details: JSON.stringify({ permissionName }),
          ipAddress,
          userAgent,
          createdAt: new Date(),
        });
      });

      logger.info(`User ${userId} direct override for '${permissionName}' removed by ${actorId}`);
    } catch (error) {
      logger.error({ error, userId, permissionName }, "Error removing direct override permission");
      throw error;
    }
  }

  /**
   * Creates a new custom Enterprise Role.
   */
  async createCustomRole(actorId: string, input: CreateRoleInput, ipAddress?: string, userAgent?: string): Promise<any> {
    try {
      // Validate code unique
      const [existing] = await db.select().from(roles).where(eq(roles.code, input.code)).limit(1);
      if (existing) {
        throw new Error(`Role code '${input.code}' is already in use`);
      }

      // Check permission names exist
      let permIds: string[] = [];
      if (input.permissionNames.length > 0) {
        const foundPerms = await db
          .select()
          .from(permissions)
          .where(inArray(permissions.name, input.permissionNames));
        
        if (foundPerms.length !== input.permissionNames.length) {
          const foundSet = new Set(foundPerms.map((p) => p.name));
          const missing = input.permissionNames.filter((name) => !foundSet.has(name));
          throw new Error(`Invalid permissions requested: ${missing.join(", ")}`);
        }
        permIds = foundPerms.map((p) => p.id);
      }

      const newRole = await db.transaction(async (tx) => {
        const [role] = await tx.insert(roles).values({
          name: input.name,
          code: input.code,
          description: input.description ?? "",
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();

        if (permIds.length > 0) {
          const mappings = permIds.map((pid) => ({
            roleId: role.id,
            permissionId: pid,
            assignedBy: actorId,
            createdAt: new Date(),
          }));
          await tx.insert(rolePermissions).values(mappings);
        }

        await tx.insert(permissionAuditLogs).values({
          actorId,
          action: "ROLE_CREATE",
          targetType: "ROLE",
          targetId: role.id,
          details: JSON.stringify({ code: role.code, name: role.name, permissionCount: permIds.length }),
          ipAddress,
          userAgent,
          createdAt: new Date(),
        });

        return role;
      });

      logger.info(`Custom role ${input.code} created successfully by ${actorId}`);
      return newRole;
    } catch (error) {
      logger.error({ error, input }, "Error creating custom role");
      throw error;
    }
  }

  /**
   * Updates an existing Enterprise Role and syncs its mapped permissions.
   */
  async updateCustomRole(actorId: string, roleCode: string, input: UpdateRoleInput, ipAddress?: string, userAgent?: string): Promise<any> {
    try {
      const [role] = await db.select().from(roles).where(eq(roles.code, roleCode)).limit(1);
      if (!role) {
        throw new Error(`Role with code '${roleCode}' not found`);
      }

      if (role.isSystem && (input.name || input.permissionNames)) {
        // System roles can be augmented with permissions, but standard names are locked.
        // We'll allow editing system role permission mapping, but lock its code/name representation.
      }

      const updated = await db.transaction(async (tx) => {
        // Update basic attributes if provided
        const updatePayload: Record<string, any> = { updatedAt: new Date() };
        if (input.name && !role.isSystem) updatePayload.name = input.name;
        if (input.description !== undefined) updatePayload.description = input.description;

        await tx.update(roles).set(updatePayload).where(eq(roles.id, role.id));

        // Sync permissions if provided
        if (input.permissionNames) {
          let permIds: string[] = [];
          if (input.permissionNames.length > 0) {
            const foundPerms = await tx
              .select()
              .from(permissions)
              .where(inArray(permissions.name, input.permissionNames));
            
            if (foundPerms.length !== input.permissionNames.length) {
              const foundSet = new Set(foundPerms.map((p) => p.name));
              const missing = input.permissionNames.filter((name) => !foundSet.has(name));
              throw new Error(`Invalid permissions requested: ${missing.join(", ")}`);
            }
            permIds = foundPerms.map((p) => p.id);
          }

          // Clear existing mappings
          await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));

          // Set new mappings
          if (permIds.length > 0) {
            const mappings = permIds.map((pid) => ({
              roleId: role.id,
              permissionId: pid,
              assignedBy: actorId,
              createdAt: new Date(),
            }));
            await tx.insert(rolePermissions).values(mappings);
          }
        }

        await tx.insert(permissionAuditLogs).values({
          actorId,
          action: "ROLE_UPDATE",
          targetType: "ROLE",
          targetId: role.id,
          details: JSON.stringify({ 
            code: role.code, 
            updatedFields: Object.keys(updatePayload),
            permissionCount: input.permissionNames?.length 
          }),
          ipAddress,
          userAgent,
          createdAt: new Date(),
        });

        return { ...role, ...updatePayload };
      });

      logger.info(`Role ${roleCode} updated by ${actorId}`);
      return updated;
    } catch (error) {
      logger.error({ error, roleCode, input }, "Error updating role");
      throw error;
    }
  }

  /**
   * Deletes a custom Enterprise Role.
   */
  async deleteCustomRole(actorId: string, roleCode: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      const [role] = await db.select().from(roles).where(eq(roles.code, roleCode)).limit(1);
      if (!role) {
        throw new Error(`Role with code '${roleCode}' not found`);
      }

      if (role.isSystem) {
        throw new Error("System roles cannot be deleted. They are critical to platform infrastructure security.");
      }

      await db.transaction(async (tx) => {
        // Clear mappings
        await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
        await tx.delete(userRoles).where(eq(userRoles.roleId, role.id));
        
        // Delete Role
        await tx.delete(roles).where(eq(roles.id, role.id));

        await tx.insert(permissionAuditLogs).values({
          actorId,
          action: "ROLE_DELETE",
          targetType: "ROLE",
          targetId: role.id,
          details: JSON.stringify({ code: role.code, name: role.name }),
          ipAddress,
          userAgent,
          createdAt: new Date(),
        });
      });

      logger.info(`Custom role ${roleCode} deleted by ${actorId}`);
    } catch (error) {
      logger.error({ error, roleCode }, "Error deleting custom role");
      throw error;
    }
  }

  /**
   * Retrieves the full authorization role-permission mapping matrix.
   */
  async getPermissionMatrix(): Promise<any> {
    try {
      const allRoles = await db.select().from(roles);
      const allPerms = await db.select().from(permissions);
      const allMappings = await db.select().from(rolePermissions);

      // Map roles to their mapped permission IDs
      const matrix: Record<string, string[]> = {};
      
      for (const r of allRoles) {
        const mappings = allMappings.filter((m) => m.roleId === r.id);
        const mappedPermIds = mappings.map((m) => m.permissionId);
        const mappedPermNames = allPerms
          .filter((p) => mappedPermIds.includes(p.id))
          .map((p) => p.name);
        
        matrix[r.code] = mappedPermNames;
      }

      return {
        roles: allRoles.map((r) => ({ code: r.code, name: r.name, description: r.description, isSystem: r.isSystem })),
        permissionsCount: allPerms.length,
        matrix
      };
    } catch (error) {
      logger.error(error, "Error getting permission matrix");
      throw error;
    }
  }

  /**
   * Returns a detailed profile of a user's security and permissions state.
   */
  async getUserEffectivePermissionsAndRoles(userId: string): Promise<any> {
    try {
      // User assigned roles
      const assignedRoles = await db
        .select({
          code: roles.code,
          name: roles.name,
          description: roles.description,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId));

      // Direct overrides
      const overrides = await db
        .select({
          name: permissions.name,
          label: permissions.label,
          type: userPermissions.type,
        })
        .from(userPermissions)
        .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
        .where(eq(userPermissions.userId, userId));

      // Effective Permissions list
      const effectivePermissions = await this.getUserPermissions(userId);

      return {
        userId,
        roles: assignedRoles,
        directOverrides: overrides,
        effectivePermissions
      };
    } catch (error) {
      logger.error({ error, userId }, "Error compiling user security profile");
      throw error;
    }
  }

  /**
   * Lists all roles.
   */
  async listAllRoles(): Promise<any[]> {
    return db.select().from(roles);
  }

  /**
   * Lists all permissions, beautifully grouped by Category -> Group -> Item.
   */
  async listAllPermissions(): Promise<any[]> {
    try {
      const cats = await db.select().from(permissionCategories);
      const grps = await db.select().from(permissionGroups);
      const perms = await db.select().from(permissions);

      return cats.map((cat) => {
        const catGroups = grps.filter((g) => g.categoryId === cat.id);
        return {
          id: cat.id,
          name: cat.name,
          code: cat.code,
          description: cat.description,
          groups: catGroups.map((g) => {
            const groupPerms = perms.filter((p) => p.groupId === g.id);
            return {
              id: g.id,
              name: g.name,
              code: g.code,
              description: g.description,
              permissions: groupPerms.map((p) => ({
                id: p.id,
                name: p.name,
                label: p.label,
                description: p.description,
                isSystem: p.isSystem
              }))
            };
          })
        };
      });
    } catch (error) {
      logger.error(error, "Error listing grouped permissions");
      throw error;
    }
  }

  /**
   * Searches permissions dynamically by label, code, description.
   */
  async searchPermissions(query: string): Promise<any[]> {
    const term = `%${query}%`;
    return db
      .select({
        id: permissions.id,
        name: permissions.name,
        label: permissions.label,
        description: permissions.description
      })
      .from(permissions)
      .where(
        or(
          like(permissions.name, term),
          like(permissions.label, term),
          like(permissions.description, term)
        )
      )
      .limit(50);
  }

  /**
   * Retrieves security audit logs for tracing user actions.
   */
  async getSecurityAuditLogs(filters?: { actorId?: string; action?: string; limit?: number }): Promise<any[]> {
    const limit = filters?.limit ?? 100;
    const conditions = [];

    if (filters?.actorId) conditions.push(eq(permissionAuditLogs.actorId, filters.actorId));
    if (filters?.action) conditions.push(eq(permissionAuditLogs.action, filters.action));

    const query = db
      .select()
      .from(permissionAuditLogs)
      .orderBy(sql`${permissionAuditLogs.createdAt} DESC`)
      .limit(limit);

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    return query;
  }
}
