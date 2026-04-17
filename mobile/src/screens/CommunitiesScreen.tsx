import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useMumbaiCityId } from "../hooks/useMumbaiCityId";

type Row = {
  id: string;
  name: string;
  memberCount: number;
  tags: string[];
};

export function CommunitiesScreen() {
  const { me } = useAuth();
  const cityId = useMumbaiCityId(me?.city?.id);
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Communities</Text>
      {loading && !items.length ? (
        <ActivityIndicator color="#ea580c" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} />
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.meta}>{item.memberCount} members</Text>
              <Text style={styles.tags}>{item.tags.join(" · ")}</Text>
            </Pressable>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f10", paddingTop: 16 },
  h1: {
    fontSize: 22,
    fontWeight: "700",
    color: "#faf7f2",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  list: { padding: 20, paddingBottom: 100 },
  card: {
    backgroundColor: "#1c1c1f",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  title: { fontSize: 17, fontWeight: "600", color: "#faf7f2" },
  meta: { fontSize: 14, color: "#a8a29e", marginTop: 4 },
  tags: { fontSize: 12, color: "#78716c", marginTop: 8 },
});
