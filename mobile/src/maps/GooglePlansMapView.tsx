import React, { useCallback, useRef } from "react";
import { StyleSheet, View, Platform } from "react-native";
import MapView, {
  Marker,
  Circle,
  PROVIDER_GOOGLE,
  type Region,
} from "react-native-maps";
import { googleDarkMapStyle } from "./googleDarkMapStyle";
import type { MapPlansMapProps } from "./types";

/**
 * Google Maps implementation. Uses PROVIDER_GOOGLE on iOS + Android when native keys are set (app.config.js).
 */
export function GooglePlansMapView({
  initialRegion,
  pins,
  onPinPress,
  onRegionChangeComplete,
  userLocation,
  radiusHighlightM,
}: MapPlansMapProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <View style={styles.fill}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        customMapStyle={googleDarkMapStyle}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="standard"
      >
        {userLocation && radiusHighlightM && radiusHighlightM > 0 ? (
          <Circle
            center={userLocation}
            radius={radiusHighlightM}
            strokeColor="rgba(240,132,255,0.55)"
            fillColor="rgba(240,132,255,0.06)"
          />
        ) : null}
        {userLocation ? (
          <Marker
            coordinate={userLocation}
            title="You are here"
            tracksViewChanges={false}
            pinColor="#22d3ee"
          />
        ) : null}
        {pins.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            onPress={() => onPinPress(p.id)}
            tracksViewChanges={false}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  map: { width: "100%", height: "100%" },
});
