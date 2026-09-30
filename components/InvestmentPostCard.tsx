"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  MapPin,
  MessageCircle,
  Phone,
  UserPlus,
} from "lucide-react";

import { getImageUrl } from "../utils/imageUrl";
import { formatInvestmentAmount } from "../utils/formatInvestmentAmount";
import { useLanguage } from "../app/context/LanguageContext";

type MarketplacePost = {
  _id: string;
  headline: string;
  description?: string;
  images?: string[];
  location?: string;
  subLocation?: string;
  category?: string;
  subCategory?: string;
  postRole?: "investor" | "business_owner";
  businessStatus?: "new" | "closed" | "active" | "running" | "inactive";
  price?: number;
  expectedReturn?: number;
  priceBoxValues?: Record<string, unknown>;
  priceBoxFields?: Array<{
    key: string;
    label?: string;
    labelBn?: string;
    inputType?: "text" | "number";
    order?: number;
  }>;
  features?: {
    priceBoxValues?: Record<string, unknown>;
    priceBoxFields?: Array<{
      key: string;
      label?: string;
      labelBn?: string;
      inputType?: "text" | "number";
      order?: number;
    }>;
    priceBoxEnabled?: boolean;
    priceBoxName?: string;
  };
  adType?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    _id?: string;
    name?: string;
    storeName?: string;
    photo?: string;
    mVerified?: boolean;
    verifiedBy?: string;
  };
};

