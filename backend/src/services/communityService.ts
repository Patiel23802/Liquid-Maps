import {
  CommunityMemberStatus,
  CommunityVisibility,
} from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";

export async function listCommunities(cityId: string, search?: string) {
  const items = await prisma.community.findMany({
    where: {
      cityId,
      visibility: CommunityVisibility.public,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return items.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    memberCount: c._count.members,
    tags: c.tags,
    visibility: c.visibility,
    isCurated: c.isCurated,
    description: c.description,
  }));
}

export async function getCommunity(id: string, userId?: string) {
  const c = await prisma.community.findUnique({
    where: { id },
    include: {
      _count: { select: { members: true } },
    },
  });
  if (!c) throw new AppError("NOT_FOUND", "Community not found", 404);

  let myMembership: string | null = null;
  if (userId) {
    const m = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: { communityId: id, userId },
      },
    });
    myMembership = m?.status ?? null;
  }

  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    tags: c.tags,
    visibility: c.visibility,
    memberCount: c._count.members,
    isCurated: c.isCurated,
    myMembership,
  };
}

export async function joinCommunity(communityId: string, userId: string) {
  const c = await prisma.community.findUnique({ where: { id: communityId } });
  if (!c) throw new AppError("NOT_FOUND", "Community not found", 404);

  const status =
    c.visibility === CommunityVisibility.private
      ? CommunityMemberStatus.pending
      : CommunityMemberStatus.active;

  await prisma.communityMember.upsert({
    where: {
      communityId_userId: { communityId, userId },
    },
    create: { communityId, userId, status },
    update: { status },
  });

  return { status };
}

export async function leaveCommunity(communityId: string, userId: string) {
  await prisma.communityMember.deleteMany({
    where: { communityId, userId },
  });
}
