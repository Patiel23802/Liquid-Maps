import { z } from "zod";

export const sendOtpSchema = z.object({
  phone: z.string().min(10).max(20),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(20),
  code: z.string().min(4).max(8),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const fcmTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android", "web"]).optional(),
});
