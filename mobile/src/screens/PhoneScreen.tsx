import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api/client";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Phone">;

/** Matches backend DEV_TEST_PHONE (+919999000099) when you enter 10 digits without +91. */
const DEV_PREFILL_PHONE = __DEV__ ? "9999000099" : "";

export function PhoneScreen({ navigation }: Props) {
  const [phone, setPhone] = useState(DEV_PREFILL_PHONE);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    const normalized = phone.replace(/\s/g, "");
    if (normalized.length < 10) {
      setErr("Enter a valid phone number");
      return;
    }
    const full = normalized.startsWith("+") ? normalized : `+91${normalized}`;
    setBusy(true);
    setErr(null);
    try {
      await api("/auth/otp/send", {
        method: "POST",
        body: { phone: full },
        auth: false,
      });
      navigation.navigate("Otp", { phone: full });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Socialise</Text>
      <Text style={styles.sub}>
        Real-world plans nearby — not dating, just people doing things.
      </Text>
      {__DEV__ ? (
        <Text style={styles.devHint}>
          Dev test: 9999000099 → OTP 424242
        </Text>
      ) : null}
      <TextInput
        style={styles.input}
        placeholder="Phone (e.g. 9876543210)"
        keyboardType="phone-pad"
        autoComplete="tel"
        value={phone}
        onChangeText={setPhone}
      />
      {err ? <Text style={styles.err}>{err}</Text> : null}
      <Pressable
        style={[styles.btn, busy && styles.btnDisabled]}
        onPress={submit}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Send OTP</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#0f0f10" },
  title: { fontSize: 36, fontWeight: "700", color: "#faf7f2", marginBottom: 8 },
  sub: { fontSize: 15, color: "#a8a29e", marginBottom: 32, lineHeight: 22 },
  devHint: {
    fontSize: 13,
    color: "#86efac",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#1c1c1f",
    borderRadius: 12,
    padding: 16,
    fontSize: 17,
    color: "#faf7f2",
    marginBottom: 12,
  },
  err: { color: "#f87171", marginBottom: 8 },
  btn: {
    backgroundColor: "#ea580c",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "600" },
});
