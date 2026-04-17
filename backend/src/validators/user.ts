import { z } from "zod";

export const patchMeSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9_]+$/i)
    .optional(),
  bio: z.string().max(500).optional(),
  email: z.string().email().optional().nullable(),
  cityId: z.string().uuid().optional().nullable(),
  localityId: z.string().uuid().optional().nullable(),
  localityText: z.string().max(120).optional().nullable(),
  ageBand: z.string().max(20).optional().nullable(),
  gender: z
    .enum(["male", "female", "non_binary", "prefer_not_say"])
    .optional()
    .nullable(),
  interestIds: z.array(z.number().int()).optional(),
  primaryVibeId: z.number().int().optional().nullable(),
  secondaryVibeIds: z.array(z.number().int()).max(5).optional(),
  profileImageUrl: z.string().url().optional().nullable(),
  privacySettings: z.record(z.unknown()).optional(),
  safetyPreferences: z.record(z.unknown()).optional(),
});

export const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});
