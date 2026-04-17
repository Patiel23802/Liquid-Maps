import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../middlewares/validate.js";
import {
  sendOtpSchema,
  verifyOtpSchema,
  refreshSchema,
  fcmTokenSchema,
} from "../validators/auth.js";
import * as authService from "../services/authService.js";
import { requireAuth, type AuthedRequest } from "../middlewares/auth.js";
import { prisma } from "../config/database.js";

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRouter = Router();

authRouter.post(
  "/otp/send",
  otpLimiter,
  validate({ body: sendOtpSchema }),
  async (req, res, next) => {
    try {
      const { phone } = req.body as { phone: string };
      const data = await authService.sendOtp(phone);
      res.json({ data });
    } catch (e) {
      next(e);
    }
  }
);

authRouter.post(
  "/otp/verify",
  otpLimiter,
  validate({ body: verifyOtpSchema }),
  async (req, res, next) => {
    try {
      const { phone, code } = req.body as { phone: string; code: string };
      const data = await authService.verifyOtpAndLogin(phone, code);
      res.json({ data });
    } catch (e) {
      next(e);
    }
  }
);

authRouter.post(
  "/refresh",
  validate({ body: refreshSchema }),
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      const data = await authService.refreshSession(refreshToken);
      res.json({ data });
    } catch (e) {
      next(e);
    }
  }
);

authRouter.post(
  "/logout",
  requireAuth,
  validate({ body: refreshSchema }),
  async (req: AuthedRequest, res, next) => {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      await authService.logout(req.userId!, refreshToken);
      res.json({ data: { ok: true } });
    } catch (e) {
      next(e);
    }
  }
);

authRouter.post(
  "/fcm-token",
  requireAuth,
  validate({ body: fcmTokenSchema }),
  async (req: AuthedRequest, res, next) => {
    try {
      const { token, platform } = req.body as {
        token: string;
        platform?: string;
      };
      const userId = req.userId!;
      await prisma.userDevice.upsert({
        where: {
          userId_fcmToken: { userId, fcmToken: token },
        },
        create: { userId, fcmToken: token, platform: platform ?? null },
        update: { lastSeenAt: new Date(), platform: platform ?? undefined },
      });
      res.json({ data: { ok: true } });
    } catch (e) {
      next(e);
    }
  }
);
