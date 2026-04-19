import React from "react";
import { View, StyleSheet } from "react-native";

/** Tab hub: navigation to CreatePlan is handled in MainTabs listeners. */
export function CreateTabScreen() {
  return <View style={styles.root} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f0f10" },
});
