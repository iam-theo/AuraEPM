import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { DrizzleIamRepository } from "../infrastructure/drizzle-iam.repository.ts";
import { UnauthorizedError, NotFoundError, ConflictError } from "../../../shared/infrastructure/errors.ts";
import { systemConfigurations } from "../../../db/schema.ts";
import { db } from "../../../shared/database/index.ts";
import { eq } from "drizzle-orm";

export class IamService {
  constructor(private readonly iamRepository: DrizzleIamRepository) {}

  private getJwtSecrets() {
    return {
      accessSecret: process.env.JWT_ACCESS_SECRET || "default_access_secret_2026",
      refreshSecret: process.env.JWT_REFRESH_SECRET || "default_refresh_secret_2026"
    };
  }

  private async getDefaultPassword(): Promise<string> {
    const [config] = await db.select().from(systemConfigurations).where(eq(systemConfigurations.configKey, "DEFAULT_USER_PASSWORD"));
    return config?.configValue || "Welcome@123";
  }

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  async registerUser(data: any, actorId?: string) {
    const existingUser = await this.iamRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    const defaultPassword = await this.getDefaultPassword();
    const hash = await bcrypt.hash(defaultPassword, 10);
    
    const user = await this.iamRepository.createUser({ ...data, createdBy: actorId }, hash);
    
    await this.iamRepository.logSecurityAudit({
      userId: user.id,
      actorId: actorId || user.id,
      action: "USER_REGISTERED",
      details: { email: user.email },
      ipAddress: data.ipAddress
    });

    return user;
  }

