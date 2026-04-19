import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useMumbaiCityId } from "../hooks/useMumbaiCityId";
type Spot = {
  id: string;
  name: string;
  category: { name: string; slug: string };
  popularity: number;
  vibeTags: string[];
  distanceKm?: number;
};

export function SocialSpotsScreen() {
  const { me } = useAuth();
  const cityId = useMumbaiCityId(me?.city?.id);
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);

  const load = useCallback(async () => {
    if (!cityId) return;
    setLoading(true);
    try {
      const q = new URLSearchParams({
        cityId,
        radiusKm: "20",
        limit: "40",
      });
      if (loc) {
        q.set("lat", String(loc.lat));
        q.set("lng", String(loc.lng));
      }
      const data = await api<Spot[]>(`/spots?${q.toString()}`, { auth: false });
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [cityId, loc]);

  useEffect(() => {
    let c = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const p = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!c) {
        setLoc({ lat: p.coords.latitude, lng: p.coords.longitude });
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <BlurView intensity={32} tint="dark" style={styles.headerInner}>
          <Text style={styles.h1}>Social spots</Text>
          <Text style={styles.sub}>Cafes, turfs, gaming zones — ranked by vibe.</Text>
        </BlurView>
      </View>
      {loading && !items.length ? (
        <ActivityIndicator color="#f5d0fe" style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 108 + Math.max(insets.top, 12),
            paddingBottom: 120,
          }}
          data={items}
          keyExtractor={(i) => i.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} />
          }
          ListHeaderComponent={
            <View style={styles.banner}>
              <Text style={styles.bannerText}>
                Trending venues around Mumbai — distance updates when location is on.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <BlurView intensity={26} tint="dark" style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.category.name}
                {item.distanceKm != null ? ` • ${item.distanceKm} km` : ""}
              </Text>
              <View style={styles.tags}>
                {item.vibeTags.map((t) => (
                  <View key={t} style={styles.tag}>
                    <Text style={styles.tagText}>{t}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.pop}>Popularity {item.popularity}/100</Text>
            </BlurView>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f0f10" },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    paddingHorizontal: 16,
  },
  headerInner: {
    borderRadius: 18,
    overflow: "hidden",
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  h1: { fontSize: 22, fontWeight: "900", color: "#f5f5ff" },
  sub: { marginTop: 6, fontSize: 13, color: "#a8a29e" },
  banner: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(34,211,238,0.08)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.22)",
  },
  bannerText: { color: "#a5f3fc", fontSize: 13, fontWeight: "700" },
  card: {
    marginBottom: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  name: { fontSize: 17, fontWeight: "900", color: "#f5d0fe" },
  meta: { marginTop: 4, fontSize: 13, color: "#a8a29e" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(240,132,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(240,132,255,0.25)",
  },
  tagText: { fontSize: 11, fontWeight: "800", color: "#f5d0fe" },
  pop: { marginTop: 10, fontSize: 12, color: "#67e8f9", fontWeight: "800" },
});
