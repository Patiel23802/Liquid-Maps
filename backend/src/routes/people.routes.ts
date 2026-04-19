import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { nearbyPeopleQuerySchema } from "../validators/people.js";
import * as peopleService from "../services/peopleService.js";

export const peopleRouter = Router();

peopleRouter.get(
  "/nearby",
  requireAuth,
  validate({ query: nearbyPeopleQuerySchema }),
  async (req: AuthedRequest, res, next) => {
    try {
      const q = req.query as unknown as {
        lat: number;
        lng: number;
        radiusKm: number;
        category?: string;
        limit?: number;
      };
      const data = await peopleService.listNearbyPeople({
        viewerId: req.userId!,
        lat: q.lat,
        lng: q.lng,
        radiusKm: q.radiusKm,
        category: q.category,
        limit: q.limit,
      });
      res.json({ data });
    } catch (e) {
      next(e);
    }
  }
);
