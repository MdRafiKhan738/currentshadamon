"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  MapPin,
  MessageCircle,
  Phone,
  UserPlus,
  UserRound,
} from "lucide-react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

import { getImageUrl } from "../utils/imageUrl";
import { API_BASE_URL } from "../utils/apiConfig";
import { formatInvestmentAmount } from "../utils/formatInvestmentAmount";

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
  businessStatus?: "new" | "closed" | "active" | "inactive";
  price?: number;
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

function roleLabel(post: MarketplacePost) {
  if (post.postRole === "business_owner") return "Active Business";
  if (post.postRole === "investor") return "Investor";
  return "";
}

export default function InvestmentPostCard({
  post,
  onOpen,
}: {
  post: MarketplacePost;
  onOpen: () => void;
}) {
  const [inviteStatus, setInviteStatus] = useState<"none" | "pending" | "accepted" | "rejected" | "cancelled">("none");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 10000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const token = Cookies.get("token");
    if (!token || !post?._id) {
      setInviteStatus("none");
      return;
    }

    fetch(`${API_BASE_URL}/api/invites?adId=${encodeURIComponent(post._id)}`, {
      headers: { Authorization: "Bearer " + token },
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((result) => {
        if (cancelled || !result?.success) return;
        const sent = Array.isArray(result.sent) ? result.sent : [];
        const current = sent.find(
          (invite: any) => String(invite.adId?._id || invite.adId) === String(post._id),
        );
        if (current) setInviteStatus(current.status || "pending");
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [post?._id]);

  const values = post.priceBoxValues || post.features?.priceBoxValues || {};
  const fields = useMemo(() => {
    const source = post.priceBoxFields || post.features?.priceBoxFields || [];
    return [...source].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [post.priceBoxFields, post.features?.priceBoxFields]);

  const visibleFields = fields.slice(0, 3);
  const hasPriceBox = visibleFields.length > 0;
  const image = getImageUrl(post.images?.[0]);
  const name = post.user?.name || post.user?.storeName || "Member";
  const verified = Boolean(post.user?.mVerified || (post.user?.verifiedBy && post.user.verifiedBy !== "Not Verified"));
  const badge = roleLabel(post);
  const isBusiness = post.postRole === "business_owner";
  const displayDate = post.updatedAt && post.adType?.toLowerCase() === "promoted" ? post.updatedAt : post.createdAt;

  const invite = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const token = Cookies.get("token");
    if (!token) {
      window.dispatchEvent(new CustomEvent("open-mobile-entry-modal", { detail: { reason: "invite", ad: post } }));
      return;
    }

    const receiverId = post.user?._id;
    if (!receiverId) {
      toast.error("This post owner could not be identified.");
      return;
    }

    try {
      const response = await fetch(API_BASE_URL + "/api/invites/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ receiverId, adId: post._id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Unable to send invite.");
      setInviteStatus("pending");
      toast.success("Invite sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send invite.");
    }
  };

  const priceText = (field: any) => {
    const value = values[field.key];
    if (field.inputType === "text") return String(value ?? "—");
    return formatInvestmentAmount(value as any);
  };

  return (
    <article
      onClick={onOpen}
      className="group w-full cursor-pointer overflow-hidden rounded-[10px] border border-[#dfe7ee] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.08)] transition-shadow hover:shadow-[0_6px_18px_rgba(15,23,42,0.09)]"
    >
      <div className="grid min-h-[236px] grid-cols-[190px_minmax(0,1fr)] sm:grid-cols-[205px_minmax(0,1fr)]">
        <div className="relative min-h-[236px] overflow-hidden bg-[#f1f4f6]">
          {image ? (
            <img
              src={image}
              alt={post.headline}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400">
              No image
            </div>
          )}
        </div>

        <div className="min-w-0 bg-white px-3.5 py-3 sm:px-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5 text-[9px] font-semibold text-slate-500">
              {badge ? (
                <>
                  <span className={isBusiness ? "text-[#0e9f75]" : "text-[#5e39e6]"}>{badge}</span>
                  <span className="text-slate-300">•</span>
                </>
              ) : null}
              <span className="inline-flex min-w-0 items-center gap-1 truncate text-slate-500">
                <MapPin className="h-3 w-3 shrink-0" />
                {post.location || "Bangladesh"}
              </span>
            </div>
            {post.businessStatus && post.postRole === "business_owner" ? (
              <span className="shrink-0 rounded-full bg-[#eaf8f2] px-2 py-1 text-[8px] font-bold text-[#15966f]">
                {post.businessStatus === "new"
                  ? "New Business"
                  : post.businessStatus === "closed"
                    ? "Closed"
                    : "Active Business"}
              </span>
            ) : null}
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
                  <div className={cn("truncate text-[9px] font-medium", index === 0 ? "text-white/90" : "text-slate-400")}>
                    {field.label || field.labelBn || field.key}
                  </div>
                  <div className={cn("mt-1 truncate text-[14px] font-extrabold", index === 0 ? "text-white" : "text-slate-900")}>
                    {priceText(field)}
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
                <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-800">
                  <UserRound className="h-3 w-3 text-slate-500" />
                  <span className="truncate">{name}</span>
                  {verified ? <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#12a87c]" /> : null}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[8px] text-slate-400">
                  <span className="font-semibold text-slate-500">Post by</span>
                  <span className="font-bold text-slate-700">{name}</span>
                  <CalendarDays className="h-2.5 w-2.5" />
                  <span>{postedAgo(displayDate, now)}</span>
                </div>
                {post.subLocation ? (
                  <div className="mt-0.5 text-[8px] text-slate-400">{post.location} · {post.subLocation}</div>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={inviteStatus === "none" || inviteStatus === "rejected" || inviteStatus === "cancelled" ? invite : (e) => e.stopPropagation()}
                  disabled={inviteStatus === "pending" || inviteStatus === "accepted"}
                  className={cn(
                    "flex items-center gap-1 rounded-md border px-2 py-1.5 text-[8px] font-bold",
                    inviteStatus === "pending" || inviteStatus === "accepted"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-violet-200 bg-violet-50 text-violet-700",
                  )}
                >
                  <UserPlus className="h-3 w-3" />
                  {inviteStatus === "pending" ? "Invited" : inviteStatus === "accepted" ? "Accepted" : "Invite"}
                </button>
                <button type="button" onClick={(e) => e.stopPropagation()} className="rounded-md border border-slate-200 p-1.5 text-slate-500">
                  <MessageCircle className="h-3 w-3" />
                </button>
                <button type="button" onClick={(e) => e.stopPropagation()} className="rounded-md border border-slate-200 p-1.5 text-slate-500">
                  <Phone className="h-3 w-3" />
                </button>
                <span className="rounded-md bg-[#111827] p-1.5 text-white">
                  <ArrowUpRight className="h-3 w-3" />
                </span>
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
