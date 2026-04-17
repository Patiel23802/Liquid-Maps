import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import * as feedService from "../services/feedService.js";

const homeQuery = z.object({
  cityId: z.string().uuid(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});

export const feedRouter = Router();

feedRouter.get(
  "/home",
  requireAuth,
  validate({ query: homeQuery }),
  async (req: AuthedRequest, res, next) => {
    try {
      const { cityId, lat, lng } = req.query as unknown as z.infer<
        typeof homeQuery
      >;
      const data = await feedService.homeFeed(req.userId!, cityId, lat, lng);
      res.json({ data });
    } catch (e) {
      next(e);
    }
  }
);
