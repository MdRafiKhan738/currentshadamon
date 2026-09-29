import { Suspense } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#eef3f6] flex items-center justify-center text-sm text-slate-500">Loading...</div>}>
      {children}
    </Suspense>
  );
}
