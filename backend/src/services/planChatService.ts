import { ParticipantStatus } from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";

async function assertCanChat(planId: string, userId: string) {
  const part = await prisma.planParticipant.findUnique({
    where: { planId_userId: { planId, userId } },
  });
  const ok =
    part &&
    (part.status === ParticipantStatus.joined ||
      part.status === ParticipantStatus.approved);
  if (!ok) {
    throw new AppError("CHAT_FORBIDDEN", "Join the plan to chat", 403);
  }
  const room = await prisma.planChatRoom.findUnique({ where: { planId } });
  if (!room) throw new AppError("NOT_FOUND", "Chat not found", 404);
  return room.id;
}

export async function listMessages(
  planId: string,
  userId: string,
  beforeIso?: string,
  limit = 50
) {
  const roomId = await assertCanChat(planId, userId);
  const where: {
    roomId: string;
    createdAt?: { lt: Date };
  } = { roomId };
  if (beforeIso) {
    const d = new Date(beforeIso);
    if (!Number.isNaN(d.getTime())) where.createdAt = { lt: d };
  }

  const items = await prisma.planMessage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { sender: { select: { id: true, username: true, name: true } } },
  });

  return {
    items: items.reverse().map((m) => ({
      id: m.id,
      senderId: m.senderId,
      sender: m.sender
        ? {
            id: m.sender.id,
            username: m.sender.username,
            name: m.sender.name,
          }
        : null,
      messageType: m.messageType,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

export async function sendMessage(planId: string, userId: string, body: string) {
  const roomId = await assertCanChat(planId, userId);
  const msg = await prisma.planMessage.create({
    data: {
      roomId,
      senderId: userId,
      body,
      messageType: "text",
    },
  });
  return {
    id: msg.id,
    planId,
    senderId: userId,
    body: msg.body,
    createdAt: msg.createdAt.toISOString(),
  };
}
