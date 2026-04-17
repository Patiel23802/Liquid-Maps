import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useMumbaiCityId } from "../hooks/useMumbaiCityId";

type Cat = { id: number; name: string; slug: string };
type Vibe = { id: number; name: string; slug: string };

export function CreatePlanScreen() {
  const navigation = useNavigation();
  const { me } = useAuth();
  const cityId = useMumbaiCityId(me?.city?.id);
  const [categories, setCategories] = useState<Cat[]>([]);
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [title, setTitle] = useState("");
  const [locationName, setLocationName] = useState("");
  const [lat, setLat] = useState("19.076");
  const [lng, setLng] = useState("72.8777");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [vibeId, setVibeId] = useState<number | null>(null);
  const [maxP, setMaxP] = useState("8");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [c, v] = await Promise.all([
          api<Cat[]>("/categories", { auth: false }),
          api<Vibe[]>("/vibes", { auth: false }),
        ]);
        setCategories(c);
        setVibes(v);
        if (c[0]) setCategoryId(c[0].id);
        if (v[0]) setVibeId(v[0].id);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const publish = async () => {
    if (!cityId || categoryId == null || vibeId == null) {
      Alert.alert("Missing info", "Pick city, category, and vibe.");
      return;
    }
    const start = new Date(Date.now() + 60 * 60 * 1000);
    setBusy(true);
    try {
      await api("/plans", {
        method: "POST",
        body: {
          title: title.trim() || "Hangout",
          description: "",
          categoryId,
          vibeId,
          cityId,
          locationName: locationName.trim() || "TBD — message in chat",
          lat: parseFloat(lat) || 19.076,
          lng: parseFloat(lng) || 72.8777,
          startTime: start.toISOString(),
          maxParticipants: Math.min(500, Math.max(2, parseInt(maxP, 10) || 8)),
          joinType: "open",
          visibility: "public",
        },
      });
      Alert.alert("Published", "Your plan is live.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.inner}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Chai at Carter Road"
        placeholderTextColor="#78716c"
      />
      <Text style={styles.label}>Place name</Text>
      <TextInput
        style={styles.input}
        value={locationName}
        onChangeText={setLocationName}
        placeholderTextColor="#78716c"
      />
      <Text style={styles.label}>Category</Text>
      <View style={styles.chips}>
        {categories.map((c) => (
          <Pressable
            key={c.id}
            style={[styles.chip, categoryId === c.id && styles.chipOn]}
            onPress={() => setCategoryId(c.id)}
          >
            <Text
              style={[styles.chipText, categoryId === c.id && styles.chipTextOn]}
            >
              {c.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Vibe</Text>
      <View style={styles.chips}>
        {vibes.map((v) => (
          <Pressable
            key={v.id}
            style={[styles.chip, vibeId === v.id && styles.chipOn]}
            onPress={() => setVibeId(v.id)}
          >
            <Text style={[styles.chipText, vibeId === v.id && styles.chipTextOn]}>
              {v.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Max people</Text>
      <TextInput
        style={styles.input}
        value={maxP}
        onChangeText={setMaxP}
        keyboardType="number-pad"
        placeholderTextColor="#78716c"
      />
      <Text style={styles.hint}>Starts in ~1 hour (MVP). Map pin: lat/lng</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.half]}
          value={lat}
          onChangeText={setLat}
          placeholderTextColor="#78716c"
        />
        <TextInput
          style={[styles.input, styles.half]}
          value={lng}
          onChangeText={setLng}
          placeholderTextColor="#78716c"
        />
      </View>
      <Pressable
        style={[styles.btn, busy && { opacity: 0.6 }]}
        onPress={publish}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Publish plan</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0f0f10" },
  inner: { padding: 20, paddingBottom: 40 },
  label: { color: "#a8a29e", marginBottom: 8, marginTop: 12 },
  hint: { color: "#78716c", fontSize: 12, marginTop: 8 },
  input: {
    backgroundColor: "#1c1c1f",
    borderRadius: 10,
    padding: 14,
    color: "#faf7f2",
    fontSize: 16,
  },
  row: { flexDirection: "row", gap: 8 },
  half: { flex: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#44403c",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipOn: { backgroundColor: "#ea580c", borderColor: "#ea580c" },
  chipText: { color: "#a8a29e", fontSize: 13 },
  chipTextOn: { color: "#fff", fontWeight: "600" },
  btn: {
    marginTop: 24,
    backgroundColor: "#ea580c",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
