"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../app/context/LanguageContext";
import { getImageUrl } from "../utils/imageUrl";
import VerifiedBadge from "./VerifiedBadge";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PremiumUser {
  _id: string;
  name: string;
  storeName?: string;
  photo?: string;
  merchantType?: "Premium";
  verifiedBy?: string;
  mVerified?: boolean;
  hasPromotedAds?: boolean;
  profileViews?: number;
  followers?: any[];
  isFollowing?: boolean;
}

interface MerchantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  premiumUsers: PremiumUser[];
  onProfileClick: (userId: string) => void;
  onFollowUser: (e: React.MouseEvent, userId: string) => void;
}

const PAGE_SIZE = 10;

export default function MerchantsModal({
  isOpen,
  onClose,
  premiumUsers,
  onProfileClick,
  onFollowUser,
}: MerchantsModalProps) {
  const { t, language } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);

  // const promotedMerchants = premiumUsers.filter(
  //   (user) => user.hasPromotedAds === true,
  // );

  // uncomment this line to show all merchants instead of only promoted ones
  const promotedMerchants = premiumUsers;

  const totalPages = Math.max(
    1,
    Math.ceil(promotedMerchants.length / PAGE_SIZE),
  );

  // Reset to page 1 whenever the modal is opened
  useEffect(() => {
    if (isOpen) setCurrentPage(1);
  }, [isOpen]);

  // Guard against being stuck on a page that no longer exists (e.g. list shrinks)
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  if (!isOpen) return null;

  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageItems = promotedMerchants.slice(startIdx, startIdx + PAGE_SIZE);

  const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="fixed inset-0 z-[1200] flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-[565px] rounded-t-lg rounded-b-none overflow-hidden flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-2xl h-[calc(100vh-80px)] font-sans">
        {/* Header */}
        <div className="flex items-center justify-between p-2 px-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-black hover:bg-slate-50 rounded-full transition-colors"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <h2 className="text-[16px] text-black font-medium">
              {language === "bn" ? "জনপ্রিয় বিক্রেতা" : "Popular Merchants"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-50 rounded-full"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-white">
          {promotedMerchants.length === 0 ? (
            <div className="py-20 text-center text-black text-sm italic px-4">
              <p>
                {language === "bn"
                  ? "কোনো বিক্রেতা পাওয়া যায়নি"
                  : "No merchants found"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pageItems.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div
                    className="shrink-0 cursor-pointer"
                    onClick={() => {
                      onProfileClick(user._id);
                      onClose();
                    }}
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-100 bg-slate-200 relative group">
                      {user.photo ? (
                        <img
                          src={getImageUrl(user.photo) || undefined}
                          alt={user.storeName || user.name}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-black font-bold text-xl uppercase">
                          {(user.storeName || user.name).charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div
                      className="flex items-center gap-1.5 cursor-pointer group/name"
                      onClick={() => {
                        onProfileClick(user._id);
                        onClose();
                      }}
                    >
                      <h4 className="text-black text-[15px] truncate group-hover/name:text-[#0088cc] transition-colors">
                        {user.storeName || user.name}
                      </h4>
                      {user.mVerified && (
                        <VerifiedBadge className="translate-y-[0.5px]" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {user.followers?.length || 0} {t("follower")}
                    </p>
                  </div>

                  <button
                    onClick={(e) => onFollowUser(e, user._id)}
                    className={cn(
                      "flex items-center justify-center gap-1 px-3 h-7 border rounded-full text-[11px] font-bold transition-all shrink-0",
                      user.isFollowing
                        ? "bg-slate-100 text-slate-500 border-slate-300"
                        : "border-slate-300 text-slate-500 hover:bg-slate-50 hover:border-slate-400",
                    )}
                  >
                    {!user.isFollowing && (
                      <span className="text-sm leading-none -mt-0.5">+</span>
                    )}
                    {user.isFollowing ? t("Unfollow") : t("Follow")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {promotedMerchants.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-white shrink-0">
            <button
              onClick={goPrev}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-300 text-xs font-bold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {language === "bn" ? "পূর্ববর্তী" : "Prev"}
            </button>

            {/* <span className="text-[11px] text-slate-500 font-medium">
              {language === "bn"
                ? `পৃষ্ঠা ${currentPage} / ${totalPages}`
                : `Page ${currentPage} of ${totalPages}`}
            </span> */}

            <button
              onClick={goNext}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-300 text-xs font-bold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              {language === "bn" ? "পরবর্তী" : "Next"}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}