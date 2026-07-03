/**
 * Client-Side API Utility Layer
 * Syncs directly with Express REST API endpoints under /api/project-tracker
 */

import { ChatMessage } from "../modules/project-tracker/types.ts";

const BASE_URL = "/api/project-tracker";

export async function request(endpoint: string, options: RequestInit = {}) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (res.headers.get("content-type")?.includes("text/csv")) {
      return await res.text();
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || "API request failed");
    }
    return json.data;
  } catch (err: any) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Dashboard
  getDashboard: (projectId?: string) => 
    request(`/dashboard/summary${projectId ? `?projectId=${projectId}` : ""}`),

  // Projects Integration
  getProjectsList: () => 
    fetch("/api/projects").then(res => res.json()).then(res => res.data),

  // Team
  getTeam: (projectId: string) => 
    request(`/team/project/${projectId}`),
  assignMember: (data: any) => 
    request("/team", { method: "POST", body: JSON.stringify(data) }),
  updateAllocation: (id: string, data: any) => 
    request(`/team/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  removeMember: (id: string) => 
    request(`/team/${id}`, { method: "DELETE" }),

  // Tasks
  getTasks: (projectId: string, filters: any = {}) => {
    const q = new URLSearchParams(filters).toString();
    return request(`/tasks/project/${projectId}${q ? `?${q}` : ""}`);
  },
  getCriticalPath: (projectId: string) => 
    request(`/tasks/project/${projectId}/critical-path`),
  createTask: (data: any) => 
    request("/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id: string, data: any) => 
    request(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTask: (id: string) => 
    request(`/tasks/${id}`, { method: "DELETE" }),
  bulkUpdateTasks: (data: any) => 
    request("/tasks/bulk-update", { method: "PATCH", body: JSON.stringify(data) }),
  bulkDeleteTasks: (data: any) => 
    request("/tasks/bulk-delete", { method: "DELETE", body: JSON.stringify(data) }),

  // Subtasks
  getSubtasks: (taskId: string) => 
    request(`/tasks/task/${taskId}/subtasks`),
  createSubtask: (data: any) => 
    request("/tasks/subtask", { method: "POST", body: JSON.stringify(data) }),
  updateSubtask: (id: string, data: any) => 
    request(`/tasks/subtask/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteSubtask: (id: string) => 
    request(`/tasks/subtask/${id}`, { method: "DELETE" }),

  // Milestones
  getMilestones: (projectId: string) => 
    request(`/tasks/project/${projectId}/milestones`),
  createMilestone: (data: any) => 
    request("/tasks/milestone", { method: "POST", body: JSON.stringify(data) }),
  updateMilestone: (id: string, data: any) => 
    request(`/tasks/milestone/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteMilestone: (id: string) => 
    request(`/tasks/milestone/${id}`, { method: "DELETE" }),

  // Dependencies
  getDependencies: (projectId: string) => 
    request(`/tasks/project/${projectId}/dependencies`),
  createDependency: (data: any) => 
    request("/tasks/dependency", { method: "POST", body: JSON.stringify(data) }),
  deleteDependency: (id: string) => 
    request(`/tasks/dependency/${id}`, { method: "DELETE" }),

  // Time logs
  getTimeLogs: (projectId: string) => 
    request(`/tir/project/${projectId}`),
  getTimeSummary: (projectId: string) => 
    request(`/tir/project/${projectId}/summary`),
  createTimeLog: (data: any) => 
    request("/tir", { method: "POST", body: JSON.stringify(data) }),
  approveTimeLog: (id: string) => 
    request(`/tir/${id}/approve`, { method: "PATCH" }),

  // Issues
  getIssues: (projectId: string) => 
    request(`/tir/project/${projectId}/issues`),
  createIssue: (data: any) => 
    request("/tir/issue", { method: "POST", body: JSON.stringify(data) }),
  updateIssue: (id: string, data: any) => 
    request(`/tir/issue/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteIssue: (id: string) => 
    request(`/tir/issue/${id}`, { method: "DELETE" }),

  // Risks
  getRisks: (projectId: string) => 
    request(`/tir/project/${projectId}/risks`),
  createRisk: (data: any) => 
    request("/tir/risk", { method: "POST", body: JSON.stringify(data) }),
  updateRisk: (id: string, data: any) => 
    request(`/tir/risk/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteRisk: (id: string) => 
    request(`/tir/risk/${id}`, { method: "DELETE" }),

  // Deliverables
  getDeliverables: (projectId: string) => 
    request(`/ddc/project/${projectId}`),
  createDeliverable: (data: any) => 
    request("/ddc", { method: "POST", body: JSON.stringify(data) }),
  updateDeliverable: (id: string, data: any) => 
    request(`/ddc/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteDeliverable: (id: string) => 
    request(`/ddc/${id}`, { method: "DELETE" }),

  // Documents
  getDocuments: (projectId: string, folderPath?: string) => 
    request(`/ddc/project/${projectId}/documents${folderPath ? `?folderPath=${encodeURIComponent(folderPath)}` : ""}`),
  getFolders: (projectId: string) => 
    request(`/ddc/project/${projectId}/folders`),
  uploadDocument: (data: any) => 
    request("/ddc/document", { method: "POST", body: JSON.stringify(data) }),

  // Threaded Comments
  getComments: (entityType: string, entityId: string) => 
    request(`/ddc/comments/${entityType}/${entityId}`),
  createComment: (data: any) => 
    request("/ddc/comment", { method: "POST", body: JSON.stringify(data) }),
  addReaction: (commentId: string, reaction: string, teamMemberId: string) => 
    request(`/ddc/comment/${commentId}/reaction`, { method: "POST", body: JSON.stringify({ reaction, teamMemberId }) }),
  deleteComment: (id: string) => 
    request(`/ddc/comment/${id}`, { method: "DELETE" }),

  // Meetings
  getMeetings: (projectId: string) => 
    request(`/meetings-resources/project/${projectId}`),
  createMeeting: (data: any) => 
    request("/meetings-resources", { method: "POST", body: JSON.stringify(data) }),
  updateMeeting: (id: string, data: any) => 
    request(`/meetings-resources/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  getCapacityPlanning: (projectId: string) => 
    request(`/meetings-resources/project/${projectId}/capacity-planning`),
  getProgressEVM: (projectId: string) => 
    request(`/meetings-resources/project/${projectId}/evm-progress`),

  // Notifications, Audit & Reports
  getNotifications: () => 
    request("/nar/notifications"),
  getUnreadCount: () => 
    request("/nar/notifications/unread-count"),
  markAsRead: (id: string) => 
    request(`/nar/notifications/${id}/read`, { method: "PATCH" }),
  getAuditLogs: (projectId: string) => 
    request(`/nar/audit-logs/project/${projectId}`),
  getExecutiveReport: (projectId: string) => 
    request(`/nar/reports/executive-status/${projectId}`),
  downloadTasksCSV: (projectId: string) => 
    request(`/nar/reports/export-csv/${projectId}`),

  // Gemini Agent
  chatWithAgent: (data: { message: string; projectId: string; googleAccessToken?: string; history?: any[] }) =>
    request("/gemini-agent/chat", { method: "POST", body: JSON.stringify(data) }),
  // ==========================================
  // CHAT MODULE
  // ==========================================
  getChatMessages: async (projectId: string): Promise<ChatMessage[]> => {
    const res = await fetch(`${BASE_URL}/chat/${projectId}`);
    const json = await res.json();
    return json.data || [];
  },

  sendChatMessage: async (data: Partial<ChatMessage>): Promise<ChatMessage> => {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.data;
  },
};
