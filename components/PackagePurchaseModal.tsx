"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
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
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
};

function splitFeatures(items?: string[]) {
  return (items || [])
    .flatMap((item) => String(item).split(/[,\n]/))
    .map((item) => item.trim())
    .filter(Boolean);
}

function FeatureRows({ item }: { item: PackageOption }) {
  const checked = useMemo(() => splitFeatures(item.checkedFeatures), [item.checkedFeatures]);
  const unchecked = useMemo(() => splitFeatures(item.uncheckedFeatures), [item.uncheckedFeatures]);

  return (
    <div className="mt-4 space-y-2.5">
      {checked.map((feature, index) => (
        <div key={"c-" + index + "-" + feature} className="flex items-start gap-2.5 text-[13px] font-medium leading-5 text-slate-700">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2f9a84] text-white">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
          <span>{feature}</span>
        </div>
      ))}
      {unchecked.map((feature, index) => (
        <div key={"u-" + index + "-" + feature} className="flex items-start gap-2.5 text-[13px] font-medium leading-5 text-slate-500">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ef3b43] text-white">
            <X className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
          <span>{feature}</span>
        </div>
      ))}
    </div>
  );
}

function PackageCard({
  item,
  buying,
  onPurchase,
}: {
  item: PackageOption;
  buying: string | null;
  onPurchase: (item: PackageOption) => void;
}) {
  const discount = getDiscount(item);
  const credits = Number(item.maxProfileView || item.total_connects || 0);
  const isBoth = item.packageType === "Both";

  return (
    <article className="relative overflow-hidden rounded-[12px] border border-[#d8e0e5] bg-white px-4 pb-4 pt-5 shadow-sm">
      <div className="absolute left-0 top-0 h-[72px] w-[82px] rounded-br-[66px] rounded-tl-[12px] bg-[#2d987f] text-white">
        <span className="absolute left-3.5 top-3.5 text-[11px] font-semibold leading-[1.15]">{isBoth ? "Both" : "You"}<br />See</span>
      </div>

      <div className="pl-[68px] pr-2">
        <h3 className="truncate text-[16px] font-bold text-slate-900">{item.name}</h3>
        <div className="mt-1.5 text-[13px] font-semibold text-slate-700">{item.validDays} Days</div>
      </div>

      <div className="mt-6 text-center">
        <div className="text-[13px] font-semibold text-[#2d987f]">
          {discount ? discount + "% off " : ""}
          {item.oldPrice ? <span className="text-slate-400 line-through">৳{item.oldPrice}</span> : null}
        </div>
        <div className="mt-1 text-[22px] font-extrabold text-slate-900">৳{item.price}</div>
      </div>

      <div className="mt-4 rounded-full border border-[#a7d9cb] px-3 py-2.5 text-center text-[12px] font-semibold text-slate-600">
        {isBoth ? "You & suitable contacts" : "Only you can see contact info"} · {credits.toLocaleString()} Connects
      </div>

      <div className="max-h-[250px] overflow-y-auto pr-1">
        <FeatureRows item={item} />
      </div>

      <button
        onClick={() => onPurchase(item)}
        disabled={buying === item._id}
        className="mt-5 w-full rounded-full bg-[#2d987f] py-3 text-[13px] font-extrabold text-white shadow-[0_3px_7px_rgba(45,152,127,0.28)] disabled:opacity-60"
      >
        {buying === item._id ? "Opening..." : "Continue"}
      </button>
    </article>
  );
}

