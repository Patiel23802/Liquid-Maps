import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../config";

declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

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

export const http = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  timeout: 25_000,
  headers: { "Content-Type": "application/json" },
  validateStatus: (s) => s < 500,
});

http.interceptors.request.use(async (config) => {
  if (!config.skipAuth) {
    const t = await getAccessToken();
    if (t) {
      config.headers.set("Authorization", `Bearer ${t}`);
    }
  }
  return config;
});
