import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../config";
import {
  clearTokens,
  getAccessToken,
  http,
  setTokens,
} from "./http";

export { getAccessToken, setTokens, clearTokens } from "./http";

const ACCESS_KEY = "@socialise/access";
const REFRESH_KEY = "@socialise/refresh";

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export async function api<T>(
  path: string,
  options: {
    method?: Method;
    body?: unknown;
    auth?: boolean;
  } = {}
): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const url = path.startsWith("/") ? path : `/${path}`;
  try {
    const res = await http.request<{
      data?: T;
      error?: { message?: string; code?: string };
    }>({
      url,
      method,
      data: body,
      skipAuth: auth === false,
    });
    if (res.status >= 400) {
      throw new Error(res.data?.error?.message ?? `HTTP ${res.status}`);
    }
    return res.data.data as T;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const msg =
        (e.response?.data as { error?: { message?: string } })?.error
          ?.message ?? e.message;
      if (!e.response) {
        throw new Error(
          `Cannot reach API (${API_BASE}). Start the backend (npm run dev in /backend). On a physical phone, set EXPO_PUBLIC_API_URL=http://YOUR_MAC_LAN_IP:4000 in mobile/.env`
        );
      }
      throw new Error(msg || `HTTP ${e.response.status}`);
    }
    throw e instanceof Error ? e : new Error("Request failed");
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  const r = await AsyncStorage.getItem(REFRESH_KEY);
  if (!r) return null;
  try {
    const res = await http.post<{
      data: { accessToken: string; expiresIn: number };
    }>("/auth/refresh", { refreshToken: r }, { skipAuth: true });
    if (res.status >= 400 || !res.data.data?.accessToken) {
      await clearTokens();
      return null;
    }
    await AsyncStorage.setItem(ACCESS_KEY, res.data.data.accessToken);
    return res.data.data.accessToken;
  } catch {
    await clearTokens();
    return null;
  }
}