export default function PackagePurchaseModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [currentPackage, setCurrentPackage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const token = Cookies.get("token");
    const packagesPromise = fetch(API_BASE_URL + "/api/packages", { cache: "no-store" })
      .then((response) => response.json());
    const mePromise = token
      ? fetch(API_BASE_URL + "/api/user/me", {
          headers: { Authorization: "Bearer " + token },
          cache: "no-store",
        }).then((response) => response.json()).catch(() => ({}))
      : Promise.resolve({});

    Promise.all([packagesPromise, mePromise])
      .then(([result, me]) => {
        const rows = Array.isArray(result?.data) ? result.data : [];
        setPackages(
          rows
            .filter((item: PackageOption) => item.packageType === "You" || item.packageType === "Both")
            .sort((a: PackageOption, b: PackageOption) => Number(a.price || 0) - Number(b.price || 0)),
        );
        setCurrentPackage(me?.activePackage || null);
      })
      .catch(() => {
        setPackages([]);
        setCurrentPackage(null);
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  useEffect(() => setPage(0), [isOpen]);

  const youPackages = useMemo(() => packages.filter((item) => item.packageType === "You"), [packages]);
  const bothPackages = useMemo(() => packages.filter((item) => item.packageType === "Both"), [packages]);
  const visibleYouPackages = youPackages.slice(page * 2, page * 2 + 2);
  const maxPage = Math.max(0, Math.ceil(youPackages.length / 2) - 1);

  const purchase = async (item: PackageOption) => {
    const token = Cookies.get("token");
    if (!token) {
      window.dispatchEvent(new CustomEvent("open-mobile-entry-modal"));
      return;
    }

    setBuying(item._id);
    try {
      const me = await fetch(API_BASE_URL + "/api/user/me", {
        headers: { Authorization: "Bearer " + token },
        cache: "no-store",
      }).then((r) => r.json()).catch(() => ({}));

      const response = await fetch(API_BASE_URL + "/api/payment/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          packageId: item._id,
          totalAmount: item.price,
          paymentType: "package",
          userName: me?.name || me?.storeName || "Package customer",
          userMobile: me?.mobile || "01700000000",
          description: item.name + " package purchase",
        }),
      });

      const result = await response.json();
      if (result?.url) window.location.href = result.url;
      else setBuying(null);
    } catch {
      setBuying(null);
    }
  };

  if (!isOpen) return null;

  const currentPackageName = currentPackage?.name || "Free";
  const currentCredits = Number(currentPackage?.creditsRemaining ?? 0);
  const currentValidTill = currentPackage?.validTill ? new Date(currentPackage.validTill).toLocaleDateString() : "—";

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/45 p-2 sm:p-4">
      <div className="relative flex max-h-[96vh] w-full max-w-[760px] flex-col overflow-hidden rounded-[14px] bg-white shadow-2xl">
        <button onClick={onClose} aria-label="Close package dialog" className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
          <X className="h-5 w-5" />
        </button>

        <div className="shrink-0 border-b border-slate-200 px-5 pb-4 pt-6">
          <h2 className="text-[20px] font-extrabold text-slate-900">Your Package</h2>
          <p className="mt-1 text-[13px] text-slate-500">Current connect balance and package validity.</p>
        </div>

        {loading ? (
          <div className="flex min-h-[520px] items-center justify-center text-sm text-slate-400">Loading packages...</div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <section className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <div className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">Package</div>
                  <div className="mt-1 text-[18px] font-extrabold text-slate-900">{currentPackageName}</div>
                </div>
                <div>
                  <div className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">Available Connects</div>
                  <div className="mt-1 text-[22px] font-extrabold text-slate-900">{currentCredits}</div>
                </div>
                <div>
                  <div className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">Valid Till</div>
                  <div className="mt-1 text-[16px] font-bold text-slate-900">{currentValidTill}</div>
                </div>
                <div>
                  <div className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">Package Type</div>
                  <div className="mt-1 text-[16px] font-bold text-slate-900">{currentPackage?.type || "—"}</div>
                </div>
              </div>
            </section>

            <section className="mt-5">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-[17px] font-extrabold text-slate-900">Available You Packages</h3>
                  <p className="text-[12px] text-slate-500">Only you can see the contact information.</p>
                </div>
                <div className="text-[12px] font-semibold text-slate-400">{youPackages.length} package{youPackages.length === 1 ? "" : "s"}</div>
              </div>

              {youPackages.length === 0 ? (
                <div className="rounded-[12px] border border-dashed border-slate-300 px-4 py-8 text-center text-[13px] text-slate-400">No You package is available.</div>
              ) : (
                <div className="relative">
                  <div className="grid gap-4 md:grid-cols-2">
                    {visibleYouPackages.map((item) => <PackageCard key={item._id} item={item} buying={buying} onPurchase={purchase} />)}
                  </div>
                  {page < maxPage ? (
                    <button onClick={() => setPage((value) => Math.min(maxPage, value + 1))} className="absolute right-[-12px] top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#a9d8ce] bg-white shadow-md">
                      <ChevronRight className="h-6 w-6 text-slate-500" />
                    </button>
                  ) : null}
                  {page > 0 ? (
                    <button onClick={() => setPage((value) => Math.max(0, value - 1))} className="absolute left-[-12px] top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#a9d8ce] bg-white shadow-md">
                      <ChevronLeft className="h-6 w-6 text-slate-500" />
                    </button>
                  ) : null}
                </div>
              )}
            </section>

            <section className="mt-7 border-t border-slate-200 pt-5">
              <div className="mb-3">
                <h3 className="text-[17px] font-extrabold text-slate-900">Both Packages</h3>
                <p className="text-[12px] text-slate-500">All shared packages are shown below without the slider.</p>
              </div>
              {bothPackages.length === 0 ? (
                <div className="rounded-[12px] border border-dashed border-slate-300 px-4 py-8 text-center text-[13px] text-slate-400">No Both package is available.</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {bothPackages.map((item) => <PackageCard key={item._id} item={item} buying={buying} onPurchase={purchase} />)}
                </div>
              )}
            </section>

            <div className="mt-6 border-t border-slate-200 pt-4 text-[12px] leading-5 text-slate-600">
              <div className="font-bold text-slate-900">You See</div>
              <div>Only you can see contact information after the package is active.</div>
              <div className="mt-2 font-bold text-slate-900">Both View</div>
              <div>You and suitable contacts can view contact information according to the package.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}