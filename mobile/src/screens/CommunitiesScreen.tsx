import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  TextInput,
  ImageBackground,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useMumbaiCityId } from "../hooks/useMumbaiCityId";

type Row = {
  id: string;
  name: string;
  memberCount: number;
  tags: string[];
};

const BG_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDXU2Eryclbki-fAL0n5yXfZKcgdh5CDG_tNugpA4HuhP3oigkaSEX39C97m1Kan7rbyiXNhYqRSpNOpTCwBLINaSSTlOEPquu3YmB8w3nkCA306XdaArsQ7GqottmrHKvkAXn-gWiXOEF4_Q1nCCpJtOEzz1DZ6KVciUxezkf476FWdiWBokOq3qF18X3LsLXzNJMSK1Tfvo2k0QJwYi2sEjWp0DTc--5n7a6NhdOb7eDlfcZoJK2rCvJ0-d6sj9M0_RXeC4XtwUzh";

const GROUP_IMG_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDMUQLCPUt5_-BkDuNl9eyFQ5z66zUnyyi-FYr4wa9d7HpT-9SC9M69PstNGxpF5wRfZVK7IviRV_538SIednuM7vTS1l04Wuw2FixFRXSSpQ-_OdjsuCOAO2hwIhixrChXHwZgOyzW2MGUYHDG8_EoITAGRp6VyG3RF3TP2U2vz7dlYs5oNTXEXoD2CInQ1XCDeKTZLL34Fi8G2BZV_7uBbOZY_OrTUeFTXq_LgyQdk4RI2aIfoMOvknBZBtThTYNqUjRfDWmGUPB9";

