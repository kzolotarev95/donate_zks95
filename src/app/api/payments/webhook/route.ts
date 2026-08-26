import { NextRequest, NextResponse } from "next/server";
import { loadState, saveState } from "@/lib/site-state";
import { getWebhookSecretFromUrl } from "@/lib/yookassa";

type YooKassaBody = {
  event?: string;
  object?: {
    id?: string;
    status?: string;
    amount?: {
      currency?: string;
      value?: string;
    };
    metadata?: Record<string, string | undefined>;
  };
};

export async function POST(request: NextRequest) {
  const state = await loadState();
  const urlSecret = getWebhookSecretFromUrl(request.nextUrl);
  const configuredSecret = state.settings.yookassaWebhookSecret || process.env.YOOKASSA_WEBHOOK_SECRET || "";

  if (configuredSecret && urlSecret !== configuredSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as YooKassaBody | null;
  const paymentId = payload?.object?.id;
  const status = payload?.object?.status || payload?.event?.split(".").at(-1) || "pending";

  if (!paymentId) {
    return NextResponse.json({ ok: true });
  }

  const donations = state.donations.map((donation) => {
    if (donation.paymentId !== paymentId) {
      return donation;
    }

    return {
      ...donation,
      status: mapStatus(status),
      rawStatus: status,
      updatedAt: new Date().toISOString(),
    };
  });

  await saveState({
    ...state,
    donations,
  });

  return NextResponse.json({ ok: true });
}

function mapStatus(status: string): "pending" | "succeeded" | "canceled" | "waiting_for_capture" {
  if (status === "succeeded") {
    return "succeeded";
  }

  if (status === "waiting_for_capture") {
    return "waiting_for_capture";
  }

  if (status === "canceled") {
    return "canceled";
  }

  return "pending";
}
