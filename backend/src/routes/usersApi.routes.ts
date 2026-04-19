import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { patchMeSchema } from "../validators/user.js";
import * as userService from "../services/userService.js";
import * as planService from "../services/planService.js";

export const usersApiRouter = Router();

const interestsBodySchema = z.object({
  interestIds: z.array(z.number().int()).max(40),
});

usersApiRouter.get("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const data = await userService.getMe(req.userId!);
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

usersApiRouter.put(
  "/me",
  requireAuth,
  validate({ body: patchMeSchema }),
  async (req: AuthedRequest, res, next) => {
    try {
      const data = await userService.patchMe(req.userId!, req.body);
      res.json({ data });
    } catch (e) {
      next(e);
    }
  }
);

usersApiRouter.put(
  "/me/interests",
  requireAuth,
  validate({ body: interestsBodySchema }),
  async (req: AuthedRequest, res, next) => {
    try {
      const { interestIds } = req.body as { interestIds: number[] };
      const data = await userService.patchMe(req.userId!, { interestIds });
      res.json({ data });
    } catch (e) {
      next(e);
    }
  }
);

usersApiRouter.get(
  "/me/events",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      const data = await planService.listMyHostedPlans(req.userId!);
      res.json({ data });
    } catch (e) {
      next(e);
    }
  }
);

usersApiRouter.get(
  "/me/joined-events",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      const data = await planService.listMyJoinedPlans(req.userId!);
      res.json({ data });
    } catch (e) {
      next(e);
    }
  }
);

usersApiRouter.get("/:id", async (req, res, next) => {
  try {
    const data = await userService.getUserPublicProfile(String(req.params.id));
    res.json({ data });
  } catch (e) {
    next(e);
  }
});
