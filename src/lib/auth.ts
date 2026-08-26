import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { defaultSettings } from "./site-state";
import { getAdminPassword } from "./admin-password";

const COOKIE_NAME = "dz_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || "dev-admin-session-secret";
}

export async function isAdminPassword(input: string) {
  return input === (await getAdminPassword());
}

export function createSessionToken(now = Date.now()) {
  const timestamp = String(now);
  const signature = createHmac("sha256", getSecret()).update(timestamp).digest("hex");
  return `${timestamp}.${signature}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) {
    return false;
  }

  const [timestamp, signature] = token.split(".");
  if (!timestamp || !signature) {
    return false;
  }

  const expected = createHmac("sha256", getSecret()).update(timestamp).digest("hex");

  try {
    const provided = Buffer.from(signature, "hex");
    const target = Buffer.from(expected, "hex");
    if (provided.length !== target.length || !timingSafeEqual(provided, target)) {
      return false;
    }
  } catch {
    return false;
  }

  const issuedAt = Number(timestamp);
  if (!Number.isFinite(issuedAt)) {
    return false;
  }

  return Date.now() - issuedAt < SESSION_TTL_MS;
}

export function isAdminRequest(request: NextRequest) {
  return verifySessionToken(request.cookies.get(COOKIE_NAME)?.value);
}

export function getAdminCookieName() {
  return COOKIE_NAME;
}

export function getAdminSessionCookieOptions(isSecure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecure,
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}

export function isSecureRequest(request: NextRequest) {
  return request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
}

export function getDefaultAdminPasswordHint() {
  return defaultSettings.githubUsername;
}
