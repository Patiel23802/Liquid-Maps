import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { locationSchema, patchMeSchema } from "../validators/user.js";
import * as userService from "../services/userService.js";

export const userRouter = Router();

userRouter.get("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const data = await userService.getMe(req.userId!);
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

userRouter.patch(
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

userRouter.patch(
  "/me/onboarding/complete",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      const data = await userService.completeOnboarding(req.userId!);
      res.json({ data });
    } catch (e) {
      next(e);
    }
  }
);

userRouter.put(
  "/me/location",
  requireAuth,
  validate({ body: locationSchema }),
  async (req: AuthedRequest, res, next) => {
    try {
      const { lat, lng } = req.body as { lat: number; lng: number };
      await userService.updateLocation(req.userId!, lat, lng);
      res.json({ data: { ok: true } });
    } catch (e) {
      next(e);
    }
  }
);
