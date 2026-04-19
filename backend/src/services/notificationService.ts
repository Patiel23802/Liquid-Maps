import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";

export async function listForUser(userId: string, limit = 50) {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    data: n.data,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function seedDemoNotifications(userId: string) {
  const samples: Prisma.NotificationCreateManyInput[] = [
    {
      userId,
      type: NotificationType.nearby_trending,
      title: "Trending near you",
      body: "Football kickabouts are spiking in Bandra this evening.",
      data: { kind: "trending", area: "Bandra" },
    },
    {
      userId,
      type: NotificationType.plan_reminder,
      title: "New event nearby",
      body: "A cafe co-working meetup starts in 45 minutes — 1.2km away.",
      data: { kind: "nearby_event" },
    },
    {
      userId,
      type: NotificationType.system,
      title: "Liquid Map",
      body: "Your radius filter is set to 5km — widen it to see more plans.",
      data: { kind: "tip" },
    },
  ];
  await prisma.notification.createMany({ data: samples });
  return listForUser(userId);
}
