"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

type Tier = {
  label: string;
  amount: number;
  description: string;
};

type Props = {
  tiers: Tier[];
  supportNote: string;
};

export function DonateWidget({ tiers, supportNote }: Props) {
  const [selectedAmount, setSelectedAmount] = useState(String(tiers[0]?.amount ?? 500));
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const activeTier = useMemo(() => {
    const amount = Number(selectedAmount);
    return tiers.find((tier) => tier.amount === amount)?.label ?? "Свободный взнос";
  }, [selectedAmount, tiers]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const response = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(selectedAmount),
        donorName: name.trim(),
        message: message.trim(),
        tier: activeTier,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      confirmationUrl?: string;
    };

    if (!response.ok || !data.confirmationUrl) {
      setError(data.error || "Не удалось создать платёж");
      setBusy(false);
      return;
    }

    window.location.assign(data.confirmationUrl);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[10px] border border-[rgba(212,175,55,.22)] bg-[rgba(10,5,6,.88)] p-4 shadow-[0_30px_90px_rgba(0,0,0,.72)]">
      <div className="space-y-2 text-center">
        <h3 className="text-xl font-extrabold tracking-tight text-[#fff4dd]">❤️ Поддержать разработку</h3>
        <p className="text-sm leading-6 text-white/70">{supportNote}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tiers.map((tier) => {
          const active = Number(selectedAmount) === tier.amount;
          return (
            <button
              key={tier.label}
              type="button"
              onClick={() => setSelectedAmount(String(tier.amount))}
              className={`rounded-[8px] border px-3 py-3 text-left transition ${
                active
                  ? "border-[#d4af37]/70 bg-[rgba(229,9,45,.22)] text-[#fff8ef]"
                  : "border-[rgba(255,255,255,.1)] bg-[rgba(255,255,255,.03)] text-white/80 hover:border-[rgba(212,175,55,.3)] hover:bg-[rgba(212,175,55,.08)]"
              }`}
            >
              <div className="text-sm font-semibold">{tier.label}</div>
              <div className="text-xs opacity-70">{tier.amount.toLocaleString("ru-RU")} ₽</div>
            </button>
          );
        })}
      </div>

      <label className="block space-y-2">
        <span className="text-sm text-white/70">Другая сумма</span>
        <div className="flex items-center gap-2 rounded-[8px] border border-[rgba(255,255,255,.14)] bg-[rgba(255,255,255,.04)] px-4 py-3">
          <input
            className="w-full bg-transparent outline-none placeholder:text-white/30"
            type="number"
            min="1"
            step="1"
            value={selectedAmount}
            onChange={(event) => setSelectedAmount(event.target.value)}
            placeholder="1000"
          />
          <span className="text-white/50">₽</span>
        </div>
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm text-white/70">Имя</span>
          <input
            className="w-full rounded-[8px] border border-[rgba(255,255,255,.14)] bg-[rgba(255,255,255,.04)] px-4 py-3 outline-none transition placeholder:text-white/30 focus:border-[rgba(212,175,55,.45)]"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ваше имя"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-white/70">Сообщение</span>
          <input
            className="w-full rounded-[8px] border border-[rgba(255,255,255,.14)] bg-[rgba(255,255,255,.04)] px-4 py-3 outline-none transition placeholder:text-white/30 focus:border-[rgba(212,175,55,.45)]"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Пара слов поддержки"
          />
        </label>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <button
        className="w-full rounded-[8px] bg-[linear-gradient(135deg,#ff173c_0%,#a1051d_52%,#d4af37_100%)] px-4 py-3 font-extrabold text-white transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={busy}
      >
        {busy ? "Создаем платеж..." : "❤️ Поддержать разработку"}
      </button>
    </form>
  );
}
