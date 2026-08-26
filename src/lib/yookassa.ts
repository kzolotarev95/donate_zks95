import { randomUUID } from "crypto";

export type YooKassaCreatePaymentResult = {
  id: string;
  status: string;
  confirmation?: {
    type: string;
    confirmation_url: string;
  };
};

export type YooKassaPaymentNotification = {
  type?: string;
  event?: string;
  object?: {
    id?: string;
    status?: string;
    amount?: {
      value?: string;
      currency?: string;
    };
    metadata?: Record<string, string | undefined>;
    confirmation?: {
      confirmation_url?: string;
    };
  };
};

export function resolveYooKassaCredentials(settings: {
  yookassaShopId: string;
  yookassaSecretKey: string;
}) {
  return {
    shopId: settings.yookassaShopId || process.env.YOOKASSA_SHOP_ID || "",
    secretKey: settings.yookassaSecretKey || process.env.YOOKASSA_SECRET_KEY || "",
  };
}

export async function createYooKassaPayment(input: {
  shopId: string;
  secretKey: string;
  amount: number;
  currency: string;
  description: string;
  returnUrl: string;
  metadata?: Record<string, string>;
}) {
  const response = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${input.shopId}:${input.secretKey}`).toString("base64")}`,
      "Content-Type": "application/json",
      "Idempotence-Key": randomUUID(),
    },
    body: JSON.stringify({
      amount: {
        value: input.amount.toFixed(2),
        currency: input.currency,
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: input.returnUrl,
      },
      description: input.description,
      metadata: input.metadata ?? {},
    }),
  });

  const data = (await response.json().catch(() => ({}))) as YooKassaCreatePaymentResult & {
    description?: string;
    code?: string;
  };

  if (!response.ok) {
    const message = data.description || data.code || `YooKassa error ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export function getWebhookSecretFromUrl(url: URL) {
  return url.searchParams.get("secret") || "";
}
