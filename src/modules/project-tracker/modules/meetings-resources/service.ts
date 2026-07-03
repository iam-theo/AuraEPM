import { MeetingsResourcesRepository } from "./repository.ts";
import { Meeting } from "../../types.ts";
import { dbState } from "../../db.ts";

export class MeetingsResourcesService {
  private repository = new MeetingsResourcesRepository();

  // ==========================================
  // MEETINGS
  // ==========================================
  async getMeetings(projectId: string): Promise<Meeting[]> {
    return this.repository.getMeetingsByProject(projectId);
  }

  async createMeeting(data: Partial<Meeting>): Promise<Meeting> {
    return this.repository.createMeeting(data);
  }

  async updateMeeting(id: string, data: Partial<Meeting>): Promise<Meeting> {
    const updated = await this.repository.updateMeeting(id, data);
    if (!updated) throw new Error("Meeting schedule not found to update");
    return updated;
  }

  // ==========================================
  // CAPACITY & RESOURCES PLANNING
  // ==========================================
  async getResourceAllocationReport(projectId: string) {
    const members = dbState.teamMembers.filter(m => m.projectId === projectId && !m.deletedAt);
    const logs = dbState.timeLogs.filter(l => l.projectId === projectId);

    const reports = members.map(m => {
      // Get logged hours for this week
      const memberLogs = logs.filter(l => l.teamMemberId === m.id);
      const hoursLogged = memberLogs.reduce((acc, l) => acc + l.hours, 0);
      
      const utilizationPercent = m.capacity > 0 
        ? Math.round((hoursLogged / m.capacity) * 100)
        : 0;

      let availabilityStatus: "AVAILABLE" | "LIMITED" | "UNAVAILABLE" = "AVAILABLE";
      if (utilizationPercent >= 100) {
        availabilityStatus = "UNAVAILABLE";
      } else if (utilizationPercent >= 80) {
        availabilityStatus = "LIMITED";
      }

      return {
        memberId: m.id,
        name: m.name,
        role: m.role,
        capacityHours: m.capacity,
        hoursLogged,
        utilizationPercent,
        allocationPercent: m.allocation,
        availabilityStatus
      };
    });

    return reports;
  }

  // ==========================================
  // EARNED VALUE MANAGEMENT (EVM) MATHEMATICS
  // ==========================================
  async getProjectProgressEVM(projectId: string) {
    const project = dbState.projects.find(p => p.id === projectId && !p.deletedAt);
    if (!project) throw new Error("Project record not found");

    const tasks = dbState.tasks.filter(t => t.projectId === projectId && !t.deletedAt);
    const logs = dbState.timeLogs.filter(l => l.projectId === projectId);

    const budget = project.budget || 100000; // BAC: Budget At Completion
    const progressPercent = project.progress / 100; // 0.0 to 1.0

    // 1. EV (Earned Value) = BAC * Progress%
    const earnedValue = budget * progressPercent;

    // 2. PV (Planned Value) = BAC * Expected% (calculated linearly across timeline days)
    const start = new Date(project.startDate).getTime();
    const end = new Date(project.endDate).getTime();
    const today = new Date().getTime();

    let plannedValue = 0;
    if (today <= start) {
      plannedValue = 0;
    } else if (today >= end) {
      plannedValue = budget;
    } else {
      const totalDays = end - start;
      const elapsedDays = today - start;
      const expectedProgress = elapsedDays / totalDays;
      plannedValue = budget * expectedProgress;
    }

    // 3. AC (Actual Cost) = Logged Hours * Avg Billing Rate ($75/hour)
    const totalHoursLogged = logs.reduce((sum, l) => sum + l.hours, 0);
    const avgBillingRate = 75; // standard rate in USD/hr
    const actualCost = totalHoursLogged * avgBillingRate;

    // 4. Variances
    const costVariance = earnedValue - actualCost; // CV = EV - AC
    const scheduleVariance = earnedValue - plannedValue; // SV = EV - PV

    // 5. Performance Indexes
    const costPerformanceIndex = actualCost > 0 ? (earnedValue / actualCost) : 1.0; // CPI = EV/AC
    const schedulePerformanceIndex = plannedValue > 0 ? (earnedValue / plannedValue) : 1.0; // SPI = EV/PV

    // 6. Project Health Score (Derived composite KPI)
    // Combined index between CPI (weight 0.5) and SPI (weight 0.5) capped at 100
    const compositeIndex = (costPerformanceIndex * 0.5) + (schedulePerformanceIndex * 0.5);
    const healthScore = Math.min(100, Math.max(0, Math.round(compositeIndex * 100)));

    return {
      projectId,
      projectName: project.name,
      progressPercent: project.progress,
      budgetAtCompletion: budget,
      earnedValue: Math.round(earnedValue),
      plannedValue: Math.round(plannedValue),
      actualCost: Math.round(actualCost),
      variances: {
        costVariance: Math.round(costVariance),
        scheduleVariance: Math.round(scheduleVariance)
      },
      indexes: {
        CPI: parseFloat(costPerformanceIndex.toFixed(2)),
        SPI: parseFloat(schedulePerformanceIndex.toFixed(2))
      },
      healthScore,
      interpretation: {
        costStatus: costVariance >= 0 ? "UNDER_BUDGET" : "OVER_BUDGET",
        scheduleStatus: scheduleVariance >= 0 ? "AHEAD_OF_SCHEDULE" : "BEHIND_OF_SCHEDULE"
      }
    };
  }
}
