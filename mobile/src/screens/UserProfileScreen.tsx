import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api/client";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "UserProfile">;

type PublicUser = {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  discoveryTagline: string | null;
  city: { name: string } | null;
  interests: { id: number; name: string; slug: string }[];
};

export function UserProfileScreen({ route }: Props) {
  const { userId } = route.params;
  const [u, setU] = useState<PublicUser | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const data = await api<PublicUser>(`/users/${userId}`, { auth: false });
        if (!c) setU(data);
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : "Failed");
      }
    })();
    return () => {
      c = true;
    };
  }, [userId]);

  if (!u && !err) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#67e8f9" />
      </View>
    );
  }

  if (err || !u) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{err ?? "Not found"}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.inner}>
      <LinearGradient
        colors={["rgba(240,132,255,0.35)", "rgba(0,227,253,0.2)"]}
        style={styles.hero}
      >
        <View style={styles.avatar} />
        <Text style={styles.name}>{u.name}</Text>
        <Text style={styles.user}>@{u.username}</Text>
        {u.city ? <Text style={styles.city}>{u.city.name}</Text> : null}
      </LinearGradient>
      <BlurView intensity={28} tint="dark" style={styles.card}>
        {u.discoveryTagline ? (
          <Text style={styles.tagline}>{u.discoveryTagline}</Text>
        ) : null}
        {u.bio ? <Text style={styles.bio}>{u.bio}</Text> : null}
        <Text style={styles.section}>Interests</Text>
        <View style={styles.chips}>
          {u.interests.map((i) => (
            <View key={i.id} style={styles.chip}>
              <Text style={styles.chipText}>{i.name}</Text>
            </View>
          ))}
        </View>
      </BlurView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f0f10" },
  inner: { paddingBottom: 40 },
  center: { flex: 1, backgroundColor: "#0f0f10", justifyContent: "center" },
  err: { color: "#fca5a5", textAlign: "center" },
  hero: {
    paddingTop: 48,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: "rgba(13,13,24,0.5)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  name: { marginTop: 14, fontSize: 24, fontWeight: "900", color: "#0f0f10" },
  user: { marginTop: 4, fontSize: 14, fontWeight: "800", color: "rgba(15,15,16,0.75)" },
  city: { marginTop: 6, fontSize: 13, fontWeight: "700", color: "rgba(15,15,16,0.7)" },
  card: {
    marginHorizontal: 16,
    marginTop: -18,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  tagline: { fontSize: 15, fontWeight: "800", color: "#f5d0fe" },
  bio: { marginTop: 10, fontSize: 14, color: "rgba(233,230,247,0.92)", lineHeight: 20 },
  section: {
    marginTop: 16,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: "rgba(171,169,185,0.95)",
    textTransform: "uppercase",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(34,211,238,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.22)",
  },
  chipText: { fontSize: 12, fontWeight: "800", color: "#a5f3fc" },
});
