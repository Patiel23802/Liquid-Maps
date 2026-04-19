import React, { useCallback, useState } from "react";
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
import { api } from "../api/client";

type Row = {
  id: string;
  title: string;
  body: string | null;
  createdAt: string;
  readAt: string | null;
};

export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<Row[]>("/notifications");
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const seed = async () => {
    try {
      const data = await api<Row[]>("/notifications/seed", { method: "POST" });
      setItems(data);
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <BlurView intensity={32} tint="dark" style={styles.headerInner}>
          <Text style={styles.h1}>Notifications</Text>
          <Pressable onPress={seed} style={styles.seed}>
            <Text style={styles.seedText}>Load demo alerts</Text>
          </Pressable>
        </BlurView>
      </View>
      {loading && !items.length ? (
        <ActivityIndicator color="#67e8f9" style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 96 + Math.max(insets.top, 12),
            paddingBottom: 120,
          }}
          data={items}
          keyExtractor={(i) => i.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} />
          }
          renderItem={({ item }) => (
            <BlurView intensity={24} tint="dark" style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
              <Text style={styles.time}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  h1: { fontSize: 22, fontWeight: "900", color: "#f5f5ff" },
  seed: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(34,211,238,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.28)",
  },
  seedText: { color: "#67e8f9", fontWeight: "900", fontSize: 12 },
  card: {
    marginBottom: 12,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  title: { fontSize: 16, fontWeight: "900", color: "#f5d0fe" },
  body: { marginTop: 6, fontSize: 14, color: "rgba(233,230,247,0.9)" },
  time: { marginTop: 10, fontSize: 11, color: "#78716c", fontWeight: "700" },
});
