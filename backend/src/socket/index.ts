import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { verifyAccessToken } from "../utils/jwt.js";
import { env } from "../config/env.js";

export function attachSocket(httpServer: HttpServer): Server {
  const origins =
    env.CORS_ORIGIN === "*"
      ? true
      : env.CORS_ORIGIN.split(",").map((o) => o.trim());

  const io = new Server(httpServer, {
    cors: { origin: origins, methods: ["GET", "POST"] },
  });

  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string) ||
        (socket.handshake.headers.authorization?.replace("Bearer ", "") ?? "");
      if (!token) {
        next(new Error("Unauthorized"));
        return;
      }
      verifyAccessToken(token);
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    let uid: string;
    try {
      const token = socket.handshake.auth?.token as string;
      const header = socket.handshake.headers.authorization;
      const raw =
        token || (header?.startsWith("Bearer ") ? header.slice(7) : "");
      uid = verifyAccessToken(raw).sub;
    } catch {
      socket.disconnect();
      return;
    }

    socket.on("plan:subscribe", (planId: string) => {
      if (typeof planId === "string") socket.join(`plan:${planId}`);
    });
    socket.on("plan:unsubscribe", (planId: string) => {
      if (typeof planId === "string") socket.leave(`plan:${planId}`);
    });

    socket.emit("connected", { userId: uid });
  });

  return io;
}
