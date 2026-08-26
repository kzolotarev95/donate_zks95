"use client";

import type { ReactNode } from "react";
import { useState } from "react";

type FormValues = {
  siteTitle: string;
  siteSubtitle: string;
  introTitle: string;
  introText: string;
  githubUsername: string;
  featuredRepoNames: string;
  supportAmounts: string;
  supportNote: string;
  contactEmail: string;
  telegramUrl: string;
  yookassaShopId: string;
  yookassaSecretKey: string;
  yookassaWebhookSecret: string;
  successPath: string;
  cancelPath: string;
};

type Props = {
  initialValues: FormValues;
  webhookUrl: string;
  paymentsConfigured: boolean;
};

export function AdminSettingsForm({ initialValues, webhookUrl, paymentsConfigured }: Props) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function updateField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setError("");

    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      settings?: FormValues;
      message?: string;
    };

    if (!response.ok) {
      setError(data.error || "Не удалось сохранить настройки");
      setSaving(false);
      return;
    }

    setValues(data.settings ?? values);
    setNotice(data.message || "Настройки сохранены");
    setSaving(false);
  }

  async function copyWebhook() {
    await navigator.clipboard.writeText(webhookUrl);
    setNotice("Webhook URL скопирован");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Название сайта">
          <input className={inputClass} value={values.siteTitle} onChange={(event) => updateField("siteTitle", event.target.value)} />
        </Field>
        <Field label="Подзаголовок">
          <input className={inputClass} value={values.siteSubtitle} onChange={(event) => updateField("siteSubtitle", event.target.value)} />
        </Field>
        <Field label="Hero-заголовок">
          <input className={inputClass} value={values.introTitle} onChange={(event) => updateField("introTitle", event.target.value)} />
        </Field>
        <Field label="О проекте">
          <textarea className={`${inputClass} min-h-[120px]`} value={values.introText} onChange={(event) => updateField("introText", event.target.value)} />
        </Field>
        <Field label="GitHub username">
          <input className={inputClass} value={values.githubUsername} onChange={(event) => updateField("githubUsername", event.target.value)} />
        </Field>
        <Field label="Featured repos">
          <input className={inputClass} value={values.featuredRepoNames} onChange={(event) => updateField("featuredRepoNames", event.target.value)} placeholder="repo-1, repo-2" />
        </Field>
        <Field label="Суммы донатов">
          <input className={inputClass} value={values.supportAmounts} onChange={(event) => updateField("supportAmounts", event.target.value)} placeholder="300, 1000, 2500, 5000" />
        </Field>
        <Field label="Support note">
          <input className={inputClass} value={values.supportNote} onChange={(event) => updateField("supportNote", event.target.value)} />
        </Field>
        <Field label="Email">
          <input className={inputClass} type="email" value={values.contactEmail} onChange={(event) => updateField("contactEmail", event.target.value)} />
        </Field>
        <Field label="Telegram URL">
          <input className={inputClass} value={values.telegramUrl} onChange={(event) => updateField("telegramUrl", event.target.value)} />
        </Field>
        <Field label="Success path">
          <input className={inputClass} value={values.successPath} onChange={(event) => updateField("successPath", event.target.value)} />
        </Field>
        <Field label="Cancel path">
          <input className={inputClass} value={values.cancelPath} onChange={(event) => updateField("cancelPath", event.target.value)} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="YooKassa shop id">
          <input className={inputClass} value={values.yookassaShopId} onChange={(event) => updateField("yookassaShopId", event.target.value)} />
        </Field>
        <Field label="YooKassa secret key">
          <input className={inputClass} value={values.yookassaSecretKey} onChange={(event) => updateField("yookassaSecretKey", event.target.value)} placeholder="Оставьте пустым, чтобы не менять" />
        </Field>
        <Field label="Webhook secret">
          <input className={inputClass} value={values.yookassaWebhookSecret} onChange={(event) => updateField("yookassaWebhookSecret", event.target.value)} placeholder="Необязательно" />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copyWebhook}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/90 transition hover:border-white/20 hover:bg-white/10"
        >
          Скопировать webhook URL
        </button>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${paymentsConfigured ? "bg-emerald-300/15 text-emerald-200" : "bg-amber-300/15 text-amber-200"}`}>
          {paymentsConfigured ? "YooKassa подключена" : "YooKassa не настроена"}
        </span>
      </div>

      {notice ? <p className="text-sm text-emerald-200">{notice}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-2xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Сохраняем..." : "Сохранить настройки"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm text-white/65">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-emerald-300/60";
