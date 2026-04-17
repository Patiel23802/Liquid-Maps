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
  user: { id: string; phone: string; onboardingCompleted: boolean; username: string | null };
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

  const refreshJti = randomToken();
  const tokenHash = sha256(refreshJti);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_TTL_DAYS);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const refreshToken = signRefreshToken(user.id, refreshJti);
  const accessToken = signAccessToken(user.id);

  return {
    accessToken,
    refreshToken,
    expiresIn: env.ACCESS_TOKEN_TTL_SEC,
    user: {
      id: user.id,
      phone: user.phone,
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
