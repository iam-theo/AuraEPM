import { ITaskRepository } from "../domain/task.repository.interface.ts";
import { Task, TaskProps, TaskStatus } from "../domain/task.entity.ts";
import { NotFoundError } from "../../../shared/infrastructure/errors.ts";
import { eventBus } from "../../../shared/domain/event-bus.ts";

export class TaskService {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async createTask(data: Partial<TaskProps>): Promise<Task> {
    const task = Task.create(data);
    await this.taskRepository.save(task);
    eventBus.publish("task.created", task);
    return task;
  }

  async getTask(id: string): Promise<Task> {
    const task = await this.taskRepository.findById(id);
    if (!task) throw new NotFoundError("Task");
    return task;
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    return this.taskRepository.findByProjectId(projectId);
  }

  async updateTaskStatus(id: string, newStatus: TaskStatus): Promise<Task> {
    const task = await this.getTask(id);
    task.updateStatus(newStatus);
    await this.taskRepository.save(task);
    eventBus.publish("task.status_updated", { id, status: newStatus });
    return task;
  }

  async updateTask(id: string, data: Partial<TaskProps>): Promise<Task> {
    const task = await this.getTask(id);
    Object.assign(task.props, data);
    task.props.updatedAt = new Date();
    await this.taskRepository.save(task);
    eventBus.publish("task.updated", task);
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await this.getTask(id);
    await this.taskRepository.delete(id);
    eventBus.publish("task.deleted", { id });
  }
}
