"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { BadgeCheck, Bookmark, MessageSquare, Phone, UserPlus } from "lucide-react";
import { useLanguage } from "../app/context/LanguageContext";
import { getImageUrl } from "../utils/imageUrl";
import { formatInvestmentAmount } from "../utils/formatInvestmentAmount";

type PriceField = {
  key: string;
  label?: string;
  labelBn?: string;
  order?: number;
};

type MarketplacePost = {
  _id: string;
  headline: string;
  images?: string[];
  location?: string;
  category?: string;
  subLocation?: string;
  subCategory?: string;
  postRole?: "investor" | "business_owner";
  businessStatus?: "new" | "running" | "closed" | "active" | "inactive";
  minInvestment?: number | string;
  maxInvestment?: number | string;
  expectedProfit?: number;
  expectedReturn?: number;
  priceBoxValues?: Record<string, unknown>;
  priceBoxFields?: PriceField[];
  features?: {
    priceBoxValues?: Record<string, unknown>;
    priceBoxFields?: PriceField[];
    priceBoxEnabled?: boolean;
  };
  createdAt?: string;
  user?: {
    _id?: string;
    name?: string;
    storeName?: string;
    mVerified?: boolean;
    verifiedBy?: string;
  };
};

function ago(createdAt: string | undefined, now: number) {
  if (!createdAt) return "";
  const seconds = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function InvestmentPostCard({ post, onOpen }: { post: MarketplacePost; onOpen: () => void }) {
  const { language } = useLanguage();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 10000);
    return () => window.clearInterval(timer);
  }, []);

  const image = getImageUrl(post.images?.[0]);
  const role = post.postRole === "business_owner" ? "Business Owner" : "Investor";
  const roleBn = post.postRole === "business_owner" ? "ব্যবসা মালিক" : "বিনিয়োগকারী";
  const verified = Boolean(post.user?.mVerified || (post.user?.verifiedBy && post.user.verifiedBy !== "Not Verified"));
  const returnValue = post.expectedReturn ?? post.expectedProfit;
  const dynamicValues = post.priceBoxValues || post.features?.priceBoxValues || {};
  const dynamicFields = [...(post.priceBoxFields || post.features?.priceBoxFields || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  const hasDynamicFields = dynamicFields.length > 0 && post.features?.priceBoxEnabled !== false;

  const openAction = (event: MouseEvent) => {
    event.stopPropagation();
    onOpen();
  };

  const fallbackFields = [
    { key: "minInvestment", label: "Min Invest", labelBn: "সর্বনিম্ন বিনিয়োগ", value: post.minInvestment },
    { key: "maxInvestment", label: "Max Invest", labelBn: "সর্বোচ্চ বিনিয়োগ", value: post.maxInvestment },
    { key: "expectedProfit", label: post.postRole === "investor" ? "Expected Profit" : "Return", labelBn: post.postRole === "investor" ? "প্রত্যাশিত লাভ" : "রিটার্ন", value: returnValue },
  ];

  return (
    <article onClick={onOpen} className="group flex min-h-[132px] cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="relative w-[132px] shrink-0 bg-slate-100 sm:w-[175px]">
        {image ? <img src={image} alt={post.headline} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>}
        <div className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[9px] text-white">{ago(post.createdAt, now)}</div>
      </div>

      <div className="min-w-0 flex-1 px-3 py-2.5 sm:px-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{language === "bn" ? roleBn : role}</span>
          <span className="truncate text-[9px] text-slate-400">{post.subCategory || (language === "bn" ? "বিনিয়োগ পোস্ট" : "Investment post")}</span>
        </div>

        <h3 className="mt-1 line-clamp-2 text-[17px] font-bold leading-[1.05] text-slate-950 sm:text-[20px]">{post.headline}</h3>

        {hasDynamicFields ? (
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {dynamicFields.slice(0, 6).map((field) => {
              const value = dynamicValues[field.key];
              if (value === undefined || value === null || String(value).trim() === "") return null;
              const label = language === "bn" ? (field.labelBn || field.label || field.key) : (field.label || field.labelBn || field.key);
              return <div key={field.key} className="min-w-0 rounded-md bg-slate-50 px-2 py-1.5"><div className="truncate text-[12px] font-extrabold text-slate-900">{String(value)}</div><div className="mt-0.5 truncate text-[7px] uppercase tracking-wide text-slate-400">{label}</div></div>;
            })}
          </div>
        ) : (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {fallbackFields.map((field) => <div key={field.key} className="min-w-0 rounded-md bg-slate-50 px-2 py-1.5"><div className="truncate text-[12px] font-extrabold text-slate-900">{field.key === "minInvestment" || field.key === "maxInvestment" ? formatInvestmentAmount(field.value as number | string | undefined) : field.value ?? "—"}{field.key === "expectedProfit" && field.value !== undefined ? "%" : ""}</div><div className="mt-0.5 truncate text-[7px] uppercase tracking-wide text-slate-400">{language === "bn" ? field.labelBn : field.label}</div></div>)}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-[10px] text-slate-600"><span className="truncate font-semibold">{post.user?.name || post.user?.storeName || "Member"}</span>{verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}</div>
            <div className="truncate text-[9px] text-slate-400">{post.location || "Bangladesh"}{post.subLocation ? `, ${post.subLocation}` : ""}</div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button onClick={openAction} className="rounded border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-50" title="Proposal"><UserPlus className="h-3.5 w-3.5" /></button>
            <button onClick={openAction} className="rounded border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-50" title="Message"><MessageSquare className="h-3.5 w-3.5" /></button>
            <button onClick={openAction} className="rounded border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-50" title="Call"><Phone className="h-3.5 w-3.5" /></button>
            <button onClick={openAction} className="hidden rounded border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-50 sm:block" title="Save"><Bookmark className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        {post.businessStatus && post.postRole === "business_owner" && <div className="mt-1 text-[9px] font-medium text-emerald-600">{post.businessStatus === "new" ? "New Business" : post.businessStatus === "closed" || post.businessStatus === "inactive" ? "Closed Business" : "Running Business"}</div>}
      </div>
    </article>
  );
}
