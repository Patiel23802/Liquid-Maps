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
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { setSession } = useAuth();
  const [email, setEmail] = useState(__DEV__ ? "liquid@demo.app" : "");
  const [password, setPassword] = useState(__DEV__ ? "demo12345" : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!email.includes("@")) {
      setErr("Enter a valid email");
      return;
    }
    if (password.length < 8) {
      setErr("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const data = await api<{
        accessToken: string;
        refreshToken: string;
      }>("/auth/login", {
        method: "POST",
        body: { email: email.trim(), password },
        auth: false,
      });
      await setSession(data.accessToken, data.refreshToken);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={["#0a0514", "#0f0f10"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.card}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Log in with email and password.</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#78716c"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#78716c"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {err ? <Text style={styles.err}>{err}</Text> : null}
        <Pressable
          style={[styles.btn, busy && styles.btnDisabled]}
          onPress={submit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#0f0f10" />
          ) : (
            <Text style={styles.btnText}>Log in</Text>
          )}
        </Pressable>
        <Pressable onPress={() => navigation.navigate("Signup")}>
          <Text style={styles.link}>Need an account? Sign up</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("Phone")}>
          <Text style={styles.linkMuted}>Use phone OTP instead</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f0f10", justifyContent: "center" },
  card: {
    marginHorizontal: 22,
    padding: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(13,13,24,0.72)",
  },
  title: { fontSize: 26, fontWeight: "900", color: "#f5f5ff" },
  sub: { marginTop: 8, fontSize: 14, color: "#a8a29e", marginBottom: 18 },
  input: {
    backgroundColor: "rgba(2,6,23,0.55)",
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: "#faf7f2",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  err: { color: "#fca5a5", marginBottom: 10, fontSize: 13 },
  btn: {
    marginTop: 6,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    backgroundColor: "#67e8f9",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#0f0f10", fontSize: 16, fontWeight: "900" },
  link: {
    marginTop: 18,
    textAlign: "center",
    color: "#f5d0fe",
    fontWeight: "800",
    fontSize: 14,
  },
  linkMuted: {
    marginTop: 12,
    textAlign: "center",
    color: "#78716c",
    fontSize: 13,
    fontWeight: "600",
  },
});
