"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { BadgeCheck, Bookmark, MessageSquare, Phone, UserPlus } from "lucide-react";
import { useLanguage } from "../app/context/LanguageContext";
import { getImageUrl } from "../utils/imageUrl";
import { formatInvestmentAmount } from "../utils/formatInvestmentAmount";

type MarketplacePost = {
  _id: string;
  headline: string;
  images?: string[];
  location?: string;
  category?: string;
  subLocation?: string;
  postRole?: "investor" | "business_owner";
  businessStatus?: "new" | "running" | "closed" | "active" | "inactive";
  minInvestment?: number | string;
  maxInvestment?: number | string;
  expectedProfit?: number;
  expectedReturn?: number;
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

export default function InvestmentPostCard({
  post,
  onOpen,
}: {
  post: MarketplacePost;
  onOpen: () => void;
}) {
  const { language } = useLanguage();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 10000);
    return () => window.clearInterval(timer);
  }, []);

  const image = getImageUrl(post.images?.[0]);
  const role = post.postRole === "business_owner" ? "Business Owner" : "Investor";
  const verified = Boolean(
    post.user?.mVerified ||
      (post.user?.verifiedBy && post.user.verifiedBy !== "Not Verified"),
  );
  const returnValue = post.expectedReturn ?? post.expectedProfit;

  const openAction = (event: MouseEvent) => {
    event.stopPropagation();
    onOpen();
  };

  return (
    <article
      onClick={onOpen}
      className="group flex min-h-[132px] cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="relative w-[132px] shrink-0 bg-slate-100 sm:w-[175px]">
        {image ? (
          <img
            src={image}
            alt={post.headline}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            No image
          </div>
        )}
        <div className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[9px] text-white">
          {ago(post.createdAt, now)}
        </div>
      </div>

      <div className="min-w-0 flex-1 px-3 py-2.5 sm:px-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active Business
          </span>
          <span className="text-[9px] text-slate-400">{role}</span>
        </div>

        <h3 className="mt-1 line-clamp-2 text-[17px] font-bold leading-[1.05] text-slate-950 sm:text-[20px]">
          {post.headline}
        </h3>

        <div className="mt-2 flex items-stretch gap-2">
          <div className="flex min-w-[48px] items-center justify-center rounded-md bg-violet-700 px-1.5 py-1 text-center text-white">
            <div>
              <div className="text-[12px] font-extrabold leading-none">
                {returnValue ?? "—"}%
              </div>
              <div className="mt-0.5 text-[7px] uppercase tracking-wide text-violet-100">
                Return
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1 border-r border-slate-200 pr-2">
            <div className="text-[13px] font-extrabold leading-none text-slate-900 sm:text-[16px]">
              {formatInvestmentAmount(post.minInvestment)}
            </div>
            <div className="mt-1 text-[8px] uppercase text-slate-400">Min Invest</div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-extrabold leading-none text-slate-900 sm:text-[16px]">
              {formatInvestmentAmount(post.maxInvestment)}
            </div>
            <div className="mt-1 text-[8px] uppercase text-slate-400">Max Invest</div>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-[10px] text-slate-600">
              <span className="truncate font-semibold">
                Post By {post.user?.name || post.user?.storeName || "Member"}
              </span>
              {verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
            </div>
            <div className="truncate text-[9px] text-slate-400">
              {post.location || "Bangladesh"}{post.subLocation ? `, ${post.subLocation}` : ""}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button onClick={openAction} className="rounded border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-50" title="Invite">
              <UserPlus className="h-3.5 w-3.5" />
            </button>
            <button onClick={openAction} className="rounded border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-50" title="Chat">
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
            <button onClick={openAction} className="rounded border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-50" title="Call">
              <Phone className="h-3.5 w-3.5" />
            </button>
            <button onClick={openAction} className="hidden rounded border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-50 sm:block" title="Save">
              <Bookmark className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {post.businessStatus && post.postRole === "business_owner" && (
          <div className="mt-1 text-[9px] font-medium text-emerald-600">
            {post.businessStatus === "new"
              ? "New Business"
              : post.businessStatus === "closed" || post.businessStatus === "inactive"
                ? "Closed Business"
                : "Running Business"}
          </div>
        )}

        {language === "bn" && (
          <span className="sr-only">বিনিয়োগ পোস্ট</span>
        )}
      </div>
    </article>
  );
}
