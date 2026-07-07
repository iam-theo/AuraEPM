import { db } from "../../../shared/database";
import { 
  users, userRoles, roles, permissions, rolePermissions, 
  projects, tasks, risksAndIssues, auditLogs, 
  chatMessages, changeRequests, securityAuditLogs, loginHistory,
  resources, resourceAllocations
} from "../../../db/schema.ts";
import { eq, and, or, ilike, desc, asc, count, inArray, isNotNull, sql } from "drizzle-orm";
import { UserSearchFilters } from "../application/user.dto";

export class UserRepository {
  async findAll(filters: UserSearchFilters) {
    const { 
      search, department, status, role, 
      page = 1, limit = 10, 
      sortBy = 'createdAt', sortOrder = 'desc' 
    } = filters;

    const offset = (page - 1) * limit;
    
    let query = db.select().from(users);
    
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(users.username, `%${search}%`)
        )
      );
    }
    
    if (department) {
      conditions.push(eq(users.department, department));
    }
    
    if (status) {
      conditions.push(eq(users.status, status as any));
    }

    if (role) {
      // Join with userRoles and roles
      const subquery = db.select({ userId: userRoles.userId })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(roles.code, role));
      
      conditions.push(inArray(users.id, subquery));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // @ts-ignore
    const dataQuery = db.select().from(users).where(whereClause);
    
    // Sorting
    const sortField = (users as any)[sortBy] || users.createdAt;
    const sortedQuery = sortOrder === 'asc' ? dataQuery.orderBy(asc(sortField)) : dataQuery.orderBy(desc(sortField));
    
    const data = await sortedQuery.limit(limit).offset(offset);
    
    // Count total
    const [totalResult] = await db.select({ value: count() }).from(users).where(whereClause);
    const total = Number(totalResult.value);

    return { data, total };
  }

  async findById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async findByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async listDepartments() {
    const result = await db.select({ department: users.department })
      .from(users)
      .where(isNotNull(users.department))
      .groupBy(users.department);
    return result.map(r => r.department);
  }

  async findUserRoles(userId: string) {
    return await db.select({
      id: roles.id,
      name: roles.name,
      code: roles.code,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));
  }

  async findUserPermissions(userId: string) {
    // Get permissions through roles
    const rolePerms = await db.select({
      name: permissions.name,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(userRoles.userId, userId));

    return Array.from(new Set(rolePerms.map(p => p.name)));
  }

  async findUserProjects(userId: string) {
    // Deep search: find projects where user is manager OR allocated as a resource
    const resourceIdsSubquery = db.select({ id: resources.id })
      .from(resources)
      .where(eq(resources.userId, userId));

    const allocatedProjectsSubquery = db.select({ projectId: resourceAllocations.projectId })
      .from(resourceAllocations)
      .where(inArray(resourceAllocations.resourceId, resourceIdsSubquery));

    return await db.select().from(projects)
      .where(
        or(
          eq(projects.managerId, userId),
          inArray(projects.id, allocatedProjectsSubquery)
        )
      );
  }

  async findUserTasks(userId: string) {
    // Deep search: find tasks where user is assignee OR linked via resourceId
    const resourceIdsSubquery = db.select({ id: sql<string>`cast(${resources.id} as text)` })
      .from(resources)
      .where(eq(resources.userId, userId));

    return await db.select().from(tasks)
      .where(
        or(
          eq(tasks.assigneeId, userId),
          inArray(tasks.assigneeId, resourceIdsSubquery)
        )
      );
  }

  async findUserRisksAndIssues(userId: string) {
    return await db.select().from(risksAndIssues).where(eq(risksAndIssues.ownerId, userId));
  }

  async findUserAuditLogs(userId: string) {
    return await db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(desc(auditLogs.createdAt)).limit(50);
  }

  async findUserChatMessages(userId: string) {
    return await db.select().from(chatMessages).where(eq(chatMessages.authorId, userId)).orderBy(desc(chatMessages.createdAt)).limit(50);
  }

  async findUserChangeRequests(userId: string) {
    return await db.select().from(changeRequests).where(eq(changeRequests.createdBy, userId));
  }

  async findUserSecurityLogs(userId: string) {
    return await db.select().from(securityAuditLogs).where(eq(securityAuditLogs.userId, userId as any)).orderBy(desc(securityAuditLogs.createdAt)).limit(50);
  }

  async findUserLoginHistory(userId: string) {
    return await db.select().from(loginHistory).where(eq(loginHistory.userId, userId as any)).orderBy(desc(loginHistory.createdAt)).limit(50);
  }

  async findUserResources(userId: string) {
    return await db.select().from(resources).where(eq(resources.userId, userId));
  }

  async findUserMilestones(userId: string) {
    // Milestones are stored in projects table as JSON
    const userProjects = await this.findUserProjects(userId);
    const milestones: any[] = [];
    
    userProjects.forEach(project => {
      if (project.milestonesJson) {
        try {
          const projectMilestones = JSON.parse(project.milestonesJson);
          if (Array.isArray(projectMilestones)) {
            projectMilestones.forEach(m => {
              milestones.push({
                ...m,
                projectId: project.id,
                projectName: project.name
              });
            });
          }
        } catch (e) {
          console.error("Failed to parse milestones JSON for project", project.id);
        }
      }
    });
    
    return milestones;
  }

  async listManagers() {
    // Managers are often defined by a role or specific field, for now just list those in projects
    // or those with 'manager' in jobTitle
    return await db.select()
      .from(users)
      .where(or(
        ilike(users.jobTitle, '%Manager%'),
        ilike(users.jobTitle, '%Director%'),
        ilike(users.jobTitle, '%Lead%')
      ));
  }
}
