import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "EditProfile">;

type Interest = { id: number; slug: string; name: string };

export function EditProfileScreen({ navigation }: Props) {
  const { me, refreshMe } = useAuth();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [tagline, setTagline] = useState("");
  const [catalog, setCatalog] = useState<Interest[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (me) {
      setName(me.name);
      setBio(me.bio ?? "");
      setTagline(me.discoveryTagline ?? "");
      setPicked(me.interestIds ?? []);
    }
  }, [me]);

  useEffect(() => {
    (async () => {
      try {
        const rows = await api<Interest[]>("/interests", { auth: false });
        setCatalog(rows);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const toggle = (id: number) => {
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const save = async () => {
    setBusy(true);
    try {
      await api("/users/me", {
        method: "PUT",
        body: {
          name: name.trim(),
          bio: bio.trim() || null,
          discoveryTagline: tagline.trim() || null,
          interestIds: picked,
        },
      });
      await refreshMe();
      navigation.goBack();
    } finally {
      setBusy(false);
    }
  };

  if (!me) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#67e8f9" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.inner}>
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={bio}
        onChangeText={setBio}
        multiline
      />
      <Text style={styles.label}>Status line</Text>
      <TextInput
        style={styles.input}
        value={tagline}
        onChangeText={setTagline}
        placeholder="e.g. Looking for a football group"
        placeholderTextColor="#57534e"
      />
      <Text style={styles.label}>Interests</Text>
      <View style={styles.chips}>
        {catalog.map((c) => {
          const on = picked.includes(c.id);
          return (
            <Pressable key={c.id} onPress={() => toggle(c.id)}>
              <BlurView
                intensity={on ? 36 : 18}
                tint="dark"
                style={[styles.chip, on ? styles.chipOn : null]}
              >
                <Text style={[styles.chipText, on ? styles.chipTextOn : null]}>
                  {c.name}
                </Text>
              </BlurView>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        style={[styles.save, busy && styles.saveDisabled]}
        onPress={save}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#0f0f10" />
        ) : (
          <Text style={styles.saveText}>Save profile</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f0f10" },
  inner: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, justifyContent: "center", backgroundColor: "#0f0f10" },
  label: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: "rgba(171,169,185,0.95)",
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "rgba(13,13,24,0.85)",
    borderRadius: 14,
    padding: 14,
    color: "#faf7f2",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  multiline: { minHeight: 100, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  chipOn: {
    borderColor: "rgba(240,132,255,0.45)",
    backgroundColor: "rgba(240,132,255,0.15)",
  },
  chipText: { color: "#a8a29e", fontWeight: "800", fontSize: 12 },
  chipTextOn: { color: "#f5d0fe" },
  save: {
    marginTop: 28,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "#67e8f9",
  },
  saveDisabled: { opacity: 0.6 },
  saveText: { color: "#0f0f10", fontWeight: "900", fontSize: 16 },
});
