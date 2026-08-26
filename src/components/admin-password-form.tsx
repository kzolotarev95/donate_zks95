"use client";

import type { FormEvent } from "react";
import { useState } from "react";

type Props = {
  className?: string;
};

export function AdminPasswordForm({ className = "" }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setError("");

    const response = await fetch("/api/admin/password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password, confirmPassword }),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };

    if (!response.ok) {
      setError(data.error || "Не удалось сменить пароль");
      setSaving(false);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setNotice(data.message || "Пароль обновлен");
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-white/60">Новый пароль</span>
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-white/60">Повтор пароля</span>
          <input
            className={inputClass}
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
          />
        </label>
      </div>

      {notice ? <p className="text-sm text-emerald-300">{notice}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl border border-white/10 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Сохраняем..." : "Сменить пароль"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-white outline-none transition placeholder:text-white/30 focus:border-emerald-300/60";
