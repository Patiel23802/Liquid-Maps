import crypto from "node:crypto";

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function randomToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}
