import React, { useCallback, useEffect, useRef } from "react";
import { StyleSheet, View, Platform, Text } from "react-native";
import MapView, {
  Marker,
  Circle,
  PROVIDER_GOOGLE,
  type Region,
} from "react-native-maps";
import { googleDarkMapStyle } from "./googleDarkMapStyle";
import type { MapPlansMapProps } from "./types";

/** Approximate Google zoom from latitude span (tuned for city / neighborhood views). */
function zoomFromLatitudeDelta(latDelta: number): number {
  const d = Math.max(0.005, Math.min(0.8, latDelta));
  return Math.min(18, Math.max(10.5, 16 - Math.log2(d * 280)));
}

/**
 * Google Maps with tilt, rotation, 3D buildings, and a gentle intro camera move.
 */
export function GooglePlansMapView({
  initialRegion,
  pins,
  onPinPress,
  onRegionChangeComplete,
  userLocation,
  radiusHighlightM,
  mapType = "standard",
  threeDTrigger = 0,
}: MapPlansMapProps) {
  const mapRef = useRef<MapView>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introDoneRef = useRef(false);
  const userCameraDoneRef = useRef(false);

  const center = userLocation ?? {
    latitude: initialRegion.latitude,
    longitude: initialRegion.longitude,
  };

  const applyPerspectiveCamera = useCallback(
    (opts?: { softer?: boolean; stronger?: boolean }) => {
      const map = mapRef.current;
      if (!map) return;
      const pitch = opts?.softer ? 38 : opts?.stronger ? 66 : 52;
      const heading = opts?.softer ? 12 : opts?.stronger ? 42 : 24;
      map.animateCamera(
        {
          center: {
            latitude: center.latitude,
            longitude: center.longitude,
          },
          pitch,
          heading,
          zoom: opts?.stronger
            ? Math.max(16.8, zoomFromLatitudeDelta(initialRegion.latitudeDelta))
            : zoomFromLatitudeDelta(initialRegion.latitudeDelta),
        },
        { duration: opts?.softer ? 500 : opts?.stronger ? 750 : 900 }
      );
    },
    [
      center.latitude,
      center.longitude,
      initialRegion.latitudeDelta,
    ]
  );

  useEffect(() => {
    if (!threeDTrigger) return;
    // If the user taps "3D", push a stronger perspective camera.
    applyPerspectiveCamera({ stronger: true });
  }, [threeDTrigger, applyPerspectiveCamera]);

  useEffect(() => {
    if (!userLocation || userCameraDoneRef.current || !introDoneRef.current) {
      return;
    }
    userCameraDoneRef.current = true;
    const t = setTimeout(() => applyPerspectiveCamera({ softer: true }), 450);
    return () => clearTimeout(t);
  }, [userLocation, applyPerspectiveCamera]);

  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onRegionChangeComplete(region);
      }, 450);
    },
    [onRegionChangeComplete]
  );

  if (Platform.OS === "web") {
    return null;
  }

  const glowRadius =
    userLocation && radiusHighlightM && radiusHighlightM > 0
      ? radiusHighlightM * 1.12
      : 0;

  return (
    <View style={styles.fill}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        customMapStyle={
          mapType === "satellite" || mapType === "hybrid"
            ? undefined
            : googleDarkMapStyle
        }
        onRegionChangeComplete={handleRegionChangeComplete}
        onMapReady={() => {
          if (introDoneRef.current) return;
          introDoneRef.current = true;
          requestAnimationFrame(() => {
            applyPerspectiveCamera();
            if (userLocation) userCameraDoneRef.current = true;
          });
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        mapType={mapType}
        pitchEnabled
        rotateEnabled
        scrollEnabled
        zoomEnabled
        showsBuildings
        showsIndoors={false}
        showsCompass
        showsScale
        loadingEnabled
        moveOnMarkerPress
        toolbarEnabled={false}
      >
        {userLocation && glowRadius > 0 ? (
          <Circle
            center={userLocation}
            radius={glowRadius}
            strokeColor="rgba(0, 227, 253, 0.12)"
            strokeWidth={1}
            fillColor="rgba(0, 227, 253, 0.06)"
          />
        ) : null}
        {userLocation && radiusHighlightM && radiusHighlightM > 0 ? (
          <Circle
            center={userLocation}
            radius={radiusHighlightM}
            strokeColor="rgba(240, 132, 255, 0.65)"
            fillColor="rgba(192, 132, 252, 0.08)"
            strokeWidth={2}
          />
        ) : null}
        {userLocation ? (
          <Marker
            coordinate={userLocation}
            title="You are here"
            description="Two fingers: drag to pan · pinch to zoom · rotate to steer · drag up/down to tilt"
            tracksViewChanges
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.youPulse}>
              <View style={styles.youCore} />
            </View>
          </Marker>
        ) : null}
        {pins.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            onPress={() => onPinPress(p.id)}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={pins.length < 28}
          >
            <View style={styles.planPin}>
              <View style={styles.planPinGlow} />
              <View style={styles.planPinDot} />
              {p.participantCount > 0 ? (
                <Text style={styles.planPinCount}>
                  {p.participantCount >= p.maxParticipants
                    ? "●"
                    : String(p.participantCount)}
                </Text>
              ) : null}
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  map: { width: "100%", height: "100%" },
  youPulse: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34, 211, 238, 0.22)",
    borderWidth: 2,
    borderColor: "rgba(103, 232, 249, 0.95)",
  },
  youCore: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#ecfeff",
  },
  planPin: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
  },
  planPinGlow: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(240, 132, 255, 0.35)",
  },
  planPinDot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: "rgba(192, 132, 252, 0.95)",
    borderWidth: 2,
    borderColor: "rgba(103, 232, 249, 0.9)",
  },
  planPinCount: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "900",
    color: "#f5f5ff",
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
});
