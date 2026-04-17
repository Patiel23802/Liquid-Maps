import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  PrismaClient,
  PlanJoinType,
  PlanStatus,
  ParticipantStatus,
  VerificationStatus,
  Gender,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const mumbai = await prisma.city.upsert({
    where: { slug: "mumbai" },
    update: {},
    create: {
      name: "Mumbai",
      slug: "mumbai",
      centerLat: 19.076,
      centerLng: 72.8777,
      isActive: true,
    },
  });

  const localities = [
    { name: "Bandra West", slug: "bandra-west" },
    { name: "Andheri West", slug: "andheri-west" },
    { name: "Powai", slug: "powai" },
    { name: "Marine Drive", slug: "marine-drive" },
  ];
  for (const l of localities) {
    await prisma.locality.upsert({
      where: {
        cityId_slug: { cityId: mumbai.id, slug: l.slug },
      },
      update: {},
      create: { cityId: mumbai.id, name: l.name, slug: l.slug, isEnabled: true },
    });
  }

  const categories = [
    { slug: "food", name: "Food & chai", icon: "cup", sortOrder: 1 },
    { slug: "sports", name: "Sports", icon: "ball", sortOrder: 2 },
    { slug: "walks", name: "Walks", icon: "walk", sortOrder: 3 },
    { slug: "cowork", name: "Coworking", icon: "laptop", sortOrder: 4 },
    { slug: "music", name: "Music & gigs", icon: "music", sortOrder: 5 },
    { slug: "trek", name: "Trek & outdoors", icon: "mountain", sortOrder: 6 },
  ];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon, sortOrder: c.sortOrder },
      create: c,
    });
  }

  const vibes = [
    { slug: "chill", name: "Chill", sortOrder: 1 },
    { slug: "fitness", name: "Fitness", sortOrder: 2 },
    { slug: "food", name: "Food", sortOrder: 3 },
    { slug: "productive", name: "Productive", sortOrder: 4 },
    { slug: "explore", name: "Explore", sortOrder: 5 },
    { slug: "deep_talk", name: "Deep talk", sortOrder: 6 },
  ];
  for (const v of vibes) {
    await prisma.vibe.upsert({
      where: { slug: v.slug },
      update: { name: v.name, sortOrder: v.sortOrder },
      create: v,
    });
  }

  const interests = [
    "coffee",
    "startups",
    "football",
    "cricket",
    "trekking",
    "reading",
    "board_games",
    "photography",
  ];
  for (const slug of interests) {
    await prisma.interest.upsert({
      where: { slug },
      update: {},
      create: { slug, name: slug.replace(/_/g, " ") },
    });
  }

  const email =
    process.env.ADMIN_BOOTSTRAP_EMAIL ?? "admin@socialise.local";
  const password =
    process.env.ADMIN_BOOTSTRAP_PASSWORD ?? "changeme123";
  const hash = await bcrypt.hash(password, 10);
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash: hash },
    create: { email, passwordHash: hash, role: "superadmin" },
  });

  const bandra = await prisma.locality.findFirst({
    where: { slug: "bandra-west", cityId: mumbai.id },
  });

  const host = await prisma.user.upsert({
    where: { phone: "+919999000001" },
    update: {},
    create: {
      phone: "+919999000001",
      phoneVerifiedAt: new Date(),
      name: "Demo Host",
      username: "demo_host",
      bio: "I like hosting chai walks",
      cityId: mumbai.id,
      localityId: bandra?.id,
      lat: 19.06,
      lng: 72.83,
      onboardingCompleted: true,
      verificationStatus: VerificationStatus.id_verified,
      gender: Gender.female,
    },
  });

  const catFood = await prisma.category.findUniqueOrThrow({
    where: { slug: "food" },
  });
  const catWalks = await prisma.category.findUniqueOrThrow({
    where: { slug: "walks" },
  });
  const vibeChill = await prisma.vibe.findUniqueOrThrow({
    where: { slug: "chill" },
  });
  const vibeExplore = await prisma.vibe.findUniqueOrThrow({
    where: { slug: "explore" },
  });

  const start1 = new Date(Date.now() + 45 * 60 * 1000);
  const start2 = new Date(Date.now() + 3 * 60 * 60 * 1000);

  let p1 = await prisma.plan.findFirst({
    where: { hostUserId: host.id, title: "Chai at Carter Road" },
  });
  if (!p1) {
    p1 = await prisma.plan.create({
      data: {
        hostUserId: host.id,
        title: "Chai at Carter Road",
      description: "Quick cup and sunset — everyone welcome.",
      categoryId: catFood.id,
      vibeId: vibeChill.id,
      cityId: mumbai.id,
      localityId: bandra?.id,
      locationName: "Carter Road promenade",
      lat: 19.05,
      lng: 72.82,
      startTime: start1,
      maxParticipants: 10,
      joinType: PlanJoinType.open,
      status: PlanStatus.published,
      verifiedOnly: false,
      womenOnly: false,
    },
    });
  }

  let p2 = await prisma.plan.findFirst({
    where: { hostUserId: host.id, title: "Marine Drive night walk" },
  });
  if (!p2) {
    p2 = await prisma.plan.create({
      data: {
        hostUserId: host.id,
        title: "Marine Drive night walk",
      description: "Slow pace, no agenda.",
      categoryId: catWalks.id,
      vibeId: vibeExplore.id,
      cityId: mumbai.id,
      locationName: "Marine Drive",
      lat: 18.94,
      lng: 72.82,
      startTime: start2,
      maxParticipants: 20,
      joinType: PlanJoinType.open,
      status: PlanStatus.published,
    },
    });
  }

  for (const p of [p1, p2]) {
    await prisma.planParticipant.upsert({
      where: { planId_userId: { planId: p.id, userId: host.id } },
      update: {},
      create: {
        planId: p.id,
        userId: host.id,
        status: ParticipantStatus.joined,
      },
    });
    const room = await prisma.planChatRoom.upsert({
      where: { planId: p.id },
      update: {},
      create: { planId: p.id },
    });
    const existing = await prisma.planMessage.count({
      where: { roomId: room.id },
    });
    if (existing === 0) {
      await prisma.planMessage.create({
        data: {
          roomId: room.id,
          senderId: null,
          body: "Plan chat started. Meet in public, stay safe.",
          messageType: "system",
        },
      });
    }
  }

  await prisma.community.upsert({
    where: {
      cityId_slug: { cityId: mumbai.id, slug: "bandra-walkers" },
    },
    update: {},
    create: {
      cityId: mumbai.id,
      name: "Bandra walkers",
      slug: "bandra-walkers",
      description: "Morning and evening walks around Bandra.",
      tags: ["walks", "bandra", "fitness"],
      isCurated: true,
      visibility: "public",
      createdById: host.id,
    },
  });

  await prisma.community.upsert({
    where: {
      cityId_slug: { cityId: mumbai.id, slug: "mumbai-founders" },
    },
    update: {},
    create: {
      cityId: mumbai.id,
      name: "Mumbai founders",
      slug: "mumbai-founders",
      description: "Coworking sessions and founder hangouts.",
      tags: ["startups", "cowork"],
      isCurated: true,
      visibility: "public",
      createdById: host.id,
    },
  });

  console.log("Seed OK — Mumbai catalog, demo host, 2 plans, admin:", email);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
