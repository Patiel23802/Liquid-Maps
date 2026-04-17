import type { Request, Response, NextFunction } from "express";
import { verifyAdminToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";

export type AdminRequest = Request & { adminId?: string };

export function requireAdmin(
  req: AdminRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      next(new AppError("UNAUTHORIZED", "Missing token", 401));
      return;
    }
    const token = header.slice(7);
    const { sub } = verifyAdminToken(token);
    req.adminId = sub;
    next();
  } catch {
    next(new AppError("UNAUTHORIZED", "Invalid admin token", 401));
  }
}
