import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middlewares/auth.js";
import * as notificationService from "../services/notificationService.js";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      const data = await notificationService.listForUser(req.userId!);
      res.json({ data });
    } catch (e) {
      next(e);
    }
  }
);

notificationsRouter.post(
  "/seed",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      const data = await notificationService.seedDemoNotifications(
        req.userId!
      );
      res.status(201).json({ data });
    } catch (e) {
      next(e);
    }
  }
);
