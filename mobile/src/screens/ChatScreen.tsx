import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api/client";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

type Msg = {
  id: string;
  senderId: string | null;
  body: string;
  messageType: string;
  createdAt: string;
};

export function ChatScreen({ route }: Props) {
  const { planId } = route.params;
  const [items, setItems] = useState<Msg[]>([]);
  const [text, setText] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api<{ items: Msg[] }>(
        `/plans/${planId}/chat/messages`,
        { method: "GET" }
      );
      setItems(data.items);
    } catch {
      setItems([]);
    }
  }, [planId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  const send = async () => {
    const b = text.trim();
    if (!b) return;
    setText("");
    try {
      await api(`/plans/${planId}/chat/messages`, {
        method: "POST",
        body: { body: b },
      });
      load();
    } catch {
      setText(b);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={88}
    >
      <FlatList
        data={items}
        keyExtractor={(m) => m.id}
        style={styles.list}
        contentContainerStyle={styles.listInner}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.messageType === "system" && styles.system,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                item.messageType === "system" && styles.systemText,
              ]}
            >
              {item.body}
            </Text>
            <Text style={styles.time}>
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Message"
          placeholderTextColor="#78716c"
        />
        <Pressable style={styles.send} onPress={send}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#0f0f10" },
  list: { flex: 1 },
  listInner: { padding: 16, paddingBottom: 8 },
  bubble: {
    alignSelf: "flex-start",
    maxWidth: "88%",
    backgroundColor: "#1c1c1f",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  system: { alignSelf: "center", backgroundColor: "#292524" },
  bubbleText: { color: "#faf7f2", fontSize: 15 },
  systemText: { color: "#a8a29e", fontSize: 13, textAlign: "center" },
  time: { fontSize: 10, color: "#78716c", marginTop: 4 },
  inputRow: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#292524",
  },
  input: {
    flex: 1,
    backgroundColor: "#1c1c1f",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#faf7f2",
    fontSize: 16,
  },
  send: {
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#ea580c",
    borderRadius: 10,
  },
  sendText: { color: "#fff", fontWeight: "600" },
});
