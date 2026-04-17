import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Metro and the API should run on the same machine. Expo Go exposes the dev server
 * host so we can call the backend on that LAN IP (physical devices cannot use localhost).
 */
function lanHostFromExpo(): string | undefined {
  const uri = Constants.expoConfig?.hostUri;
  if (uri && typeof uri === "string") {
    const host = uri.includes(":") ? uri.split(":")[0]! : uri;
    if (host && host !== "127.0.0.1" && host !== "localhost") return host;
  }
  const dbg = (
    Constants.expoGoConfig as { debuggerHost?: string } | null
  )?.debuggerHost;
  if (dbg && typeof dbg === "string") {
    const host = dbg.includes(":") ? dbg.split(":")[0]! : dbg;
    if (host && host !== "127.0.0.1" && host !== "localhost") return host;
  }
  return undefined;
}

/**
 * 1) EXPO_PUBLIC_API_URL in .env (set on real devices if auto-detection fails)
 * 2) Dev: same host as Metro (works for Expo Go on Wi‑Fi)
 * 3) Android emulator → 10.0.2.2; iOS simulator → localhost
 */
export const API_BASE: string = (() => {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (__DEV__) {
    const host = lanHostFromExpo();
    if (host && host !== "localhost") {
      return `http://${host}:4000`;
    }
  }

  return (
    Platform.select({
      android: "http://10.0.2.2:4000",
      default: "http://localhost:4000",
    }) ?? "http://localhost:4000"
  );
})();
