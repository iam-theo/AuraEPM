import { db } from "./src/shared/database/index.ts";
import { AuthorizationService } from "./src/modules/authorization/application/authorization.service.ts";

async function main() {
  const authService = new AuthorizationService();
  try {
    const users = await authService.listAllUsers();
    console.log("Users:", users);
    const depts = await authService.listDepartments();
    console.log("Departments:", depts);
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}
main();
