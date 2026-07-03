import { dbState, saveDatabase } from "../../db.ts";
import { Notification, AuditLog } from "../../types.ts";

export class NotificationsAuditReportsRepository {
  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return dbState.notifications.filter(n => n.userId === userId);
  }

  async markAsRead(id: string): Promise<Notification | null> {
    const index = dbState.notifications.findIndex(n => n.id === id);
    if (index === -1) return null;

    dbState.notifications[index].isRead = true;
    saveDatabase();
    return dbState.notifications[index];
  }

  async getUnreadCount(userId: string): Promise<number> {
    return dbState.notifications.filter(n => n.userId === userId && !n.isRead).length;
  }

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  async getAuditLogs(projectId: string): Promise<AuditLog[]> {
    return dbState.auditLogs.filter(al => al.projectId === projectId);
  }
}
