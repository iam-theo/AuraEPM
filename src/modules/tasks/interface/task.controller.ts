import { Request, Response } from "express";
import { TaskService } from "../application/task.service.ts";
import { ResponseFormatter, StatusCode } from "../../../shared/infrastructure/response.ts";

export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  getByProject = async (req: Request, res: Response) => {
    const tasks = await this.taskService.getTasksByProject(req.params.projectId);
    return ResponseFormatter.success(res, tasks.map(t => ({ id: t.id, ...t.props })));
  };

  getOne = async (req: Request, res: Response) => {
    const task = await this.taskService.getTask(req.params.id);
    return ResponseFormatter.success(res, { id: task.id, ...task.props });
  };

  create = async (req: Request, res: Response) => {
    const task = await this.taskService.createTask(req.body);
    return ResponseFormatter.success(res, { id: task.id, ...task.props }, "Task created successfully", StatusCode.CREATED);
  };

  updateStatus = async (req: Request, res: Response) => {
    const task = await this.taskService.updateTaskStatus(req.params.id, req.body.status);
    return ResponseFormatter.success(res, { id: task.id, ...task.props }, "Task status updated successfully");
  };

  update = async (req: Request, res: Response) => {
    const task = await this.taskService.updateTask(req.params.id, req.body);
    return ResponseFormatter.success(res, { id: task.id, ...task.props }, "Task updated successfully");
  };

  delete = async (req: Request, res: Response) => {
    await this.taskService.deleteTask(req.params.id);
    return ResponseFormatter.success(res, null, "Task deleted successfully", StatusCode.NO_CONTENT);
  };
}
