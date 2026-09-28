"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  MapPin,
  MessageCircle,
  Phone,
  UserRound,
} from "lucide-react";
import { getImageUrl } from "../utils/imageUrl";

type MarketplacePost = {
  _id: string;
  headline: string;
  images?: string[];
  location?: string;
  category?: string;
  subCategory?: string;
  postRole?: "investor" | "business_owner";
  businessStatus?: "new" | "running" | "closed" | "active" | "inactive";
  priceBoxValues?: Record<string, unknown>;
  priceBoxFields?: Array<{
    key: string;
    label?: string;
    labelBn?: string;
    order?: number;
  }>;
  features?: {
    priceBoxValues?: Record<string, unknown>;
    priceBoxFields?: Array<{
      key: string;
      label?: string;
      labelBn?: string;
      order?: number;
    }>;
    priceBoxEnabled?: boolean;
    priceBoxName?: string;
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

function formatPostedAgo(createdAt?: string, now = Date.now()) {
  if (!createdAt) return "";
  const seconds = Math.max(
    0,
    Math.floor((now - new Date(createdAt).getTime()) / 1000),
  );

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
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 10000);
    return () => window.clearInterval(timer);
  }, []);

  const role =
    post.postRole === "business_owner" ? "Business Owner" : "Investor";
  const image = getImageUrl(post.images?.[0]);
  const values = post.priceBoxValues || post.features?.priceBoxValues || {};
  const fields = [
    ...(post.priceBoxFields || post.features?.priceBoxFields || []),
  ].sort((a, b) => (a.order || 0) - (b.order || 0));
  const showPriceBox =
    fields.length > 0 && post.features?.priceBoxEnabled !== false;
  const verified = Boolean(
    post.user?.mVerified ||
      (post.user?.verifiedBy && post.user.verifiedBy !== "Not Verified"),
  );

  return (
    <article
      onClick={onOpen}
      className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="grid sm:grid-cols-[190px_1fr]">
        <div className="relative h-48 bg-slate-100 sm:h-full sm:min-h-[210px]">
          {image ? (
            <img
              src={image}
              alt={post.headline}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <Building2 className="absolute inset-0 m-auto h-12 w-12 text-slate-300" />
          )}
        </div>

        <div className="min-w-0 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-[11px] font-bold text-slate-700">
              <span className="truncate">{role}</span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex min-w-0 items-center gap-1 truncate font-medium text-slate-500">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {post.location || "Bangladesh"}
              </span>
            </div>
            {post.businessStatus && role === "Business Owner" ? (
              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">
                {post.businessStatus === "closed"
                  ? "Closed"
                  : post.businessStatus === "new"
                    ? "New Business"
                    : "Active Business"}
              </span>
            ) : null}
          </div>

          <h3 className="mt-2 line-clamp-2 text-xl font-semibold leading-tight text-slate-900">
            {post.headline}
          </h3>

          {showPriceBox ? (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {fields.slice(0, 6).map((field) => (
                <div
                  key={field.key}
                  className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2.5"
                >
                  <div className="truncate text-[10px] font-medium text-slate-500">
                    {field.label || field.labelBn || field.key}
                  </div>
                  <div className="mt-1 truncate text-base font-bold text-slate-900">
                    {String(values[field.key] ?? "—")}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <UserRound className="h-3.5 w-3.5 text-slate-500" />
                <span className="truncate">
                  {post.user?.name || post.user?.storeName || "Member"}
                </span>
                {verified ? (
                  <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                ) : null}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                <CalendarDays className="h-3 w-3" />
                {formatPostedAgo(post.createdAt, now)}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="rounded-lg border border-slate-200 p-2">
                <Phone className="h-3.5 w-3.5" />
              </span>
              <span className="rounded-lg border border-slate-200 p-2">
                <MessageCircle className="h-3.5 w-3.5" />
              </span>
              <span className="rounded-lg bg-slate-900 p-2 text-white">
                <ArrowIcon />
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        d="M4 16 16 4M7 4h9v9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
