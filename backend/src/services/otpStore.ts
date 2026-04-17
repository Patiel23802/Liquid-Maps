import { env } from "../config/env.js";

type Entry = { code: string; expiresAt: number };

const store = new Map<string, Entry>();

/** Dev-only: use this number + OTP in the app (E.164). Not evaluated in production. */
export const DEV_TEST_PHONE = "+919999000099";
export const DEV_TEST_OTP = "424242";

function normalizePhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (phone.trim().startsWith("+")) return `+${digits}`;
  return phone.trim();
}

export function setOtp(phone: string, code: string, ttlMs: number): void {
  store.set(phone, { code, expiresAt: Date.now() + ttlMs });
}

export function verifyOtp(phone: string, code: string): boolean {
  if (env.NODE_ENV === "development") {
    if (
      normalizePhoneE164(phone) === DEV_TEST_PHONE &&
      code === DEV_TEST_OTP
    ) {
      return true;
    }
  }
  if (env.DEV_OTP_SKIP) return true;
  if (env.DEV_OTP_CODE && code === env.DEV_OTP_CODE) return true;
  const e = store.get(phone);
  if (!e || Date.now() > e.expiresAt) return false;
  if (e.code !== code) return false;
  store.delete(phone);
  return true;
}

export function peekOtpForDev(phone: string): string | undefined {
  if (env.NODE_ENV !== "development") return undefined;
  return store.get(phone)?.code;
}
