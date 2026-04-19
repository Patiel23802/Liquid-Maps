import type { Region } from "react-native-maps";

export type PlanMapPin = {
  id: string;
  lat: number;
  lng: number;
  startTime: string;
  categoryId: number;
  participantCount: number;
  maxParticipants: number;
  verifiedOnly: boolean;
  womenOnly: boolean;
};

export type MapPlansMapProps = {
  initialRegion: Region;
  pins: PlanMapPin[];
  onPinPress: (planId: string) => void;
  onRegionChangeComplete: (region: Region) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  /** Highlight discovery radius in meters (e.g. radiusKm * 1000). */
  radiusHighlightM?: number;
};

export function regionToBounds(region: Region): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  const halfLat = region.latitudeDelta / 2;
  const halfLng = region.longitudeDelta / 2;
  return {
    north: region.latitude + halfLat,
    south: region.latitude - halfLat,
    east: region.longitude + halfLng,
    west: region.longitude - halfLng,
  };
}
