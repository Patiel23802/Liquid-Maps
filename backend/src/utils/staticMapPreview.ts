import { env } from "../config/env.js";

/**
 * Google Static Maps thumbnail URL (roadmap + marker at lat/lng).
 * Requires GOOGLE_MAPS_STATIC_API_KEY and Static Maps API enabled for that key.
 */
export function staticMapPreviewUrl(
  lat: number,
  lng: number
): string | undefined {
  const key = env.GOOGLE_MAPS_STATIC_API_KEY;
  if (!key || !Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;

  const center = `${lat},${lng}`;
  const markers = `color:0xA855F7|size:small|${lat},${lng}`;
  const params = new URLSearchParams({
    center,
    zoom: "17",
    size: "128x128",
    scale: "2",
    maptype: "roadmap",
    markers,
    key,
  });

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}
