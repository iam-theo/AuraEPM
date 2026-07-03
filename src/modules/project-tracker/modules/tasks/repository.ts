import { dbState, generateUUID, saveDatabase } from "../../db.ts";
import { Task, Subtask, Milestone, Dependency, TaskStatus } from "../../types.ts";

export class TasksRepository {
  // ==========================================
  // TASKS
  // ==========================================
  async findTaskById(id: string): Promise<Task | null> {
    return dbState.tasks.find(t => t.id === id && !t.deletedAt) || null;
  }

  async findTasksByProject(projectId: string, filters: any = {}): Promise<Task[]> {
    let list = dbState.tasks.filter(t => t.projectId === projectId && !t.deletedAt);

    if (filters.status) {
      list = list.filter(t => t.status === filters.status);
    }
    if (filters.priority) {
      list = list.filter(t => t.priority === filters.priority);
    }
    if (filters.assigneeId) {
      list = list.filter(t => t.assigneeId === filters.assigneeId);
    }
    if (filters.milestoneId) {
      list = list.filter(t => t.milestoneId === filters.milestoneId);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      list = list.filter(t => 
        t.title.toLowerCase().includes(searchLower) || 
        t.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort order
    if (filters.sortBy) {
      const field = filters.sortBy;
      const desc = filters.sortOrder === "desc";
      list.sort((a: any, b: any) => {
        if (a[field] < b[field]) return desc ? 1 : -1;
        if (a[field] > b[field]) return desc ? -1 : 1;
        return 0;
      });
    }

    return list;
  }

  async createTask(data: Partial<Task>): Promise<Task> {
    const newTask: Task = {
      id: generateUUID(),
      projectId: data.projectId!,
      title: data.title!,
      description: data.description || "",
      status: data.status || TaskStatus.TODO,
      priority: data.priority || data.priority || "MEDIUM" as any,
      startDate: data.startDate!,
      dueDate: data.dueDate!,
      assigneeId: data.assigneeId || null,
      milestoneId: data.milestoneId || null,
      labels: data.labels || [],
      estimatedHours: data.estimatedHours || 0,
      actualHours: 0,
      completedAt: data.status === TaskStatus.DONE ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    };

    dbState.tasks.push(newTask);
    saveDatabase();
    return newTask;
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task | null> {
    const index = dbState.tasks.findIndex(t => t.id === id && !t.deletedAt);
    if (index === -1) return null;

    const current = dbState.tasks[index];
    let completedAt = current.completedAt;
    
    if (data.status === TaskStatus.DONE && current.status !== TaskStatus.DONE) {
      completedAt = new Date().toISOString();
    } else if (data.status && data.status !== TaskStatus.DONE) {
      completedAt = null;
    }

    dbState.tasks[index] = {
      ...current,
      ...data,
      completedAt,
      updatedAt: new Date().toISOString()
    };

    saveDatabase();
    return dbState.tasks[index];
  }

  async deleteTask(id: string): Promise<boolean> {
    const index = dbState.tasks.findIndex(t => t.id === id && !t.deletedAt);
    if (index === -1) return false;

    dbState.tasks[index].deletedAt = new Date().toISOString();
    
    // Cascading soft-delete subtasks
    dbState.subtasks.forEach(sub => {
      if (sub.taskId === id && !sub.deletedAt) {
        sub.deletedAt = new Date().toISOString();
      }
    });

    saveDatabase();
    return true;
  }

  async bulkUpdateTasks(ids: string[], data: Partial<Task>): Promise<number> {
    let updatedCount = 0;
    dbState.tasks.forEach(t => {
      if (ids.includes(t.id) && !t.deletedAt) {
        Object.assign(t, {
          ...data,
          updatedAt: new Date().toISOString(),
          completedAt: data.status === TaskStatus.DONE ? new Date().toISOString() : data.status ? null : t.completedAt
        });
        updatedCount++;
      }
    });
    if (updatedCount > 0) saveDatabase();
    return updatedCount;
  }

  async bulkDeleteTasks(ids: string[]): Promise<number> {
    let deletedCount = 0;
    dbState.tasks.forEach(t => {
      if (ids.includes(t.id) && !t.deletedAt) {
        t.deletedAt = new Date().toISOString();
        deletedCount++;
        
        // Cascading subtasks
        dbState.subtasks.forEach(sub => {
          if (sub.taskId === t.id && !sub.deletedAt) {
            sub.deletedAt = new Date().toISOString();
          }
        });
      }
    });
    if (deletedCount > 0) saveDatabase();
    return deletedCount;
  }

  // ==========================================
  // SUBTASKS
  // ==========================================
  async findSubtaskById(id: string): Promise<Subtask | null> {
    return dbState.subtasks.find(s => s.id === id && !s.deletedAt) || null;
  }

  async findSubtasksByTask(taskId: string): Promise<Subtask[]> {
    return dbState.subtasks
      .filter(s => s.taskId === taskId && !s.deletedAt)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async createSubtask(data: Partial<Subtask>): Promise<Subtask> {
    const activeSubtasks = dbState.subtasks.filter(s => s.taskId === data.taskId && !s.deletedAt);
    const orderIndex = activeSubtasks.length;

    const newSubtask: Subtask = {
      id: generateUUID(),
      taskId: data.taskId!,
      title: data.title!,
      isCompleted: false,
      orderIndex,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    };

    dbState.subtasks.push(newSubtask);
    saveDatabase();
    return newSubtask;
  }

  async updateSubtask(id: string, data: Partial<Subtask>): Promise<Subtask | null> {
    const index = dbState.subtasks.findIndex(s => s.id === id && !s.deletedAt);
    if (index === -1) return null;

    dbState.subtasks[index] = {
      ...dbState.subtasks[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    saveDatabase();
    return dbState.subtasks[index];
  }

  async deleteSubtask(id: string): Promise<boolean> {
    const index = dbState.subtasks.findIndex(s => s.id === id && !s.deletedAt);
    if (index === -1) return false;

    dbState.subtasks[index].deletedAt = new Date().toISOString();
    saveDatabase();
    return true;
  }

  // ==========================================
  // MILESTONES
  // ==========================================
  async findMilestoneById(id: string): Promise<Milestone | null> {
    return dbState.milestones.find(m => m.id === id && !m.deletedAt) || null;
  }

  async findMilestonesByProject(projectId: string): Promise<Milestone[]> {
    return dbState.milestones.filter(m => m.projectId === projectId && !m.deletedAt);
  }

  async createMilestone(data: Partial<Milestone>): Promise<Milestone> {
    const newMilestone: Milestone = {
      id: generateUUID(),
      projectId: data.projectId!,
      title: data.title!,
      description: data.description || "",
      targetDate: data.targetDate!,
      actualDate: null,
      isCompleted: false,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    };

    dbState.milestones.push(newMilestone);
    saveDatabase();
    return newMilestone;
  }

  async updateMilestone(id: string, data: Partial<Milestone>): Promise<Milestone | null> {
    const index = dbState.milestones.findIndex(m => m.id === id && !m.deletedAt);
    if (index === -1) return null;

    dbState.milestones[index] = {
      ...dbState.milestones[index],
      ...data,
      updatedAt: new Date().toISOString(),
      actualDate: data.isCompleted ? new Date().toISOString().substring(0, 10) : data.isCompleted === false ? null : dbState.milestones[index].actualDate
    };

    saveDatabase();
    return dbState.milestones[index];
  }

  async deleteMilestone(id: string): Promise<boolean> {
    const index = dbState.milestones.findIndex(m => m.id === id && !m.deletedAt);
    if (index === -1) return false;

    dbState.milestones[index].deletedAt = new Date().toISOString();
    saveDatabase();
    return true;
  }

  // ==========================================
  // DEPENDENCIES
  // ==========================================
  async findDependenciesByProject(projectId: string): Promise<Dependency[]> {
    return dbState.dependencies.filter(d => d.projectId === projectId);
  }

  async createDependency(data: Partial<Dependency>): Promise<Dependency> {
    const newDependency: Dependency = {
      id: generateUUID(),
      projectId: data.projectId!,
      type: data.type || "FS" as any,
      predecessorId: data.predecessorId!,
      successorId: data.successorId!,
      predecessorType: data.predecessorType || "TASK",
      successorType: data.successorType || "TASK",
      lagDays: data.lagDays || 0,
      createdAt: new Date().toISOString()
    };

    dbState.dependencies.push(newDependency);
    saveDatabase();
    return newDependency;
  }

  async deleteDependency(id: string): Promise<boolean> {
    const index = dbState.dependencies.findIndex(d => d.id === id);
    if (index === -1) return false;

    dbState.dependencies.splice(index, 1);
    saveDatabase();
    return true;
  }
}
