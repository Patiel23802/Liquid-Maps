import { Router } from "express";
import { z } from "zod";
import { optionalAuth, requireAuth, type AuthedRequest } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import * as communityService from "../services/communityService.js";

const listQuery = z.object({
  cityId: z.string().uuid(),
  search: z.string().optional(),
});

export const communityRouter = Router();

communityRouter.get(
  "/",
  optionalAuth,
  validate({ query: listQuery }),
  async (req: AuthedRequest, res, next) => {
    try {
      const { cityId, search } = req.query as z.infer<typeof listQuery>;
      const data = await communityService.listCommunities(cityId, search);
      res.json({ data: { items: data } });
    } catch (e) {
      next(e);
    }
  }
);

communityRouter.get("/:id", optionalAuth, async (req: AuthedRequest, res, next) => {
  try {
    const id = String(req.params.id);
    const data = await communityService.getCommunity(id, req.userId);
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

communityRouter.post(
  "/:id/join",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      const id = String(req.params.id);
      const data = await communityService.joinCommunity(id, req.userId!);
      res.json({ data });
    } catch (e) {
      next(e);
    }
  }
);

communityRouter.post(
  "/:id/leave",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      const id = String(req.params.id);
      await communityService.leaveCommunity(id, req.userId!);
      res.json({ data: { ok: true } });
    } catch (e) {
      next(e);
    }
  }
);
