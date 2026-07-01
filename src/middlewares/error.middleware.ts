import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export interface CustomError extends Error {
  statusCode?: number;
}

export const globalErrorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 1. Log structural error details securely internally
  console.error(`[ERROR TIME: ${new Date().toISOString()}] Details:`, {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // 2. Handle Zod Input Validation Failures
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      errorType: "VALIDATION_ERROR",
      message: "The application payload parameters failed structural validation rules.",
      issues: err.issues.map((e) => ({
        field: e.path.join("."),
        issue: e.message,
      })),
    });
    return;
  }

  // 3. Handle explicit operational errors
  const status = err.statusCode || 500;
  const message = status === 500 ? "An internal database or server subsystem failure occurred." : err.message;

  res.status(status).json({
    success: false,
    errorType: status === 500 ? "INTERNAL_SERVER_ERROR" : "OPERATIONAL_ERROR",
    message,
  });
};