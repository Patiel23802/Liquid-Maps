import type {
  Interest,
  User,
  Vibe,
  City,
  Locality,
} from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";

type UserWithRelations = User & {
  city: City | null;
  locality: Locality | null;
  interests: { interest: Interest }[];
  vibes: { vibe: Vibe; isPrimary: boolean }[];
};

export async function getMe(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    include: {
      city: true,
      locality: true,
      interests: { include: { interest: true } },
      vibes: { include: { vibe: true } },
    },
  });
  if (!user) throw new AppError("NOT_FOUND", "User not found", 404);
  return serializeUser(user);
}

export async function patchMe(
  userId: string,
  data: {
    name?: string;
    username?: string;
    bio?: string | null;
    discoveryTagline?: string | null;
    email?: string | null;
    cityId?: string | null;
    localityId?: string | null;
    localityText?: string | null;
    ageBand?: string | null;
    gender?: string | null;
    interestIds?: number[];
    primaryVibeId?: number | null;
    secondaryVibeIds?: number[];
    profileImageUrl?: string | null;
    privacySettings?: Record<string, unknown>;
    safetyPreferences?: Record<string, unknown>;
  }
) {
  if (data.username) {
    const taken = await prisma.user.findFirst({
      where: {
        username: data.username,
        NOT: { id: userId },
      },
    });
    if (taken) throw new AppError("USERNAME_TAKEN", "Username taken", 409);
  }

  const {
    interestIds,
    primaryVibeId,
    secondaryVibeIds,
    name,
    username,
    bio,
    discoveryTagline,
    email,
    cityId,
    localityId,
    localityText,
    ageBand,
    gender,
    profileImageUrl,
    privacySettings,
    safetyPreferences,
  } = data;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(username !== undefined && { username }),
        ...(bio !== undefined && { bio }),
        ...(discoveryTagline !== undefined && { discoveryTagline }),
        ...(email !== undefined && { email }),
        ...(cityId !== undefined && { cityId }),
        ...(localityId !== undefined && { localityId }),
        ...(localityText !== undefined && { localityText }),
        ...(ageBand !== undefined && { ageBand }),
        ...(gender !== undefined && { gender: gender as User["gender"] | null }),
        ...(profileImageUrl !== undefined && { profileImageUrl }),
        ...(privacySettings !== undefined && {
          privacySettings: privacySettings as object,
        }),
        ...(safetyPreferences !== undefined && {
          safetyPreferences: safetyPreferences as object,
        }),
      },
    });

    if (interestIds) {
      await tx.userInterest.deleteMany({ where: { userId } });
      if (interestIds.length) {
        await tx.userInterest.createMany({
          data: interestIds.map((interestId) => ({ userId, interestId })),
        });
      }
    }

    if (primaryVibeId != null || secondaryVibeIds) {
      await tx.userVibe.deleteMany({ where: { userId } });
      const rows: { userId: string; vibeId: number; isPrimary: boolean }[] =
        [];
      if (primaryVibeId != null) {
        rows.push({ userId, vibeId: primaryVibeId, isPrimary: true });
      }
      const second = secondaryVibeIds ?? [];
      for (const v of second) {
        if (v === primaryVibeId) continue;
        rows.push({ userId, vibeId: v, isPrimary: false });
      }
      if (rows.length) await tx.userVibe.createMany({ data: rows });
    }
  });

  return getMe(userId);
}

export async function completeOnboarding(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { onboardingCompleted: true },
  });
  return getMe(userId);
}

export async function updateLocation(
  userId: string,
  lat: number,
  lng: number
) {
  await prisma.user.update({
    where: { id: userId },
    data: { lat, lng, locationUpdatedAt: new Date() },
  });
}

export async function getUserPublicProfile(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null, isBanned: false },
    include: {
      city: true,
      interests: { include: { interest: true } },
    },
  });
  if (!user) throw new AppError("NOT_FOUND", "User not found", 404);
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    bio: user.bio,
    discoveryTagline: user.discoveryTagline,
    profileImageUrl: user.profileImageUrl,
    city: user.city
      ? { id: user.city.id, name: user.city.name, slug: user.city.slug }
      : null,
    interests: user.interests.map((ui) => ({
      id: ui.interest.id,
      slug: ui.interest.slug,
      name: ui.interest.name,
    })),
  };
}

function serializeUser(user: UserWithRelations) {
  const primaryVibe = user.vibes.find((v) => v.isPrimary);
  return {
    id: user.id,
    phone: user.phone,
    email: user.email,
    name: user.name,
    username: user.username,
    bio: user.bio,
    discoveryTagline: user.discoveryTagline,
    ageBand: user.ageBand,
    gender: user.gender,
    city: user.city
      ? { id: user.city.id, name: user.city.name, slug: user.city.slug }
      : null,
    locality: user.locality
      ? { id: user.locality.id, name: user.locality.name }
      : null,
    localityText: user.localityText,
    lat: user.lat,
    lng: user.lng,
    profileImageUrl: user.profileImageUrl,
    verificationStatus: user.verificationStatus,
    attendanceScore: Number(user.attendanceScore),
    hostScore: Number(user.hostScore),
    onboardingCompleted: user.onboardingCompleted,
    privacySettings: user.privacySettings,
    safetyPreferences: user.safetyPreferences,
    interestIds: user.interests.map((i) => i.interest.id),
    vibeIds: user.vibes.map((v) => v.vibe.id),
    primaryVibeId: primaryVibe?.vibe.id ?? null,
  };
}
