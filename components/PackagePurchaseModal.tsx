"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const GREEN = "#2f9a80";

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
    <div className="mt-3 space-y-1.5 text-left">
      {checked.map((feature, index) => (
        <div
          key={"c-" + index + "-" + feature}
          className="flex items-start gap-1.5 text-[12px] font-medium leading-[1.25] text-slate-800"
        >
          <span
            className="mt-[1px] flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: GREEN }}
          >
            <Check className="h-[10px] w-[10px]" strokeWidth={4} />
          </span>
          <span>{feature}</span>
        </div>
      ))}
      {unchecked.map((feature, index) => (
        <div
          key={"u-" + index + "-" + feature}
          className="flex items-start gap-1.5 text-[12px] font-medium leading-[1.25] text-slate-800"
        >
          <span className="mt-[1px] flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full bg-[#e5383b] text-white">
            <X className="h-[10px] w-[10px]" strokeWidth={4} />
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
  const perConnect = credits > 0 ? Math.round(Number(item.price || 0) / credits) : 0;

  return (
    <article className="relative flex h-full w-full flex-col overflow-hidden rounded-[10px] border border-[#dfe6ea] bg-white px-2.5 pb-3 pt-3 text-center">
      {/* green corner tab */}
      <div
        className="absolute left-0 top-0 h-[46px] w-[50px] rounded-br-[44px] rounded-tl-[10px] text-white"
        style={{ backgroundColor: GREEN }}
      >
        <span className="absolute left-2 top-1.5 text-left text-[10px] font-semibold leading-[1.15]">
          {isBoth ? "Both" : "You"}
          <br />
          See
        </span>
      </div>

      {/* heading */}
      <div className="px-5 pt-0.5">
        {isBoth ? (
          <>
            <div className="text-[12px] font-medium leading-tight text-slate-700">
              Per Connect ৳{perConnect}
            </div>
            <h3 className="mt-1 text-[15px] font-bold leading-tight text-slate-900">{item.name}</h3>
          </>
        ) : (
          <h3 className="text-[14px] font-bold leading-[1.25] text-slate-900">{item.name}</h3>
        )}
        <div className="mt-1.5 text-[12px] font-medium text-slate-700">{item.validDays} Days</div>
      </div>

      {/* price */}
      <div className="mt-2.5">
        <div className="text-[12px] font-semibold" style={{ color: GREEN }}>
          {discount ? discount + "% off " : ""}
          {item.oldPrice ? (
            <span className="font-medium text-[#9fd0c3] line-through">৳{item.oldPrice}</span>
          ) : null}
        </div>
        <div className="mt-0.5 text-[16px] font-bold leading-tight text-slate-900">৳{item.price}</div>
      </div>

      <FeatureRows item={item} />

      <div className="mt-auto pt-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPurchase(item);
          }}
          disabled={buying === item._id}
          className="mx-auto block rounded-full px-6 py-[7px] text-[11px] font-bold text-white shadow-[0_2px_5px_rgba(47,154,128,0.35)] disabled:opacity-60"
          style={{ backgroundColor: GREEN }}
        >
          {buying === item._id ? "Opening..." : "Continue"}
        </button>
      </div>
    </article>
  );
}

function PackageSlider({
  items,
  buying,
  onPurchase,
}: {
  items: PackageOption[];
  buying: string | null;
  onPurchase: (item: PackageOption) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const updateEdge = () => {
    const el = trackRef.current;
    if (!el) return;
    setEdge({
      start: el.scrollLeft <= 2,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    });
  };

  useEffect(() => {
    updateEdge();
  }, [items]);

  const move = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * (el.clientWidth / 2 + 6), behavior: "smooth" });
  };

  const arrowClass =
    "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#b9dcd2] bg-white/95 shadow-md transition-opacity";

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={updateEdge}
        className="flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <div key={item._id} className="w-[calc(50%-6px)] shrink-0 snap-start">
            <PackageCard item={item} buying={buying} onPurchase={onPurchase} />
          </div>
        ))}
      </div>

      {items.length > 2 ? (
        <>
          <button
            type="button"
            aria-label="Previous packages"
            onClick={() => move(-1)}
            disabled={edge.start}
            className={arrowClass + " left-1 " + (edge.start ? "opacity-40" : "opacity-100")}
          >
            <ChevronLeft className="h-6 w-6 text-slate-400" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Next packages"
            onClick={() => move(1)}
            disabled={edge.end}
            className={arrowClass + " right-1 " + (edge.end ? "opacity-40" : "opacity-100")}
          >
            <ChevronRight className="h-6 w-6 text-slate-500" strokeWidth={1.5} />
          </button>
        </>
      ) : null}
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

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(API_BASE_URL + "/api/packages", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        const rows = Array.isArray(result?.data) ? result.data : [];
        setPackages(
          rows
            .filter((item: PackageOption) => item.packageType === "You" || item.packageType === "Both")
            .sort((a: PackageOption, b: PackageOption) => Number(a.price || 0) - Number(b.price || 0)),
        );
      })
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const youPackages = useMemo(() => packages.filter((item) => item.packageType === "You"), [packages]);
  const bothPackages = useMemo(() => packages.filter((item) => item.packageType === "Both"), [packages]);

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
      })
        .then((r) => r.json())
        .catch(() => ({}));

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

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/45 p-3">
      <div className="relative flex max-h-[94vh] w-full max-w-[430px] flex-col overflow-hidden rounded-[14px] bg-white shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Close package dialog"
          className="absolute right-2.5 top-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="shrink-0 px-5 pb-2.5 pt-5 text-center">
          <h2 className="text-[16px] font-bold text-slate-900">Upgrade to See</h2>
          <p className="mt-0.5 text-[8.5px] italic text-slate-500">
            contact info will be available after upgrade
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center text-sm text-slate-400">
            Loading packages...
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-3.5 pb-5 pt-1">
            {youPackages.length === 0 ? (
              <div className="rounded-[10px] border border-dashed border-slate-300 px-4 py-6 text-center text-[12px] text-slate-400">
                No You package is available.
              </div>
            ) : (
              <PackageSlider items={youPackages} buying={buying} onPurchase={purchase} />
            )}

            <div className="mt-5 space-y-1.5 text-center text-[10.5px] leading-4 text-slate-500">
              <p>
                <span className="font-bold text-slate-900">You See</span> Only you Can See Contact Info.
              </p>
              <p>
                <span className="font-bold text-slate-900">Both View</span> You &amp; your suitable, Can View
                Contact Info.
              </p>
            </div>

            <div className="mt-3">
              {bothPackages.length === 0 ? (
                <div className="rounded-[10px] border border-dashed border-slate-300 px-4 py-6 text-center text-[12px] text-slate-400">
                  No Both package is available.
                </div>
              ) : (
                <PackageSlider items={bothPackages} buying={buying} onPurchase={purchase} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
