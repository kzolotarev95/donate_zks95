import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { loadState, parseSettingsPayload, saveState, settingsToFormValues } from "@/lib/site-state";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = await loadState();
  return NextResponse.json({ settings: settingsToFormValues(state.settings) });
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const state = await loadState();
  const nextSettings = parseSettingsPayload(payload);

  const mergedSettings = {
    ...state.settings,
    ...nextSettings,
    yookassaSecretKey: nextSettings.yookassaSecretKey || state.settings.yookassaSecretKey,
    yookassaWebhookSecret: nextSettings.yookassaWebhookSecret || state.settings.yookassaWebhookSecret,
  };

  await saveState({
    ...state,
    settings: mergedSettings,
  });

  return NextResponse.json({
    message: "Настройки сохранены",
    settings: settingsToFormValues(mergedSettings),
  });
}
