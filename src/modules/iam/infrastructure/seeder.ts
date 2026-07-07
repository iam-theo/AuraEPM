import bcrypt from "bcrypt";
import { db } from "../../../shared/database/index.ts";
import { users, passwords, roles, userRoles } from "../../../db/schema.ts";
import { eq, and } from "drizzle-orm";
import logger from "../../../shared/infrastructure/logger.ts";

export async function seedIAM() {
  logger.info("Starting IAM Seeding process...");

  try {
    // Check if admin user exists
    const adminEmail = "admin@auraepm.com";
    const [existingAdmin] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

    let adminUser = existingAdmin;

    if (!existingAdmin) {
      logger.info(`Creating default admin user: ${adminEmail}`);
      
      const passwordHash = await bcrypt.hash("Welcome@123", 10);
      
      await db.transaction(async (tx) => {
        const [user] = await tx.insert(users).values({
          firstName: "Enterprise",
          lastName: "Admin",
          email: adminEmail,
          username: "admin",
          department: "IT",
          jobTitle: "System Administrator",
          organization: "AuraEPM Enterprise",
          status: "ACTIVE",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();

        await tx.insert(passwords).values({
          userId: user.id,
          hash: passwordHash,
          mustChange: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        adminUser = user;
      });
      
      logger.info("Default admin user created successfully.");
    } else {
      logger.info("Default admin user already exists.");
    }

    if (adminUser) {
      // Ensure the default admin has the super_admin role
      const [superAdminRole] = await db.select().from(roles).where(eq(roles.code, "super_admin")).limit(1);
      if (superAdminRole) {
        const [existingAssigned] = await db.select()
          .from(userRoles)
          .where(and(eq(userRoles.userId, adminUser.id), eq(userRoles.roleId, superAdminRole.id)))
          .limit(1);
        if (!existingAssigned) {
          logger.info(`Assigning super_admin role to admin user: ${adminEmail}`);
          await db.insert(userRoles).values({
            userId: adminUser.id,
            roleId: superAdminRole.id,
            assignedBy: "system",
            createdAt: new Date()
          });
          logger.info("super_admin role assigned successfully.");
        } else {
          logger.info("admin user already has super_admin role assigned.");
        }
      } else {
        logger.warn("super_admin role not found in database to assign to admin.");
      }
    }
  } catch (error) {
    logger.error({ error }, "Failed to seed IAM database");
    throw error;
  }
}
