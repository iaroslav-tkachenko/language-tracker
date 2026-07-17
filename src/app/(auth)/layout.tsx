import { Clock3 } from "lucide-react";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-slate-50 px-4 py-10">
      <div
        className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-50 to-transparent"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2.5 text-blue-600">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <Clock3 size={22} aria-hidden="true" />
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-950">
            Language Tracker
          </span>
        </div>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}
