import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from "react-native";
import { BlurView } from "expo-blur";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api/client";
import type { RootStackParamList } from "../navigation/types";

type Person = {
  id: string;
  name: string;
  username: string;
  discoveryTagline: string | null;
  distanceKm: number;
  interests: { id: number; slug: string; name: string }[];
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function NearbyPeopleScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 19.076,
    lng: 72.8777,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await api<Person[]>(
        `/people/nearby?lat=${coords.lat}&lng=${coords.lng}&radiusKm=12&limit=40`
      );
      setItems(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [coords.lat, coords.lng]);

  useEffect(() => {
    let c = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!c) {
          setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        }
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
          <Text style={styles.h1}>Nearby people</Text>
          <Text style={styles.sub}>Community vibe — not a dating feed.</Text>
        </BlurView>
      </View>
      {loading && !items.length ? (
        <ActivityIndicator color="#67e8f9" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 100 + Math.max(insets.top, 12),
            paddingBottom: 120,
          }}
          data={items}
          keyExtractor={(i) => i.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {err ?? "No discoverable profiles in this radius yet."}
            </Text>
          }
          renderItem={({ item }) => (
            <BlurView intensity={26} tint="dark" style={styles.card}>
              <View style={styles.rowTop}>
                <View style={styles.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.dist}>{item.distanceKm} km away</Text>
                </View>
              </View>
              {item.discoveryTagline ? (
                <Text style={styles.tagline}>{item.discoveryTagline}</Text>
              ) : null}
              <View style={styles.chips}>
                {item.interests.slice(0, 4).map((x) => (
                  <View key={x.id} style={styles.chip}>
                    <Text style={styles.chipText}>{x.name}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.actions}>
                <Pressable
                  style={styles.btnGhost}
                  onPress={() =>
                    navigation.navigate("UserProfile", { userId: item.id })
                  }
                >
                  <Text style={styles.btnGhostText}>View profile</Text>
                </Pressable>
                <Pressable style={styles.btnSolid}>
                  <Text style={styles.btnSolidText}>Connect</Text>
                </Pressable>
              </View>
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
  card: {
    marginBottom: 14,
    borderRadius: 20,
    overflow: "hidden",
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(13,13,24,0.45)",
  },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "rgba(240,132,255,0.25)",
    borderWidth: 1,
    borderColor: "rgba(240,132,255,0.45)",
  },
  name: { fontSize: 17, fontWeight: "900", color: "#f5f5ff" },
  dist: { marginTop: 2, fontSize: 12, color: "#67e8f9", fontWeight: "700" },
  tagline: {
    marginTop: 10,
    fontSize: 14,
    color: "rgba(233,230,247,0.92)",
    lineHeight: 20,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(34,211,238,0.10)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.22)",
  },
  chipText: { fontSize: 11, fontWeight: "800", color: "#a5f3fc" },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    justifyContent: "flex-end",
  },
  btnGhost: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  btnGhostText: { color: "#e7e5f4", fontWeight: "800", fontSize: 13 },
  btnSolid: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(240,132,255,0.9)",
  },
  btnSolidText: { color: "#120616", fontWeight: "900", fontSize: 13 },
  empty: { color: "#a8a29e", textAlign: "center", marginTop: 40 },
});
