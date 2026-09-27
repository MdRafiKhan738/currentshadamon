"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Home, SearchX } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  return (
    <main className="min-h-screen bg-[#f3f6f9] flex items-center justify-center px-4">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <SearchX className="h-8 w-8" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Shadamon Investment</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">404</h1>
        <p className="mt-2 text-sm text-slate-500">This investment page does not exist or is no longer available.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button onClick={() => router.push("/dashboard")} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white">
            <Home className="h-4 w-4" /> Dashboard
          </button>
        </div>
      </section>
    </main>
  );
}
