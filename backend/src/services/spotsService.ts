import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { distanceKm } from "../utils/distance.js";

export async function listSpots(q: {
  cityId: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  category?: string;
  limit?: number;
}) {
  const limit = Math.min(q.limit ?? 40, 80);
  const where: { cityId: string; categoryId?: number } = { cityId: q.cityId };
  if (q.category) {
    const cat = await prisma.category.findFirst({
      where: { slug: q.category, isActive: true },
    });
    if (cat) where.categoryId = cat.id;
  }

  const rows = await prisma.socialSpot.findMany({
    where,
    include: { category: true },
    orderBy: [{ popularity: "desc" }, { name: "asc" }],
    take: limit,
  });

  const mapped = rows.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    description: s.description,
    address: s.address,
    lat: s.lat,
    lng: s.lng,
    popularity: s.popularity,
    vibeTags: s.vibeTags,
    category: {
      id: s.category.id,
      name: s.category.name,
      slug: s.category.slug,
    },
    distanceKm: undefined as number | undefined,
  }));

  if (q.lat != null && q.lng != null) {
    const r = q.radiusKm ?? 25;
    return mapped
      .map((s) => ({
        ...s,
        distanceKm: Math.round(distanceKm(q.lat!, q.lng!, s.lat, s.lng) * 10) / 10,
      }))
      .filter((s) => (s.distanceKm as number) <= r)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }

  return mapped;
}

export async function getSpotById(id: string) {
  const s = await prisma.socialSpot.findFirst({
    where: { id },
    include: { category: true, city: true },
  });
  if (!s) throw new AppError("NOT_FOUND", "Spot not found", 404);
  return {
    id: s.id,
    name: s.name,
    slug: s.slug,
    description: s.description,
    address: s.address,
    lat: s.lat,
    lng: s.lng,
    popularity: s.popularity,
    vibeTags: s.vibeTags,
    city: { id: s.city.id, name: s.city.name, slug: s.city.slug },
    category: {
      id: s.category.id,
      name: s.category.name,
      slug: s.category.slug,
    },
  };
}
