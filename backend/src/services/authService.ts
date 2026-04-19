import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { randomToken, sha256 } from "../utils/hash.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { setOtp, verifyOtp, peekOtpForDev } from "./otpStore.js";

const OTP_TTL_MS = 5 * 60 * 1000;

async function issueAuthTokens(userId: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const refreshJti = randomToken();
  const tokenHash = sha256(refreshJti);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_TTL_DAYS);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  const refreshToken = signRefreshToken(userId, refreshJti);
  const accessToken = signAccessToken(userId);
  return {
    accessToken,
    refreshToken,
    expiresIn: env.ACCESS_TOKEN_TTL_SEC,
  };
}

function randomOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendOtp(phone: string): Promise<{
  expiresInSeconds: number;
  channel: string;
  devCode?: string;
}> {
  await prisma.otpAttempt.create({
    data: { phone, success: false },
  });
  const code = randomOtp();
  setOtp(phone, code, OTP_TTL_MS);
  // Phase 2: integrate Twilio / MSG91
  if (env.NODE_ENV === "development") {
    console.info(`[OTP] ${phone} code=${code}`);
  }
  return {
    expiresInSeconds: OTP_TTL_MS / 1000,
    channel: "sms",
    devCode: env.NODE_ENV === "development" ? code : undefined,
  };
}

export async function verifyOtpAndLogin(
  phone: string,
  code: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    phone: string | null;
    onboardingCompleted: boolean;
    username: string | null;
  };
}> {
  const ok = verifyOtp(phone, code);
  if (!ok) {
    await prisma.otpAttempt.create({ data: { phone, success: false } });
    throw new AppError("OTP_INVALID", "Invalid or expired code", 400);
  }
  await prisma.otpAttempt.create({ data: { phone, success: true } });

  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    const base = phone.replace(/\D/g, "").slice(-6);
    user = await prisma.user.create({
      data: {
        phone,
        phoneVerifiedAt: new Date(),
        name: "New member",
        username: `user_${base}_${Date.now().toString(36)}`,
        onboardingCompleted: false,
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { phoneVerifiedAt: new Date() },
    });
  }

  const tokens = await issueAuthTokens(user.id);

  return {
    ...tokens,
    user: {
      id: user.id,
      phone: user.phone,
      onboardingCompleted: user.onboardingCompleted,
      username: user.username,
    },
  };
}

export async function signupWithEmail(input: {
  email: string;
  password: string;
  name: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: { id: string; email: string | null; onboardingCompleted: boolean; username: string };
}> {
  const email = input.email.trim().toLowerCase();
  const taken = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });
  if (taken) {
    throw new AppError("EMAIL_IN_USE", "Email already registered", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const base = email.split("@")[0]!.replace(/[^a-z0-9_]/gi, "").slice(0, 20) || "user";
  const username = `${base}_${Math.random().toString(36).slice(2, 8)}`;

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: input.name.trim(),
      username,
      onboardingCompleted: false,
    },
  });

  const tokens = await issueAuthTokens(user.id);
  return {
    ...tokens,
    user: {
      id: user.id,
      email: user.email,
      onboardingCompleted: user.onboardingCompleted,
      username: user.username,
    },
  };
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: { id: string; email: string | null; onboardingCompleted: boolean; username: string };
}> {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email: normalized, deletedAt: null, isBanned: false },
  });
  if (!user?.passwordHash) {
    throw new AppError("INVALID_CREDENTIALS", "Invalid email or password", 401);
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new AppError("INVALID_CREDENTIALS", "Invalid email or password", 401);
  }

  const tokens = await issueAuthTokens(user.id);
  return {
    ...tokens,
    user: {
      id: user.id,
      email: user.email,
      onboardingCompleted: user.onboardingCompleted,
      username: user.username,
    },
  };
}

export async function refreshSession(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  let sub: string;
  let jti: string;
  try {
    ({ sub, jti } = verifyRefreshToken(refreshToken));
  } catch {
    throw new AppError("INVALID_REFRESH", "Invalid refresh token", 401);
  }
  const row = await prisma.refreshToken.findFirst({
    where: {
      userId: sub,
      tokenHash: sha256(jti),
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (!row) throw new AppError("INVALID_REFRESH", "Invalid refresh token", 401);

  return {
    accessToken: signAccessToken(sub),
    expiresIn: env.ACCESS_TOKEN_TTL_SEC,
  };
}

export async function logout(userId: string, refreshToken: string): Promise<void> {
  try {
    const { sub, jti } = verifyRefreshToken(refreshToken);
    if (sub !== userId) return;
    await prisma.refreshToken.updateMany({
      where: { userId, tokenHash: sha256(jti) },
      data: { revokedAt: new Date() },
    });
  } catch {
    /* ignore */
  }
}

export { peekOtpForDev };
