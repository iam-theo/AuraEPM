import { IProjectRepository } from "../domain/project.repository.interface.ts";
import { Project, ProjectProps } from "../domain/project.entity.ts";
import { NotFoundError } from "../../../shared/infrastructure/errors.ts";
import { eventBus } from "../../../shared/domain/event-bus.ts";
import { AuditLogger } from "../../../shared/infrastructure/audit-logger.ts";

export class ProjectService {
  constructor(private readonly projectRepository: IProjectRepository) {}

  async createProject(data: Partial<ProjectProps>, userId: string): Promise<Project> {
    const project = Project.create(data);
    await this.projectRepository.save(project);
    
    await AuditLogger.log(project.id, userId, "PROJECT_CREATED", "PROJECT", project.id, data);
    eventBus.publish("project.created", project);
    return project;
  }

  async getProject(id: string): Promise<Project> {
    const project = await this.projectRepository.findById(id);
    if (!project) throw new NotFoundError("Project");
    return project;
  }

  async getAllProjects(): Promise<Project[]> {
    return this.projectRepository.findAll();
  }

  async updateProject(id: string, data: Partial<ProjectProps>, userId: string): Promise<Project> {
    const project = await this.getProject(id);
    
    Object.assign(project.props, data);
    project.props.updatedAt = new Date();
    
    await this.projectRepository.save(project);
    await AuditLogger.log(project.id, userId, "PROJECT_UPDATED", "PROJECT", project.id, data);
    eventBus.publish("project.updated", project);
    return project;
  }

  async deleteProject(id: string, userId: string): Promise<void> {
    const project = await this.getProject(id);
    await this.projectRepository.delete(id);
    await AuditLogger.log(project.id, userId, "PROJECT_DELETED", "PROJECT", project.id);
    eventBus.publish("project.deleted", { id });
  }
}
