import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getAdminCookieName, verifySessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  if (verifySessionToken(cookieStore.get(getAdminCookieName())?.value)) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_40px_120px_rgba(0,0,0,.35)] backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">Admin</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">Вход в панель</h1>
        <p className="mt-3 text-white/65">Пароль задается через `ADMIN_PASSWORD` или в первом запуске.</p>
        <div className="mt-6">
          <AdminLoginForm />
        </div>
        <div className="mt-6 text-sm text-white/45">
          <Link href="/" className="text-emerald-200">
            Назад на сайт
          </Link>
        </div>
      </div>
    </main>
  );
}
