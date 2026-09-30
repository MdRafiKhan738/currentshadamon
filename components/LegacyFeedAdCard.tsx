"use client";

import React, { useState } from "react";
import { Grid, MapPin } from "lucide-react";
import { getImageUrl } from "../utils/imageUrl";
import { getNonHighlightLabels, hasHighlightLabel } from "../utils/labels";
import { useLanguage } from "../app/context/LanguageContext";
import VerifiedBadge from "./VerifiedBadge";
import { timeAgo } from "../utils/timeAgo";

const LEGACY_API_BASE = "https://api.shadamon.com";

type Props = {
  ad: any;
  variant: "big" | "small";
  onOpen: () => void;
};

function resolveImage(path?: string) {
  return getImageUrl(path || "");
}

function LegacyImage({
  path,
  alt,
  className,
  big = false,
}: {
  path?: string;
  alt: string;
  className: string;
  big?: boolean;
}) {
  const [src, setSrc] = useState(() => resolveImage(path));

  const fallback = (() => {
    const raw = String(path || "");
    if (!raw || raw.startsWith("http") || raw.startsWith("data:") || raw.startsWith("blob:")) return "";
    return LEGACY_API_BASE + (raw.startsWith("/") ? raw : "/" + raw);
  })();

  return (
    <>
      <img
        src={src || undefined}
        alt=""
        className={className}
        onError={() => {
          if (fallback && src !== fallback) setSrc(fallback);
        }}
      />
      {src ? (
        <img
          src={src}
          alt={alt}
          className={big ? "relative z-10 w-full h-full object-contain" : className.replace("absolute", "relative").replace(" z-10", "")}
          loading="lazy"
          onError={() => {
            if (fallback && src !== fallback) setSrc(fallback);
          }}
        />
      ) : null}
    </>
  );
}