export function CommunitiesScreen() {
  const { me } = useAuth();
  const cityId = useMumbaiCityId(me?.city?.id);
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (!cityId) return;
    try {
      const data = await api<{ items: Row[] }>(
        `/communities?cityId=${cityId}`,
        { auth: false }
      );
      setItems(data.items);
    } finally {
      setLoading(false);
    }
  }, [cityId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [items, query]);

  const featuredGroup = filtered[0];

  return (
    <View style={styles.root}>
      <ImageBackground
        source={{ uri: BG_URI }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        imageStyle={styles.bgImage}
      >
        <LinearGradient
          colors={["rgba(13,13,24,0.92)", "rgba(13,13,24,0.35)", "rgba(13,13,24,0.92)"]}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={styles.meshPink} />
        <View pointerEvents="none" style={styles.meshCyan} />
      </ImageBackground>

      <View
        style={[styles.topAppBar, { paddingTop: Math.max(insets.top, 12) }]}
        pointerEvents="box-none"
      >
        <BlurView intensity={38} tint="dark" style={styles.topAppBarInner}>
          <View style={styles.brandRow}>
            <MaterialIcons name="explore" size={20} color="#f5d0fe" />
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandLiquid}>Liquid</Text>
              <Text style={styles.brandMap}>Map</Text>
            </View>
          </View>
          <View style={styles.topAvatar} />
        </BlurView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 100 + Math.max(insets.top, 12) },
        ]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor="#67e8f9" />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBlock}>
          <Text style={styles.vibeKicker}>Vibe Check</Text>
          <Text style={styles.heroTitle}>
            Nearby{" "}
            <Text>
              <Text style={styles.heroFlowPrimary}>Flow</Text>
              <Text style={styles.heroFlowSecondary}>.</Text>
            </Text>
          </Text>
        </View>

        <View style={styles.searchWrap}>
          <MaterialIcons
            name="search"
            size={20}
            color="rgba(117,116,130,0.95)"
            style={styles.searchIcon}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search people or groups..."
            placeholderTextColor="rgba(117,116,130,0.85)"
            style={styles.searchInput}
          />
        </View>

        {loading && !items.length ? (
          <ActivityIndicator color="#67e8f9" style={{ marginTop: 28 }} />
        ) : null}

        {/* Person card 1 */}
        <BlurView intensity={26} tint="dark" style={[styles.card, styles.asymmetric]}>
          <View style={styles.cardTopRow}>
            <View>
              <View style={styles.avatarRingPrimary}>
                <View style={styles.avatarInner} />
              </View>
              <View style={[styles.onlineDot, { backgroundColor: "#22c55e" }]} />
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.distMain}>0.4 km</Text>
              <Text style={styles.distSub}>Aoyama, Minato</Text>
            </View>
          </View>
          <Text style={styles.personName}>Elena Vance</Text>
          <Text style={styles.personBio} numberOfLines={2}>
            Digital nomad exploring local jazz bars. Always down for a quick espresso match.
          </Text>
          <View style={styles.cardFooter}>
            <View style={styles.initialsRow}>
              <View style={[styles.initials, { backgroundColor: "rgba(124,77,255,0.95)" }]}>
                <Text style={styles.initialsText}>DV</Text>
              </View>
              <View style={[styles.initials, { backgroundColor: "rgba(234,107,255,0.95)" }]}>
                <Text style={styles.initialsText}>JS</Text>
              </View>
            </View>
            <Pressable style={styles.sayHiBtn}>
              <LinearGradient
                colors={["#f084ff", "#ea6bff"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sayHiGradient}
              >
                <Text style={styles.sayHiText}>SAY HI</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </BlurView>

        {/* Wide group card — prefer first API community when available */}
        <BlurView intensity={28} tint="dark" style={[styles.cardWide, styles.asymmetric]}>
          <ImageBackground
            source={{ uri: GROUP_IMG_URI }}
            style={styles.groupImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={["transparent", "rgba(36,36,52,0.92)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Active Group</Text>
            </View>
          </ImageBackground>
          <View style={styles.groupBody}>
            <View style={styles.groupTitleRow}>
              <Text style={styles.groupTitle} numberOfLines={2}>
                {featuredGroup?.name ?? "Liquid Motion Lab"}
              </Text>
              <Text style={styles.distMain}>1.2 km</Text>
            </View>
            <Text style={styles.groupDesc} numberOfLines={4}>
              {featuredGroup
                ? `${featuredGroup.memberCount} members${
                    featuredGroup.tags.length
                      ? ` · ${featuredGroup.tags.slice(0, 3).join(" · ")}`
                      : ""
                  }`
                : "A collective of 12 creators meeting at 'The Void' for a generative art sprint. Open for 3 more drop-ins."}
            </Text>
            <View style={styles.groupFooter}>
              <View style={styles.membersRow}>
                <MaterialIcons name="group" size={16} color="#f084ff" />
                <Text style={styles.membersText}>
                  {featuredGroup
                    ? `${featuredGroup.memberCount} members`
                    : "12/15 members"}
                </Text>
              </View>
              <Pressable style={styles.joinBtn}>
                <Text style={styles.joinBtnText}>JOIN SESSION</Text>
              </Pressable>
            </View>
          </View>
        </BlurView>

        {/* Person card 2 */}
        <BlurView intensity={26} tint="dark" style={[styles.card, styles.asymmetric]}>
          <View style={styles.cardTopRow}>
            <View>
              <View style={styles.avatarRingSecondary}>
                <View style={styles.avatarInner} />
              </View>
              <View style={[styles.onlineDot, { backgroundColor: "#64748b" }]} />
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.distMain}>2.8 km</Text>
              <Text style={styles.distSub}>Shibuya Crossing</Text>
            </View>
          </View>
          <Text style={styles.personName}>Kaito Sato</Text>
          <Text style={styles.personBio} numberOfLines={2}>
            Architecture geek. Mapping the hidden brutalist gems of Tokyo. Join the walk?
          </Text>
          <View style={styles.cardFooter}>
            <View style={styles.tagRow}>
              <View style={styles.tagChip}>
                <Text style={styles.tagChipText}>History</Text>
              </View>
              <View style={styles.tagChip}>
                <Text style={styles.tagChipText}>Design</Text>
              </View>
            </View>
            <Pressable style={styles.sayHiBtn}>
              <LinearGradient
                colors={["#f084ff", "#ea6bff"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sayHiGradient}
              >
                <Text style={styles.sayHiText}>SAY HI</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </BlurView>

        {/* Pulse card */}
        <BlurView intensity={24} tint="dark" style={[styles.pulseCard, styles.asymmetric]}>
          <View style={styles.pulseIconWrap}>
            <MaterialIcons name="flare" size={32} color="#a68cff" />
          </View>
          <Text style={styles.pulseTitle}>New Pulse Detected</Text>
          <Text style={styles.pulseBody}>
            There’s a secret pop-up event starting in 15 minutes nearby.
          </Text>
          <Pressable>
            <Text style={styles.revealLink}>REVEAL LOCATION</Text>
          </Pressable>
        </BlurView>

        {/* Person card 3 */}
        <BlurView intensity={26} tint="dark" style={[styles.card, styles.asymmetric]}>
          <View style={styles.cardTopRow}>
            <View>
              <View style={styles.avatarRingPrimary}>
                <View style={styles.avatarInner} />
              </View>
              <View style={[styles.onlineDot, { backgroundColor: "#22c55e" }]} />
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.distMain}>0.9 km</Text>
              <Text style={styles.distSub}>Omotesando</Text>
            </View>
          </View>
          <Text style={styles.personName}>Marcus Chen</Text>
          <Text style={styles.personBio} numberOfLines={2}>
            Creative coder. Looking for feedback on a new WebGL visualizer. Pizza’s on me.
          </Text>
          <View style={styles.cardFooter}>
            <View style={styles.initialsRow}>
              <View style={[styles.smallAvatar, { backgroundColor: "rgba(0,103,117,0.95)" }]} />
              <View style={[styles.smallAvatar, { backgroundColor: "rgba(234,107,255,0.95)" }]} />
              <View style={[styles.smallAvatar, styles.smallAvatarMore]}>
                <Text style={styles.smallAvatarMoreText}>+4</Text>
              </View>
            </View>
            <Pressable style={styles.sayHiBtn}>
              <LinearGradient
                colors={["#f084ff", "#ea6bff"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sayHiGradient}
              >
                <Text style={styles.sayHiText}>SAY HI</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </BlurView>

        {/* Extra API communities as compact rows */}
        {filtered.slice(1).map((c) => (
          <BlurView key={c.id} intensity={22} tint="dark" style={[styles.apiRow, styles.asymmetric]}>
            <View style={styles.apiRowLeft}>
              <View style={styles.apiDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.apiName} numberOfLines={1}>
                  {c.name}
                </Text>
                <Text style={styles.apiMeta} numberOfLines={1}>
                  {c.memberCount} members
                  {c.tags.length ? ` · ${c.tags.join(" · ")}` : ""}
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="rgba(171,169,185,0.7)" />
          </BlurView>
        ))}

      </ScrollView>

      <View pointerEvents="none" style={styles.floatBubbleLeft} />
      <View pointerEvents="none" style={styles.floatBubbleRight} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0d0d18" },
  bgImage: { opacity: 0.22, transform: [{ scale: 1.08 }] },
  meshPink: {
    position: "absolute",
    top: "-8%",
    left: "-18%",
    width: 420,
    height: 420,
    borderRadius: 999,
    backgroundColor: "rgba(240, 132, 255, 0.16)",
  },
  meshCyan: {
    position: "absolute",
    bottom: "-12%",
    right: "-22%",
    width: 460,
    height: 460,
    borderRadius: 999,
    backgroundColor: "rgba(0, 227, 253, 0.14)",
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 130,
    gap: 20,
  },

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
  brandTitleRow: { flexDirection: "row", alignItems: "baseline" },
  brandLiquid: {
    fontSize: 18,
    fontWeight: "900",
    color: "#f5d0fe",
    letterSpacing: -0.35,
  },
  brandMap: {
    marginLeft: 4,
    fontSize: 18,
    fontWeight: "900",
    color: "#67e8f9",
    letterSpacing: -0.35,
  },
  topAvatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(240, 132, 255, 0.22)",
    backgroundColor: "rgba(36,36,52,0.9)",
  },

  heroBlock: { marginBottom: 4 },
  vibeKicker: {
    fontSize: 11,
    fontWeight: "800",
    color: "#00e3fd",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: "900",
    color: "#e9e6f7",
    letterSpacing: -1,
    lineHeight: 44,
  },
  heroFlowPrimary: { color: "#f084ff" },
  heroFlowSecondary: { color: "#00e3fd" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(71,71,84,0.35)",
    backgroundColor: "rgba(0,0,0,0.28)",
    paddingVertical: 12,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  searchIcon: { marginLeft: 4, marginRight: 8 },
  searchInput: {
    flex: 1,
    color: "#e9e6f7",
    fontSize: 15,
    paddingVertical: 0,
  },

  asymmetric: {
    borderTopLeftRadius: 48,
    borderBottomRightRadius: 48,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
  },
  card: {
    minHeight: 300,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(24, 24, 38, 0.38)",
    overflow: "hidden",
    shadowColor: "#f084ff",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  avatarRingPrimary: {
    width: 84,
    height: 84,
    borderRadius: 999,
    padding: 4,
    borderWidth: 4,
    borderColor: "rgba(240, 132, 255, 0.12)",
    backgroundColor: "rgba(36,36,52,0.85)",
    overflow: "hidden",
  },
  avatarRingSecondary: {
    width: 84,
    height: 84,
    borderRadius: 999,
    padding: 4,
    borderWidth: 4,
    borderColor: "rgba(0, 227, 253, 0.12)",
    backgroundColor: "rgba(36,36,52,0.85)",
    overflow: "hidden",
  },
  avatarInner: { flex: 1, borderRadius: 999, backgroundColor: "rgba(30,30,45,0.95)" },
  onlineDot: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: "rgba(24,24,38,0.95)",
  },
  distMain: { fontSize: 13, fontWeight: "700", color: "#00e3fd", letterSpacing: 0.6 },
  distSub: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(71,71,84,0.95)",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  personName: { marginTop: 22, fontSize: 22, fontWeight: "800", color: "#e9e6f7" },
  personBio: { marginTop: 8, fontSize: 14, lineHeight: 20, color: "rgba(171,169,185,0.95)" },
  cardFooter: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  initialsRow: { flexDirection: "row" },
  initials: {
    width: 32,
    height: 32,
    borderRadius: 999,
    marginRight: -8,
    borderWidth: 2,
    borderColor: "rgba(24,24,38,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: { fontSize: 10, fontWeight: "900", color: "#0d0d18" },
  tagRow: { flexDirection: "row", gap: 8 },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(36,36,52,0.95)",
  },
  tagChipText: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(117,116,130,0.95)",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  sayHiBtn: { borderRadius: 999, overflow: "hidden" },
  sayHiGradient: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  sayHiText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: 2,
  },

  cardWide: {
    flexDirection: "column",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(24, 24, 38, 0.38)",
    overflow: "hidden",
    padding: 22,
    gap: 16,
    shadowColor: "#00e3fd",
    shadowOpacity: 0.07,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },
  groupImage: {
    minHeight: 200,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(36,36,52,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  activePill: {
    position: "absolute",
    left: 14,
    bottom: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0, 227, 253, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(0, 227, 253, 0.28)",
  },
  activePillText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#00e3fd",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  groupBody: { flex: 1, justifyContent: "space-between", gap: 12 },
  groupTitleRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  groupTitle: { flex: 1, fontSize: 26, fontWeight: "900", color: "#e9e6f7", letterSpacing: -0.5 },
  groupDesc: { fontSize: 15, lineHeight: 22, color: "rgba(171,169,185,0.95)" },
  groupFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  membersRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  membersText: { fontSize: 13, fontWeight: "700", color: "#e9e6f7" },
  joinBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0, 227, 253, 0.35)",
    backgroundColor: "rgba(0, 227, 253, 0.08)",
  },
  joinBtnText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#00e3fd",
    letterSpacing: 2,
  },

  pulseCard: {
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(166,140,255,0.22)",
    backgroundColor: "rgba(124, 77, 255, 0.10)",
    overflow: "hidden",
    gap: 8,
  },
  pulseIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: "rgba(166, 140, 255, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  pulseTitle: { fontSize: 18, fontWeight: "900", color: "#a68cff" },
  pulseBody: {
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(171,169,185,0.95)",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  revealLink: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "900",
    color: "#a68cff",
    letterSpacing: 2,
    textDecorationLine: "underline",
    textDecorationColor: "rgba(166,140,255,0.35)",
  },

  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
    marginRight: -8,
    borderWidth: 2,
    borderColor: "rgba(24,24,38,0.95)",
  },
  smallAvatarMore: {
    backgroundColor: "rgba(36,36,52,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  smallAvatarMoreText: { fontSize: 10, fontWeight: "900", color: "#e9e6f7" },

  apiRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(24, 24, 38, 0.32)",
    overflow: "hidden",
  },
  apiRowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, paddingRight: 10 },
  apiDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#f084ff",
  },
  apiName: { fontSize: 15, fontWeight: "800", color: "#e9e6f7" },
  apiMeta: { marginTop: 2, fontSize: 12, color: "rgba(171,169,185,0.92)" },

  floatBubbleLeft: {
    position: "absolute",
    left: -70,
    bottom: "22%",
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(124, 77, 255, 0.18)",
    opacity: 0.9,
    zIndex: 1,
  },
  floatBubbleRight: {
    position: "absolute",
    right: -80,
    top: "18%",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(0, 103, 117, 0.12)",
    opacity: 0.9,
    zIndex: 1,
  },
});
