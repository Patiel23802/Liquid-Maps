import {
  PlanJoinType,
  PlanStatus,
  ParticipantStatus,
  PlanVisibility,
  Prisma,
  VerificationStatus,
  Gender,
  NotificationType,
} from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { distanceKm } from "../utils/distance.js";

function encodeCursor(start: Date, id: string): string {
  return Buffer.from(
    JSON.stringify({ t: start.toISOString(), id }),
    "utf-8"
  ).toString("base64url");
}

function decodeCursor(
  cursor: string | undefined
): { t: string; id: string } | null {
  if (!cursor) return null;
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf-8");
    const o = JSON.parse(raw) as { t: string; id: string };
    if (!o.t || !o.id) return null;
    return o;
  } catch {
    return null;
  }
}

export async function createPlan(
  hostUserId: string,
  input: {
    title: string;
    description?: string | null;
    categoryId: number;
    vibeId: number;
    cityId: string;
    localityId?: string | null;
    locationName: string;
    lat: number;
    lng: number;
    startTime: Date;
    endTime?: Date | null;
    maxParticipants: number;
    visibility?: PlanVisibility;
    joinType?: PlanJoinType;
    verifiedOnly?: boolean;
    womenOnly?: boolean;
    hideExactUntilJoin?: boolean;
    communityIds?: string[];
    costSplitNote?: string | null;
    bringItemsNote?: string | null;
  }
) {
  const plan = await prisma.$transaction(async (tx) => {
    const p = await tx.plan.create({
      data: {
        hostUserId,
        title: input.title,
        description: input.description ?? undefined,
        categoryId: input.categoryId,
        vibeId: input.vibeId,
        cityId: input.cityId,
        localityId: input.localityId ?? undefined,
        locationName: input.locationName,
        lat: input.lat,
        lng: input.lng,
        startTime: input.startTime,
        endTime: input.endTime ?? undefined,
        maxParticipants: input.maxParticipants,
        visibility: input.visibility ?? PlanVisibility.public,
        joinType: input.joinType ?? PlanJoinType.open,
        verifiedOnly: input.verifiedOnly ?? false,
        womenOnly: input.womenOnly ?? false,
        hideExactUntilJoin: input.hideExactUntilJoin ?? true,
        costSplitNote: input.costSplitNote ?? undefined,
        bringItemsNote: input.bringItemsNote ?? undefined,
        status: PlanStatus.published,
      },
    });
    await tx.planParticipant.create({
      data: {
        planId: p.id,
        userId: hostUserId,
        status: ParticipantStatus.joined,
      },
    });
    const room = await tx.planChatRoom.create({
      data: { planId: p.id },
    });
    await tx.planMessage.create({
      data: {
        roomId: room.id,
        senderId: null,
        body: "Plan chat started. Be kind, meet in public places first.",
        messageType: "system",
      },
    });
    if (input.communityIds?.length) {
      await tx.planCommunity.createMany({
        data: input.communityIds.map((communityId) => ({
          planId: p.id,
          communityId,
        })),
        skipDuplicates: true,
      });
    }
    return p;
  });
  return getPlanById(plan.id, hostUserId);
}

