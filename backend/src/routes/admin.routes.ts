import { Router } from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.js";
import { requireAdmin, type AdminRequest } from "../middlewares/requireAdmin.js";
import * as adminService from "../services/adminService.js";

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const adminRouter = Router();

adminRouter.post(
  "/auth/login",
  validate({ body: loginBody }),
  async (req, res, next) => {
    try {
      const { email, password } = req.body as z.infer<typeof loginBody>;
      const data = await adminService.adminLogin(email, password);
      res.json({ data });
    } catch (e) {
      next(e);
    }
  }
);

adminRouter.get(
  "/metrics/overview",
  requireAdmin,
  async (req: AdminRequest, res, next) => {
    try {
      const cityId = req.query.cityId as string | undefined;
      const data = await adminService.adminMetrics(cityId);
      res.json({ data });
    } catch (e) {
      next(e);
    }
  }
);

adminRouter.get("/reports", requireAdmin, async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const data = await adminService.listReports(status);
    res.json({ data });
  } catch (e) {
    next(e);
  }
});
