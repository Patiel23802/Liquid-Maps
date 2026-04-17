import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { ReportTargetType } from "@prisma/client";
import * as reportService from "../services/reportService.js";

const reportBody = z.object({
  targetType: z.nativeEnum(ReportTargetType),
  targetUserId: z.string().uuid().optional(),
  targetPlanId: z.string().uuid().optional(),
  targetMessageId: z.string().uuid().optional(),
  targetCommunityId: z.string().uuid().optional(),
  reason: z.string().min(1).max(64),
  details: z.string().max(2000).optional(),
});

export const reportRouter = Router();

reportRouter.post(
  "/",
  requireAuth,
  validate({ body: reportBody }),
  async (req: AuthedRequest, res, next) => {
    try {
      const data = await reportService.createReport(req.userId!, req.body);
      res.status(201).json({ data });
    } catch (e) {
      next(e);
    }
  }
);
