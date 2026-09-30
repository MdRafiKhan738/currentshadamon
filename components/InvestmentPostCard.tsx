"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, MessageCircle, Phone, UserPlus } from "lucide-react";

import { getImageUrl } from "../utils/imageUrl";
import { formatInvestmentAmount } from "../utils/formatInvestmentAmount";
import { useLanguage } from "../app/context/LanguageContext";

type PriceBoxField = {
  key: string;
  label?: string;
  labelBn?: string;
  inputType?: "text" | "number";
  order?: number;
};

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
  priceBoxFields?: PriceBoxField[];
  features?: {
    priceBoxValues?: Record<string, unknown>;
    priceBoxFields?: PriceBoxField[];
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

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function InvestmentPostCard({
  post,
  onOpen,
}: {
  post: MarketplacePost;
  onOpen: () => void;
}) {
  const { language } = useLanguage();
  const bn = language === "bn";

  const values = post.priceBoxValues || post.features?.priceBoxValues || {};
  const fields = useMemo(() => {
    const source = post.priceBoxFields || post.features?.priceBoxFields || [];
    return [...source].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [post.priceBoxFields, post.features?.priceBoxFields]);

  // Put the "return / profit" field first so it becomes the purple box.
  const returnFieldIndex = fields.findIndex((field) =>
    /return|expected|profit|percent|roi/i.test(String(field.label || field.labelBn || field.key)),
  );
  const orderedFields =
    returnFieldIndex >= 0
      ? [fields[returnFieldIndex], ...fields.filter((_, index) => index !== returnFieldIndex)]
      : fields;
  const visibleFields = orderedFields.slice(0, 3);
  const hasPriceBox = visibleFields.length > 0;

  const rawImagePath = String(post.images?.[0] || "");
  const [image, setImage] = useState(() => getImageUrl(rawImagePath));
  const isRemoteImage =
    rawImagePath.startsWith("http") || rawImagePath.startsWith("data:") || rawImagePath.startsWith("blob:");
  const legacyImage =
    !isRemoteImage && rawImagePath
      ? "https://api.shadamon.com" + (rawImagePath.startsWith("/") ? rawImagePath : "/" + rawImagePath)
      : "";

  const name = post.user?.name || post.user?.storeName || "Member";
  const verified = Boolean(
    post.user?.mVerified || (post.user?.verifiedBy && post.user.verifiedBy !== "Not Verified"),
  );

  const statusText =
    post.postRole === "business_owner"
      ? post.businessStatus === "new"
        ? bn ? "নতুন ব্যবসা" : "New Business"
        : post.businessStatus === "closed" || post.businessStatus === "inactive"
          ? bn ? "ব্যবসা বন্ধ" : "Close Business"
          : bn ? "সক্রিয় ব্যবসা" : "Active Business"
      : bn ? "সক্রিয় ব্যবসা" : "Active Business";

  const roleText =
    post.postRole === "business_owner"
      ? bn ? "ব্যবসায়ী" : "Business Owner"
      : bn ? "বিনিয়োগকারী" : "Investor";

  const locationText = [post.subLocation, post.location].filter(Boolean).join(", ") || (bn ? "বাংলাদেশ" : "Bangladesh");

  const displayDate =
    post.updatedAt && post.adType?.toLowerCase() === "promoted" ? post.updatedAt : post.updatedAt || post.createdAt;

  const priceText = (field: PriceBoxField, index = 0) => {
    const value = values[field.key];
    const fieldName = String(field.label || field.labelBn || field.key || "").toLowerCase();
    const formatted =
      field.inputType === "text" ? String(value ?? "—") : formatInvestmentAmount(value as any);
    if (index === 0 || /return|expected|profit|percentage|percent|roi/.test(fieldName)) {
      const raw = String(value ?? "").trim();
      if (raw && !raw.endsWith("%")) return formatted + "%";
    }
    return formatted;
  };

  const fieldLabel = (field: PriceBoxField) =>
    bn ? field.labelBn || field.label || field.key : field.label || field.key;

  return (
    <article
      onClick={onOpen}
      className="group w-full cursor-pointer overflow-hidden rounded-[14px] border border-[#e3e8f0] bg-[#f7f8fc] p-2 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_6px_18px_rgba(15,23,42,0.09)]"
    >
      <div className="grid grid-cols-[38%_minmax(0,1fr)] gap-3">
        {/* Image */}
        <div className="relative min-h-[150px] overflow-hidden rounded-[10px] bg-[#e9edf2]">
          {image ? (
            <img
              src={image || undefined}
              alt={post.headline}
              className="absolute inset-0 h-full w-full object-cover"
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

        {/* Details */}
        <div className="flex min-w-0 flex-col py-0.5 pr-1">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-800">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#4f46e5]" />
            <span className="truncate">{statusText}</span>
          </div>

          <h3 className="mt-1 line-clamp-2 text-[17px] font-extrabold leading-[1.1] tracking-[-0.01em] text-slate-900">
            {post.headline}
          </h3>

          {/* Metrics */}
          {hasPriceBox ? (
            <div className="mt-2.5 flex items-stretch gap-3">
              {visibleFields.map((field, index) =>
                index === 0 ? (
                  <div
                    key={field.key}
                    className="flex min-w-[46px] max-w-[30%] shrink-0 flex-col justify-center rounded-[8px] bg-[#7b2dfc] px-2 py-1.5 text-white"
                  >
                    <div className="truncate text-[13px] font-extrabold leading-none">
                      {priceText(field, index)}
                    </div>
                    <div className="mt-1 truncate text-[8px] font-semibold uppercase leading-none text-white/80">
                      {fieldLabel(field)}
                    </div>
                  </div>
                ) : (
                  <div key={field.key} className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-extrabold leading-tight text-slate-900">
                      {priceText(field, index)}
                    </div>
                    <div className="mt-0.5 truncate text-[10px] font-medium text-slate-400">
                      {fieldLabel(field)}
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : post.price !== undefined ? (
            <div className="mt-2.5">
              <div className="text-[14px] font-extrabold text-slate-900">
                ৳ {Number(post.price || 0).toLocaleString()}
              </div>
              <div className="mt-0.5 text-[10px] font-medium text-slate-400">{bn ? "মূল্য" : "Price"}</div>
            </div>
          ) : null}

          {/* Poster */}
          <div className="mt-2.5">
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <span className="font-semibold">{bn ? "পোস্ট করেছেন" : "Post By"}</span>
              <span className="truncate font-bold text-slate-900">{name}</span>
              {verified ? <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#12a87c]" /> : null}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500">
              <span className="font-semibold text-slate-600">{roleText}</span>
              <span className="truncate">{locationText}</span>
            </div>
          </div>

          {/* Actions + updated */}
          <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
            <div className="flex items-center gap-1.5">
              {[UserPlus, MessageCircle, Phone].map((Icon, i) => (
                <div
                  key={i}
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-slate-200 bg-white text-slate-800"
                >
                  <Icon className="h-4 w-4" />
                </div>
              ))}
            </div>
            <div className="text-right text-[9px] font-medium leading-tight text-slate-400">
              <div>{bn ? "আপডেট" : "Updated"}</div>
              <div>{postedAgo(displayDate)}</div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
