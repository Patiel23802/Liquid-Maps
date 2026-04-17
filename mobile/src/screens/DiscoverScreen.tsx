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
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useMumbaiCityId } from "../hooks/useMumbaiCityId";
import type { RootStackParamList } from "../navigation/types";

type Item = {
  id: string;
  title: string;
  locationName: string;
  startTime: string;
  womenOnly?: boolean;
  verifiedOnly?: boolean;
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function DiscoverScreen() {
  const navigation = useNavigation<Nav>();
  const { me } = useAuth();
  const cityId = useMumbaiCityId(me?.city?.id);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!cityId) return;
    try {
      const data = await api<{ items: Item[] }>(
        `/plans?cityId=${cityId}&sort=soonest&limit=30`,
        { method: "GET", auth: false }
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
      <Text style={styles.h1}>Discover</Text>
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
            <Pressable
              style={styles.card}
              onPress={() =>
                navigation.navigate("PlanDetail", { planId: item.id })
              }
            >
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>{item.locationName}</Text>
              <View style={styles.row}>
                {item.verifiedOnly ? (
                  <Text style={styles.tag}>Verified only</Text>
                ) : null}
                {item.womenOnly ? (
                  <Text style={styles.tag}>Women & NB</Text>
                ) : null}
              </View>
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
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
  tag: { fontSize: 11, color: "#93c5fd" },
});
