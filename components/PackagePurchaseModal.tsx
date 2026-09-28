"use client";

import { useEffect, useState } from "react";
import { Check, ChevronRight, Clock3, X } from "lucide-react";
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

const getDiscount = (item: PackageOption) => {
  const oldPrice = Number(item.oldPrice || 0);
  const price = Number(item.price || 0);
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
};

export default function PackagePurchaseModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    fetch(`${API_BASE_URL}/api/packages`)
      .then((response) => response.json())
      .then((result) =>
        setPackages(
          (result.data || [])
            .filter(
              (item: PackageOption) =>
                item.packageType === "You" || item.packageType === "Both",
            )
            .sort((a: PackageOption, b: PackageOption) => {
              if (a.packageType !== b.packageType) {
                return a.packageType === "You" ? -1 : 1;
              }
              return Number(a.price || 0) - Number(b.price || 0);
            }),
        ),
      )
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const purchase = async (item: PackageOption) => {
    const token = Cookies.get("token");
    if (!token) {
      window.dispatchEvent(new CustomEvent("open-mobile-entry-modal"));
      return;
    }

    setBuying(item._id);

    try {
      const me = await fetch(`${API_BASE_URL}/api/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .catch(() => ({}));

      const response = await fetch(`${API_BASE_URL}/api/payment/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
      if (result.url) {
        window.location.href = result.url;
      } else {
        setBuying(null);
      }
    } catch {
      setBuying(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-md">
      <div className="relative max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-2xl bg-white px-4 py-5 shadow-2xl sm:px-6 sm:py-6">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close package dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Clock3 className="h-5 w-5" />
          </div>
          <h2 className="mt-2 text-xl font-extrabold text-slate-900 sm:text-2xl">
            Upgrade to See
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Choose a package to view available contact information.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">
            Loading packages...
          </div>
        ) : packages.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            Packages are temporarily unavailable.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {packages.map((item) => {
              const credits = Number(
                item.maxProfileView || item.total_connects || 0,
              );
              const discount = getDiscount(item);
              const isBoth = item.packageType === "Both";
              const checked = item.checkedFeatures || [];
              const unchecked = item.uncheckedFeatures || [];

              return (
                <article
                  key={item._id}
                  className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-emerald-300 hover:shadow-md sm:p-4"
                >
                  <div
                    className="absolute left-0 top-0 rounded-br-xl rounded-tl-xl bg-emerald-500 px-3 py-1.5 text-[10px] font-extrabold text-white"
                  >
                    {isBoth ? "Both See" : "You See"}
                  </div>

                  <div className="mt-5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-extrabold text-slate-900">
                        {item.name}
                      </h3>
                      <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                        {isBoth
                          ? "You + suitable contact access"
                          : "Your suitable contacts"}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {discount ? (
                          <span className="text-[10px] font-medium text-slate-400 line-through">
                            ৳{item.oldPrice}
                          </span>
                        ) : null}
                        {discount ? (
                          <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                            {discount}% off
                          </span>
                        ) : null}
                      </div>
                      <div className="text-lg font-extrabold text-slate-900">
                        ৳{item.price}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2">
                    <span className="text-[10px] font-semibold text-slate-600">
                      {credits} contact views
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {item.validDays} Days
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    {checked.slice(0, 3).map((feature) => (
                      <div
                        key={feature}
                        className="flex gap-1.5 text-[10px] leading-4 text-slate-600"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span>{feature}</span>
                      </div>
                    ))}
                    {unchecked.slice(0, 2).map((feature) => (
                      <div
                        key={feature}
                        className="flex gap-1.5 text-[10px] leading-4 text-slate-400"
                      >
                        <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
                        <span className="line-through">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => purchase(item)}
                      disabled={buying === item._id}
                      className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-[11px] font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {buying === item._id
                        ? "Opening payment..."
                        : "Continue"}
                    </button>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-200 text-emerald-600">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
