import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import * as Location from "expo-location";
import type { Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useMumbaiCityId } from "../hooks/useMumbaiCityId";
import type { RootStackParamList } from "../navigation/types";
import { GooglePlansMapView } from "../maps/GooglePlansMapView";

type PlanCard = {
  id: string;
  title: string;
  startTime: string;
  locationName: string;
  participantCount?: number;
  womenOnly?: boolean;
  verifiedOnly?: boolean;
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT_REGION: Region = {
  latitude: 19.076,
  longitude: 72.8777,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { me } = useAuth();
  const cityId = useMumbaiCityId(me?.city?.id);
  const insets = useSafeAreaInsets();
  const [feed, setFeed] = useState<{
    happeningNow: PlanCard[];
    startingSoon: PlanCard[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [locErr, setLocErr] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [initialRegion, setInitialRegion] = useState<Region>(DEFAULT_REGION);

  const load = useCallback(async () => {
    if (!cityId) return;
    setErr(null);
    try {
      const data = await api<{
        happeningNow: PlanCard[];
        startingSoon: PlanCard[];
      }>(`/feed/home?cityId=${cityId}`, { method: "GET" });
      setFeed({
        happeningNow: data.happeningNow,
        startingSoon: data.startingSoon,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [cityId]);

  React.useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLocErr(null);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocErr("Location permission denied — showing a default area.");
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
      } catch (e) {
        if (cancelled) return;
        setLocErr(e instanceof Error ? e.message : "Failed to get location");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const liveEvents = useMemo(() => feed?.happeningNow?.slice(0, 2) ?? [], [feed]);
  const socialSpots = useMemo(() => feed?.startingSoon?.slice(0, 3) ?? [], [feed]);
  const cityName = me?.city?.name?.trim();

  if (!cityId && loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS === "web" ? (
        <View style={styles.centered}>
          <Text style={styles.webTitle}>Liquid Map</Text>
          <Text style={styles.webBody}>
            This immersive home view runs on iOS/Android (native Google Maps).
          </Text>
        </View>
      ) : (
        <>
          <GooglePlansMapView
            initialRegion={initialRegion}
            pins={[]}
            userLocation={userLocation}
            onPinPress={() => {}}
            onRegionChangeComplete={() => {}}
          />

          <View pointerEvents="none" style={styles.vignette} />

          <View style={[styles.topAppBar, { paddingTop: Math.max(insets.top, 12) }]} pointerEvents="box-none">
            <BlurView intensity={35} tint="dark" style={styles.topAppBarInner}>
              <View style={styles.brandRow}>
                <View style={styles.brandDot} />
                <Text style={styles.brandText}>Liquid Map</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate("CreatePlan")}
                style={styles.explorePill}
              >
                <Text style={styles.explorePillText}>+ Plan</Text>
              </Pressable>
            </BlurView>
          </View>

          <View style={styles.floatLayer} pointerEvents="box-none">
            <View style={styles.topRowWrap} pointerEvents="box-none">
              <View pointerEvents="none" style={styles.topRowGlowPurple} />
              <View pointerEvents="none" style={styles.topRowGlowCyan} />
              <View style={styles.topRow} pointerEvents="box-none">
              <BlurView intensity={30} tint="dark" style={[styles.glassCard, styles.cardLeft]}>
                <Text style={styles.cardKicker}>Live Events</Text>
                {loading && !feed ? (
                  <ActivityIndicator color="#67e8f9" style={{ marginTop: 10 }} />
                ) : liveEvents.length ? (
                  liveEvents.map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => navigation.navigate("PlanDetail", { planId: p.id })}
                      style={styles.cardRow}
                    >
                      <Text numberOfLines={1} style={styles.cardRowTitle}>
                        {p.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.cardRowMeta}>
                        {p.locationName}
                      </Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.cardEmpty}>Nothing live right now.</Text>
                )}
              </BlurView>

              <BlurView intensity={30} tint="dark" style={[styles.glassCard, styles.cardRight]}>
                <Text style={styles.cardKicker}>Social Spots</Text>
                {loading && !feed ? (
                  <ActivityIndicator color="#f0abfc" style={{ marginTop: 10 }} />
                ) : socialSpots.length ? (
                  socialSpots.map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => navigation.navigate("PlanDetail", { planId: p.id })}
                      style={styles.socialRow}
                    >
                      <Text numberOfLines={1} style={styles.socialTitle}>
                        {p.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.socialMeta}>
                        {p.locationName}
                      </Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.cardEmpty}>No spots yet.</Text>
                )}
              </BlurView>
            </View>
            </View>

            <View style={styles.bottomRow} pointerEvents="box-none">
              <View style={styles.bottomLeft} pointerEvents="box-none">
                <BlurView intensity={28} tint="dark" style={styles.avatarsPill}>
                  <View style={[styles.avatar, styles.avatar1]} />
                  <View style={[styles.avatar, styles.avatar2]} />
                  <View style={[styles.avatar, styles.avatar3]} />
                  <View style={styles.avatarMore}>
                    <Text style={styles.avatarMoreText}>+12</Text>
                  </View>
                </BlurView>
                <BlurView intensity={24} tint="dark" style={styles.nearbyPill}>
                  <Text style={styles.nearbyPillText}>Nearby People</Text>
                </BlurView>
              </View>

              <BlurView intensity={30} tint="dark" style={styles.radiusCard}>
                <View style={styles.radiusHeader}>
                  <Text style={styles.radiusLabel}>Search Radius</Text>
                  <Text style={styles.radiusValue}>
                    5.2 <Text style={styles.radiusUnit}>km</Text>
                  </Text>
                </View>
                <View style={styles.sliderTrack}>
                  <View style={styles.sliderFill} />
                </View>
                <View style={styles.sliderTicks}>
                  <Text style={styles.sliderTickText}>1km</Text>
                  <Text style={styles.sliderTickText}>10km</Text>
                </View>
              </BlurView>
            </View>
          </View>

          {err ? (
            <View style={styles.toast}>
              <Text style={styles.toastText}>{err}</Text>
            </View>
          ) : null}
          {locErr ? (
            <View style={[styles.toast, { bottom: 92 }]}>
              <Text style={styles.toastText}>{locErr}</Text>
            </View>
          ) : null}
          <View style={styles.cityPill} pointerEvents="none">
            <Text style={styles.cityPillText}>{cityName ? `Explore • ${cityName}` : "Explore"}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f10" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f10",
    padding: 24,
  },
  webTitle: { fontSize: 26, fontWeight: "800", color: "#f5d0fe" },
  webBody: { marginTop: 10, fontSize: 14, color: "#a8a29e", textAlign: "center" },

  // background accents
  vignette: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  // top app bar
  topAppBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  topAppBarInner: {
    height: 56,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(2, 6, 23, 0.45)",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "rgba(240, 132, 255, 0.95)",
    shadowColor: "#00e3fd",
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  brandText: { fontSize: 18, fontWeight: "900", color: "#e9e6f7", letterSpacing: -0.2 },
  explorePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.25)",
  },
  explorePillText: { color: "#67e8f9", fontSize: 12, fontWeight: "800" },

  cityPill: {
    position: "absolute",
    top: 74,
    left: 18,
    right: 18,
    alignItems: "center",
  },
  cityPillText: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  // floating layer
  floatLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 118,
    paddingBottom: 110, // keep above tab bar
    justifyContent: "space-between",
  },
  topRowWrap: {
    position: "relative",
  },
  topRowGlowPurple: {
    position: "absolute",
    left: -36,
    top: -34,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: "rgba(240, 132, 255, 0.18)",
    transform: [{ scale: 1 }],
  },
  topRowGlowCyan: {
    position: "absolute",
    right: -44,
    top: -18,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(0, 227, 253, 0.14)",
    transform: [{ scale: 1 }],
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  glassCard: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(13, 13, 24, 0.35)",
    padding: 14,
  },
  cardLeft: { width: 170 },
  cardRight: { width: 170 },
  cardKicker: {
    color: "rgba(233, 230, 247, 0.75)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  cardRow: { marginTop: 10 },
  cardRowTitle: { color: "#f5d0fe", fontSize: 13, fontWeight: "800" },
  cardRowMeta: { marginTop: 2, color: "rgba(171, 169, 185, 0.9)", fontSize: 10 },
  socialRow: { marginTop: 10 },
  socialTitle: { color: "#e9e6f7", fontSize: 13, fontWeight: "800" },
  socialMeta: { marginTop: 2, color: "rgba(171, 169, 185, 0.9)", fontSize: 10 },
  cardEmpty: { marginTop: 10, color: "rgba(171, 169, 185, 0.9)", fontSize: 11 },

  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  bottomLeft: { gap: 10 },
  avatarsPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(13, 13, 24, 0.30)",
    padding: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
    marginRight: -10,
    borderWidth: 2,
  },
  avatar1: { backgroundColor: "rgba(240, 132, 255, 0.35)", borderColor: "rgba(240, 132, 255, 0.45)" },
  avatar2: { backgroundColor: "rgba(0, 227, 253, 0.25)", borderColor: "rgba(0, 227, 253, 0.35)" },
  avatar3: { backgroundColor: "rgba(168, 140, 255, 0.25)", borderColor: "rgba(168, 140, 255, 0.35)" },
  avatarMore: {
    width: 34,
    height: 34,
    borderRadius: 999,
    marginLeft: 2,
    backgroundColor: "rgba(36, 36, 52, 0.80)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarMoreText: { color: "#67e8f9", fontSize: 10, fontWeight: "900" },
  nearbyPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(240, 132, 255, 0.10)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  nearbyPillText: { color: "#f5d0fe", fontSize: 12, fontWeight: "900" },

  radiusCard: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(13, 13, 24, 0.35)",
    padding: 14,
  },
  radiusHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  radiusLabel: {
    color: "rgba(171, 169, 185, 0.95)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  radiusValue: { color: "#67e8f9", fontSize: 18, fontWeight: "900" },
  radiusUnit: { color: "rgba(171, 169, 185, 0.95)", fontSize: 11, fontWeight: "800" },
  sliderTrack: {
    marginTop: 12,
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(36, 36, 52, 0.85)",
    overflow: "hidden",
  },
  sliderFill: {
    width: "52%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(240, 132, 255, 0.90)",
  },
  sliderTicks: { marginTop: 10, flexDirection: "row", justifyContent: "space-between" },
  sliderTickText: { color: "rgba(171, 169, 185, 0.9)", fontSize: 10 },

  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: "rgba(69, 10, 10, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 12,
    borderRadius: 14,
  },
  toastText: { color: "#fecaca", fontSize: 12, fontWeight: "700" },
});
