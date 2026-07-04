import { Request, Response } from "express";
import { IamService } from "../application/iam.service.ts";
import { ResponseFormatter, StatusCode } from "../../../shared/infrastructure/response.ts";

export class IamController {
  constructor(private readonly iamService: IamService) {}

  registerUser = async (req: Request, res: Response) => {
    const data = { ...req.body, ipAddress: req.ip };
    const actorId = req.user?.uid;
    const user = await this.iamService.registerUser(data, actorId);
    return ResponseFormatter.success(res, { id: user.id, email: user.email }, "User created successfully", StatusCode.CREATED);
  };

  login = async (req: Request, res: Response) => {
    const { email, password, deviceInfo } = req.body;
    const result = await this.iamService.login(email, password, deviceInfo, req.ip || "0.0.0.0");
    return ResponseFormatter.success(res, result, "Logged in successfully");
  };

  refresh = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await this.iamService.refreshToken(refreshToken, req.ip || "0.0.0.0");
    return ResponseFormatter.success(res, result, "Token refreshed successfully");
  };

  logout = async (req: Request, res: Response) => {
    const userId = req.user?.uid;
    const sessionId = req.body.sessionId;
    if (userId) {
      await this.iamService.logout(userId, sessionId);
    }
    return ResponseFormatter.success(res, null, "Logged out successfully", StatusCode.NO_CONTENT);
  };

  getMe = async (req: Request, res: Response) => {
    const userId = req.user?.uid;
    if (!userId) {
      return ResponseFormatter.error(res, "Unauthorized", StatusCode.UNAUTHORIZED);
    }
    const user = await this.iamService.getMe(userId);
    return ResponseFormatter.success(res, user);
  };

  getUsers = async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const users = await this.iamService.getAllUsers(limit, offset);
    return ResponseFormatter.success(res, users);
  };

  updateUser = async (req: Request, res: Response) => {
    const actorId = req.user?.uid;
    const user = await this.iamService.updateUser(req.params.id, req.body, actorId, req.ip || "0.0.0.0");
    return ResponseFormatter.success(res, user, "User updated successfully");
  };

  deleteUser = async (req: Request, res: Response) => {
    const actorId = req.user?.uid;
    await this.iamService.deleteUser(req.params.id, actorId, req.ip || "0.0.0.0");
    return ResponseFormatter.success(res, null, "User deleted successfully", StatusCode.NO_CONTENT);
  };

  forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await this.iamService.forgotPassword(email, req.ip || "0.0.0.0");
    return ResponseFormatter.success(res, result, "Password reset processed");
  };

  resetPassword = async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    await this.iamService.resetPassword(token, newPassword, req.ip || "0.0.0.0");
    return ResponseFormatter.success(res, null, "Password reset successfully");
  };

  changePassword = async (req: Request, res: Response) => {
    const userId = req.user?.uid;
    if (!userId) return ResponseFormatter.error(res, "Unauthorized", StatusCode.UNAUTHORIZED);
    
    const { oldPassword, newPassword } = req.body;
    await this.iamService.changePassword(userId, oldPassword, newPassword, req.ip || "0.0.0.0");
    return ResponseFormatter.success(res, null, "Password changed successfully");
  };

  getSessions = async (req: Request, res: Response) => {
    const userId = req.user?.uid;
    if (!userId) return ResponseFormatter.error(res, "Unauthorized", StatusCode.UNAUTHORIZED);
    
    const sessions = await this.iamService.getSessions(userId);
    return ResponseFormatter.success(res, sessions);
  };

  terminateSession = async (req: Request, res: Response) => {
    const userId = req.user?.uid;
    if (!userId) return ResponseFormatter.error(res, "Unauthorized", StatusCode.UNAUTHORIZED);
    
    await this.iamService.terminateSession(userId, req.params.id, req.ip || "0.0.0.0");
    return ResponseFormatter.success(res, null, "Session terminated", StatusCode.NO_CONTENT);
  };

  terminateAllSessions = async (req: Request, res: Response) => {
    const userId = req.user?.uid;
    if (!userId) return ResponseFormatter.error(res, "Unauthorized", StatusCode.UNAUTHORIZED);
    
    await this.iamService.terminateAllSessions(userId, req.ip || "0.0.0.0");
    return ResponseFormatter.success(res, null, "All sessions terminated", StatusCode.NO_CONTENT);
  };
}
