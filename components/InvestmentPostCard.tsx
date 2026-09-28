"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Building2, MapPin, UserRound } from "lucide-react";
import { useLanguage } from "../app/context/LanguageContext";
import { getImageUrl } from "../utils/imageUrl";

type MarketplacePost = {
  _id: string;
  headline: string;
  images?: string[];
  location?: string;
  category?: string;
  postRole?: "investor" | "business_owner";
  businessStatus?: "active" | "inactive";
  minInvestment?: number | string;
  maxInvestment?: number | string;
  expectedProfit?: number;
  expectedReturn?: number;
  priceBoxValues?: Record<string, unknown>;
  priceBoxFields?: Array<{ key: string; label?: string; labelBn?: string; order?: number; }>;
  features?: { priceBoxValues?: Record<string, unknown>; priceBoxFields?: Array<{ key: string; label?: string; labelBn?: string; order?: number; }>; priceBoxEnabled?: boolean; };
  createdAt?: string;
  user?: { _id?: string; name?: string; storeName?: string; mVerified?: boolean; verifiedBy?: string };
};

function formatPostedAgo(createdAt: string | undefined, now: number, language: string) {
  if (!createdAt) return "";
  const elapsedSeconds = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 1000));
  const units = elapsedSeconds < 60
    ? [elapsedSeconds, language === "bn" ? "সেকেন্ড আগে" : "sec ago"]
    : elapsedSeconds < 3600
      ? [Math.floor(elapsedSeconds / 60), language === "bn" ? "মিনিট আগে" : "min ago"]
      : elapsedSeconds < 86400
        ? [Math.floor(elapsedSeconds / 3600), language === "bn" ? "ঘণ্টা আগে" : "hr ago"]
        : [Math.floor(elapsedSeconds / 86400), language === "bn" ? "দিন আগে" : "days ago"];
  const value = Number(units[0]).toLocaleString(language === "bn" ? "bn-BD" : "en-US");
  return `${value} ${units[1]}`;
}

export default function InvestmentPostCard({ post, onOpen }: { post: MarketplacePost; onOpen: () => void }) {
  const { language } = useLanguage();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 10000);
    return () => window.clearInterval(interval);
  }, []);

  const categoryValue = (post.category ?? "").toLowerCase();
  const normalizedRole = post.postRole === "business_owner" || categoryValue === "business-owner" || categoryValue === "business owner" ? "business_owner" : "investor";
  const roleLabel = normalizedRole === "business_owner"
    ? (language === "bn" ? "উদ্যোক্তা" : "Business Owner")
    : (language === "bn" ? "বিনিয়োগকারী" : "Investor");
  const verified = Boolean(post.user?.mVerified || (post.user?.verifiedBy && post.user.verifiedBy !== "Not Verified"));
  const image = getImageUrl(post.images?.[0]);
  const showBusinessStatus = normalizedRole === "business_owner";
  const dynamicValues = post.priceBoxValues || post.features?.priceBoxValues || {};
  const dynamicFields = [...(post.priceBoxFields || post.features?.priceBoxFields || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  const hasDynamicFields = dynamicFields.length > 0 && post.features?.priceBoxEnabled !== false;

  return (
    <article onClick={onOpen} className="group cursor-pointer overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="grid sm:grid-cols-[180px_1fr]">
        <div className="relative h-44 bg-slate-100 sm:h-full">
          {image ? <img src={image} alt={post.headline} className="h-full w-full object-cover" loading="lazy" /> : <Building2 className="absolute inset-0 m-auto h-10 w-10 text-violet-300" />}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
            <span className="inline-flex min-w-0 items-center gap-1"><UserRound className="h-3.5 w-3.5" />{post.user?.name || "Marketplace member"}</span>
            {verified ? <span className="inline-flex shrink-0 items-center gap-1 font-medium text-emerald-600"><BadgeCheck className="h-4 w-4" />Verified</span> : <span className="shrink-0">Unverified</span>}
          </div>
          <h3 className="mt-2 text-lg font-medium leading-tight text-slate-900">{post.headline}</h3>
          <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-[0.12em] text-violet-700">
            <span>{roleLabel} {language === "bn" ? "পোস্ট" : "Post"}</span>
            <time className="shrink-0 normal-case tracking-normal text-slate-500">{formatPostedAgo(post.createdAt, now, language)}</time>
          </div>
          {hasDynamicFields && (
            <div className="mt-3 grid grid-cols-2 gap-2 overflow-hidden rounded-xl border border-violet-100 text-center text-xs sm:grid-cols-3">
              {dynamicFields.slice(0, 6).map((field) => (
                <div key={field.key} className="border-r border-violet-100 px-2 py-2 last:border-r-0">
                  <p className="truncate text-slate-500">{language === "bn" ? (field.labelBn || field.label || field.key) : (field.label || field.labelBn || field.key)}</p>
                  <p className="mt-1 truncate font-medium">{String(dynamicValues[field.key] ?? "—")}</p>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{post.location || "Bangladesh"}</span>
            {showBusinessStatus && (
              <span className={post.businessStatus === "inactive" ? "text-rose-600" : "text-emerald-600"}>{post.businessStatus === "inactive" ? "Inactive Business" : "Active Business"}</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
