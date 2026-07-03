import { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";
import { UnauthorizedError } from "./errors.ts";

export const authMiddleware = async (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError("No token provided"));
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return next(new UnauthorizedError("Invalid token"));
  }
};