  async login(email: string, plainPassword: string, deviceInfo: string, ipAddress: string) {
    const user = await this.iamRepository.findUserByEmail(email);
    if (!user) throw new UnauthorizedError("Invalid credentials");
    if (user.isLocked || !user.isActive) throw new UnauthorizedError("Account locked or inactive");

    const pwd = await this.iamRepository.getPasswordForUser(user.id);
    if (!pwd) throw new UnauthorizedError("Invalid credentials");

    const isMatch = await bcrypt.compare(plainPassword, pwd.hash);
    if (!isMatch) {
      await this.iamRepository.logSecurityAudit({
        userId: user.id,
        action: "FAILED_LOGIN",
        ipAddress
      });
      throw new UnauthorizedError("Invalid credentials");
    }

    const { accessSecret } = this.getJwtSecrets();
    
    const payload = {
      uid: user.id,
      email: user.email,
      tenantId: user.tenantId,
      department: user.department,
    };

    const accessToken = jwt.sign(payload, accessSecret, { expiresIn: "1h" });
    
    const rawRefreshToken = crypto.randomBytes(40).toString("hex");
    const hashedToken = this.hashToken(rawRefreshToken);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.iamRepository.saveRefreshToken(user.id, hashedToken, deviceInfo, ipAddress, expiresAt);
    
    const sessionId = crypto.randomBytes(16).toString("hex");
    await this.iamRepository.saveDeviceSession({
      userId: user.id,
      sessionId,
      ipAddress,
      deviceInfo,
      isActive: true
    });

    await this.iamRepository.logSecurityAudit({
      userId: user.id,
      action: "LOGIN_SUCCESS",
      ipAddress
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 3600,
      tokenType: "Bearer",
      mustChangePassword: pwd.mustChange
    };
  }

  async refreshToken(rawRefreshToken: string, ipAddress: string) {
    const hashedToken = this.hashToken(rawRefreshToken);
    const tokenRecord = await this.iamRepository.findRefreshTokenByHash(hashedToken);
    
    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const user = await this.iamRepository.findUserById(tokenRecord.userId);
    if (!user || !user.isActive || user.isLocked) {
      throw new UnauthorizedError("User is inactive or locked");
    }

    const { accessSecret } = this.getJwtSecrets();
    const payload = {
      uid: user.id,
      email: user.email,
      tenantId: user.tenantId,
      department: user.department,
    };

    const newAccessToken = jwt.sign(payload, accessSecret, { expiresIn: "1h" });
    const newRawRefreshToken = crypto.randomBytes(40).toString("hex");
    const newHashedToken = this.hashToken(newRawRefreshToken);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.iamRepository.revokeRefreshToken(tokenRecord.id);
    await this.iamRepository.saveRefreshToken(user.id, newHashedToken, tokenRecord.deviceInfo || "", ipAddress, expiresAt);
    
    await this.iamRepository.logSecurityAudit({
      userId: user.id,
      action: "TOKEN_REFRESH",
      ipAddress
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
      expiresIn: 3600,
      tokenType: "Bearer"
    };
  }

  async logout(userId: string, sessionId?: string) {
    if (sessionId) {
      await this.iamRepository.invalidateSession(sessionId);
    }
    await this.iamRepository.logSecurityAudit({
      userId,
      action: "LOGOUT"
    });
  }

  async getMe(userId: string) {
    const user = await this.iamRepository.findUserById(userId);
    if (!user) throw new NotFoundError("User");
    return user;
  }

  async getAllUsers(limit: number, offset: number) {
    return this.iamRepository.getAllUsers(limit, offset);
  }

  async updateUser(userId: string, data: any, actorId: string, ipAddress: string) {
    const user = await this.iamRepository.updateUser(userId, data);
    if (!user) throw new NotFoundError("User");
    
    await this.iamRepository.logSecurityAudit({
      userId,
      actorId,
      action: "USER_UPDATED",
      ipAddress
    });

    return user;
  }

  async deleteUser(userId: string, actorId: string, ipAddress: string) {
    await this.iamRepository.softDeleteUser(userId);
    await this.iamRepository.logSecurityAudit({
      userId,
      actorId,
      action: "USER_DELETED",
      ipAddress
    });
  }

  async forgotPassword(email: string, ipAddress: string) {
    const user = await this.iamRepository.findUserByEmail(email);
    if (!user) return; // Do not leak existence

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = this.hashToken(rawToken);
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

    await this.iamRepository.savePasswordResetToken(user.id, hashedToken, expiresAt);
    
    await this.iamRepository.logSecurityAudit({
      userId: user.id,
      action: "PASSWORD_RESET_REQUESTED",
      ipAddress
    });

    // In a real system, send email here
    return {
      message: "If an account exists, a password reset link has been sent.",
      resetToken: rawToken // ONLY FOR DEMO/TESTING
    };
  }

  async resetPassword(rawToken: string, newPassword: string, ipAddress: string) {
    const hashedToken = this.hashToken(rawToken);
    const tokenRecord = await this.iamRepository.findPasswordResetTokenByHash(hashedToken);
    
    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedError("Invalid or expired reset token");
    }

    const user = await this.iamRepository.findUserById(tokenRecord.userId);
    if (!user) throw new NotFoundError("User");

    // Check history
    const history = await this.iamRepository.getPasswordHistory(user.id, 5);
    for (const past of history) {
      if (await bcrypt.compare(newPassword, past.hash)) {
        throw new ConflictError("Cannot reuse a recent password");
      }
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await this.iamRepository.updatePassword(user.id, newHash, false);
    await this.iamRepository.markPasswordResetTokenUsed(tokenRecord.id);

    await this.iamRepository.logSecurityAudit({
      userId: user.id,
      action: "PASSWORD_RESET",
      ipAddress
    });
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string, ipAddress: string) {
    const pwd = await this.iamRepository.getPasswordForUser(userId);
    if (!pwd) throw new NotFoundError("Password record");

    const isMatch = await bcrypt.compare(oldPassword, pwd.hash);
    if (!isMatch) {
      throw new UnauthorizedError("Incorrect current password");
    }

    const history = await this.iamRepository.getPasswordHistory(userId, 5);
    for (const past of history) {
      if (await bcrypt.compare(newPassword, past.hash)) {
        throw new ConflictError("Cannot reuse a recent password");
      }
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await this.iamRepository.updatePassword(userId, newHash, false);

    await this.iamRepository.logSecurityAudit({
      userId,
      action: "PASSWORD_CHANGED",
      ipAddress
    });
  }

  async getSessions(userId: string) {
    return this.iamRepository.getUserSessions(userId);
  }

  async terminateSession(userId: string, sessionId: string, ipAddress: string) {
    await this.iamRepository.invalidateSession(sessionId);
    await this.iamRepository.logSecurityAudit({
      userId,
      action: "SESSION_TERMINATED",
      ipAddress,
      details: { sessionId }
    });
  }

  async terminateAllSessions(userId: string, ipAddress: string) {
    await this.iamRepository.terminateAllSessions(userId);
    await this.iamRepository.logSecurityAudit({
      userId,
      action: "ALL_SESSIONS_TERMINATED",
      ipAddress
    });
  }
}