export async function listPlans(
  viewerId: string | undefined,
  q: {
    cityId: string;
    lat?: number;
    lng?: number;
    radiusKm: number;
    category?: string;
    categoryId?: number;
    vibeId?: number;
    verifiedOnly?: boolean;
    womenOnly?: boolean;
    sort: "distance" | "soonest" | "popular" | "trusted_host";
    limit: number;
    cursor?: string;
  }
) {
  let categoryId = q.categoryId;
  if (categoryId == null && q.category) {
    const cat = await prisma.category.findFirst({
      where: { slug: q.category, isActive: true },
    });
    if (cat) categoryId = cat.id;
  }

  const now = new Date();
  const c = decodeCursor(q.cursor);
  const where: Prisma.PlanWhereInput = {
    cityId: q.cityId,
    status: PlanStatus.published,
    visibility: PlanVisibility.public,
    startTime: { gte: now },
    ...(categoryId != null ? { categoryId } : {}),
    ...(q.vibeId != null ? { vibeId: q.vibeId } : {}),
    ...(q.verifiedOnly ? { verifiedOnly: true } : {}),
    ...(q.womenOnly ? { womenOnly: true } : {}),
    ...(c
      ? {
          OR: [
            { startTime: { gt: new Date(c.t) } },
            {
              AND: [
                { startTime: new Date(c.t) },
                { id: { gt: c.id } },
              ],
            },
          ],
        }
      : {}),
  };

  const plans = await prisma.plan.findMany({
    where,
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
    orderBy: [{ startTime: "asc" }, { id: "asc" }],
    take: q.limit + 1,
  });

  let slice = plans;
  let nextCursor: string | null = null;
  if (plans.length > q.limit) {
    nextCursor = encodeCursor(
      plans[q.limit - 1]!.startTime,
      plans[q.limit - 1]!.id
    );
    slice = plans.slice(0, q.limit);
  }

  if (q.lat != null && q.lng != null) {
    slice = slice.filter(
      (p) =>
        distanceKm(q.lat!, q.lng!, p.lat, p.lng) <= q.radiusKm
    );
  }

  if (q.sort === "popular") {
    slice.sort(
      (a, b) => b._count.participants - a._count.participants
    );
  }
  if (q.sort === "trusted_host") {
    slice.sort(
      (a, b) =>
        Number(b.host.hostScore) - Number(a.host.hostScore)
    );
  }
  if (q.sort === "distance" && q.lat != null && q.lng != null) {
    slice.sort(
      (a, b) =>
        distanceKm(q.lat!, q.lng!, a.lat, a.lng) -
        distanceKm(q.lat!, q.lng!, b.lat, b.lng)
    );
  }

  const items = slice.map((p) =>
    toPlanCard(p, viewerId, q.lat, q.lng)
  );
  return { items, nextCursor };
}

export async function mapPlans(q: {
  cityId: string;
  north: number;
  south: number;
  east: number;
  west: number;
  category?: string;
}) {
  let categoryId: number | undefined;
  if (q.category) {
    const cat = await prisma.category.findFirst({
      where: { slug: q.category, isActive: true },
    });
    if (cat) categoryId = cat.id;
  }

  const now = new Date();
  const plans = await prisma.plan.findMany({
    where: {
      cityId: q.cityId,
      status: PlanStatus.published,
      visibility: PlanVisibility.public,
      startTime: { gte: now },
      lat: { gte: q.south, lte: q.north },
      lng: { gte: q.west, lte: q.east },
      ...(categoryId != null ? { categoryId } : {}),
    },
    select: {
      id: true,
      lat: true,
      lng: true,
      startTime: true,
      categoryId: true,
      verifiedOnly: true,
      womenOnly: true,
      maxParticipants: true,
      _count: { select: { participants: true } },
    },
  });
  return plans.map((p) => ({
    id: p.id,
    lat: p.lat,
    lng: p.lng,
    startTime: p.startTime.toISOString(),
    categoryId: p.categoryId,
    participantCount: p._count.participants,
    maxParticipants: p.maxParticipants,
    verifiedOnly: p.verifiedOnly,
    womenOnly: p.womenOnly,
  }));
}

export async function joinPlan(planId: string, userId: string) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.status !== PlanStatus.published) {
    throw new AppError("NOT_FOUND", "Plan not found", 404);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("NOT_FOUND", "User not found", 404);

  if (plan.verifiedOnly && user.verificationStatus !== VerificationStatus.id_verified) {
    throw new AppError(
      "VERIFIED_ONLY",
      "This plan is for verified members only",
      403
    );
  }
  if (plan.womenOnly) {
    const ok =
      user.gender === Gender.female || user.gender === Gender.non_binary;
    if (!ok) {
      throw new AppError(
        "WOMEN_ONLY",
        "This plan is women & non-binary only",
        403
      );
    }
  }

  const count = await prisma.planParticipant.count({
    where: {
      planId,
      status: {
        in: [ParticipantStatus.joined, ParticipantStatus.approved],
      },
    },
  });
  if (count >= plan.maxParticipants) {
    throw new AppError("PLAN_FULL", "Plan is full", 409);
  }

  const existing = await prisma.planParticipant.findUnique({
    where: { planId_userId: { planId, userId } },
  });
  if (existing?.status === ParticipantStatus.joined ||
      existing?.status === ParticipantStatus.approved) {
    return {
      participantId: existing.id,
      status: existing.status,
      canChat: true,
    };
  }

  const status =
    plan.joinType === PlanJoinType.approval_required
      ? ParticipantStatus.pending
      : ParticipantStatus.joined;

  const row = await prisma.planParticipant.upsert({
    where: { planId_userId: { planId, userId } },
    create: { planId, userId, status },
    update: { status, leftAt: null },
  });

  const room = await prisma.planChatRoom.findUnique({
    where: { planId },
  });
  if (room && status === ParticipantStatus.joined) {
    await prisma.planMessage.create({
      data: {
        roomId: room.id,
        senderId: null,
        body: `${user.name} joined the plan`,
        messageType: "system",
      },
    });
    if (plan.hostUserId !== userId) {
      await prisma.notification.create({
        data: {
          userId: plan.hostUserId,
          type: NotificationType.system,
          title: "Someone joined your plan",
          body: `${user.name} joined “${plan.title}”.`,
          data: { planId, actorUserId: userId },
        },
      });
    }
  }

  return {
    participantId: row.id,
    status: row.status,
    canChat:
      row.status === ParticipantStatus.joined ||
      row.status === ParticipantStatus.approved,
  };
}

