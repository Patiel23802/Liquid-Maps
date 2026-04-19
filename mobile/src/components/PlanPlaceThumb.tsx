import React, { useEffect, useMemo, useState } from "react";
import { View, Image, StyleSheet } from "react-native";
import { resolvePlanMapPreviewUrl } from "../utils/mapPreviewUrl";

type Props = {
  mapPreviewUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  size?: number;
  borderRadius?: number;
};

export function PlanPlaceThumb({
  mapPreviewUrl,
  lat,
  lng,
  size = 44,
  borderRadius,
}: Props) {
  const [failed, setFailed] = useState(false);
  const uri = useMemo(
    () => resolvePlanMapPreviewUrl(mapPreviewUrl, lat, lng),
    [mapPreviewUrl, lat, lng]
  );
  const r = borderRadius ?? Math.round(size * 0.22);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  if (!uri || failed) {
    return (
      <View
        style={[
          styles.ph,
          { width: size, height: size, borderRadius: r },
        ]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[styles.img, { width: size, height: size, borderRadius: r }]}
      onError={() => setFailed(true)}
      accessibilityRole="image"
      accessibilityLabel="Map preview of the meeting place"
    />
  );
}

const styles = StyleSheet.create({
  ph: {
    backgroundColor: "rgba(168, 85, 247, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  img: { backgroundColor: "#1c1c1f" },
});
