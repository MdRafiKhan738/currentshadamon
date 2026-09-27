"use client";

import { useEffect, useState } from "react";
import { Check, Clock, X } from "lucide-react";
import Cookies from "js-cookie";
import { API_BASE_URL } from "../utils/apiConfig";

type PackageOption = {
  _id: string;
  name: string;
  packageType: "You" | "Both";
  oldPrice?: number;
  price: number;
  maxProfileView?: number;
  total_connects?: number;
  validDays: number;
  bestValueSuggestion?: boolean;
  checkedFeatures?: string[];
  uncheckedFeatures?: string[];
};

export default function PackagePurchaseModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/packages`)
      .then((response) => response.json())
      .then((result) => setPackages((result.data || []).filter((item: PackageOption) => item.packageType === "You" || item.packageType === "Both")))
      .finally(() => setLoading(false));
  }, []);

  const purchase = async (item: PackageOption) => {
    const token = Cookies.get("token");
    if (!token) {
      window.dispatchEvent(new CustomEvent("open-mobile-entry-modal"));
      return;
    }
    setBuying(item._id);
    const me = await fetch(API_BASE_URL + "/api/user/me", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => ({}));
    const response = await fetch(`${API_BASE_URL}/api/payment/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        packageId: item._id,
        totalAmount: item.price,
        paymentType: "package",
        userName: me?.name || me?.storeName || "Package customer",
        userMobile: me?.mobile || "01700000000",
        description: `${item.name} package purchase`,
      }),
    });
    const result = await response.json();
    if (result.url) window.location.href = result.url;
    else setBuying(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl md:p-8">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100" aria-label="Close package dialog"><X className="h-5 w-5" /></button>
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Clock className="h-6 w-6" /></div>
          <h2 className="text-2xl font-bold text-slate-900">Upgrade to see contact numbers</h2>
          <p className="mt-2 text-sm text-slate-500">Choose a package to view investor and business-owner contact information.</p>
        </div>
        {loading ? <p className="py-12 text-center text-slate-500">Loading packages...</p> : packages.length === 0 ? <p className="py-12 text-center text-slate-500">Packages are temporarily unavailable.</p> : <div className="mt-7 grid gap-4 md:grid-cols-2">
          {packages.map((item) => {
            const credits = item.maxProfileView || item.total_connects || 0;
            return <article key={item._id} className={`relative rounded-xl border p-5 ${item.bestValueSuggestion ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-200"}`}>
              {item.bestValueSuggestion && <span className="absolute -top-3 left-5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">Best value</span>}
              <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-900">{item.name}</h3><p className="text-sm text-emerald-700">{item.packageType === "Both" ? "You + Both access" : "Your contacts access"}</p></div><strong className="text-xl text-slate-900">৳{item.price}</strong></div>
              <p className="mt-5 text-sm font-semibold text-slate-700">{credits} contact views for {item.validDays} days</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">{(item.checkedFeatures || []).map((feature) => <li key={feature} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-600" />{feature}</li>)}{(item.uncheckedFeatures || []).slice(0, 2).map((feature) => <li key={feature} className="text-slate-400 line-through">{feature}</li>)}</ul>
              <button onClick={() => purchase(item)} disabled={buying === item._id} className="mt-6 w-full rounded-lg bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{buying === item._id ? "Opening payment..." : "Continue"}</button>
            </article>;
          })}
        </div>}
      </div>
    </div>
  );
}
