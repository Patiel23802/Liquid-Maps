import Constants from "expo-constants";

export function getGoogleMapsApiKeyForStatic(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  const extra = Constants.expoConfig?.extra as
    | { googleMapsApiKey?: string }
    | undefined;
  const k = extra?.googleMapsApiKey?.trim();
  return k || undefined;
}

function buildStaticMapUrl(lat: number, lng: number, apiKey: string): string {
  const center = `${lat},${lng}`;
  const markers = `color:0xA855F7|size:small|${lat},${lng}`;
  const params = new URLSearchParams({
    center,
    zoom: "17",
    size: "128x128",
    scale: "2",
    maptype: "roadmap",
    markers,
    key: apiKey,
  });
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

/** Prefer server `mapPreviewUrl`; otherwise build a Static Maps URL when a Maps key is available. */
export function resolvePlanMapPreviewUrl(
  mapPreviewUrl: string | null | undefined,
  lat: number | null | undefined,
  lng: number | null | undefined
): string | undefined {
  const trimmed = mapPreviewUrl?.trim();
  if (trimmed) return trimmed;
  const key = getGoogleMapsApiKeyForStatic();
  if (
    !key ||
    lat == null ||
    lng == null ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return undefined;
  }
  return buildStaticMapUrl(lat, lng, key);
}
