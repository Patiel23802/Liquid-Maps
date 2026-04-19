import { z } from "zod";

export const listSpotsQuerySchema = z.object({
  cityId: z.string().uuid(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().min(0.5).max(50).optional().default(15),
  category: z.string().min(1).max(64).optional(),
  limit: z.coerce.number().int().min(1).max(80).optional().default(40),
});
