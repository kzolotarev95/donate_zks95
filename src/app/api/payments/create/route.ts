import { NextRequest, NextResponse } from "next/server";
import { createDonationRecord, loadState, saveState } from "@/lib/site-state";
import { createYooKassaPayment, resolveYooKassaCredentials } from "@/lib/yookassa";

function resolveOrigin(request: NextRequest) {
  const proto = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || request.nextUrl.host;
  return `${proto}://${host}`;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    amount?: number;
    donorName?: string;
    message?: string;
    tier?: string;
  } | null;

  if (!body?.amount || Number.isNaN(Number(body.amount)) || Number(body.amount) <= 0) {
    return NextResponse.json({ error: "Некорректная сумма" }, { status: 400 });
  }

  const state = await loadState();
  const credentials = resolveYooKassaCredentials(state.settings);
  if (!credentials.shopId || !credentials.secretKey) {
    return NextResponse.json({ error: "YooKassa не настроена" }, { status: 400 });
  }

  const origin = resolveOrigin(request);
  const returnUrl = new URL(state.settings.successPath, origin).toString();

  const payment = await createYooKassaPayment({
    shopId: credentials.shopId,
    secretKey: credentials.secretKey,
    amount: Number(body.amount),
    currency: "RUB",
    description: body.tier ? `Support: ${body.tier}` : "Support for open source projects",
    returnUrl,
    metadata: {
      donorName: body.donorName || "Anonymous",
      message: body.message || "",
      tier: body.tier || "",
    },
  }).catch((error: Error) => {
    throw new Error(error.message);
  });

  const confirmationUrl = payment.confirmation?.confirmation_url;
  if (!confirmationUrl) {
    return NextResponse.json({ error: "YooKassa не вернула ссылку оплаты" }, { status: 502 });
  }

  const donation = createDonationRecord({
    paymentId: payment.id,
    amount: Number(body.amount),
    currency: "RUB",
    donorName: body.donorName?.trim() || "Anonymous",
    message: body.message?.trim() || "",
    tier: body.tier?.trim() || "Support",
    status: payment.status === "succeeded" ? "succeeded" : payment.status === "waiting_for_capture" ? "waiting_for_capture" : "pending",
    confirmationUrl,
    rawStatus: payment.status,
  });

  await saveState({
    ...state,
    donations: [donation, ...state.donations],
  });

  return NextResponse.json({
    paymentId: payment.id,
    confirmationUrl,
  });
}
