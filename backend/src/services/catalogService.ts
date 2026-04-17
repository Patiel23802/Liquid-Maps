import { prisma } from "../config/database.js";

export async function listCities() {
  return prisma.city.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function listLocalities(citySlug: string) {
  const city = await prisma.city.findUnique({ where: { slug: citySlug } });
  if (!city) return [];
  return prisma.locality.findMany({
    where: { cityId: city.id, isEnabled: true },
    orderBy: { name: "asc" },
  });
}

export async function listCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listVibes() {
  return prisma.vibe.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listInterests() {
  return prisma.interest.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}
