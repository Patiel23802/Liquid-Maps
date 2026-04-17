import { Router } from "express";
import { requireAuth, optionalAuth, type AuthedRequest } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  createPlanSchema,
  listPlansQuerySchema,
  mapPlansQuerySchema,
  chatMessageSchema,
} from "../validators/plan.js";
import * as planService from "../services/planService.js";
import * as planChatService from "../services/planChatService.js";

export const planRouter = Router();

planRouter.get(
  "/",
  optionalAuth,
  validate({ query: listPlansQuerySchema }),
  async (req: AuthedRequest, res, next) => {
    try {
      const q = req.query as unknown as Parameters<
        typeof planService.listPlans
      >[1];
      const data = await planService.listPlans(req.userId, q);
      res.json({ data });
    } catch (e) {
      next(e);
    }
  }
);

planRouter.get(
  "/map",
  validate({ query: mapPlansQuerySchema }),
  async (req, res, next) => {
    try {
      const q = req.query as unknown as Parameters<
        typeof planService.mapPlans
      >[0];
      const data = await planService.mapPlans(q);
      res.json({ data });
    } catch (e) {
      next(e);
    }
  }
);

planRouter.get("/:id", optionalAuth, async (req: AuthedRequest, res, next) => {
  try {
    const planId = String(req.params.id);
    const data = await planService.getPlanById(planId, req.userId);
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

planRouter.post(
  "/",
  requireAuth,
  validate({ body: createPlanSchema }),
  async (req: AuthedRequest, res, next) => {
    try {
      const b = req.body as Record<string, unknown>;
      const data = await planService.createPlan(req.userId!, {
        title: b.title as string,
        description: (b.description as string) ?? null,
        categoryId: b.categoryId as number,
        vibeId: b.vibeId as number,
        cityId: b.cityId as string,
        localityId: (b.localityId as string) ?? null,
        locationName: b.locationName as string,
        lat: b.lat as number,
        lng: b.lng as number,
        startTime: new Date(b.startTime as string),
        endTime: b.endTime ? new Date(b.endTime as string) : null,
        maxParticipants: b.maxParticipants as number,
        visibility: b.visibility as "public" | "private" | "unlisted" | undefined,
        joinType: b.joinType as "open" | "approval_required" | undefined,
        verifiedOnly: b.verifiedOnly as boolean | undefined,
        womenOnly: b.womenOnly as boolean | undefined,
        hideExactUntilJoin: b.hideExactUntilJoin as boolean | undefined,
        communityIds: b.communityIds as string[] | undefined,
        costSplitNote: (b.costSplitNote as string) ?? null,
        bringItemsNote: (b.bringItemsNote as string) ?? null,
      });
      res.status(201).json({ data });
    } catch (e) {
      next(e);
    }
  }
);

planRouter.post(
  "/:id/join",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      const planId = String(req.params.id);
      const data = await planService.joinPlan(planId, req.userId!);
      const io = req.app.get("io");
      io.to(`plan:${planId}`).emit("plan:participant_updated", {
        planId,
        action: "join",
      });
      res.json({ data });
    } catch (e) {
      next(e);
    }
  }
);

planRouter.post(
  "/:id/leave",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      const planId = String(req.params.id);
      await planService.leavePlan(planId, req.userId!);
      const io = req.app.get("io");
      io.to(`plan:${planId}`).emit("plan:participant_updated", {
        planId,
        action: "leave",
      });
      res.json({ data: { ok: true } });
    } catch (e) {
      next(e);
    }
  }
);

planRouter.get(
  "/:id/chat/messages",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      const planId = String(req.params.id);
      const before = req.query.before as string | undefined;
      const data = await planChatService.listMessages(
        planId,
        req.userId!,
        before
      );
      res.json({ data });
    } catch (e) {
      next(e);
    }
  }
);

planRouter.post(
  "/:id/chat/messages",
  requireAuth,
  validate({ body: chatMessageSchema }),
  async (req: AuthedRequest, res, next) => {
    try {
      const planId = String(req.params.id);
      const { body } = req.body as { body: string };
      const msg = await planChatService.sendMessage(
        planId,
        req.userId!,
        body
      );
      const io = req.app.get("io");
      io.to(`plan:${planId}`).emit("chat:message", msg);
      res.status(201).json({ data: msg });
    } catch (e) {
      next(e);
    }
  }
);
