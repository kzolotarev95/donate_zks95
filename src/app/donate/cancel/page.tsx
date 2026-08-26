import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="min-h-screen px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-200">Оплата не завершена</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Можно попробовать еще раз</h1>
        <p className="mt-4 text-white/70">Если это была ошибка, просто вернитесь на главную и повторите платёж.</p>
        <Link href="/" className="mt-8 inline-flex rounded-full bg-white px-5 py-3 font-semibold text-slate-950">
          На главную
        </Link>
      </div>
    </main>
  );
}
