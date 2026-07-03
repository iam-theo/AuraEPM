import { dbState, generateUUID, saveDatabase } from "../../db.ts";
import { TeamMember } from "../../types.ts";

export class TeamRepository {
  /**
   * Find a team member by ID
   */
  async findById(id: string): Promise<TeamMember | null> {
    const member = dbState.teamMembers.find(t => t.id === id && !t.deletedAt);
    return member || null;
  }

  /**
   * Find a team member by Project and User ID
   */
  async findByProjectAndUser(projectId: string, userId: string): Promise<TeamMember | null> {
    const member = dbState.teamMembers.find(t => t.projectId === projectId && t.userId === userId && !t.deletedAt);
    return member || null;
  }

  /**
   * List all team members assigned to a specific project
   */
  async findByProject(projectId: string): Promise<TeamMember[]> {
    return dbState.teamMembers.filter(t => t.projectId === projectId && !t.deletedAt);
  }

  /**
   * Insert a new team member
   */
  async create(data: Partial<TeamMember>): Promise<TeamMember> {
    const newMember: TeamMember = {
      id: generateUUID(),
      projectId: data.projectId!,
      userId: data.userId!,
      name: data.name!,
      email: data.email!,
      role: data.role || "Team Member",
      capacity: data.capacity !== undefined ? data.capacity : 40,
      allocation: data.allocation !== undefined ? data.allocation : 100,
      availability: data.availability || "AVAILABLE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    };

    dbState.teamMembers.push(newMember);
    saveDatabase();
    return newMember;
  }

  /**
   * Update an existing team member's configuration
   */
  async update(id: string, data: Partial<TeamMember>): Promise<TeamMember | null> {
    const index = dbState.teamMembers.findIndex(t => t.id === id && !t.deletedAt);
    if (index === -1) return null;

    dbState.teamMembers[index] = {
      ...dbState.teamMembers[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    saveDatabase();
    return dbState.teamMembers[index];
  }

  /**
   * Soft-delete a team member from a project
   */
  async delete(id: string): Promise<boolean> {
    const index = dbState.teamMembers.findIndex(t => t.id === id && !t.deletedAt);
    if (index === -1) return false;

    dbState.teamMembers[index].deletedAt = new Date().toISOString();
    saveDatabase();
    return true;
  }
}
