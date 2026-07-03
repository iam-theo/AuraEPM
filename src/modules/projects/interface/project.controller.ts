import { Request, Response } from "express";
import { ProjectService } from "../application/project.service.ts";
import { ResponseFormatter, StatusCode } from "../../../shared/infrastructure/response.ts";

export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  getAll = async (req: Request, res: Response) => {
    const projects = await this.projectService.getAllProjects();
    return ResponseFormatter.success(res, projects.map(p => ({ id: p.id, ...p.props })));
  };

  getOne = async (req: Request, res: Response) => {
    const project = await this.projectService.getProject(req.params.id);
    return ResponseFormatter.success(res, { id: project.id, ...project.props });
  };

  create = async (req: any, res: Response) => {
    const userId = req.user?.uid || "system";
    const project = await this.projectService.createProject(req.body, userId);
    return ResponseFormatter.success(res, { id: project.id, ...project.props }, "Project created successfully", StatusCode.CREATED);
  };

  update = async (req: any, res: Response) => {
    const userId = req.user?.uid || "system";
    const project = await this.projectService.updateProject(req.params.id, req.body, userId);
    return ResponseFormatter.success(res, { id: project.id, ...project.props }, "Project updated successfully");
  };

  delete = async (req: any, res: Response) => {
    const userId = req.user?.uid || "system";
    await this.projectService.deleteProject(req.params.id, userId);
    return ResponseFormatter.success(res, null, "Project deleted successfully", StatusCode.NO_CONTENT);
  };
}
