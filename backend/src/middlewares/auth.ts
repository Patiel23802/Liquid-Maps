import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";
import { prisma } from "../config/database.js";

export type AuthedRequest = Request & { userId?: string };

export async function requireAuth(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      next(new AppError("UNAUTHORIZED", "Missing token", 401));
      return;
    }
    const token = header.slice(7);
    const { sub } = verifyAccessToken(token);
    const user = await prisma.user.findFirst({
      where: { id: sub, deletedAt: null, isBanned: false },
    });
    if (!user) {
      next(new AppError("UNAUTHORIZED", "Invalid user", 401));
      return;
    }
    req.userId = sub;
    next();
  } catch {
    next(new AppError("UNAUTHORIZED", "Invalid or expired token", 401));
  }
}

export async function optionalAuth(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }
  try {
    const token = header.slice(7);
    const { sub } = verifyAccessToken(token);
    const user = await prisma.user.findFirst({
      where: { id: sub, deletedAt: null, isBanned: false },
    });
    if (user) req.userId = sub;
  } catch {
    /* ignore */
  }
  next();
}
