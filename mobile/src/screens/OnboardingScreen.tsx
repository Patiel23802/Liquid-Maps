import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function OnboardingScreen() {
  const { refreshMe, me } = useAuth();
  const navigation = useNavigation();
  const [name, setName] = useState(me?.name ?? "");
  const [username, setUsername] = useState(me?.username ?? "");
  const [cityId, setCityId] = useState<string | null>(me?.city?.id ?? null);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await api<{ id: string; name: string }[]>("/cities", {
          auth: false,
        });
        setCities(list);
        if (!cityId && list.length) {
          const m = list.find((c) => c.name.toLowerCase().includes("mumbai"));
          setCityId(m?.id ?? list[0]!.id);
        }
      } catch {
        /* ignore */
      }
    })();
  }, [cityId]);

  const save = async () => {
    setBusy(true);
    try {
      await api("/me", {
        method: "PATCH",
        body: {
          name: name.trim() || "Member",
          username: username.trim().replace(/\s/g, "_"),
          cityId,
        },
      });
      await api("/me/onboarding/complete", { method: "PATCH", body: {} });
      await refreshMe();
      navigation.goBack();
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.inner}>
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor="#78716c"
      />
      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholder="unique_username"
        placeholderTextColor="#78716c"
      />
      <Text style={styles.label}>City</Text>
      <View style={styles.chips}>
        {cities.map((c) => (
          <Pressable
            key={c.id}
            style={[styles.chip, cityId === c.id && styles.chipOn]}
            onPress={() => setCityId(c.id)}
          >
            <Text
              style={[styles.chipText, cityId === c.id && styles.chipTextOn]}
            >
              {c.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        style={[styles.btn, busy && { opacity: 0.6 }]}
        onPress={save}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Save & continue</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0f0f10" },
  inner: { padding: 20, paddingBottom: 40 },
  label: { color: "#a8a29e", marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: "#1c1c1f",
    borderRadius: 10,
    padding: 14,
    color: "#faf7f2",
    fontSize: 16,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#44403c",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipOn: { backgroundColor: "#ea580c", borderColor: "#ea580c" },
  chipText: { color: "#a8a29e" },
  chipTextOn: { color: "#fff", fontWeight: "600" },
  btn: {
    marginTop: 28,
    backgroundColor: "#ea580c",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
