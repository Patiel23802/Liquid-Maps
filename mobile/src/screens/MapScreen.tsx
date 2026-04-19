import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Pressable,
} from "react-native";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Region } from "react-native-maps";
import type { RootStackParamList } from "../navigation/types";
import { GooglePlansMapView } from "../maps/GooglePlansMapView";
import { regionToBounds, type PlanMapPin } from "../maps/types";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useMumbaiCityId } from "../hooks/useMumbaiCityId";

const MUMBAI: Region = {
  latitude: 19.076,
  longitude: 72.8777,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

/** Match home default: plans within this distance when GPS is available. */
const MAP_RADIUS_KM = 10;

export function MapScreen() {
  const navigation = useNavigation();
  const { me } = useAuth();
  const cityId = useMumbaiCityId(me?.city?.id);
  const [pins, setPins] = useState<PlanMapPin[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [locErr, setLocErr] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [initialRegion, setInitialRegion] = useState<Region>(MUMBAI);

  const hasMapsKey =
    Constants.expoConfig?.extra &&
    (Constants.expoConfig.extra as { hasGoogleMapsKey?: boolean })
      .hasGoogleMapsKey === true;

  const title = useMemo(() => {
    const city = me?.city?.name?.trim();
    return city ? `Map • ${city}` : "Map";
  }, [me?.city?.name]);

  const fetchPins = useCallback(
    async (region: Region) => {
      if (!cityId) return;
      setLoading(true);
      setErr(null);
      try {
        const q = new URLSearchParams({ cityId });
        if (userLocation) {
          q.set("lat", String(userLocation.latitude));
          q.set("lng", String(userLocation.longitude));
          q.set("radiusKm", String(MAP_RADIUS_KM));
        } else {
          const { north, south, east, west } = regionToBounds(region);
          q.set("north", String(north));
          q.set("south", String(south));
          q.set("east", String(east));
          q.set("west", String(west));
        }
        const data = await api<PlanMapPin[]>(`/plans/map?${q.toString()}`, {
          auth: false,
        });
        setPins(data);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load map");
        setPins([]);
      } finally {
        setLoading(false);
      }
    },
    [cityId, userLocation]
  );

  useEffect(() => {
    if (!cityId) return;
    fetchPins(MUMBAI);
  }, [cityId, fetchPins]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLocErr(null);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocErr("Location permission denied — showing default area.");
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setUserLocation(coords);
        setInitialRegion((prev) => ({
          ...prev,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }));
        fetchPins({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.12,
          longitudeDelta: 0.12,
        });
      } catch (e) {
        if (cancelled) return;
        setLocErr(e instanceof Error ? e.message : "Failed to get location");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPins]);

  const onRegionChangeComplete = useCallback(
    (region: Region) => {
      if (!userLocation) fetchPins(region);
    },
    [fetchPins, userLocation]
  );

  const onPinPress = useCallback(
    (planId: string) => {
      navigation
        .getParent<NativeStackNavigationProp<RootStackParamList>>()
        ?.navigate("PlanDetail", { planId });
    },
    [navigation]
  );

  if (Platform.OS === "web") {
    return (
      <View style={styles.fallback}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>
          Live Google Maps runs on the iOS and Android builds. Configure
          GOOGLE_MAPS_API_KEY and use a development build for full SDK support.
        </Text>
      </View>
    );
  }

  if (!cityId) {
    return (
      <View style={styles.fallback}>
        <ActivityIndicator color="#ea580c" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!hasMapsKey ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Set GOOGLE_MAPS_API_KEY in mobile/.env and restart Expo (npx expo
            start -c). For iOS Google tiles, run npx expo prebuild then build
            the native app.
          </Text>
        </View>
      ) : null}
      <GooglePlansMapView
        initialRegion={initialRegion}
        pins={pins}
        onPinPress={onPinPress}
        onRegionChangeComplete={onRegionChangeComplete}
        userLocation={userLocation}
      />
      <View style={styles.topBar} pointerEvents="box-none">
        <View style={styles.topBarInner} pointerEvents="auto">
          <View>
            <Text style={styles.brandTitle}>Liquid Map</Text>
            <Text style={styles.brandSubtitle}>{title}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (userLocation) {
                fetchPins({
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  latitudeDelta: 0.12,
                  longitudeDelta: 0.12,
                });
              }
            }}
            style={styles.pill}
          >
            <Text style={styles.pillText}>My Location</Text>
          </Pressable>
        </View>
      </View>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#ea580c" size="small" />
        </View>
      ) : null}
      {err ? (
        <View style={styles.errBar}>
          <Text style={styles.errText}>{err}</Text>
        </View>
      ) : null}
      {locErr ? (
        <View style={styles.locBar}>
          <Text style={styles.locText}>{locErr}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f10" },
  fallback: {
    flex: 1,
    backgroundColor: "#0f0f10",
    padding: 24,
    justifyContent: "center",
  },
  title: { fontSize: 22, fontWeight: "700", color: "#faf7f2", marginBottom: 12 },
  body: { fontSize: 15, color: "#a8a29e", lineHeight: 22 },
  banner: {
    backgroundColor: "#422006",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bannerText: { color: "#fde68a", fontSize: 12, lineHeight: 17 },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  topBarInner: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(2, 6, 23, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f5d0fe",
    letterSpacing: -0.2,
  },
  brandSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: "#a5b4fc",
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.25)",
  },
  pillText: { color: "#67e8f9", fontSize: 12, fontWeight: "700" },
  loader: {
    position: "absolute",
    top: 84,
    right: 16,
    backgroundColor: "#1c1c1f",
    padding: 8,
    borderRadius: 8,
  },
  locBar: {
    position: "absolute",
    top: 84,
    left: 16,
    right: 84,
    backgroundColor: "rgba(2, 6, 23, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  locText: { color: "#bae6fd", fontSize: 12 },
  errBar: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#450a0a",
    padding: 12,
    borderRadius: 10,
  },
  errText: { color: "#fecaca", fontSize: 13 },
});
