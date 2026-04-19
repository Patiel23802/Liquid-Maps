import React, { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const { me, signOut } = useAuth();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const stackNav = useCallback(() => {
    return navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  }, [navigation]);

  const [invisibleMode, setInvisibleMode] = useState(true);
  const [haptics, setHaptics] = useState(false);
  const [radius, setRadius] = useState(50);
  const [hostedCount, setHostedCount] = useState(0);
  const [joinedCount, setJoinedCount] = useState(0);

  const loadCounts = useCallback(async () => {
    if (!me) return;
    try {
      const [hosted, joined] = await Promise.all([
        api<{ id: string }[]>("/users/me/events"),
        api<{ id: string }[]>("/users/me/joined-events"),
      ]);
      setHostedCount(hosted.length);
      setJoinedCount(joined.length);
    } catch {
      /* ignore */
    }
  }, [me]);

  useFocusEffect(
    useCallback(() => {
      void loadCounts();
    }, [loadCounts])
  );

  const displayName = me?.name?.trim() || "—";
  const subtitle = useMemo(() => {
    const city = me?.city?.name?.trim();
    return city ? `${city} • Neon Explorer` : "Neon Explorer";
  }, [me?.city?.name]);

  return (
    <View style={styles.container}>
      <View
        style={[styles.topAppBar, { paddingTop: Math.max(insets.top, 12) }]}
        pointerEvents="box-none"
      >
        <BlurView intensity={35} tint="dark" style={styles.topAppBarInner}>
          <View style={styles.brandRow}>
            <MaterialIcons name="explore" size={20} color="#f5d0fe" />
            <Text style={styles.brandText}>Liquid Map</Text>
          </View>
          <View style={styles.topAvatar} />
        </BlurView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.inner,
          { paddingTop: 108 + Math.max(insets.top, 12) },
        ]}
      >
        {/* Profile hero */}
        <View style={styles.hero} pointerEvents="box-none">
          <View style={styles.avatarAura} pointerEvents="none" />
          <LinearGradient
            colors={["rgba(240,132,255,0.95)", "rgba(0,227,253,0.95)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarRing}
          >
            <View style={styles.avatarInner} />
          </LinearGradient>

          <View style={styles.heroText}>
            <Text style={styles.heroName}>{displayName}</Text>
            <Text style={styles.heroSub}>{subtitle}</Text>
            {me?.discoveryTagline ? (
              <Text style={styles.tagline}>{me.discoveryTagline}</Text>
            ) : null}
          </View>
        </View>

        <Pressable
          style={styles.editProfile}
          onPress={() => stackNav()?.navigate("EditProfile")}
        >
          <Text style={styles.editProfileText}>Edit profile & interests</Text>
        </Pressable>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <BlurView intensity={28} tint="dark" style={[styles.statCard, styles.statCardPrimary]}>
            <Text style={styles.statValuePrimary}>{hostedCount}</Text>
            <Text style={styles.statLabel}>Plans hosted</Text>
          </BlurView>
          <BlurView intensity={28} tint="dark" style={[styles.statCard, styles.statCardSecondary]}>
            <Text style={styles.statValueSecondary}>{joinedCount}</Text>
            <Text style={styles.statLabel}>Plans joined</Text>
          </BlurView>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="settings" size={18} color="#67e8f9" />
            <Text style={styles.sectionTitle}>Preferences</Text>
          </View>

          <BlurView intensity={26} tint="dark" style={styles.prefCard}>
            <View style={styles.prefRow}>
              <View style={styles.prefLeft}>
                <View style={[styles.prefIconWrap, { backgroundColor: "rgba(36,36,52,0.8)" }]}>
                  <MaterialIcons name="visibility-off" size={20} color="#f084ff" />
                </View>
                <View style={styles.prefText}>
                  <Text style={styles.prefTitle}>Invisible Mode</Text>
                  <Text style={styles.prefDesc}>
                    Hide your real-time position from the map
                  </Text>
                </View>
              </View>
              <Switch
                value={invisibleMode}
                onValueChange={setInvisibleMode}
                trackColor={{ false: "rgba(36,36,52,0.9)", true: "rgba(240,132,255,0.55)" }}
                thumbColor="#ffffff"
              />
            </View>
          </BlurView>

          <BlurView intensity={26} tint="dark" style={styles.prefCard}>
            <View style={styles.prefRow}>
              <View style={styles.prefLeft}>
                <View style={[styles.prefIconWrap, { backgroundColor: "rgba(36,36,52,0.8)" }]}>
                  <MaterialIcons name="radar" size={20} color="#67e8f9" />
                </View>
                <View style={styles.prefText}>
                  <Text style={styles.prefTitle}>Discovery Radius</Text>
                  <Text style={styles.prefDesc}>
                    Max distance for event notifications
                  </Text>
                </View>
              </View>
              <Text style={styles.radiusValueText}>
                {Math.round((radius / 100) * 10 * 10) / 10} km
              </Text>
            </View>
            <View style={styles.sliderWrap}>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${radius}%` }]} />
              </View>
              <View style={styles.sliderTicks}>
                <Text style={styles.sliderTickText}>Local</Text>
                <Text style={styles.sliderTickText}>City-Wide</Text>
              </View>
              <View style={styles.sliderButtons}>
                <Pressable
                  onPress={() => setRadius((r) => Math.max(0, r - 10))}
                  style={styles.sliderBtn}
                >
                  <Text style={styles.sliderBtnText}>-</Text>
                </Pressable>
                <Pressable
                  onPress={() => setRadius((r) => Math.min(100, r + 10))}
                  style={styles.sliderBtn}
                >
                  <Text style={styles.sliderBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
          </BlurView>

          <BlurView intensity={26} tint="dark" style={styles.prefCard}>
            <View style={styles.prefRow}>
              <View style={styles.prefLeft}>
                <View style={[styles.prefIconWrap, { backgroundColor: "rgba(36,36,52,0.8)" }]}>
                  <MaterialIcons name="vibration" size={20} color="#a68cff" />
                </View>
                <View style={styles.prefText}>
                  <Text style={styles.prefTitle}>Haptic Feedback</Text>
                  <Text style={styles.prefDesc}>
                    Subtle vibrations for navigation cues
                  </Text>
                </View>
              </View>
              <Switch
                value={haptics}
                onValueChange={setHaptics}
                trackColor={{ false: "rgba(36,36,52,0.9)", true: "rgba(168,140,255,0.55)" }}
                thumbColor="#ffffff"
              />
            </View>
          </BlurView>
        </View>

        {/* Onboarding */}
        {!me?.onboardingCompleted ? (
          <Pressable
            style={styles.primaryCta}
            onPress={() => stackNav()?.navigate("Onboarding")}
          >
            <Text style={styles.primaryCtaText}>Finish onboarding</Text>
          </Pressable>
        ) : null}

        {/* Logout */}
        <Pressable style={styles.logoutBtn} onPress={signOut}>
          <Text style={styles.logoutText}>Log Out of Liquid Map</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d18" },
  scroll: { flex: 1 },
  inner: { paddingHorizontal: 18, paddingBottom: 130, gap: 18 },

  topAppBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 20,
  },
  topAppBarInner: {
    height: 64,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(2, 6, 23, 0.55)",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#f084ff",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#e9e6f7",
    letterSpacing: -0.2,
  },
  topAvatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(0, 227, 253, 0.45)",
    backgroundColor: "rgba(36,36,52,0.9)",
  },

  hero: { alignItems: "center", gap: 14, paddingTop: 6 },
  avatarAura: {
    position: "absolute",
    top: 0,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(240, 132, 255, 0.18)",
    opacity: 1,
  },
  avatarRing: {
    width: 132,
    height: 132,
    borderRadius: 999,
    padding: 4,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "rgba(36,36,52,0.95)",
    borderWidth: 4,
    borderColor: "rgba(18,18,30,0.95)",
  },
  heroText: { alignItems: "center", gap: 6 },
  heroName: { fontSize: 34, fontWeight: "900", color: "#e9e6f7", letterSpacing: -0.5 },
  tagline: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 14,
    color: "rgba(233,230,247,0.88)",
    fontWeight: "600",
    paddingHorizontal: 12,
  },
  editProfile: {
    marginTop: 4,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    backgroundColor: "rgba(34,211,238,0.10)",
  },
  editProfileText: { color: "#67e8f9", fontWeight: "900", fontSize: 14 },
  heroSub: {
    fontSize: 12,
    fontWeight: "800",
    color: "#67e8f9",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },

  statsGrid: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(233, 230, 247, 0.10)",
    backgroundColor: "rgba(24, 24, 38, 0.35)",
    paddingVertical: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  statCardPrimary: { borderColor: "rgba(240, 132, 255, 0.18)" },
  statCardSecondary: { borderColor: "rgba(0, 227, 253, 0.18)" },
  statValuePrimary: { fontSize: 34, fontWeight: "900", color: "#f084ff" },
  statValueSecondary: { fontSize: 34, fontWeight: "900", color: "#00e3fd" },
  statLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(171, 169, 185, 0.92)",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },

  section: { gap: 12, marginTop: 6 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#e9e6f7" },

  prefCard: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(233, 230, 247, 0.10)",
    backgroundColor: "rgba(24, 24, 38, 0.35)",
    padding: 16,
  },
  prefRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  prefLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, paddingRight: 10 },
  prefIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  prefText: { flex: 1 },
  prefTitle: { fontSize: 14, fontWeight: "900", color: "#e9e6f7" },
  prefDesc: { marginTop: 2, fontSize: 11, color: "rgba(171, 169, 185, 0.92)" },
  radiusValueText: { fontSize: 14, fontWeight: "900", color: "#67e8f9" },
  sliderWrap: { marginTop: 14 },
  sliderTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(36,36,52,0.90)",
    overflow: "hidden",
  },
  sliderFill: { height: "100%", borderRadius: 999, backgroundColor: "rgba(0, 227, 253, 0.85)" },
  sliderTicks: { marginTop: 10, flexDirection: "row", justifyContent: "space-between" },
  sliderTickText: { fontSize: 10, color: "rgba(171, 169, 185, 0.90)", fontWeight: "800" },
  sliderButtons: { marginTop: 12, flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  sliderBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(36,36,52,0.80)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sliderBtnText: { color: "#e9e6f7", fontSize: 18, fontWeight: "900" },

  primaryCta: {
    marginTop: 6,
    borderRadius: 999,
    backgroundColor: "rgba(240,132,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(240,132,255,0.25)",
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryCtaText: { color: "#f5d0fe", fontWeight: "900" },

  logoutBtn: {
    marginTop: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(215, 51, 87, 0.35)",
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "rgba(215, 51, 87, 0.06)",
  },
  logoutText: { color: "rgba(215, 51, 87, 0.95)", fontWeight: "900" },
});
