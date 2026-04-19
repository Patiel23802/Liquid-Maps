import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#0a0514", "#0f0f10", "#051a1f"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glowPurple} />
      <View style={styles.glowCyan} />
      <View style={styles.content}>
        <Text style={styles.kicker}>Meet the city</Text>
        <Text style={styles.title}>Liquid Map</Text>
        <Text style={styles.sub}>
          Plans, people, and social spots — mapped in real time. Dark mode,
          glass cards, zero noise.
        </Text>
        <Pressable
          style={styles.primary}
          onPress={() => navigation.navigate("Signup")}
        >
          <Text style={styles.primaryText}>Create account</Text>
        </Pressable>
        <Pressable
          style={styles.secondary}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.secondaryText}>Log in</Text>
        </Pressable>
        <Pressable
          style={styles.ghost}
          onPress={() => navigation.navigate("Phone")}
        >
          <Text style={styles.ghostText}>Continue with phone OTP</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f0f10" },
  glowPurple: {
    position: "absolute",
    top: "12%",
    left: "-20%",
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: "rgba(240,132,255,0.22)",
  },
  glowCyan: {
    position: "absolute",
    bottom: "8%",
    right: "-25%",
    width: 340,
    height: 340,
    borderRadius: 999,
    backgroundColor: "rgba(0,227,253,0.16)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 120,
    justifyContent: "flex-start",
  },
  kicker: {
    color: "rgba(171,169,185,0.95)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 10,
    fontSize: 42,
    fontWeight: "900",
    color: "#f5f5ff",
    letterSpacing: -1.2,
  },
  sub: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(200,198,214,0.92)",
    maxWidth: 360,
  },
  primary: {
    marginTop: 36,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "rgba(240,132,255,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  primaryText: { color: "#120616", fontSize: 16, fontWeight: "900" },
  secondary: {
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "rgba(34,211,238,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
  },
  secondaryText: { color: "#67e8f9", fontSize: 16, fontWeight: "800" },
  ghost: { marginTop: 18, paddingVertical: 12, alignItems: "center" },
  ghostText: { color: "rgba(171,169,185,0.95)", fontSize: 14, fontWeight: "700" },
});
