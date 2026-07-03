import { dbState, generateUUID, saveDatabase } from "../../db.ts";
import { TimeLog, Issue, Risk } from "../../types.ts";

export class TimeIssuesRisksRepository {
  // ==========================================
  // TIME LOGS
  // ==========================================
  async getTimeLogsByProject(projectId: string): Promise<TimeLog[]> {
    return dbState.timeLogs.filter(tl => tl.projectId === projectId);
  }

  async createTimeLog(data: Partial<TimeLog>): Promise<TimeLog> {
    const newLog: TimeLog = {
      id: generateUUID(),
      projectId: data.projectId!,
      taskId: data.taskId || null,
      teamMemberId: data.teamMemberId!,
      hours: data.hours!,
      date: data.date!,
      description: data.description!,
      isBillable: data.isBillable !== undefined ? data.isBillable : true,
      isApproved: false,
      createdAt: new Date().toISOString()
    };

    dbState.timeLogs.push(newLog);
    
    // Accumulate task actual hours automatically!
    if (data.taskId) {
      const task = dbState.tasks.find(t => t.id === data.taskId);
      if (task) {
        task.actualHours += data.hours!;
      }
    }

    saveDatabase();
    return newLog;
  }

  async approveTimeLog(id: string, approvedBy: string): Promise<TimeLog | null> {
    const index = dbState.timeLogs.findIndex(tl => tl.id === id);
    if (index === -1) return null;

    dbState.timeLogs[index].isApproved = true;
    dbState.timeLogs[index].approvedBy = approvedBy;
    
    saveDatabase();
    return dbState.timeLogs[index];
  }

  // ==========================================
  // ISSUES
  // ==========================================
  async getIssuesByProject(projectId: string): Promise<Issue[]> {
    return dbState.issues.filter(i => i.projectId === projectId && !i.deletedAt);
  }

  async findIssueById(id: string): Promise<Issue | null> {
    return dbState.issues.find(i => i.id === id && !i.deletedAt) || null;
  }

  async createIssue(data: Partial<Issue>): Promise<Issue> {
    const newIssue: Issue = {
      id: generateUUID(),
      projectId: data.projectId!,
      title: data.title!,
      description: data.description!,
      severity: data.severity || "MEDIUM" as any,
      priority: data.priority || "MEDIUM" as any,
      status: "OPEN" as any,
      reporterId: data.reporterId!,
      assigneeId: data.assigneeId || null,
      rootCause: null,
      resolution: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    };

    dbState.issues.push(newIssue);
    saveDatabase();
    return newIssue;
  }

  async updateIssue(id: string, data: Partial<Issue>): Promise<Issue | null> {
    const index = dbState.issues.findIndex(i => i.id === id && !i.deletedAt);
    if (index === -1) return null;

    dbState.issues[index] = {
      ...dbState.issues[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    saveDatabase();
    return dbState.issues[index];
  }

  async deleteIssue(id: string): Promise<boolean> {
    const index = dbState.issues.findIndex(i => i.id === id && !i.deletedAt);
    if (index === -1) return false;

    dbState.issues[index].deletedAt = new Date().toISOString();
    saveDatabase();
    return true;
  }

  // ==========================================
  // RISKS
  // ==========================================
  async getRisksByProject(projectId: string): Promise<Risk[]> {
    return dbState.risks.filter(r => r.projectId === projectId && !r.deletedAt);
  }

  async findRiskById(id: string): Promise<Risk | null> {
    return dbState.risks.find(r => r.id === id && !r.deletedAt) || null;
  }

  async createRisk(data: Partial<Risk>): Promise<Risk> {
    const newRisk: Risk = {
      id: generateUUID(),
      projectId: data.projectId!,
      title: data.title!,
      description: data.description!,
      probability: data.probability!,
      impact: data.impact!,
      mitigationStrategy: data.mitigationStrategy!,
      escalationPlan: data.escalationPlan || null,
      status: "IDENTIFIED",
      ownerId: data.ownerId!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    };

    dbState.risks.push(newRisk);
    saveDatabase();
    return newRisk;
  }

  async updateRisk(id: string, data: Partial<Risk>): Promise<Risk | null> {
    const index = dbState.risks.findIndex(r => r.id === id && !r.deletedAt);
    if (index === -1) return null;

    dbState.risks[index] = {
      ...dbState.risks[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    saveDatabase();
    return dbState.risks[index];
  }

  async deleteRisk(id: string): Promise<boolean> {
    const index = dbState.risks.findIndex(r => r.id === id && !r.deletedAt);
    if (index === -1) return false;

    dbState.risks[index].deletedAt = new Date().toISOString();
    saveDatabase();
    return true;
  }
}
