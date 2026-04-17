import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { userRouter } from "./user.routes.js";
import { catalogRouter } from "./catalog.routes.js";
import { feedRouter } from "./feed.routes.js";
import { planRouter } from "./plan.routes.js";
import { communityRouter } from "./community.routes.js";
import { reportRouter } from "./report.routes.js";
import { adminRouter } from "./admin.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/", userRouter);
apiRouter.use("/", catalogRouter);
apiRouter.use("/feed", feedRouter);
apiRouter.use("/plans", planRouter);
apiRouter.use("/communities", communityRouter);
apiRouter.use("/reports", reportRouter);
apiRouter.use("/admin", adminRouter);

apiRouter.get("/version", (_req, res) => {
  res.json({ data: { version: "0.1.0" } });
});
