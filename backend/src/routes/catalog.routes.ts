import { Router } from "express";
import * as catalog from "../services/catalogService.js";

export const catalogRouter = Router();

catalogRouter.get("/cities", async (_req, res, next) => {
  try {
    const items = await catalog.listCities();
    res.json({
      data: items.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        centerLat: c.centerLat,
        centerLng: c.centerLng,
      })),
    });
  } catch (e) {
    next(e);
  }
});

catalogRouter.get("/cities/:slug/localities", async (req, res, next) => {
  try {
    const items = await catalog.listLocalities(req.params.slug);
    res.json({
      data: items.map((l) => ({
        id: l.id,
        name: l.name,
        slug: l.slug,
        isEnabled: l.isEnabled,
      })),
    });
  } catch (e) {
    next(e);
  }
});

catalogRouter.get("/categories", async (_req, res, next) => {
  try {
    const items = await catalog.listCategories();
    res.json({ data: items });
  } catch (e) {
    next(e);
  }
});

catalogRouter.get("/vibes", async (_req, res, next) => {
  try {
    const items = await catalog.listVibes();
    res.json({ data: items });
  } catch (e) {
    next(e);
  }
});

catalogRouter.get("/interests", async (_req, res, next) => {
  try {
    const items = await catalog.listInterests();
    res.json({ data: items });
  } catch (e) {
    next(e);
  }
});
