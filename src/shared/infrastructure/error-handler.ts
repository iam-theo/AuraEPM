import { Request, Response, NextFunction } from "express";
import { AppError } from "./errors.ts";
import { ResponseFormatter, StatusCode } from "./response.ts";
import logger from "./logger.ts";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error({ err });

  if (err instanceof AppError) {
    return ResponseFormatter.error(res, err.message, err.statusCode);
  }

  // Handle Drizzle/Postgres errors specifically if needed here
  
  return ResponseFormatter.error(
    res,
    "An unexpected error occurred",
    StatusCode.INTERNAL_SERVER_ERROR
  );
};
