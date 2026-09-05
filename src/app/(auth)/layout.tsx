import Image from "next/image";

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
          <Image
            src="/icons/favicon.svg"
            alt=""
            width={40}
            height={40}
            priority
            className="size-10 rounded-xl"
          />
          <span className="text-xl font-bold tracking-tight text-slate-950">
            Language Tracker
          </span>
        </div>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}
