import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getAdminCookieName,
  getAdminSessionCookieOptions,
  isAdminPassword,
  isSecureRequest,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!body?.password || !(await isAdminPassword(body.password))) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getAdminCookieName(), createSessionToken(), getAdminSessionCookieOptions(isSecureRequest(request)));
  return response;
}
