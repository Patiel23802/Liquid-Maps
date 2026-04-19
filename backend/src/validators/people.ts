import { z } from "zod";

export const nearbyPeopleQuerySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radiusKm: z.coerce.number().min(0.5).max(50).optional().default(10),
  category: z.string().min(1).max(64).optional(),
  limit: z.coerce.number().int().min(1).max(60).optional().default(30),
});
