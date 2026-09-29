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

function FeatureRows({ item }: { item: PackageOption }) {
  const checked = useMemo(
    () => (item.checkedFeatures || []).flatMap((x) => String(x).split(/[,\n]/)).map((x) => x.trim()).filter(Boolean),
    [item.checkedFeatures],
  );
  const unchecked = useMemo(
    () => (item.uncheckedFeatures || []).flatMap((x) => String(x).split(/[,\n]/)).map((x) => x.trim()).filter(Boolean),
    [item.uncheckedFeatures],
  );

  return (
    <div className="mt-3 space-y-2">
      {checked.map((feature, index) => (
        <div key={`c-${index}-${feature}`} className="flex items-start gap-2 text-[10px] leading-[1.25] text-slate-700">
          <span className="mt-[1px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#2f9a84] text-white">
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </span>
          <span>{feature}</span>
        </div>
      ))}
      {unchecked.map((feature, index) => (
        <div key={`u-${index}-${feature}`} className="flex items-start gap-2 text-[10px] leading-[1.25] text-slate-500">
          <span className="mt-[1px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#ef3b43] text-white">
            <X className="h-2.5 w-2.5" strokeWidth={3} />
          </span>
          <span>{feature}</span>
        </div>
      ))}
    </div>
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
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/packages`, { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        const rows = Array.isArray(result?.data) ? result.data : [];
        setPackages(
          rows
            .filter((item: PackageOption) => item.packageType === "You" || item.packageType === "Both")
            .sort((a: PackageOption, b: PackageOption) => {
              if (a.packageType !== b.packageType) return a.packageType === "You" ? -1 : 1;
              return Number(a.price || 0) - Number(b.price || 0);
            }),
        );
      })
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  useEffect(() => setPage(0), [isOpen]);

  const visible = packages.slice(page * 2, page * 2 + 2);
  const maxPage = Math.max(0, Math.ceil(packages.length / 2) - 1);

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
        cache: "no-store",
      }).then((r) => r.json()).catch(() => ({}));

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
      if (result?.url) {
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
    <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/45 p-2 sm:p-4">
      <div className="relative flex max-h-[96vh] w-full max-w-[510px] flex-col overflow-hidden rounded-[11px] bg-white shadow-2xl">
        <button onClick={onClose} aria-label="Close package dialog" className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200">
          <X className="h-5 w-5" />
        </button>

        <div className="px-4 pb-2 pt-7 text-center">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-slate-900">Upgrade to See</h2>
          <p className="mt-0.5 text-[10px] italic text-slate-500">contact info will be available after upgrade</p>
          <div className="mt-3 h-px bg-slate-200" />
        </div>

        {loading ? (
          <div className="flex min-h-[520px] items-center justify-center text-xs text-slate-400">Loading packages...</div>
        ) : packages.length === 0 ? (
          <div className="flex min-h-[520px] items-center justify-center text-xs text-slate-400">Packages are temporarily unavailable.</div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="relative px-2 pb-2">
              <div className="grid grid-cols-2 gap-3">
                {visible.map((item) => {
                  const discount = getDiscount(item);
                  const credits = Number(item.maxProfileView || item.total_connects || 0);
                  const isBoth = item.packageType === "Both";
                  return (
                    <article key={item._id} className="relative min-h-[435px] overflow-hidden rounded-[11px] border border-[#d8e0e5] bg-white px-3 pb-3 pt-5">
                      <div className="absolute left-0 top-0 h-[70px] w-[74px] rounded-br-[64px] rounded-tl-[10px] bg-[#2d987f] text-white">
                        <span className="absolute left-3 top-3 text-[10px] leading-[1.1] font-medium">{isBoth ? "Both" : "You"}<br />See</span>
                      </div>

                      <div className="pl-[62px]">
                        <h3 className="truncate text-[14px] font-semibold text-slate-800">{item.name}</h3>
                        <div className="mt-2 text-[12px] font-normal text-slate-800">{item.validDays} Days</div>
                      </div>

                      <div className="mt-7 text-center">
                        <div className="text-[11px] font-medium text-[#2d987f]">
                          {discount ? `${discount}% off ` : ""}
                          {item.oldPrice ? <span className="text-slate-400 line-through">৳{item.oldPrice}</span> : null}
                        </div>
                        <div className="mt-0.5 text-[16px] font-bold text-slate-900">৳{item.price}</div>
                      </div>

                      <div className="mt-4 rounded-full border border-[#a7d9cb] px-3 py-2 text-center text-[10px] text-slate-500">
                        {isBoth ? "You & your suitable contacts" : "Only you can see contact info"} · {credits.toLocaleString()} Connects
                      </div>

                      <div className="max-h-[178px] overflow-y-auto pr-1"><FeatureRows item={item} /></div>

                      <button
                        onClick={() => purchase(item)}
                        disabled={buying === item._id}
                        className="absolute bottom-3 left-1/2 w-[112px] -translate-x-1/2 rounded-full bg-[#2d987f] py-2 text-[10px] font-bold text-white shadow-[0_3px_7px_rgba(45,152,127,0.28)] disabled:opacity-60"
                      >
                        {buying === item._id ? "Opening..." : "Continue"}
                      </button>
                    </article>
                  );
                })}
              </div>

              {page < maxPage ? (
                <button onClick={() => setPage((value) => Math.min(maxPage, value + 1))} className="absolute right-0 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-[#a9d8ce] bg-white shadow-sm">
                  <ChevronRight className="h-7 w-7 text-slate-400" />
                </button>
              ) : null}
              {page > 0 ? (
                <button onClick={() => setPage((value) => Math.max(0, value - 1))} className="absolute left-0 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-[#a9d8ce] bg-white shadow-sm">
                  <ChevronLeft className="h-7 w-7 text-slate-400" />
                </button>
              ) : null}
            </div>

            <div className="px-4 pb-3 pt-1 text-center text-[10px] leading-4">
              <div className="font-medium text-slate-800">You See <span className="font-normal text-slate-400">Only you Can See Contact Info.</span></div>
              <div className="my-2 h-px bg-slate-200" />
              <div className="font-medium text-slate-800">Both View <span className="font-normal text-slate-400">You & your suitable, Can View Contact Info.</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
