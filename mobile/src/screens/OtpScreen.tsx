import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Otp">;

const DEV_PREFILL_OTP = __DEV__ ? "424242" : "";

export function OtpScreen({ route }: Props) {
  const { phone } = route.params;
  const { setSession } = useAuth();
  const [code, setCode] = useState(DEV_PREFILL_OTP);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (code.length < 4) {
      setErr("Enter the code");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const data = await api<{
        accessToken: string;
        refreshToken: string;
        user: { onboardingCompleted: boolean };
      }>("/auth/otp/verify", {
        method: "POST",
        body: { phone, code },
        auth: false,
      });
      await setSession(data.accessToken, data.refreshToken);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.sub}>Sent to {phone}</Text>
      {__DEV__ ? (
        <Text style={styles.devHint}>Dev: OTP is 424242</Text>
      ) : null}
      <TextInput
        style={styles.input}
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={8}
        value={code}
        onChangeText={setCode}
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
          <Text style={styles.btnText}>Verify</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#0f0f10" },
  title: { fontSize: 24, fontWeight: "700", color: "#faf7f2", marginBottom: 8 },
  sub: { fontSize: 14, color: "#a8a29e", marginBottom: 8 },
  devHint: { fontSize: 13, color: "#86efac", marginBottom: 16 },
  input: {
    backgroundColor: "#1c1c1f",
    borderRadius: 12,
    padding: 16,
    fontSize: 22,
    letterSpacing: 4,
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