export default function LegacyFeedAdCard({ ad, variant, onOpen }: Props) {
  const { language } = useLanguage();

  if (variant === "big") {
    return (
      <div
        onClick={onOpen}
        className={
          "bg-white rounded-lg lg:rounded-xl cursor-pointer group block border shadow-sm mx-[5px] lg:mx-0 " +
          (hasHighlightLabel(ad)
            ? "border-orange-500 shadow-[0_12px_30px_rgba(249,115,22,0.25)] ring-2 ring-orange-400/40"
            : "border-slate-100")
        }
      >
        <div className="relative aspect-[16/9] w-full rounded-t-lg lg:rounded-t-xl overflow-hidden group bg-slate-50">
          <LegacyImage
            path={ad.images?.[0]}
            alt={ad.headline || "Ad"}
            className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-80"
            big
          />
          {getNonHighlightLabels(ad).length > 0 && (
            <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
              {getNonHighlightLabels(ad).map((label: string) => (
                <span
                  key={label}
                  className="bg-white/90 text-[10px] font-bold text-slate-800 px-2 py-0.5 rounded border border-slate-200 shadow-sm"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="p-2.5 lg:p-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-[10px] lg:text-[11px] text-black mb-0.5">
                <span>{ad.adType === "Promoted" ? "Promoted By" : "Post By"}</span>
                <button
                  type="button"
                  className="font-bold text-black cursor-pointer hover:text-blue-600 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.dispatchEvent(
                      new CustomEvent("open-account-modal", {
                        detail: { userId: ad?.user?._id },
                      }),
                    );
                  }}
                >
                  {ad.user?.storeName || ad.user?.name || "User"}
                </button>
                {ad.user?.mVerified && <VerifiedBadge className="translate-y-[0.5px]" />}
              </div>

              <h3 className="font-bold text-base lg:text-lg text-black leading-tight mb-0 line-clamp-1">
                {ad.headline}
              </h3>

              {ad.price !== undefined && ad.price !== null && (
                <div className="font-bold text-sm lg:text-base text-black mb-0.5 lg:mb-1">
                  ৳ {Number(ad.price).toLocaleString()}
                </div>
              )}

              <div className="flex items-center gap-2 lg:gap-3 text-[10px] text-black">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-black" />
                  {ad.location}
                </div>
                <div className="flex items-center gap-1">
                  <Grid className="w-3 h-3 text-black" />
                  {ad.category}
                </div>
              </div>
            </div>

            {ad.adType === "Promoted" && ad.promoteType === "traffic" && ad.trafficLink ? (
              <a
                href={ad.trafficLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="border border-slate-300 text-black bg-gray-200 px-2 lg:px-3 py-0.5 lg:py-1 rounded text-[10px] lg:text-xs font-bold hover:bg-slate-50"
              >
                {ad.trafficButtonType || "Visit"}
              </a>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen();
                }}
                className="border border-slate-300 text-black bg-gray-200 px-2 lg:px-3 py-0.5 lg:py-1 rounded text-[10px] lg:text-xs font-bold hover:bg-slate-50"
              >
                Detail
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      key={ad._id}
      onClick={onOpen}
      className={
        "bg-white rounded-lg lg:rounded-lg p-0.5 lg:p-3 flex gap-2 cursor-pointer transition-colors hover:bg-slate-50 border mx-[5px] lg:mx-0 " +
        (hasHighlightLabel(ad)
          ? "border-orange-500 shadow-[0_10px_25px_rgba(249,115,22,0.18)] ring-2 ring-orange-400/30"
          : "border-transparent")
      }
    >
      <div className="w-[120px] h-[90px] lg:w-[160px] lg:h-[130px] rounded-lg overflow-hidden shrink-0 relative bg-slate-50">
        {resolveImage(ad.images?.[0]) ? (
          <>
            <img
              src={resolveImage(ad.images?.[0]) || undefined}
              alt=""
              className="absolute inset-0 w-full h-full object-contain blur scale-140 opacity-80"
              onError={(e) => {
                const fallback = String(ad.images?.[0] || "");
                if (fallback && !fallback.startsWith("http") && !fallback.startsWith("data:")) {
                  const target = e.currentTarget;
                  target.src = LEGACY_API_BASE + (fallback.startsWith("/") ? fallback : "/" + fallback);
                }
              }}
            />
            <img
              src={resolveImage(ad.images?.[0]) || undefined}
              alt={ad.headline}
              className="relative z-10 w-full h-full object-contain"
              loading="lazy"
              onError={(e) => {
                const fallback = String(ad.images?.[0] || "");
                if (fallback && !fallback.startsWith("http") && !fallback.startsWith("data:")) {
                  const target = e.currentTarget;
                  target.src = LEGACY_API_BASE + (fallback.startsWith("/") ? fallback : "/" + fallback);
                }
              }}
            />
          </>
        ) : null}

        {getNonHighlightLabels(ad).length > 0 && (
          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
            {getNonHighlightLabels(ad).map((label: string) => (
              <span
                key={label}
                className="bg-white/90 text-[10px] font-bold text-slate-800 px-2 py-0.5 rounded border border-slate-200 shadow-sm"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-1 text-[9px] lg:text-[10px] text-slate-500 lg:text-black mb-0.5 flex-wrap">
          <span>{ad.adType === "Promoted" ? "Promoted By" : "Post By"}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="font-bold text-black hover:text-blue-600 hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(
                  new CustomEvent("open-account-modal", {
                    detail: { userId: ad.user?._id },
                  }),
                );
              }}
            >
              {ad.user?.storeName || ad.user?.name || "User"}
            </button>
            {ad.user?.mVerified && <VerifiedBadge className="translate-y-[0.5px]" />}
          </div>
        </div>

        <h4 className="text-[15px] text-black font-semibold line-clamp-1 leading-tight mb-0">
          {ad.headline}
        </h4>

        {ad.price !== undefined && ad.price !== null && (
          <div className="text-[15px] lg:text-sm text-black font-semibold leading-tight mb-1">
            ৳ {Number(ad.price).toLocaleString()}
          </div>
        )}

        <div className="flex items-center gap-0 text-[9px] lg:text-[10px] text-black group-hover:text-black flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 shrink-0">
              <MapPin className="w-2.5 h-2.5" />
              <span className="truncate max-w-[110px] md:max-w-[120px]">{ad.location}</span>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <Grid className="w-2.5 h-2.5" />
              <span className="truncate max-w-[110px] md:max-w-[120px]">{ad.category}</span>
            </div>
          </div>

          {ad.adType !== "Promoted" && (
            <div className="w-full text-right text-black/60 text-[9px] lg:text-[10px] whitespace-nowrap">
              {timeAgo(ad.createdAt, language as "en" | "bn")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