function postedAgo(value?: string) {
  if (!value) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function InvestmentPostCard({
  post,
  onOpen,
}: {
  post: MarketplacePost;
  onOpen: () => void;
}) {
  const { language } = useLanguage();
  const values = post.priceBoxValues || post.features?.priceBoxValues || {};
  const fields = useMemo(() => {
    const source = post.priceBoxFields || post.features?.priceBoxFields || [];
    return [...source].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [post.priceBoxFields, post.features?.priceBoxFields]);

  const returnFieldIndex = fields.findIndex((field) =>
    /return|expected/i.test(String(field.label || field.labelBn || field.key)),
  );
  const orderedFields = returnFieldIndex >= 0
    ? [fields[returnFieldIndex], ...fields.filter((_, index) => index !== returnFieldIndex)]
    : fields;
  const visibleFields = orderedFields.slice(0, 3);
  const hasPriceBox = visibleFields.length > 0;
  const rawImagePath = String(post.images?.[0] || "");
  const [image, setImage] = useState(() => getImageUrl(rawImagePath));
  const isRemoteImage = rawImagePath.startsWith("http") || rawImagePath.startsWith("data:") || rawImagePath.startsWith("blob:");
  const legacyImage = !isRemoteImage && rawImagePath
    ? "https://api.shadamon.com" + (rawImagePath.startsWith("/") ? rawImagePath : "/" + rawImagePath)
    : "";
  const name = post.user?.name || post.user?.storeName || "Member";
  const verified = Boolean(post.user?.mVerified || (post.user?.verifiedBy && post.user.verifiedBy !== "Not Verified"));
  const statusText =
    post.postRole === "business_owner"
      ? post.businessStatus === "new"
        ? (language === "bn" ? "নতুন ব্যবসা" : "New Business")
        : post.businessStatus === "closed" || post.businessStatus === "inactive"
          ? (language === "bn" ? "ব্যবসা বন্ধ" : "Close Business")
          : (language === "bn" ? "সক্রিয় ব্যবসা" : "Active Business")
      : (language === "bn" ? "বিনিয়োগকারী" : "Investor");
  const displayDate = post.updatedAt && post.adType?.toLowerCase() === "promoted" ? post.updatedAt : post.createdAt;

  const priceText = (field: any, index = 0) => {
    const value = values[field.key];
    const fieldName = String(field.label || field.labelBn || field.key || "").toLowerCase();
    const formatted = field.inputType === "text"
      ? String(value ?? "—")
      : formatInvestmentAmount(value as any);
    if (index === 0 || /return|expected|profit|percentage|percent|roi/.test(fieldName)) {
      const raw = String(value ?? "").trim();
      if (raw && !raw.endsWith("%")) return formatted + "%";
    }
    return formatted;
  };

  return (
    <article
      onClick={onOpen}
      className="group w-full cursor-pointer overflow-hidden rounded-[10px] border border-[#dfe7ee] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.08)] transition-shadow hover:shadow-[0_6px_18px_rgba(15,23,42,0.09)]"
    >
      <div className="grid min-h-[246px] grid-cols-[142px_minmax(0,1fr)] sm:grid-cols-[220px_minmax(0,1fr)]">
        <div className="relative min-h-[246px] overflow-hidden bg-[#f1f4f6]">
          {image ? (
            <img
              src={image || undefined}
              alt={post.headline}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => {
                if (legacyImage && image !== legacyImage) setImage(legacyImage);
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400">
              No image
            </div>
          )}
        </div>

        <div className="min-w-0 bg-white px-3.5 py-3 sm:px-4">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-black">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#7c3aed]" />
            <span>{statusText}</span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              {post.location || (language === "bn" ? "বাংলাদেশ" : "Bangladesh")}
            </span>
          </div>

          <h3 className="mt-1.5 line-clamp-2 text-[20px] font-bold leading-[1.08] tracking-[-0.02em] text-slate-900">
            {post.headline}
          </h3>

          {hasPriceBox ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {visibleFields.map((field, index) => (
                <div
                  key={field.key}
                  className={cn(
                    "min-w-0 rounded-[7px] border px-2.5 py-2.5",
                    index === 0
                      ? "border-[#7b2dfc] bg-[#7b2dfc] text-white"
                      : "border-slate-200 bg-white",
                  )}
                >
                  <div className={cn("truncate text-[18px] font-extrabold", index === 0 ? "text-white" : "text-slate-900")}>
                    {priceText(field, index)}
                  </div>
                  <div className={cn("mt-1 truncate text-[10px] font-semibold", index === 0 ? "text-white/80" : "text-slate-500")}>
                    {language === "bn"
                      ? (field.labelBn || field.label || field.key)
                      : (field.label || field.key)}
                  </div>
                </div>
              ))}
            </div>
          ) : post.price !== undefined ? (
            <div className="mt-3 grid grid-cols-1">
              <div className="rounded-[7px] border border-slate-200 bg-white px-2.5 py-2.5">
                <div className="text-[9px] font-medium text-slate-400">Price</div>
                <div className="mt-1 text-[14px] font-extrabold text-slate-900">৳ {Number(post.price || 0).toLocaleString()}</div>
              </div>
            </div>
          ) : null}

          <div className="mt-3 border-t border-slate-100 pt-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-[12px] font-bold text-slate-900"><span className="truncate">{name}</span></div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="font-extrabold text-slate-700">{language === "bn" ? "পোস্ট করেছেন" : "Post by"}</span>
                  <span className="font-bold text-slate-900">{name}</span>
                  {verified ? <BadgeCheck className="h-3.5 w-3.5 text-[#12a87c]" /> : null}
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span className="font-extrabold text-slate-600">{language === "bn" ? "আপলোড: " : "Uploaded at: "}{postedAgo(displayDate)}</span>
                </div>
                {post.subLocation ? <div className="mt-1 text-[15px] font-bold text-slate-600">{post.location} · {post.subLocation}</div> : null}
                {/* <div className="mt-1 text-[13px] font-bold text-slate-700">{badge}</div> */}
              </div>

              <div className="flex w-full items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700"
                    aria-hidden="true"
                  >
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700"
                    aria-hidden="true"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700"
                    aria-hidden="true"
                  >
                    <Phone className="h-4 w-4" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onOpen(); }}
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-[#111827] text-white"
                  aria-label="Open post"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
