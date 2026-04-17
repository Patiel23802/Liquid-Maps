import { ReportTargetType } from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";

export async function createReport(
  reporterId: string,
  input: {
    targetType: ReportTargetType;
    targetUserId?: string;
    targetPlanId?: string;
    targetMessageId?: string;
    targetCommunityId?: string;
    reason: string;
    details?: string;
  }
) {
  if (input.targetType === ReportTargetType.user && !input.targetUserId) {
    throw new AppError("VALIDATION", "targetUserId required", 400);
  }
  if (input.targetType === ReportTargetType.plan && !input.targetPlanId) {
    throw new AppError("VALIDATION", "targetPlanId required", 400);
  }
  if (input.targetType === ReportTargetType.message && !input.targetMessageId) {
    throw new AppError("VALIDATION", "targetMessageId required", 400);
  }
  if (
    input.targetType === ReportTargetType.community &&
    !input.targetCommunityId
  ) {
    throw new AppError("VALIDATION", "targetCommunityId required", 400);
  }

  const r = await prisma.report.create({
    data: {
      reporterId,
      targetType: input.targetType,
      targetUserId: input.targetUserId,
      targetPlanId: input.targetPlanId,
      targetMessageId: input.targetMessageId,
      targetCommunityId: input.targetCommunityId,
      reason: input.reason,
      details: input.details,
    },
  });
  return { reportId: r.id, status: r.status };
}
