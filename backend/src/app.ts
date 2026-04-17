import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  const origins =
    env.CORS_ORIGIN === "*"
      ? true
      : env.CORS_ORIGIN.split(",").map((o) => o.trim());
  app.use(cors({ origin: origins, credentials: true }));
  app.use(morgan("dev"));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/v1", apiRouter);
  app.use(errorHandler);
  return app;
}
