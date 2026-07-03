import { dbState } from "../../db.ts";
import { Project, AuditLog } from "../../types.ts";

export class DashboardRepository {
  /**
   * Fetch all active, non-soft-deleted projects
   */
  async getActiveProjects(): Promise<Project[]> {
    return dbState.projects.filter(p => !p.deletedAt);
  }

  /**
   * Fetch a specific project by UUID
   */
  async getProjectById(id: string): Promise<Project | null> {
    const project = dbState.projects.find(p => p.id === id && !p.deletedAt);
    return project || null;
  }

  /**
   * Fetch the global audit logs / activity feed
   */
  async getActivityFeed(projectId?: string, limit = 15): Promise<AuditLog[]> {
    let logs = dbState.auditLogs;
    if (projectId) {
      logs = logs.filter(l => l.projectId === projectId);
    }
    return logs.slice(0, limit);
  }

  /**
   * Fetch total task status aggregations
   */
  async getTaskStatusCounts(projectId?: string) {
    let tasks = dbState.tasks.filter(t => !t.deletedAt);
    if (projectId) {
      tasks = tasks.filter(t => t.projectId === projectId);
    }

    const counts = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
    tasks.forEach(t => {
      if (counts[t.status] !== undefined) {
        counts[t.status]++;
      }
    });

    return counts;
  }

  /**
   * Fetch total issue severities
   */
  async getIssueSeverityCounts(projectId?: string) {
    let issues = dbState.issues.filter(i => !i.deletedAt);
    if (projectId) {
      issues = issues.filter(i => i.projectId === projectId);
    }

    const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    issues.forEach(i => {
      if (counts[i.severity] !== undefined) {
        counts[i.severity]++;
      }
    });

    return counts;
  }
}
