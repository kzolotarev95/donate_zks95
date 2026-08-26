import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSettingsForm } from "@/components/admin-settings-form";
import { getAdminCookieName, verifySessionToken } from "@/lib/auth";
import { loadState, settingsToFormValues } from "@/lib/site-state";
import { resolveYooKassaCredentials } from "@/lib/yookassa";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get(getAdminCookieName())?.value)) {
    redirect("/admin/login");
  }

  const state = await loadState();
  const settings = settingsToFormValues(state.settings);
  const credentials = resolveYooKassaCredentials(state.settings);
  const webhookUrl = `${process.env.SITE_URL || "http://localhost:3000"}/api/payments/webhook?secret=${encodeURIComponent(
    state.settings.yookassaWebhookSecret || process.env.YOOKASSA_WEBHOOK_SECRET || "",
  )}`;

  const donations = [...state.donations].sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">Admin panel</p>
              <h1 className="mt-3 text-3xl font-semibold text-white">Управление сайтом и донатами</h1>
              <p className="mt-2 text-white/65">Настройки, платежи YooKassa и история поддержек в одном месте.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                Открыть сайт
              </Link>
              <Link href="/api/admin/logout" className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950">
                Выйти
              </Link>
            </div>
          </div>
        </header>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/80 p-6">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <Stat label="Донатов" value={String(donations.length)} />
            <Stat label="YooKassa" value={credentials.shopId ? "Подключена" : "Не настроена"} />
            <Stat label="Webhook" value={state.settings.yookassaWebhookSecret ? "Защищен" : "Без секрета"} />
          </div>
          <AdminSettingsForm
            initialValues={settings}
            webhookUrl={webhookUrl}
            paymentsConfigured={Boolean(credentials.shopId && credentials.secretKey)}
          />
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white">Платежи</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-6 gap-3 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/45">
              <span>Статус</span>
              <span>Сумма</span>
              <span className="col-span-2">Донор</span>
              <span className="col-span-2">ID / Дата</span>
            </div>
            {donations.length ? (
              donations.map((donation) => (
                <div key={donation.id} className="grid grid-cols-6 gap-3 border-t border-white/10 px-4 py-4 text-sm">
                  <span className="capitalize text-emerald-200">{donation.status}</span>
                  <span>{donation.amount.toLocaleString("ru-RU")} ₽</span>
                  <span className="col-span-2 truncate">{donation.donorName}</span>
                  <span className="col-span-2 truncate text-white/60">
                    {donation.paymentId} · {new Date(donation.createdAt).toLocaleString("ru-RU")}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-white/55">Пока платежей нет.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-white/50">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
