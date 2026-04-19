import { PlanStatus, PlanVisibility } from "@prisma/client";
import { prisma } from "../config/database.js";
import { distanceKm } from "../utils/distance.js";
import { staticMapPreviewUrl } from "../utils/staticMapPreview.js";

function plansWithinRadius<
  T extends { lat: number; lng: number },
>(plans: T[], lat: number, lng: number, radiusKm: number): T[] {
  return plans.filter(
    (p) => distanceKm(lat, lng, p.lat, p.lng) <= radiusKm
  );
}

export async function homeFeed(
  userId: string,
  cityId: string,
  lat?: number,
  lng?: number,
  radiusKm?: number
) {
  const now = new Date();
  const twoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const day = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { vibes: { where: { isPrimary: true }, take: 1 } },
  });
  const primaryVibeId = user?.vibes[0]?.vibeId;

  const baseWhere = {
    cityId,
    status: PlanStatus.published,
    visibility: PlanVisibility.public,
  };

  const [happeningNow, startingSoon, forYourVibe, communities, categories] =
    await Promise.all([
      prisma.plan.findMany({
        where: {
          ...baseWhere,
          startTime: { gte: now, lte: twoHours },
        },
        include: {
          category: true,
          vibe: true,
          host: {
            select: {
              id: true,
              username: true,
              name: true,
              profileImageUrl: true,
              verificationStatus: true,
              hostScore: true,
            },
          },
          _count: { select: { participants: true } },
        },
        orderBy: { startTime: "asc" },
        take: 10,
      }),
      prisma.plan.findMany({
        where: {
          ...baseWhere,
          startTime: { gt: twoHours, lte: day },
        },
        include: {
          category: true,
          vibe: true,
          host: {
            select: {
              id: true,
              username: true,
              name: true,
              profileImageUrl: true,
              verificationStatus: true,
              hostScore: true,
            },
          },
          _count: { select: { participants: true } },
        },
        orderBy: { startTime: "asc" },
        take: 10,
      }),
      primaryVibeId
        ? prisma.plan.findMany({
            where: {
              ...baseWhere,
              vibeId: primaryVibeId,
              startTime: { gte: now },
            },
            include: {
              category: true,
              vibe: true,
              host: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  profileImageUrl: true,
                  verificationStatus: true,
                  hostScore: true,
                },
              },
              _count: { select: { participants: true } },
            },
            orderBy: { startTime: "asc" },
            take: 10,
          })
        : Promise.resolve([]),
      prisma.community.findMany({
        where: { cityId, visibility: "public" },
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { members: true } },
        },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        take: 12,
      }),
    ]);

  const useRadius =
    lat != null &&
    lng != null &&
    radiusKm != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Number.isFinite(radiusKm);

  const hn = useRadius
    ? plansWithinRadius(happeningNow, lat!, lng!, radiusKm!)
    : happeningNow;
  const ss = useRadius
    ? plansWithinRadius(startingSoon, lat!, lng!, radiusKm!)
    : startingSoon;
  const fyv = useRadius
    ? plansWithinRadius(forYourVibe, lat!, lng!, radiusKm!)
    : forYourVibe;

  const mapCard = (
    p: (typeof happeningNow)[0]
  ): Record<string, unknown> => {
    const mapPreviewUrl = staticMapPreviewUrl(p.lat, p.lng);
    return {
      id: p.id,
      title: p.title,
      category: {
        id: p.category.id,
        name: p.category.name,
        slug: p.category.slug,
      },
      vibe: { id: p.vibe.id, name: p.vibe.name, slug: p.vibe.slug },
      startTime: p.startTime.toISOString(),
      locationName: p.locationName,
      lat: p.lat,
      lng: p.lng,
      distanceKm:
        lat != null && lng != null
          ? Math.round(distanceKm(lat, lng, p.lat, p.lng) * 10) / 10
          : undefined,
      participantCount: p._count.participants,
      maxParticipants: p.maxParticipants,
      verifiedOnly: p.verifiedOnly,
      womenOnly: p.womenOnly,
      joinType: p.joinType,
      host: {
        id: p.host.id,
        username: p.host.username,
        name: p.host.name,
        profileImageUrl: p.host.profileImageUrl,
        verificationStatus: p.host.verificationStatus,
        hostScore: Number(p.host.hostScore),
      },
      ...(mapPreviewUrl ? { mapPreviewUrl } : {}),
    };
  };

  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const trendingCategories = await prisma.plan.groupBy({
    by: ["categoryId"],
    where: {
      cityId,
      createdAt: { gte: since },
      status: PlanStatus.published,
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 6,
  });

  const catMap = Object.fromEntries(
    categories.map((c) => [c.id, c.name])
  );

  return {
    happeningNow: hn.map(mapCard),
    startingSoon: ss.map(mapCard),
    forYourVibe: fyv.map(mapCard),
    suggestedCommunities: communities.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      memberCount: c._count.members,
      tags: c.tags,
      isCurated: c.isCurated,
    })),
    trendingCategories: trendingCategories.map((t) => ({
      categoryId: t.categoryId,
      name: catMap[t.categoryId] ?? "Activity",
      planCount24h: t._count.id,
    })),
  };
}