export async function leavePlan(planId: string, userId: string) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new AppError("NOT_FOUND", "Plan not found", 404);
  if (plan.hostUserId === userId) {
    throw new AppError("HOST_CANNOT_LEAVE", "Cancel the plan instead", 400);
  }
  await prisma.planParticipant.updateMany({
    where: { planId, userId },
    data: { status: ParticipantStatus.left, leftAt: new Date() },
  });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const room = await prisma.planChatRoom.findUnique({ where: { planId } });
  if (room && user) {
    await prisma.planMessage.create({
      data: {
        roomId: room.id,
        senderId: null,
        body: `${user.name} left the plan`,
        messageType: "system",
      },
    });
  }
}

export async function getPlanById(planId: string, viewerId?: string) {
  const plan = await prisma.plan.findFirst({
    where: { id: planId },
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
      communities: { include: { community: true } },
      _count: { select: { participants: true } },
    },
  });
  if (!plan) throw new AppError("NOT_FOUND", "Plan not found", 404);

  let myParticipation: {
    status: ParticipantStatus;
    canChat: boolean;
  } | null = null;
  if (viewerId) {
    const part = await prisma.planParticipant.findUnique({
      where: {
        planId_userId: { planId, userId: viewerId },
      },
    });
    if (part) {
      const canChat =
        part.status === ParticipantStatus.joined ||
        part.status === ParticipantStatus.approved;
      myParticipation = { status: part.status, canChat };
    }
  }

  const hideExact =
    plan.hideExactUntilJoin &&
    (!myParticipation ||
      !(
        myParticipation.status === ParticipantStatus.joined ||
        myParticipation.status === ParticipantStatus.approved
      ));

  return {
    id: plan.id,
    title: plan.title,
    description: plan.description,
    category: {
      id: plan.category.id,
      name: plan.category.name,
      slug: plan.category.slug,
    },
    vibe: {
      id: plan.vibe.id,
      name: plan.vibe.name,
      slug: plan.vibe.slug,
    },
    cityId: plan.cityId,
    locationName: plan.locationName,
    lat: hideExact ? null : plan.lat,
    lng: hideExact ? null : plan.lng,
    locationPrecision: hideExact ? "approximate" : "exact",
    startTime: plan.startTime.toISOString(),
    endTime: plan.endTime?.toISOString() ?? null,
    maxParticipants: plan.maxParticipants,
    visibility: plan.visibility,
    joinType: plan.joinType,
    verifiedOnly: plan.verifiedOnly,
    womenOnly: plan.womenOnly,
    status: plan.status,
    participantCount: plan._count.participants,
    myParticipation,
    host: {
      id: plan.host.id,
      username: plan.host.username,
      name: plan.host.name,
      profileImageUrl: plan.host.profileImageUrl,
      verificationStatus: plan.host.verificationStatus,
      hostScore: Number(plan.host.hostScore),
    },
    communities: plan.communities.map((pc) => ({
      id: pc.community.id,
      name: pc.community.name,
    })),
    costSplitNote: plan.costSplitNote,
    bringItemsNote: plan.bringItemsNote,
    trustBadges: trustBadgesForHost(plan.host),
  };
}

