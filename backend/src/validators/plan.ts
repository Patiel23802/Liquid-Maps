import { z } from "zod";

export const createPlanSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  categoryId: z.number().int(),
  vibeId: z.number().int(),
  cityId: z.string().uuid(),
  localityId: z.string().uuid().optional().nullable(),
  locationName: z.string().min(1).max(255),
  lat: z.number(),
  lng: z.number(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional().nullable(),
  maxParticipants: z.number().int().min(2).max(500),
  visibility: z.enum(["public", "private", "unlisted"]).optional(),
  joinType: z.enum(["open", "approval_required"]).optional(),
  verifiedOnly: z.boolean().optional(),
  womenOnly: z.boolean().optional(),
  hideExactUntilJoin: z.boolean().optional(),
  communityIds: z.array(z.string().uuid()).optional(),
  costSplitNote: z.string().max(500).optional().nullable(),
  bringItemsNote: z.string().max(500).optional().nullable(),
});

export const listPlansQuerySchema = z.object({
  cityId: z.string().uuid(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().min(0.5).max(100).optional().default(10),
  category: z.string().min(1).max(64).optional(),
  categoryId: z.coerce.number().int().optional(),
  vibeId: z.coerce.number().int().optional(),
  verifiedOnly: z.coerce.boolean().optional(),
  womenOnly: z.coerce.boolean().optional(),
  sort: z
    .enum(["distance", "soonest", "popular", "trusted_host"])
    .optional()
    .default("soonest"),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  cursor: z.string().optional(),
});

export const mapPlansQuerySchema = z.object({
  cityId: z.string().uuid(),
  north: z.coerce.number(),
  south: z.coerce.number(),
  east: z.coerce.number(),
  west: z.coerce.number(),
  category: z.string().min(1).max(64).optional(),
});

export const chatMessageSchema = z.object({
  body: z.string().min(1).max(4000),
});

export const updatePlanSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  categoryId: z.number().int().optional(),
  vibeId: z.number().int().optional(),
  localityId: z.string().uuid().optional().nullable(),
  locationName: z.string().min(1).max(255).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional().nullable(),
  maxParticipants: z.number().int().min(2).max(500).optional(),
  visibility: z.enum(["public", "private", "unlisted"]).optional(),
  joinType: z.enum(["open", "approval_required"]).optional(),
});

export const planFeedbackSchema = z.object({
  attendance: z.enum(["attended", "absent", "excused"]),
  hostStars: z.number().int().min(1).max(5).optional().nullable(),
  noShowUserIds: z.array(z.string().uuid()).optional(),
  reliabilityNotes: z.string().max(1000).optional().nullable(),
});
