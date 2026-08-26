import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSettingsForm } from "@/components/admin-settings-form";
import { AdminPasswordForm } from "@/components/admin-password-form";
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
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/45">Admin</p>
            <h1 className="mt-2 text-2xl font-semibold">Панель управления</h1>
            <p className="mt-1 text-sm text-white/50">Настройки сайта, YooKassa и донаты.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/80">
              Сайт
            </Link>
            <Link href="/api/admin/logout" className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950">
              Выйти
            </Link>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Донатов" value={String(donations.length)} />
          <Stat label="YooKassa" value={credentials.shopId ? "Подключена" : "Не настроена"} />
          <Stat label="Webhook" value={state.settings.yookassaWebhookSecret ? "Есть" : "Нет"} />
        </div>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <h2 className="text-lg font-semibold">Настройки сайта</h2>
            <p className="mt-1 text-sm text-white/45">Главные поля и YooKassa.</p>
            <div className="mt-4">
              <AdminSettingsForm
                initialValues={settings}
                webhookUrl={webhookUrl}
                paymentsConfigured={Boolean(credentials.shopId && credentials.secretKey)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <h2 className="text-lg font-semibold">Смена пароля</h2>
              <p className="mt-1 text-sm text-white/45">Новый пароль начнет работать сразу.</p>
              <div className="mt-4">
                <AdminPasswordForm />
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <h2 className="text-lg font-semibold">Webhook</h2>
              <p className="mt-1 break-all text-sm text-white/55">{webhookUrl}</p>
            </section>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-lg font-semibold">Платежи</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
            <div className="grid grid-cols-12 gap-3 bg-white/[0.04] px-4 py-3 text-xs uppercase tracking-[0.18em] text-white/40">
              <span className="col-span-2">Статус</span>
              <span className="col-span-2">Сумма</span>
              <span className="col-span-4">Донор</span>
              <span className="col-span-4">ID / Дата</span>
            </div>
            {donations.length ? (
              donations.map((donation) => (
                <div key={donation.id} className="grid grid-cols-12 gap-3 border-t border-white/10 px-4 py-3 text-sm">
                  <span className="col-span-2 capitalize text-emerald-200">{donation.status}</span>
                  <span className="col-span-2">{donation.amount.toLocaleString("ru-RU")} ₽</span>
                  <span className="col-span-4 truncate">{donation.donorName}</span>
                  <span className="col-span-4 truncate text-white/55">
                    {donation.paymentId} · {new Date(donation.createdAt).toLocaleString("ru-RU")}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-sm text-white/45">Пока платежей нет.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/40">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
