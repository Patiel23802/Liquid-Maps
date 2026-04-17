import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../config";

const ACCESS = "@socialise/access";
const REFRESH = "@socialise/refresh";

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS);
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  await AsyncStorage.multiSet([
    [ACCESS, access],
    [REFRESH, refresh],
  ]);
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([ACCESS, REFRESH]);
}

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
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (auth) {
    const t = await getAccessToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/v1${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      `Cannot reach API (${API_BASE}). Start the backend (npm run dev in /backend). On a physical phone, set EXPO_PUBLIC_API_URL=http://YOUR_MAC_LAN_IP:4000 in mobile/.env`
    );
  }
  const json = (await res.json()) as {
    data?: T;
    error?: { message?: string; code?: string };
  };
  if (!res.ok) {
    throw new Error(json.error?.message ?? `HTTP ${res.status}`);
  }
  return json.data as T;
}

export async function refreshAccessToken(): Promise<string | null> {
  const r = await AsyncStorage.getItem(REFRESH);
  if (!r) return null;
  try {
    const data = await api<{ accessToken: string; expiresIn: number }>(
      "/auth/refresh",
      { method: "POST", body: { refreshToken: r }, auth: false }
    );
    await AsyncStorage.setItem(ACCESS, data.accessToken);
    return data.accessToken;
  } catch {
    await clearTokens();
    return null;
  }
}
