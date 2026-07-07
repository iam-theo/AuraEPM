import { db } from "./src/shared/database/index.ts";
import { users, userRoles, roles } from "./src/db/schema.ts";
import { eq } from "drizzle-orm";

async function main() {
  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      department: users.department,
    })
    .from(users);

  for (const user of allUsers) {
    const userRolesList = await db
      .select({
        code: roles.code,
        name: roles.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, user.id));
    (user as any).roles = userRolesList;
  }
  console.log(allUsers);
  process.exit(0);
}
main();
