import { prisma } from "../config/database.js";
import { distanceKm } from "../utils/distance.js";

export async function listNearbyPeople(q: {
  viewerId: string;
  lat: number;
  lng: number;
  radiusKm: number;
  category?: string;
  limit?: number;
}) {
  const limit = Math.min(q.limit ?? 30, 60);
  let interestId: number | undefined;
  if (q.category) {
    const interest = await prisma.interest.findFirst({
      where: { slug: q.category, isActive: true },
    });
    if (interest) interestId = interest.id;
  }

  const users = await prisma.user.findMany({
    where: {
      id: { not: q.viewerId },
      deletedAt: null,
      isBanned: false,
      lat: { not: null },
      lng: { not: null },
      ...(interestId != null
        ? {
            interests: { some: { interestId } },
          }
        : {}),
    },
    take: 80,
    include: {
      interests: { include: { interest: true } },
      city: true,
    },
  });

  const mapped = users
    .map((u) => {
      const d = distanceKm(q.lat, q.lng, u.lat!, u.lng!);
      return {
        id: u.id,
        name: u.name,
        username: u.username,
        bio: u.bio,
        discoveryTagline: u.discoveryTagline,
        ageBand: u.ageBand,
        profileImageUrl: u.profileImageUrl,
        city: u.city
          ? { id: u.city.id, name: u.city.name, slug: u.city.slug }
          : null,
        interests: u.interests.map((ui) => ({
          id: ui.interest.id,
          slug: ui.interest.slug,
          name: ui.interest.name,
        })),
        distanceKm: Math.round(d * 10) / 10,
      };
    })
    .filter((u) => u.distanceKm <= q.radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);

  return mapped;
}
