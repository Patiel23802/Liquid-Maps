import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api/client";
import type { RootStackParamList } from "../navigation/types";
import { PlanPlaceThumb } from "../components/PlanPlaceThumb";

type Props = NativeStackScreenProps<RootStackParamList, "PlanDetail">;

type Plan = {
  id: string;
  title: string;
  description: string | null;
  locationName: string;
  lat?: number | null;
  lng?: number | null;
  mapPreviewUrl?: string | null;
  startTime: string;
  participantCount: number;
  maxParticipants: number;
  verifiedOnly: boolean;
  womenOnly: boolean;
  joinType: string;
  host: { name: string; username: string; hostScore: number };
  myParticipation: { status: string; canChat: boolean } | null;
};

export function PlanDetailScreen({ route }: Props) {
  const { planId } = route.params;
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const load = async () => {
    try {
      const data = await api<Plan>(`/plans/${planId}`, {
        method: "GET",
        auth: true,
      });
      setPlan(data);
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [planId]);

  const join = async () => {
    setJoining(true);
    try {
      await api(`/plans/${planId}/join`, { method: "POST", body: {} });
      await load();
      Alert.alert("Joined", "You're in. Be safe, meet in public.");
    } catch (e) {
      Alert.alert("Could not join", e instanceof Error ? e.message : "Error");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#ea580c" size="large" />
      </View>
    );
  }
  if (!plan) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Plan not found</Text>
      </View>
    );
  }

  const canChat = plan.myParticipation?.canChat;

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.inner}>
      <View style={styles.previewRow}>
        <PlanPlaceThumb
          mapPreviewUrl={plan.mapPreviewUrl}
          lat={plan.lat ?? undefined}
          lng={plan.lng ?? undefined}
          size={120}
          borderRadius={16}
        />
      </View>
      <Text style={styles.title}>{plan.title}</Text>
      <Text style={styles.host}>
        Host: {plan.host.name} (@{plan.host.username}) · trust {plan.host.hostScore}
      </Text>
      <View style={styles.row}>
        {plan.womenOnly ? <Text style={styles.badge}>Women & NB</Text> : null}
        {plan.verifiedOnly ? <Text style={styles.badge}>Verified only</Text> : null}
      </View>
      <Text style={styles.section}>When</Text>
      <Text style={styles.body}>
        {new Date(plan.startTime).toLocaleString()}
      </Text>
      <Text style={styles.section}>Where</Text>
      <Text style={styles.body}>{plan.locationName}</Text>
      {plan.description ? (
        <>
          <Text style={styles.section}>Details</Text>
          <Text style={styles.body}>{plan.description}</Text>
        </>
      ) : null}
      <Text style={styles.meta}>
        {plan.participantCount} / {plan.maxParticipants} people
      </Text>

      {!plan.myParticipation ? (
        <Pressable
          style={[styles.primary, joining && { opacity: 0.6 }]}
          onPress={join}
          disabled={joining}
        >
          <Text style={styles.primaryText}>
            {joining ? "Joining…" : "Join plan"}
          </Text>
        </Pressable>
      ) : canChat ? (
        <Pressable
          style={styles.primary}
          onPress={() => navigation.navigate("Chat", { planId: plan.id })}
        >
          <Text style={styles.primaryText}>Open chat</Text>
        </Pressable>
      ) : (
        <Text style={styles.pending}>Request pending host approval</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0f0f10" },
  inner: { padding: 20, paddingBottom: 40 },
  previewRow: { alignItems: "center", marginBottom: 16 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f10",
  },
  muted: { color: "#78716c" },
  title: { fontSize: 24, fontWeight: "700", color: "#faf7f2" },
  host: { fontSize: 14, color: "#a8a29e", marginTop: 8 },
  row: { flexDirection: "row", gap: 8, marginTop: 12 },
  badge: {
    fontSize: 11,
    color: "#fcd34d",
    backgroundColor: "#422006",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
  },
  section: {
    marginTop: 20,
    fontSize: 13,
    fontWeight: "600",
    color: "#78716c",
    textTransform: "uppercase",
  },
  body: { fontSize: 16, color: "#e7e5e4", marginTop: 6, lineHeight: 24 },
  meta: { marginTop: 16, color: "#a8a29e" },
  primary: {
    marginTop: 24,
    backgroundColor: "#ea580c",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  pending: { marginTop: 24, color: "#fcd34d" },
});
