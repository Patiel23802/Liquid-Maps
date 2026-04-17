import bcrypt from "bcryptjs";
import { ReportStatus } from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { signAdminToken } from "../utils/jwt.js";

export async function adminLogin(email: string, password: string) {
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) throw new AppError("INVALID_CREDENTIALS", "Invalid login", 401);
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) throw new AppError("INVALID_CREDENTIALS", "Invalid login", 401);
  return {
    accessToken: signAdminToken(admin.id),
    admin: { id: admin.id, email: admin.email, role: admin.role },
  };
}

export async function adminMetrics(cityId?: string) {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const whereCity = cityId ? { cityId } : {};

  const [users, plans24, joins24, openReports, pendingVer] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.plan.count({ where: { createdAt: { gte: dayAgo }, ...whereCity } }),
    prisma.planParticipant.count({
      where: { joinedAt: { gte: dayAgo } },
    }),
    prisma.report.count({ where: { status: "open" } }),
    prisma.verificationRequest.count({ where: { status: "pending" } }),
  ]);

  return {
    totalUsers: users,
    plansCreated24h: plans24,
    planJoins24h: joins24,
    openReports,
    pendingVerifications: pendingVer,
  };
}

export async function listReports(status?: string) {
  return prisma.report.findMany({
    where: status ? { status: status as ReportStatus } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
