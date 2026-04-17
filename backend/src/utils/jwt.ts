import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type AccessPayload = { sub: string; typ?: string };
export type AdminAccessPayload = { sub: string; typ: "admin" };

export function signAccessToken(userId: string): string {
  return jwt.sign(
    { sub: userId, typ: "access" as const },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.ACCESS_TOKEN_TTL_SEC }
  );
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
  if ((decoded.typ ?? "access") !== "access" || !decoded.sub)
    throw new Error("Invalid token");
  return decoded;
}

export function signRefreshToken(userId: string, jti: string): string {
  return jwt.sign(
    { sub: userId, typ: "refresh", jti },
    env.JWT_REFRESH_SECRET,
    { expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d` }
  );
}

export function verifyRefreshToken(token: string): {
  sub: string;
  jti: string;
} {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
    sub: string;
    typ: string;
    jti: string;
  };
  if (decoded.typ !== "refresh" || !decoded.sub || !decoded.jti)
    throw new Error("Invalid refresh");
  return { sub: decoded.sub, jti: decoded.jti };
}

export function signAdminToken(adminId: string): string {
  return jwt.sign({ sub: adminId, typ: "admin" }, env.JWT_ACCESS_SECRET, {
    expiresIn: "8h",
  });
}

export function verifyAdminToken(token: string): AdminAccessPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AdminAccessPayload;
  if (decoded.typ !== "admin" || !decoded.sub) throw new Error("Invalid admin");
  return decoded;
}
