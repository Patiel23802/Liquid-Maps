import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import type { Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useMumbaiCityId } from "../hooks/useMumbaiCityId";
import type { RootStackParamList } from "../navigation/types";
import { GooglePlansMapView } from "../maps/GooglePlansMapView";
import { regionToBounds, type PlanMapPin } from "../maps/types";
import { PlanPlaceThumb } from "../components/PlanPlaceThumb";

type PlanCard = {
  id: string;
  title: string;
  startTime: string;
  locationName: string;
  lat?: number;
  lng?: number;
  mapPreviewUrl?: string;
  participantCount?: number;
  womenOnly?: boolean;
  verifiedOnly?: boolean;
  category?: { slug: string; name: string };
};

type SpotRow = {
  id: string;
  name: string;
  category: { name: string; slug: string };
  distanceKm?: number;
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT_REGION: Region = {
  latitude: 19.076,
  longitude: 72.8777,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

const CHIPS: { slug: string; label: string }[] = [
  { slug: "football", label: "Football" },
  { slug: "cafes", label: "Cafes" },
  { slug: "movies", label: "Movies" },
  { slug: "gaming", label: "Gaming" },
  { slug: "gym", label: "Gym" },
  { slug: "music", label: "Music" },
];

const RADIUS_OPTIONS = [5, 10, 25, 50];

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { me } = useAuth();
  const cityId = useMumbaiCityId(me?.city?.id);
  const insets = useSafeAreaInsets();
  const lastRegion = useRef<Region>(DEFAULT_REGION);
  const mapPinsRequestId = useRef(0);

  const [feed, setFeed] = useState<{
    happeningNow: PlanCard[];
    startingSoon: PlanCard[];
  } | null>(null);
  const [spots, setSpots] = useState<SpotRow[]>([]);
  const [pins, setPins] = useState<PlanMapPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [locErr, setLocErr] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [initialRegion, setInitialRegion] = useState<Region>(DEFAULT_REGION);
  const [categorySlug, setCategorySlug] = useState<string | undefined>();
  const [radiusKm, setRadiusKm] = useState(10);
  const [sheetPlanId, setSheetPlanId] = useState<string | null>(null);

  const stackNav = useCallback(() => {
    return navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  }, [navigation]);

  const fetchPins = useCallback(
    async (region: Region) => {
      if (!cityId) return;
      lastRegion.current = region;
      const reqId = ++mapPinsRequestId.current;
      const q = new URLSearchParams({ cityId });
      if (categorySlug) q.set("category", categorySlug);
      if (userLocation) {
        q.set("lat", String(userLocation.latitude));
        q.set("lng", String(userLocation.longitude));
        q.set("radiusKm", String(radiusKm));
      } else {
        const { north, south, east, west } = regionToBounds(region);
        q.set("north", String(north));
        q.set("south", String(south));
        q.set("east", String(east));
        q.set("west", String(west));
      }
      try {
        const data = await api<PlanMapPin[]>(`/events/map?${q.toString()}`, {
          auth: false,
        });
        if (mapPinsRequestId.current === reqId) setPins(data);
      } catch {
        if (mapPinsRequestId.current === reqId) setPins([]);
      }
    },
    [cityId, categorySlug, userLocation, radiusKm]
  );

  useEffect(() => {
    if (!cityId) return;
    fetchPins(lastRegion.current);
  }, [cityId, categorySlug, radiusKm, userLocation, fetchPins]);

  const loadFeed = useCallback(async () => {
    if (!cityId) return;
    setErr(null);
    try {
      const qs = new URLSearchParams({ cityId });
      if (userLocation) {
        qs.set("lat", String(userLocation.latitude));
        qs.set("lng", String(userLocation.longitude));
        qs.set("radiusKm", String(radiusKm));
      }
      const data = await api<{
        happeningNow: PlanCard[];
        startingSoon: PlanCard[];
      }>(`/feed/home?${qs.toString()}`, { method: "GET" });
      setFeed({
        happeningNow: data.happeningNow,
        startingSoon: data.startingSoon,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [cityId, userLocation, radiusKm]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const loadSpots = useCallback(async () => {
    if (!cityId) return;
    const q = new URLSearchParams({
      cityId,
      radiusKm: String(radiusKm),
      limit: "8",
    });
    if (userLocation) {
      q.set("lat", String(userLocation.latitude));
      q.set("lng", String(userLocation.longitude));
    }
    if (categorySlug) q.set("category", categorySlug);
    try {
      let data = await api<SpotRow[]>(`/spots?${q.toString()}`, {
        auth: false,
      });
      if (!data.length && categorySlug) {
        const q2 = new URLSearchParams(q.toString());
        q2.delete("category");
        data = await api<SpotRow[]>(`/spots?${q2.toString()}`, { auth: false });
      }
      setSpots(data.slice(0, 4));
    } catch {
      setSpots([]);
    }
  }, [cityId, userLocation, radiusKm, categorySlug]);

  useEffect(() => {
    loadSpots();
  }, [loadSpots]);

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

  const liveEvents = useMemo(() => {
    const xs = feed?.happeningNow ?? [];
    const f = categorySlug
      ? xs.filter((p) => p.category?.slug === categorySlug)
      : xs;
    return f.slice(0, 2);
  }, [feed, categorySlug]);

  const spotPreview = useMemo(() => spots.slice(0, 2), [spots]);

  const cityName = me?.city?.name?.trim();

  const sheetPin = useMemo(
    () => pins.find((p) => p.id === sheetPlanId) ?? null,
    [pins, sheetPlanId]
  );

  const radiusFillPct = useMemo(() => {
    const i = RADIUS_OPTIONS.indexOf(radiusKm);
    if (i < 0) return 40;
    return ((i + 1) / RADIUS_OPTIONS.length) * 100;
  }, [radiusKm]);

  /** Space reserved under status bar: title bar + city line + chips + breathing room */
  const topStackBottom = useMemo(() => {
    const safe = Math.max(insets.top, 10);
    const titleBar = 56;
    const cityLine = 22;
    const chipRow = 46;
    const gaps = 10 + 10 + 14;
    return safe + titleBar + cityLine + chipRow + gaps;
  }, [insets.top]);

  const toggleChip = (slug: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategorySlug((prev) => (prev === slug ? undefined : slug));
  };

  if (!cityId && loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#67e8f9" />
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
            pins={pins}
            userLocation={userLocation}
            radiusHighlightM={userLocation ? radiusKm * 1000 : undefined}
            onPinPress={(id) => setSheetPlanId(id)}
            onRegionChangeComplete={(region) => {
              if (!userLocation) fetchPins(region);
            }}
          />

          <View pointerEvents="none" style={styles.vignette} />

          <View
            style={[styles.topStack, { paddingTop: Math.max(insets.top, 10) }]}
            pointerEvents="box-none"
          >
            <BlurView intensity={35} tint="dark" style={styles.topAppBarInner}>
              <View style={styles.brandRow}>
                <View style={styles.brandDot} />
                <Text style={styles.brandText}>Liquid Map</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => stackNav()?.navigate("CreatePlan")}
                style={styles.explorePill}
              >
                <Text style={styles.explorePillText}>+ Plan</Text>
              </Pressable>
            </BlurView>

            <View style={styles.cityLine}>
              <Text style={styles.cityLineText}>
                {cityName ? `Explore · ${cityName}` : "Explore"}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
              contentContainerStyle={styles.chipRow}
            >
              {CHIPS.map((c) => {
                const on = categorySlug === c.slug;
                return (
                  <Pressable
                    key={c.slug}
                    onPress={() => toggleChip(c.slug)}
                    style={[styles.chip, on ? styles.chipOn : null]}
                  >
                    <Text style={[styles.chipText, on ? styles.chipTextOn : null]}>
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View
            style={[styles.floatLayer, { paddingTop: topStackBottom }]}
            pointerEvents="box-none"
          >
            <View style={styles.topRowWrap} pointerEvents="box-none">
              <View style={styles.topRow} pointerEvents="box-none">
                <BlurView
                  intensity={30}
                  tint="dark"
                  style={[styles.glassCard, styles.cardLeft]}
                >
                  <Text style={styles.cardKicker}>Live Events</Text>
                  {loading && !feed ? (
                    <ActivityIndicator color="#67e8f9" style={{ marginTop: 10 }} />
                  ) : liveEvents.length ? (
                    liveEvents.map((p) => (
                      <Pressable
                        key={p.id}
                        onPress={() =>
                          stackNav()?.navigate("PlanDetail", { planId: p.id })
                        }
                        style={styles.cardRow}
                      >
                        <PlanPlaceThumb
                          mapPreviewUrl={p.mapPreviewUrl}
                          lat={p.lat}
                          lng={p.lng}
                          size={40}
                        />
                        <View style={styles.cardRowText}>
                          <Text numberOfLines={1} style={styles.cardRowTitle}>
                            {p.title}
                          </Text>
                          <Text numberOfLines={1} style={styles.cardRowMeta}>
                            {p.locationName}
                          </Text>
                        </View>
                      </Pressable>
                    ))
                  ) : (
                    <Text style={styles.cardEmpty}>Nothing live right now.</Text>
                  )}
                </BlurView>

                <BlurView
                  intensity={30}
                  tint="dark"
                  style={[styles.glassCard, styles.cardRight]}
                >
                  <Text style={styles.cardKicker}>Social Spots</Text>
                  {spotPreview.length ? (
                    spotPreview.map((s) => (
                      <View key={s.id} style={styles.socialRow}>
                        <Text numberOfLines={1} style={styles.socialTitle}>
                          {s.name}
                        </Text>
                        <Text numberOfLines={1} style={styles.socialMeta}>
                          {s.category.name}
                          {s.distanceKm != null ? ` • ${s.distanceKm} km` : ""}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.cardEmpty}>No spots in this filter.</Text>
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
                <Pressable
                  onPress={() => stackNav()?.navigate("NearbyPeople")}
                  accessibilityRole="button"
                >
                  <BlurView intensity={24} tint="dark" style={styles.nearbyPill}>
                    <Text style={styles.nearbyPillText}>Nearby People</Text>
                  </BlurView>
                </Pressable>
              </View>

              <BlurView intensity={30} tint="dark" style={styles.radiusCard}>
                <View style={styles.radiusHeader}>
                  <Text style={styles.radiusLabel}>Search Radius</Text>
                  <Text style={styles.radiusValue}>
                    {radiusKm}{" "}
                    <Text style={styles.radiusUnit}>km</Text>
                  </Text>
                </View>
                <View style={styles.radiusPickRow}>
                  {RADIUS_OPTIONS.map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setRadiusKm(r);
                      }}
                      style={[
                        styles.radiusChip,
                        radiusKm === r ? styles.radiusChipOn : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.radiusChipText,
                          radiusKm === r ? styles.radiusChipTextOn : null,
                        ]}
                      >
                        {r}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.sliderTrack}>
                  <View style={[styles.sliderFill, { width: `${radiusFillPct}%` }]} />
                </View>
                <View style={styles.sliderTicks}>
                  <Text style={styles.sliderTickText}>near</Text>
                  <Text style={styles.sliderTickText}>wide</Text>
                </View>
              </BlurView>
            </View>
          </View>

          <Modal
            visible={sheetPlanId != null}
            transparent
            animationType="slide"
            onRequestClose={() => setSheetPlanId(null)}
          >
            <View style={styles.sheetBackdrop}>
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => setSheetPlanId(null)}
              />
              <BlurView intensity={40} tint="dark" style={styles.sheet}>
                {sheetPin ? (
                  <>
                    <View style={styles.sheetHeadRow}>
                      <PlanPlaceThumb
                        mapPreviewUrl={sheetPin.mapPreviewUrl}
                        lat={sheetPin.lat}
                        lng={sheetPin.lng}
                        size={56}
                        borderRadius={12}
                      />
                      <View style={styles.sheetHeadText}>
                        <Text numberOfLines={2} style={styles.sheetTitle}>
                          {sheetPin.title}
                        </Text>
                        <Text numberOfLines={1} style={styles.sheetLoc}>
                          {sheetPin.locationName}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.sheetMeta}>
                      {new Date(sheetPin.startTime).toLocaleString()} ·{" "}
                      {sheetPin.participantCount}/{sheetPin.maxParticipants} joined
                    </Text>
                    <Pressable
                      style={styles.sheetBtn}
                      onPress={() => {
                        const id = sheetPin.id;
                        setSheetPlanId(null);
                        stackNav()?.navigate("PlanDetail", { planId: id });
                      }}
                    >
                      <Text style={styles.sheetBtnText}>Open details</Text>
                    </Pressable>
                  </>
                ) : (
                  <Text style={styles.sheetTitle}>Plan</Text>
                )}
              </BlurView>
            </View>
          </Modal>

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

  vignette: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  topStack: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 12,
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

  cityLine: {
    marginTop: 10,
    alignItems: "center",
  },
  cityLineText: {
    color: "rgba(103, 232, 249, 0.95)",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  chipScroll: {
    marginTop: 10,
    maxHeight: 48,
  },
  chipRow: {
    paddingVertical: 4,
    paddingRight: 8,
    gap: 10,
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(13,13,24,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  chipOn: {
    backgroundColor: "rgba(240,132,255,0.18)",
    borderColor: "rgba(240,132,255,0.45)",
  },
  chipText: { color: "#a8a29e", fontSize: 12, fontWeight: "800" },
  chipTextOn: { color: "#f5d0fe" },

  floatLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 110,
    justifyContent: "space-between",
  },
  topRowWrap: { position: "relative" },
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
  cardRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardRowText: { flex: 1, minWidth: 0 },
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
  radiusPickRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    justifyContent: "space-between",
  },
  radiusChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "rgba(36,36,52,0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  radiusChipOn: {
    borderColor: "rgba(34,211,238,0.45)",
    backgroundColor: "rgba(34,211,238,0.12)",
  },
  radiusChipText: { color: "#a8a29e", fontSize: 12, fontWeight: "800" },
  radiusChipTextOn: { color: "#67e8f9" },
  sliderTrack: {
    marginTop: 12,
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(36, 36, 52, 0.85)",
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(240, 132, 255, 0.90)",
  },
  sliderTicks: { marginTop: 10, flexDirection: "row", justifyContent: "space-between" },
  sliderTickText: { color: "rgba(171, 169, 185, 0.9)", fontSize: 10 },

  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    marginHorizontal: 16,
    marginBottom: 100,
    borderRadius: 22,
    overflow: "hidden",
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  sheetHeadRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  sheetHeadText: { flex: 1, minWidth: 0 },
  sheetTitle: { fontSize: 17, fontWeight: "900", color: "#f5f5ff" },
  sheetLoc: {
    marginTop: 4,
    fontSize: 13,
    color: "rgba(171, 169, 185, 0.95)",
  },
  sheetMeta: { marginTop: 12, fontSize: 13, color: "#a8a29e" },
  sheetBtn: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#67e8f9",
  },
  sheetBtnText: { color: "#0f0f10", fontWeight: "900", fontSize: 15 },

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
