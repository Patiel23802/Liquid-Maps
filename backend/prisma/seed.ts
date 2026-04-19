import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  PrismaClient,
  PlanJoinType,
  PlanStatus,
  ParticipantStatus,
  VerificationStatus,
  Gender,
  NotificationType,
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
    { slug: "football", name: "Football", icon: "football", sortOrder: 10 },
    { slug: "cafes", name: "Cafes", icon: "cafe", sortOrder: 11 },
    { slug: "movies", name: "Movies", icon: "movie", sortOrder: 12 },
    { slug: "gaming", name: "Gaming", icon: "game", sortOrder: 13 },
    { slug: "gym", name: "Gym", icon: "gym", sortOrder: 14 },
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
    "cafes",
    "movies",
    "gaming",
    "gym",
    "music",
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
    update: {
      discoveryTagline: "Hosting sunset walks & football warm-ups",
    },
    create: {
      phone: "+919999000001",
      phoneVerifiedAt: new Date(),
      name: "Demo Host",
      username: "demo_host",
      bio: "I like hosting chai walks",
      discoveryTagline: "Hosting sunset walks & football warm-ups",
      cityId: mumbai.id,
      localityId: bandra?.id,
      lat: 19.06,
      lng: 72.83,
      onboardingCompleted: true,
      verificationStatus: VerificationStatus.id_verified,
      gender: Gender.female,
    },
  });

  const demoPass = await bcrypt.hash("demo12345", 12);
  const liquidDemo = await prisma.user.upsert({
    where: { email: "liquid@demo.app" },
    update: { passwordHash: demoPass, discoveryTagline: "Trying every turf in Mumbai" },
    create: {
      email: "liquid@demo.app",
      passwordHash: demoPass,
      name: "Liquid Explorer",
      username: "liquid_explorer",
      bio: "Maps, matchdays, and third-wave coffee.",
      discoveryTagline: "Trying every turf in Mumbai",
      cityId: mumbai.id,
      localityId: bandra?.id,
      lat: 19.055,
      lng: 72.825,
      onboardingCompleted: true,
      verificationStatus: VerificationStatus.phone,
    },
  });

  const u2 = await prisma.user.upsert({
    where: { phone: "+919999000002" },
    update: {},
    create: {
      phone: "+919999000002",
      phoneVerifiedAt: new Date(),
      name: "Ayaan Malik",
      username: "ayaan_m",
      bio: "5-a-side captain on weekends.",
      discoveryTagline: "Looking for a casual football group",
      cityId: mumbai.id,
      lat: 19.07,
      lng: 72.84,
      onboardingCompleted: true,
      gender: Gender.male,
    },
  });

  const u3 = await prisma.user.upsert({
    where: { phone: "+919999000003" },
    update: {},
    create: {
      phone: "+919999000003",
      phoneVerifiedAt: new Date(),
      name: "Neha Kulkarni",
      username: "neha_k",
      bio: "Indie films + filter coffee.",
      discoveryTagline: "Movie night + discussion at Prithvi?",
      cityId: mumbai.id,
      lat: 19.1,
      lng: 72.84,
      onboardingCompleted: true,
      gender: Gender.female,
    },
  });

  const footballInt = await prisma.interest.findUnique({
    where: { slug: "football" },
  });
  const cafesInt = await prisma.interest.findUnique({ where: { slug: "cafes" } });
  const moviesInt = await prisma.interest.findUnique({ where: { slug: "movies" } });
  for (const [uid, iid] of [
    [u2.id, footballInt?.id],
    [u3.id, moviesInt?.id],
    [liquidDemo.id, cafesInt?.id],
  ] as const) {
    if (iid)
      await prisma.userInterest.upsert({
        where: { userId_interestId: { userId: uid, interestId: iid } },
        update: {},
        create: { userId: uid, interestId: iid },
      });
  }

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

  const catFootball = await prisma.category.findUniqueOrThrow({
    where: { slug: "football" },
  });
  const catCafes = await prisma.category.findUniqueOrThrow({
    where: { slug: "cafes" },
  });
  const catMovies = await prisma.category.findUniqueOrThrow({
    where: { slug: "movies" },
  });
  const catGaming = await prisma.category.findUniqueOrThrow({
    where: { slug: "gaming" },
  });
  const catGym = await prisma.category.findUniqueOrThrow({
    where: { slug: "gym" },
  });
  const vibeFitness = await prisma.vibe.findUniqueOrThrow({
    where: { slug: "fitness" },
  });
  const vibeFood = await prisma.vibe.findUniqueOrThrow({
    where: { slug: "food" },
  });

  const extraPlans: Array<{
    title: string;
    categoryId: number;
    vibeId: number;
    lat: number;
    lng: number;
    locationName: string;
    start: number;
  }> = [
    {
      title: "Sunday 5-a-side — Bandra turf",
      categoryId: catFootball.id,
      vibeId: vibeFitness.id,
      lat: 19.062,
      lng: 72.83,
      locationName: "St. Andrews turf, Bandra",
      start: 2 * 60 * 60 * 1000,
    },
    {
      title: "Co-working sprint — Blue Tokai Powai",
      categoryId: catCafes.id,
      vibeId: vibeFood.id,
      lat: 19.118,
      lng: 72.91,
      locationName: "Blue Tokai, Powai",
      start: 90 * 60 * 1000,
    },
    {
      title: "IMAX night — Jio World Drive",
      categoryId: catMovies.id,
      vibeId: vibeChill.id,
      lat: 19.066,
      lng: 72.868,
      locationName: "Jio World Drive, BKC",
      start: 5 * 60 * 60 * 1000,
    },
    {
      title: "Valorant LAN — Andheri gaming cafe",
      categoryId: catGaming.id,
      vibeId: vibeExplore.id,
      lat: 19.12,
      lng: 72.83,
      locationName: "Gamestacy Arena, Andheri",
      start: 4 * 60 * 60 * 1000,
    },
    {
      title: "Push day — Gold's Bandra",
      categoryId: catGym.id,
      vibeId: vibeFitness.id,
      lat: 19.054,
      lng: 72.826,
      locationName: "Gold's Gym, Bandra",
      start: 24 * 60 * 60 * 1000,
    },
  ];

  for (const ep of extraPlans) {
    const exists = await prisma.plan.findFirst({
      where: { hostUserId: host.id, title: ep.title },
    });
    if (!exists) {
      await prisma.plan.create({
        data: {
          hostUserId: host.id,
          title: ep.title,
          description: "Seeded Liquid Map demo plan.",
          categoryId: ep.categoryId,
          vibeId: ep.vibeId,
          cityId: mumbai.id,
          localityId: bandra?.id,
          locationName: ep.locationName,
          lat: ep.lat,
          lng: ep.lng,
          startTime: new Date(Date.now() + ep.start),
          maxParticipants: 12,
          joinType: PlanJoinType.open,
          status: PlanStatus.published,
        },
      });
    }
  }

  const spotSeeds = [
    {
      slug: "third-wave-bandra",
      name: "Third Wave Coffee",
      categoryId: catCafes.id,
      lat: 19.054,
      lng: 72.826,
      popularity: 94,
      vibeTags: ["wifi", "dates", "deep-work"],
      address: "Bandra West",
    },
    {
      slug: "smaaash-lower-parel",
      name: "Smaaash",
      categoryId: catGaming.id,
      lat: 18.998,
      lng: 72.825,
      popularity: 88,
      vibeTags: ["arcade", "bowling", "groups"],
      address: "Lower Parel",
    },
    {
      slug: "joggers-park-bandra",
      name: "Joggers Park",
      categoryId: catWalks.id,
      lat: 19.058,
      lng: 72.821,
      popularity: 81,
      vibeTags: ["outdoors", "sunset", "community"],
      address: "Bandra",
    },
    {
      slug: "prithvi-juhu",
      name: "Prithvi Theatre cafe",
      categoryId: catCafes.id,
      lat: 19.107,
      lng: 72.84,
      popularity: 90,
      vibeTags: ["theatre", "chai", "culture"],
      address: "Juhu",
    },
  ];

  for (const s of spotSeeds) {
    await prisma.socialSpot.upsert({
      where: { slug: s.slug },
      update: {
        popularity: s.popularity,
        vibeTags: s.vibeTags,
      },
      create: {
        cityId: mumbai.id,
        categoryId: s.categoryId,
        name: s.name,
        slug: s.slug,
        description: "Trending hangout seeded for Liquid Map.",
        address: s.address,
        lat: s.lat,
        lng: s.lng,
        popularity: s.popularity,
        vibeTags: s.vibeTags,
      },
    });
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: liquidDemo.id,
        type: NotificationType.nearby_trending,
        title: "Trending near you",
        body: "New football plans near Carter Road tonight.",
        data: { area: "Bandra" },
      },
      {
        userId: liquidDemo.id,
        type: NotificationType.plan_reminder,
        title: "Event nearby",
        body: "A cafe co-working sprint starts in 90 minutes.",
        data: {},
      },
    ],
  });

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
