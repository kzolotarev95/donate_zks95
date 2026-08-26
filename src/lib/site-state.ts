import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type SupportTier = {
  label: string;
  amount: number;
  description: string;
};

export type SiteSettings = {
  siteTitle: string;
  siteSubtitle: string;
  introTitle: string;
  introText: string;
  githubUsername: string;
  featuredRepoNames: string[];
  supportAmounts: number[];
  supportNote: string;
  contactEmail: string;
  telegramUrl: string;
  yookassaShopId: string;
  yookassaSecretKey: string;
  yookassaWebhookSecret: string;
  successPath: string;
  cancelPath: string;
};

export type DonationRecord = {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  donorName: string;
  message: string;
  tier: string;
  status: "pending" | "succeeded" | "canceled" | "waiting_for_capture";
  confirmationUrl: string;
  createdAt: string;
  updatedAt: string;
  rawStatus?: string;
};

export type AppState = {
  settings: SiteSettings;
  donations: DonationRecord[];
  updatedAt: string;
};

export const SUPPORT_TIER_PRESETS: Omit<SupportTier, "amount">[] = [
  {
    label: "Кофе",
    description: "Небольшой импульс на быстрые фиксы и идеи.",
  },
  {
    label: "Инструменты",
    description: "На сервисы, сборки, тесты и время на open source.",
  },
  {
    label: "Сервер",
    description: "На инфраструктуру, домены и стабильные релизы.",
  },
  {
    label: "Партнерство",
    description: "На более крупные фичи и поддержку новых проектов.",
  },
  {
    label: "Меценат",
    description: "На большие релизы, refactor и полноценные фичи.",
  },
];

const statePath = path.join(process.cwd(), ".data", "site-state.json");

export const defaultSettings: SiteSettings = {
  siteTitle: "Konstantin Zolotarev",
  siteSubtitle: "Open Source Developer / Projects / Support",
  introTitle: "Разрабатываю модули OpenWrt, которые удобно ставить и поддерживать.",
  introText:
    "Разрабатываю LuCI-приложения, shell-агенты, Telegram-автоматизацию и интерфейсы для роутеров. Фокус: понятная установка, рабочие сценарии и минимум ручной возни.",
  githubUsername: "kzolotarev95",
  featuredRepoNames: [
    "luci-app-sub-sync666",
    "podkop-telegram-agent",
    "luci-theme-protobyzks95",
    "luci-app-max-tg-most",
    "luci-app-owrt-full-backup",
    "luci-app-owrt-remote",
  ],
  supportAmounts: [500, 1500, 3000, 5000, 10000],
  supportNote:
    "Если мои Open Source проекты оказались полезны — поддержите их развитие.",
  contactEmail: "kzolotarev95@developer.li",
  telegramUrl: "https://t.me/kzolotarev95",
  yookassaShopId: "",
  yookassaSecretKey: "",
  yookassaWebhookSecret: "",
  successPath: "/donate/success",
  cancelPath: "/donate/cancel",
};

export async function loadState(): Promise<AppState> {
  try {
    const raw = await readFile(statePath, "utf8");
    const parsed = JSON.parse(raw) as AppState;
    return {
      settings: {
        ...defaultSettings,
        ...parsed.settings,
        featuredRepoNames: normalizeList(parsed.settings?.featuredRepoNames ?? defaultSettings.featuredRepoNames),
        supportAmounts: normalizeAmounts(parsed.settings?.supportAmounts ?? defaultSettings.supportAmounts),
      },
      donations: Array.isArray(parsed.donations) ? parsed.donations : [],
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    const state: AppState = {
      settings: defaultSettings,
      donations: [],
      updatedAt: new Date().toISOString(),
    };
    await saveState(state).catch(() => undefined);
    return state;
  }
}

export async function saveState(state: AppState): Promise<void> {
  await mkdir(path.dirname(statePath), { recursive: true });
  const snapshot: AppState = {
    ...state,
    settings: {
      ...state.settings,
      featuredRepoNames: normalizeList(state.settings.featuredRepoNames),
      supportAmounts: normalizeAmounts(state.settings.supportAmounts),
    },
    updatedAt: new Date().toISOString(),
  };
  await writeFile(statePath, JSON.stringify(snapshot, null, 2), "utf8");
}

export function sanitizeSettingsForClient(settings: SiteSettings) {
  return {
    ...settings,
    yookassaSecretKey: "",
    yookassaWebhookSecret: "",
  };
}

export function settingsToFormValues(settings: SiteSettings) {
  return {
    ...sanitizeSettingsForClient(settings),
    featuredRepoNames: settings.featuredRepoNames.join(", "),
    supportAmounts: settings.supportAmounts.join(", "),
  };
}

export function buildSupportTiers(settings: SiteSettings): SupportTier[] {
  return SUPPORT_TIER_PRESETS.map((tier, index) => ({
    ...tier,
    amount: settings.supportAmounts[index] ?? settings.supportAmounts.at(-1) ?? defaultSettings.supportAmounts[index] ?? 1000,
  }));
}

export function normalizeList(value: string[] | string): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeAmounts(value: number[] | string): number[] {
  if (Array.isArray(value)) {
    return value.map((item) => Number(item)).filter((item) => Number.isFinite(item) && item > 0);
  }

  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
}

export function parseSettingsPayload(input: Record<string, unknown>): SiteSettings {
  return {
    siteTitle: stringValue(input.siteTitle, defaultSettings.siteTitle),
    siteSubtitle: stringValue(input.siteSubtitle, defaultSettings.siteSubtitle),
    introTitle: stringValue(input.introTitle, defaultSettings.introTitle),
    introText: stringValue(input.introText, defaultSettings.introText),
    githubUsername: stringValue(input.githubUsername, defaultSettings.githubUsername),
    featuredRepoNames: normalizeList(stringValue(input.featuredRepoNames, defaultSettings.featuredRepoNames.join(", "))),
    supportAmounts: normalizeAmounts(stringValue(input.supportAmounts, defaultSettings.supportAmounts.join(", "))),
    supportNote: stringValue(input.supportNote, defaultSettings.supportNote),
    contactEmail: stringValue(input.contactEmail, defaultSettings.contactEmail),
    telegramUrl: stringValue(input.telegramUrl, defaultSettings.telegramUrl),
    yookassaShopId: stringValue(input.yookassaShopId, ""),
    yookassaSecretKey: stringValue(input.yookassaSecretKey, ""),
    yookassaWebhookSecret: stringValue(input.yookassaWebhookSecret, ""),
    successPath: normalizePath(stringValue(input.successPath, defaultSettings.successPath)),
    cancelPath: normalizePath(stringValue(input.cancelPath, defaultSettings.cancelPath)),
  };
}

export function createDonationRecord(input: {
  paymentId: string;
  amount: number;
  currency: string;
  donorName: string;
  message: string;
  tier: string;
  status: DonationRecord["status"];
  confirmationUrl: string;
  rawStatus?: string;
}): DonationRecord {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    paymentId: input.paymentId,
    amount: input.amount,
    currency: input.currency,
    donorName: input.donorName,
    message: input.message,
    tier: input.tier,
    status: input.status,
    confirmationUrl: input.confirmationUrl,
    createdAt: now,
    updatedAt: now,
    rawStatus: input.rawStatus,
  };
}

function stringValue(value: unknown, fallback: string): string {
  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  return fallback;
}

function normalizePath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "/";
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
