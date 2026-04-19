import { Router } from "express";
import { optionalAuth, type AuthedRequest } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { listSpotsQuerySchema } from "../validators/spots.js";
import * as spotsService from "../services/spotsService.js";

export const spotsRouter = Router();

spotsRouter.get(
  "/",
  optionalAuth,
  validate({ query: listSpotsQuerySchema }),
  async (req: AuthedRequest, res, next) => {
    try {
      const q = req.query as unknown as Parameters<
        typeof spotsService.listSpots
      >[0];
      const data = await spotsService.listSpots(q);
      res.json({ data });
    } catch (e) {
      next(e);
    }
  }
);

spotsRouter.get("/:id", async (req, res, next) => {
  try {
    const data = await spotsService.getSpotById(String(req.params.id));
    res.json({ data });
  } catch (e) {
    next(e);
  }
});
