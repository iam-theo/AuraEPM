import { UserRepository } from "../infrastructure/user.repository";
import { UserMapper } from "./user.mapper";
import { UserSearchFilters, PaginatedResponse, UserDTO } from "./user.dto";
import { NotFoundError } from "../../../shared/infrastructure/errors";

export class UserService {
  private repository: UserRepository;

  constructor() {
    this.repository = new UserRepository();
  }

  async getUsers(filters: UserSearchFilters): Promise<PaginatedResponse<UserDTO>> {
    const { data, total } = await this.repository.findAll(filters);
    const dtos = UserMapper.toDTOs(data);
    
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    
    return {
      data: dtos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  async getUserById(id: string): Promise<UserDTO> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }
    return UserMapper.toDTO(user);
  }

  async getCurrentUser(id: string): Promise<UserDTO> {
    return this.getUserById(id);
  }

  async searchUsers(query: string): Promise<UserDTO[]> {
    const { data } = await this.repository.findAll({ search: query, limit: 20 });
    return UserMapper.toDTOs(data);
  }

  async getDepartments(): Promise<string[]> {
    const depts = await this.repository.listDepartments();
    return depts.filter((d): d is string => d !== null);
  }

  async getManagers(): Promise<UserDTO[]> {
    const managers = await this.repository.listManagers();
    return UserMapper.toDTOs(managers);
  }

  async getUserRoles(userId: string) {
    return await this.repository.findUserRoles(userId);
  }

  async getUserPermissions(userId: string) {
    return await this.repository.findUserPermissions(userId);
  }

  async getUserProjects(userId: string) {
    return await this.repository.findUserProjects(userId);
  }

  async getUserTasks(userId: string) {
    return await this.repository.findUserTasks(userId);
  }

  async getUserRisksAndIssues(userId: string) {
    return await this.repository.findUserRisksAndIssues(userId);
  }

  async getUserAuditLogs(userId: string) {
    return await this.repository.findUserAuditLogs(userId);
  }

  async getUserChatMessages(userId: string) {
    return await this.repository.findUserChatMessages(userId);
  }

  async getUserChangeRequests(userId: string) {
    return await this.repository.findUserChangeRequests(userId);
  }

  async getUserSecurityLogs(userId: string) {
    return await this.repository.findUserSecurityLogs(userId);
  }

  async getUserLoginHistory(userId: string) {
    return await this.repository.findUserLoginHistory(userId);
  }

  async getUserResources(userId: string) {
    return await this.repository.findUserResources(userId);
  }

  async getUserMilestones(userId: string) {
    return await this.repository.findUserMilestones(userId);
  }
}