export async function updatePlan(
  planId: string,
  hostUserId: string,
  patch: {
    title?: string;
    description?: string | null;
    categoryId?: number;
    vibeId?: number;
    localityId?: string | null;
    locationName?: string;
    lat?: number;
    lng?: number;
    startTime?: Date;
    endTime?: Date | null;
    maxParticipants?: number;
    visibility?: PlanVisibility;
    joinType?: PlanJoinType;
  }
) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.hostUserId !== hostUserId) {
    throw new AppError("NOT_FOUND", "Plan not found", 404);
  }
  if (
    plan.status !== PlanStatus.published &&
    plan.status !== PlanStatus.draft
  ) {
    throw new AppError("PLAN_LOCKED", "Plan cannot be edited", 400);
  }

  await prisma.plan.update({
    where: { id: planId },
    data: {
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.description !== undefined && { description: patch.description }),
      ...(patch.categoryId !== undefined && { categoryId: patch.categoryId }),
      ...(patch.vibeId !== undefined && { vibeId: patch.vibeId }),
      ...(patch.localityId !== undefined && { localityId: patch.localityId }),
      ...(patch.locationName !== undefined && { locationName: patch.locationName }),
      ...(patch.lat !== undefined && { lat: patch.lat }),
      ...(patch.lng !== undefined && { lng: patch.lng }),
      ...(patch.startTime !== undefined && { startTime: patch.startTime }),
      ...(patch.endTime !== undefined && { endTime: patch.endTime }),
      ...(patch.maxParticipants !== undefined && {
        maxParticipants: patch.maxParticipants,
      }),
      ...(patch.visibility !== undefined && { visibility: patch.visibility }),
      ...(patch.joinType !== undefined && { joinType: patch.joinType }),
    },
  });
  return getPlanById(planId, hostUserId);
}

export async function cancelPlan(planId: string, hostUserId: string) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.hostUserId !== hostUserId) {
    throw new AppError("NOT_FOUND", "Plan not found", 404);
  }
  await prisma.plan.update({
    where: { id: planId },
    data: { status: PlanStatus.cancelled, cancelledAt: new Date() },
  });
  return { ok: true as const };
}

export async function listMyHostedPlans(userId: string) {
  const rows = await prisma.plan.findMany({
    where: { hostUserId: userId },
    orderBy: { startTime: "desc" },
    take: 50,
    include: {
      category: true,
      _count: { select: { participants: true } },
    },
  });
  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    startTime: p.startTime.toISOString(),
    status: p.status,
    category: { id: p.category.id, name: p.category.name, slug: p.category.slug },
    participantCount: p._count.participants,
  }));
}

export async function listMyJoinedPlans(userId: string) {
  const parts = await prisma.planParticipant.findMany({
    where: {
      userId,
      status: { in: [ParticipantStatus.joined, ParticipantStatus.approved] },
    },
    include: {
      plan: {
        include: {
          category: true,
          host: {
            select: { id: true, name: true, username: true },
          },
          _count: { select: { participants: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
    take: 50,
  });
  return parts
    .filter((p) => p.plan.hostUserId !== userId)
    .map((p) => ({
      id: p.plan.id,
      title: p.plan.title,
      startTime: p.plan.startTime.toISOString(),
      status: p.plan.status,
      category: {
        id: p.plan.category.id,
        name: p.plan.category.name,
        slug: p.plan.category.slug,
      },
      participantCount: p.plan._count.participants,
      host: p.plan.host,
    }));
}

function trustBadgesForHost(host: {
  verificationStatus: VerificationStatus;
  hostScore: Prisma.Decimal;
}) {
  const badges: string[] = [];
  if (host.verificationStatus === VerificationStatus.id_verified)
    badges.push("verified_host");
  if (Number(host.hostScore) >= 65) badges.push("trusted_host");
  return badges;
}

function toPlanCard(
  p: {
    id: string;
    title: string;
    locationName: string;
    lat: number;
    lng: number;
    startTime: Date;
    category: { id: number; name: string; slug: string };
    vibe: { id: number; name: string; slug: string };
    host: {
      id: string;
      username: string;
      name: string;
      profileImageUrl: string | null;
      verificationStatus: VerificationStatus;
      hostScore: Prisma.Decimal;
    };
    verifiedOnly: boolean;
    womenOnly: boolean;
    joinType: PlanJoinType;
    maxParticipants: number;
    _count: { participants: number };
  },
  _viewerId: string | undefined,
  lat?: number,
  lng?: number
) {
  const distance =
    lat != null && lng != null
      ? distanceKm(lat, lng, p.lat, p.lng)
      : undefined;
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
    distanceKm: distance != null ? Math.round(distance * 10) / 10 : undefined,
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
    trustBadges: trustBadgesForHost(p.host),
  };
}
