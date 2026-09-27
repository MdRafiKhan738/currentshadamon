"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  X,
  Maximize2,
  MapPin,
  Grid,
  Eye,
  Share2,
  Phone,
  MessageCircle,
  ChevronUp,
  ChevronDown,
  Rocket,
  CheckCircle2,
  Truck,
  Undo2,
  Timer,
  ExternalLink,
  ChevronRight,
  Star,
  Bell,
  Search,
  Heart,
  AlertCircle,
  Contact,
  UserSquare2,
  SquareArrowOutUpRight,
  Send,
  SlidersHorizontal,
  Settings,
  LogOut,
  Inbox,
  Plus,
  Home,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  RiMailFill,
  RiShareBoxLine,
  RiMoreLine,
  RiStarFill,
  RiPhoneFill,
  RiAlarmWarningFill,
} from "react-icons/ri";
import AdDisplay from "./AdDisplay";
import {
  FaWhatsapp,
  FaTelegramPlane,
  FaFacebookMessenger,
  FaFacebook,
} from "react-icons/fa";
import { API_BASE_URL } from "../utils/apiConfig";
// Use centralized url helper
import { getImageUrl } from "../utils/imageUrl";
import { getNonHighlightLabels, hasHighlightLabel } from "../utils/labels";
import { formatDistanceToNow } from "date-fns";
import { useRef, useEffect } from "react";
import Cookies from "js-cookie";
import { useLanguage } from "../app/context/LanguageContext";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import InfoModal from "./InfoModal";
import { useSettings } from "../app/context/SettingsContext";
import VerifiedBadge from "./VerifiedBadge";
import ReportModal from "./ReportModal";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface AdDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: any; // Using any for flexibility with existing ad object structure
  initialReportOpen?: boolean;
}

export default function AdDetailsModal({
  isOpen,
  onClose,
  ad,
  initialReportOpen,
}: AdDetailsModalProps) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && initialReportOpen) {
      setIsReportModalOpen(true);
    }
  }, [isOpen, initialReportOpen]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "shipping">("details");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [showOptionsPopup, setShowOptionsPopup] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isHeadlineExpanded, setIsHeadlineExpanded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [subLocations, setSubLocations] = useState<any[]>([]);

  const [actionButtons, setActionButtons] = useState<string[]>([
    "Call",
    "Chat",
  ]);
  const { t, language } = useLanguage();
  const router = useRouter();
  const { settings } = useSettings();
  const popupRef = useRef<HTMLDivElement>(null);
  const optionsButtonRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [localFollowers, setLocalFollowers] = useState<any[]>(
    ad?.user?.followers || [],
  );

  useEffect(() => {
    setLocalFollowers(ad?.user?.followers || []);
  }, [ad?.user?.followers]);

  useEffect(() => {
    const handleGlobalFollow = (e: any) => {
      const { userId, followers } = e.detail;
      const adUserId = ad.user?._id || ad.user;
      if (adUserId === userId) {
        setLocalFollowers(followers);
      }
    };
    window.addEventListener(
      "user-followed",
      handleGlobalFollow as EventListener,
    );
    return () =>
      window.removeEventListener(
        "user-followed",
        handleGlobalFollow as EventListener,
      );
  }, [ad?.user?._id, ad?.user]);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        optionsButtonRef.current &&
        !optionsButtonRef.current.contains(event.target as Node)
      ) {
        setShowOptionsPopup(false);
        setShowShareOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Real Data States
  const [promotedAds, setPromotedAds] = useState<any[]>([]);
  const [similarAds, setSimilarAds] = useState<any[]>([]);

  const images = ad?.images || [];
  const hasImages = images.length > 0;

  // Reset states when ad changes
  useEffect(() => {
    setIsDescriptionExpanded(false);
    setIsHeadlineExpanded(false);
    setCurrentImageIndex(0);
    setShowPhone(false);
    // Reset favorited/notifying local states until re-fetched
    setIsFavorited(false);
    setIsNotifying(false);
    // Scroll to top when ad changes
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [ad?._id]);

  // Fetch Ads Effect and Subcategory Info
  React.useEffect(() => {
    if (isOpen && ad) {
      // Fetch All Ads
      fetch(`${API_BASE_URL}/api/ads/public/all`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const allAds = data.data;

            // Filter Promoted Ads
            const promoted = allAds.filter(
              (a: any) => a.adType === "Promoted" && a._id !== ad._id,
            );
            setPromotedAds(promoted);

            // Filter Similar Ads (Same Category)
            const similar = allAds
              .filter(
                (a: any) => a.category === ad.category && a._id !== ad._id,
              )
              .sort((a: any, b: any) => (a.adType === "Promoted" ? -1 : 1));
            setSimilarAds(similar);
          }
        })
        .catch((err) => console.error("Error fetching modal ads:", err));

      // Fetch Subcategories to determine button types
      fetch(`${API_BASE_URL}/api/categories/sub`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            let buttonTypeRaw = "";

            // 1. Try to find buttonType directly if subCategory is fully populated object
            if (
              typeof ad.subCategory === "object" &&
              ad.subCategory?.buttonType
            ) {
              buttonTypeRaw = ad.subCategory.buttonType;
            }
            // 2. Otherwise find in fetched list
            else {
              const identifier =
                typeof ad.subCategory === "object"
                  ? ad.subCategory?._id
                  : ad.subCategory;

              // Finds match by ID or Name (in case ad store subcategory name)
              const matchedSub = data.data.find(
                (s: any) => s._id === identifier || s.name === identifier,
              );

              if (matchedSub) {
                buttonTypeRaw = matchedSub.buttonType;
              }
            }

            setSubcategories(data.data);

            if (buttonTypeRaw) {
              const buttons = buttonTypeRaw
                .split(",")
                .map((s: string) => s.trim());
              setActionButtons(buttons);
            } else {
              // Fallback default
              setActionButtons(["Call", "Message"]);
            }
          }
        })
        .catch((err) => console.error("Error fetching subcategories:", err));

      // Fetch Categories to determine parent category names
      fetch(`${API_BASE_URL}/api/categories`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setCategories(data.data);
          }
        })
        .catch((err) => console.error("Error fetching categories:", err));

      // Fetch Locations and SubLocations for Bangla name support
      fetch(`${API_BASE_URL}/api/locations`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setLocations(data.data);
        })
        .catch(() => {});
      fetch(`${API_BASE_URL}/api/locations/sub`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setSubLocations(data.data);
        })
        .catch(() => {});

      // Fetch current user if token exists to check ownership and favorites
      const token = Cookies.get("token");
      if (token) {
        fetch(`${API_BASE_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data && data._id) {
              setCurrentUserId(data._id);
              setCurrentUser(data);

              // Set favorite status
              const favorited = (data.favorites || []).some(
                (favId: any) =>
                  (typeof favId === "string" ? favId : favId?._id) === ad._id,
              );
              setIsFavorited(favorited);

              // Set notify status
              const adSubCat =
                typeof ad.subCategory === "object"
                  ? ad.subCategory?.name
                  : ad.subCategory;
              const adLoc =
                typeof ad.location === "object"
                  ? ad.location?.name
                  : ad.location;

              const notifying = (data.notifyPreferences || []).some(
                (p: any) => p.subCategory === adSubCat && p.location === adLoc,
              );
              setIsNotifying(notifying);
            }
          })
          .catch((err) => console.error("Error fetching current user:", err));
      }
    }
  }, [isOpen, ad?._id, currentUserId]);

  const handlePromotePost = () => {
    const token = Cookies.get("token");
    if (!token) {
      window.dispatchEvent(new CustomEvent("open-mobile-entry-modal"));
      onClose();
      return;
    }

    const adOwnerId = typeof ad.user === "object" ? ad.user?._id : ad.user;
    const isOwnAd = currentUserId === adOwnerId;

    if (isOwnAd) {
      window.dispatchEvent(
        new CustomEvent("open-promote-modal", { detail: { ad } }),
      );
    } else {
      window.dispatchEvent(new CustomEvent("open-post-ad-modal"));
    }
    onClose();
  };

  const handleSellFaster = () => {
    window.dispatchEvent(new Event("open-footer-promote-modal"));
    onClose();
  };

  const handleReportClick = () => {
    const token = Cookies.get("token");
    if (!token) {
      window.dispatchEvent(
        new CustomEvent("open-mobile-entry-modal", {
          detail: { reason: "report", ad: ad },
        }),
      );
      onClose();
      return;
    }
    setIsReportModalOpen(true);
    setShowOptionsPopup(false);
  };

  const handleChatClick = () => {
    const token = Cookies.get("token");
    if (!token) {
      window.dispatchEvent(
        new CustomEvent("open-mobile-entry-modal", {
          detail: { reason: "message", ad: ad },
        }),
      );
      onClose();
      return;
    }
    window.dispatchEvent(
      new CustomEvent("open-chat-modal", { detail: { ad } }),
    );
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasImages) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasImages) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + images.length) % images.length,
      );
    }
  };

  const adLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/d?ad=${ad?._id}`
      : "";
  const primaryPhone =
    ad?.phone && String(ad.phone) !== "undefined"
      ? String(ad.phone).trim()
      : "";
  const mobileContactRows = (() => {
    const map = new Map<string, Set<string>>();

    if (primaryPhone) {
      map.set(primaryPhone, new Set(["mobile"]));
    }

    if (Array.isArray(ad?.additionalPhones)) {
      ad.additionalPhones.forEach((ap: any) => {
        let apObj: any = ap;
        if (typeof ap === "string") {
          try {
            apObj = JSON.parse(ap);
          } catch {
            apObj = null;
          }
        }

        const number = String(apObj?.number || "").trim();
        if (!number || number === "undefined") return;

        const types =
          Array.isArray(apObj?.types) && apObj.types.length > 0
            ? apObj.types.map((t: string) => String(t).trim().toLowerCase())
            : ["mobile"];

        if (!map.has(number)) {
          map.set(number, new Set());
        }

        const rowTypes = map.get(number);
        if (rowTypes) {
          types.forEach((t: string) => rowTypes.add(t));
        }
      });
    }

    return Array.from(map.entries()).map(([number, typeSet]) => ({
      number,
      types: Array.from(typeSet),
    }));
  })();
  const toIntlPhone = (num: string) => {
    const clean = String(num || "").trim();
    return clean.startsWith("+") ? clean : `+88${clean}`;
  };
  const otherContactRows = mobileContactRows.slice(primaryPhone ? 1 : 0);

  if (!isOpen || !ad) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-[565px] rounded-t-lg rounded-b-none overflow-hidden flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-2xl h-[calc(100vh-80px)] font-sans">
        {/* 1. Header */}
        <div className="flex items-center justify-between p-2 px-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-black hover:bg-slate-50 rounded-full transition-colors"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <h2 className="text-[16px] text-black font-medium">Ad Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-50 rounded-full"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto bg-white pb-32"
        >
          {/* 2. Image Gallery */}
          <div className="relative w-full aspect-[16/9] overflow-hidden group bg-slate-50">
            {hasImages ? (
              <>
                <img
                  src={getImageUrl(images[currentImageIndex]) || undefined}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60"
                />
                <img
                  src={getImageUrl(images[currentImageIndex]) || undefined}
                  alt={ad.headline}
                  className="relative z-10 w-full h-full object-contain cursor-pointer"
                  onClick={() => setIsExpanded(true)}
                  loading="lazy"
                />
                {/* {ad.adType === "Promoted" && settings.watermarkLogo && (
                  <div className="absolute bottom-4 right-4 z-20 pointer-events-none opacity-100">
                    <img
                      src={getImageUrl(settings.watermarkLogo)}
                      alt=""
                      className="w-30 h-20 object-contain"
                    />
                  </div>
                )} */}
                {settings.watermarkLogo && (
                  <div className="absolute bottom-4 right-4 z-20 pointer-events-none opacity-100">
                    <img
                      src={getImageUrl(settings.watermarkLogo)}
                      alt=""
                      className="w-30 h-20 object-contain"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-100 italic">
                No Image Available
              </div>
            )}

            {/* Expand Icon */}
            <button
              onClick={() => setIsExpanded(true)}
              className="absolute top-4 right-4 w-8 h-8 bg-white text-black border-2 border-black rounded-md flex items-center justify-center z-10 shadow-sm hover:bg-slate-50 transition-transform hover:scale-105"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Pagination Dots */}
            {hasImages && images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 bg-black/30 rounded-full backdrop-blur-sm z-10">
                {images.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentImageIndex === idx
                        ? "bg-white scale-125"
                        : "bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="p-3">
            {/* 3. Meta Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[10px] sm:text-xs text-slate-500 mb-1.5 font-medium gap-1 sm:gap-0">
              <div className="flex items-center gap-1 text-[#0088cc] sm:order-2">
                <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="mr-1">{ad.deliveryCount || 0} Delivered</span>
                <span>{ad.views || 0} Views</span>
              </div>
              <div className="flex items-center gap-3 sm:order-1 min-w-0 overflow-hidden">
                <div className="flex items-center gap-1 min-w-0">
                  <MapPin className="w-3 h-3 shrink-0 text-slate-500" />
                  {(() => {
                    const subLocName =
                      typeof ad.subLocation === "object"
                        ? ad.subLocation?.name
                        : ad.subLocation;
                    const locName =
                      typeof ad.location === "object"
                        ? ad.location?.name
                        : ad.location;
                    let subLocDisplay = subLocName;
                    let locDisplay = locName;
                    if (language === "bn") {
                      const matchedSubLoc = subLocations.find(
                        (s: any) =>
                          s.name === subLocName || s._id === ad.subLocation,
                      );
                      const matchedLoc = locations.find(
                        (l: any) => l.name === locName || l._id === ad.location,
                      );
                      subLocDisplay =
                        matchedSubLoc?.subLocationNameBn || subLocName;
                      locDisplay = matchedLoc?.locationNameBn || locName;
                    }
                    return (
                      <>
                        {subLocDisplay && (
                          <span
                            className="truncate cursor-pointer hover:text-[#0088cc] transition-colors"
                            onClick={() =>
                              router.push(
                                `/d?subLocation=${encodeURIComponent(subLocName || "")}`,
                              )
                            }
                          >
                            {subLocDisplay}
                          </span>
                        )}
                        {subLocDisplay && locDisplay && (
                          <span className="shrink-0">,</span>
                        )}
                        {locDisplay && (
                          <span
                            className="truncate cursor-pointer hover:text-[#0088cc] transition-colors"
                            onClick={() =>
                              router.push(
                                `/d?location=${encodeURIComponent(locName || "")}`,
                              )
                            }
                          >
                            {locDisplay}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-1 min-w-0">
                  <Grid className="w-3 h-3 shrink-0 text-slate-500" />
                  {(() => {
                    const subCatId =
                      typeof ad.subCategory === "object"
                        ? ad.subCategory?._id
                        : ad.subCategory;
                    const subCatName =
                      typeof ad.subCategory === "object"
                        ? ad.subCategory?.name
                        : ad.subCategory;
                    const catName =
                      typeof ad.category === "object"
                        ? ad.category?.name
                        : ad.category;
                    let subCatDisplay = subCatName;
                    let catDisplay = catName;
                    if (language === "bn") {
                      const matchedSubCat = subcategories.find(
                        (s: any) => s._id === subCatId || s.name === subCatName,
                      );
                      const matchedCat = categories.find(
                        (c: any) => c.name === catName || c._id === ad.category,
                      );
                      subCatDisplay =
                        matchedSubCat?.subCategoryNameBn || subCatName;
                      catDisplay = matchedCat?.categoryNameBn || catName;
                    }
                    return (
                      <>
                        {subCatDisplay && (
                          <span
                            className="truncate cursor-pointer hover:text-[#0088cc] transition-colors"
                            onClick={() =>
                              router.push(
                                `/d?subCategory=${encodeURIComponent(subCatName || "")}`,
                              )
                            }
                          >
                            {subCatDisplay}
                          </span>
                        )}
                        {subCatDisplay && catDisplay && (
                          <span className="shrink-0">,</span>
                        )}
                        {catDisplay && (
                          <span
                            className="truncate cursor-pointer hover:text-[#0088cc] transition-colors"
                            onClick={() =>
                              router.push(
                                `/d?category=${encodeURIComponent(catName || "")}`,
                              )
                            }
                          >
                            {catDisplay}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* 4. Title & Price */}
            <h1
              className={cn(
                "text-base text-slate-800 leading-none mb-0.5 cursor-pointer select-none",
                !isHeadlineExpanded && "truncate",
              )}
              onClick={() => setIsHeadlineExpanded(!isHeadlineExpanded)}
            >
              {ad.headline}
            </h1>
            <div className="flex items-center gap-2 mb-1">
              {/* <p className="text-xs text-slate-900 font-bold">
                                {ad.price ? `৳ ${ad.price.toLocaleString()}` : t('price_on_ask')}
                            </p> */}
              {ad.price && (
                <p className="text-xs text-slate-900 font-bold">
                  ৳ {ad.price.toLocaleString()}
                </p>
              )}
              {ad.price && (
                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  {ad.priceType === "Negotiable"
                    ? t("price_negotiable")
                    : t("price_fixed")}
                </span>
              )}
            </div>

            {/* 5. Contact Section */}
            <div className="bg-slate-200 rounded-lg mt-2 mb-2 p-3 border border-slate-100">
              {!(ad.hidePhone === true || ad.hidePhone === "true") && (
                <>
                  {/* Mobile Phone Rows */}
                  <div className="hidden mb-3 space-y-2">
                    <div className="flex items-center justify-between gap-2 rounded-md bg-white border border-slate-300 px-2.5 py-2">
                      <span className="text-[12px] text-slate-800 font-medium truncate">
                        {showPhone ? primaryPhone || "N/A" : "017 XXXXXXXX"}
                      </span>
                      <button
                        onClick={() => {
                          if (!showPhone) {
                            setShowPhone(true);
                            return;
                          }
                          if (primaryPhone) {
                            window.location.href = `tel:${primaryPhone}`;
                          }
                        }}
                        className="w-7 h-7 rounded-full bg-[#1A202C] text-white flex items-center justify-center shrink-0"
                      >
                        <Phone className="w-3.5 h-3.5 fill-white" />
                      </button>
                    </div>

                    {!showPhone && primaryPhone && (
                      <button
                        onClick={() => setShowPhone(true)}
                        className="text-[10px] text-slate-500 hover:text-blue-600 hover:underline text-left"
                      >
                        Click to show number
                      </button>
                    )}

                    {showPhone &&
                      otherContactRows.map((row, rowIdx) => (
                        <div
                          key={`${row.number}-${rowIdx}`}
                          className="flex items-center gap-2 px-1 py-0.5"
                        >
                          <span className="text-[12px] text-slate-800 font-medium truncate">
                            {row.number}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {(row.types.length > 0
                              ? row.types
                              : ["mobile"]
                            ).map((type, typeIdx) => {
                              if (type === "whatsapp") {
                                return (
                                  <button
                                    key={`${row.number}-wa-${typeIdx}`}
                                    onClick={() =>
                                      window.open(
                                        `https://wa.me/${toIntlPhone(row.number)}`,
                                        "_blank",
                                      )
                                    }
                                    className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center"
                                    title={`WhatsApp: ${row.number}`}
                                  >
                                    <FaWhatsapp className="w-4 h-4" />
                                  </button>
                                );
                              }
                              if (type === "telegram") {
                                return (
                                  <button
                                    key={`${row.number}-tg-${typeIdx}`}
                                    onClick={() =>
                                      window.open(
                                        `https://t.me/${toIntlPhone(row.number)}`,
                                        "_blank",
                                      )
                                    }
                                    className="w-7 h-7 rounded-full bg-[#0088cc] text-white flex items-center justify-center"
                                    title={`Telegram: ${row.number}`}
                                  >
                                    <FaTelegramPlane className="w-3.5 h-3.5" />
                                  </button>
                                );
                              }
                              if (type === "imo") {
                                return (
                                  <button
                                    key={`${row.number}-imo-${typeIdx}`}
                                    onClick={() => {
                                      window.location.href = `tel:${row.number}`;
                                    }}
                                    className="w-7 h-7 rounded-full bg-[#004c99] text-white flex items-center justify-center"
                                    title={`Imo: ${row.number}`}
                                  >
                                    <span className="text-[9px] font-black lowercase tracking-tight leading-none">
                                      imo
                                    </span>
                                  </button>
                                );
                              }

                              return (
                                <button
                                  key={`${row.number}-ph-${typeIdx}`}
                                  onClick={() => {
                                    window.location.href = `tel:${row.number}`;
                                  }}
                                  className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center"
                                  title={`Call: ${row.number}`}
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Main Number Section */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex flex-col leading-none justify-center min-w-0">
                      <div
                        className="flex items-center gap-1 cursor-pointer"
                        onClick={() => setShowPhone(!showPhone)}
                      >
                        <span className="text-slate-800 text-sm leading-none truncate">
                          {showPhone ? ad.phone || "N/A" : "017 XXXXXXXX"}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowPhone(!showPhone)}
                        className="text-[10px] text-slate-500 hover:text-blue-600 hover:underline text-left mt-0.5"
                      >
                        {showPhone ? "Hide number" : "Click to show number"}
                      </button>
                    </div>
                    <div className="h-6 w-[3px] bg-slate-400 mx-1 shrink-0" />
                    <button
                      onClick={() => {
                        if (!showPhone) {
                          setShowPhone(true);
                          return;
                        }
                        if (primaryPhone) {
                          window.location.href = `tel:${primaryPhone}`;
                        }
                      }}
                      className="w-8 h-8 rounded-full bg-[#1A202C] text-white flex items-center justify-center shrink-0"
                      title={
                        showPhone
                          ? `Call: ${primaryPhone || ""}`
                          : "Show number"
                      }
                    >
                      <Phone className="w-4 h-4 fill-white" />
                    </button>
                  </div>

                  {/* Plain text display of all numbers */}
                  {showPhone && otherContactRows.length > 0 && (
                    <div className="block mt-3 mb-3 px-1 space-y-2 border-t border-slate-300 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                        Others Number:
                      </p>
                      <div className="flex flex-col gap-2">
                        {otherContactRows.map((row, idx) => (
                          <div
                            key={`${row.number}-${idx}`}
                            className="flex items-center gap-4 group"
                          >
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(row.number);
                                toast.success("Number copied!");
                              }}
                              className="text-sm text-slate-700 font-medium hover:text-blue-600 transition-colors text-left truncate"
                              title="Copy number"
                            >
                              {row.number}
                            </button>
                            <div className="flex items-center gap-2.5">
                              {(row.types.length > 0
                                ? row.types
                                : ["mobile"]
                              ).map((type, typeIdx) => {
                                if (type === "whatsapp") {
                                  return (
                                    <button
                                      key={`${row.number}-desk-wa-${typeIdx}`}
                                      onClick={() =>
                                        window.open(
                                          `https://wa.me/${toIntlPhone(row.number)}`,
                                          "_blank",
                                        )
                                      }
                                      className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center"
                                      title={`WhatsApp: ${row.number}`}
                                    >
                                      <FaWhatsapp className="w-4 h-4" />
                                    </button>
                                  );
                                }
                                if (type === "imo") {
                                  return (
                                    <button
                                      key={`${row.number}-desk-imo-${typeIdx}`}
                                      onClick={() => {
                                        window.location.href = `tel:${row.number}`;
                                      }}
                                      className="w-8 h-8 rounded-full bg-[#004c99] text-white flex items-center justify-center"
                                      title={`Imo: ${row.number}`}
                                    >
                                      <span className="text-[10px] font-black lowercase tracking-tight leading-none">
                                        imo
                                      </span>
                                    </button>
                                  );
                                }
                                if (type === "telegram") {
                                  return (
                                    <button
                                      key={`${row.number}-desk-tg-${typeIdx}`}
                                      onClick={() =>
                                        window.open(
                                          `https://t.me/${toIntlPhone(row.number)}`,
                                          "_blank",
                                        )
                                      }
                                      className="w-8 h-8 rounded-full bg-[#0088cc] text-white flex items-center justify-center"
                                      title={`Telegram: ${row.number}`}
                                    >
                                      <FaTelegramPlane className="w-4 h-4" />
                                    </button>
                                  );
                                }

                                return (
                                  <button
                                    key={`${row.number}-desk-ph-${typeIdx}`}
                                    onClick={() => {
                                      window.location.href = `tel:${row.number}`;
                                    }}
                                    className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center"
                                    title={`Call: ${row.number}`}
                                  >
                                    <Phone className="w-4 h-4" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Quick Chat Row - Shown only if phone is hidden */}
              {(ad.hidePhone === true || ad.hidePhone === "true") && (
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-[160px] bg-[#EDF2F7] border border-slate-800 rounded-full py-1.5 px-4 cursor-pointer h-9 flex items-center shadow-sm"
                    onClick={handleChatClick}
                  >
                    <span className="text-sm text-slate-800">Hi ..</span>
                  </div>
                  <button
                    className="w-9 h-9 rounded-full bg-[#0088cc] flex items-center justify-center text-white shrink-0 shadow-md hover:bg-[#0077b5] transition-all active:scale-95"
                    onClick={handleChatClick}
                  >
                    <Send className="w-5 h-5 ml-0.5" />
                  </button>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex flex-row items-stretch gap-1.5 relative">
                {(() => {
                  const otherButtons = actionButtons.filter(
                    (b) => b !== "Chat" && b !== "Message",
                  );

                  return (
                    <>
                      {/* Call Button - Only if requested and phone available */}
                      {otherButtons.includes("Call") &&
                        !(
                          ad.hidePhone === true ||
                          ad.hidePhone === "true" ||
                          !ad.phone ||
                          String(ad.phone) === "undefined"
                        ) && (
                          <button
                            onClick={() => setShowPhone(!showPhone)}
                            className="flex-1 h-10 bg-[#1A202C] text-white text-xs px-1 rounded-md hover:bg-slate-800 transition-colors"
                          >
                            Call
                          </button>
                        )}

                      {/* Chat Button - ALWAYS SHOW */}
                      <button
                        className="flex-1 h-10 bg-[#1A202C] text-white text-xs px-1 rounded-md hover:bg-black transition-colors"
                        onClick={handleChatClick}
                      >
                        Chat
                      </button>

                      {/* Send CV Button - Only if requested */}
                      {otherButtons.includes("Send CV") && (
                        <button
                          onClick={async () => {
                            const token = Cookies.get("token");
                            if (!token) {
                              window.dispatchEvent(
                                new CustomEvent("open-mobile-entry-modal", {
                                  detail: { reason: "send_cv", ad: ad },
                                }),
                              );
                              onClose();
                              return;
                            }

                            const adOwnerId =
                              typeof ad.user === "object"
                                ? ad.user?._id
                                : ad.user;

                            const missingMobile =
                              !currentUser?.mobile && !currentUser?.phone;
                            if (
                              !currentUser?.gender ||
                              !currentUser?.location ||
                              !currentUser?.education ||
                              !currentUser?.profession ||
                              missingMobile ||
                              !currentUser?.email ||
                              !currentUser?.dob ||
                              !currentUser?.aboutYourself ||
                              !currentUser?.professionalExperience
                            ) {
                              window.dispatchEvent(
                                new CustomEvent("init-send-cv", {
                                  detail: { ad },
                                }),
                              );
                              onClose();
                              return;
                            }

                            const userName = currentUser?.name || "User";
                            const userPhone =
                              currentUser?.phone ||
                              currentUser?.mobile ||
                              "Not provided";
                            const userEmail =
                              currentUser?.email || "Not provided";
                            const userGender =
                              currentUser?.gender || "Not specified";
                            const userLocation =
                              currentUser?.location || "Not specified";
                            const userEducation =
                              currentUser?.education || "Not specified";
                            const userProfession =
                              currentUser?.profession || "Not specified";

                            const userDob = currentUser?.dob || "Not specified";
                            const userAbout =
                              currentUser?.aboutYourself || "Not provided";
                            const userExperience =
                              currentUser?.professionalExperience ||
                              "Not provided";

                            const message = `Interest in Ad: "${ad.headline}"

--- CV DETAILS ---
Name: ${userName}
DOB: ${userDob}
Gender: ${userGender}

Location: ${userLocation}

Education: ${userEducation}
Profession: ${userProfession}
Experience: ${userExperience}

About Myself:
${userAbout}

Contact Info:
Phone: ${userPhone}
Email: ${userEmail}

I have sent my CV for your review.`;

                            try {
                              const formData = new FormData();
                              formData.append("receiverId", adOwnerId);
                              formData.append("adId", ad._id);
                              formData.append("text", message);

                              const res = await fetch(
                                `${API_BASE_URL}/api/messages`,
                                {
                                  method: "POST",
                                  headers: { Authorization: `Bearer ${token}` },
                                  body: formData,
                                },
                              );

                              const data = await res.json();
                              if (data.success) {
                                // Open chat modal immediately
                                window.dispatchEvent(
                                  new CustomEvent("open-chat-modal", {
                                    detail: { ad },
                                  }),
                                );
                                // Optionally close this modal
                                // onClose();
                              } else {
                                alert(
                                  data.message ||
                                    "Failed to send CV. Please try again.",
                                );
                              }
                            } catch (err) {
                              console.error("Error sending CV:", err);
                              alert(
                                "An error occurred while sending your information.",
                              );
                            }
                          }}
                          className="flex-1 h-10 bg-[#1A202C] border border-[#1A202C] text-white text-xs px-2 rounded-md hover:bg-black transition-colors flex items-center justify-center"
                        >
                          <span className="whitespace-nowrap">Send CV</span>
                        </button>
                      )}
                    </>
                  );
                })()}
                <div className="shrink-0 flex items-center justify-end pl-0.5 relative">
                  <button
                    ref={optionsButtonRef}
                    onClick={() => setShowOptionsPopup(!showOptionsPopup)}
                    className="w-10 h-10 rounded-md border border-slate-400 bg-white flex items-center justify-center"
                  >
                    <SquareArrowOutUpRight
                      className="w-5 h-5 stroke-[1.8]"
                      color="#64748b"
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-4">
              {/* Tabs Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveTab("details");
                      setIsDetailsOpen(true);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold border rounded-md transition-all ${activeTab === "details" ? "border-slate-400 text-slate-800 bg-white shadow-sm" : "border-transparent text-slate-400 hover:bg-slate-50"}`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setShowShippingModal(true)}
                    className="px-3 py-1.5 text-xs font-bold border border-transparent text-slate-400 hover:bg-slate-50 rounded-md transition-all"
                  >
                    Shipping & Safety
                  </button>
                </div>
                <button onClick={() => setIsDetailsOpen(!isDetailsOpen)}>
                  <ChevronUp
                    className={`w-4 h-4 text-slate-400 transition-transform ${isDetailsOpen ? "" : "rotate-180"}`}
                  />
                </button>
              </div>

              {/* Tab Content */}
              {isDetailsOpen && (
                <div className="animate-in slide-in-from-top-2 duration-200 min-h-[80px]">
                  <div className="space-y-3">
                    {(() => {
                      const featuresObj =
                        typeof ad.features === "string"
                          ? JSON.parse(ad.features)
                          : ad.features || {};
                      if (Object.keys(featuresObj).length === 0) return null;

                      // Find subcategory to get feature order
                      const subCatIdentifier =
                        typeof ad.subCategory === "object"
                          ? ad.subCategory?._id
                          : ad.subCategory;
                      const matchedSub = subcategories.find(
                        (s: any) =>
                          s._id === subCatIdentifier ||
                          s.name === subCatIdentifier,
                      );
                      const orderedFeatureNames =
                        matchedSub?.features?.map((f: any) => f.name) || [];

                      // Sort features based on subcategory feature order
                      const sortedFeatures = Object.entries(featuresObj).sort(
                        ([keyA], [keyB]) => {
                          const indexA = orderedFeatureNames.indexOf(keyA);
                          const indexB = orderedFeatureNames.indexOf(keyB);
                          if (indexA !== -1 && indexB !== -1)
                            return indexA - indexB;
                          if (indexA !== -1) return -1;
                          if (indexB !== -1) return 1;
                          return 0;
                        },
                      );

                      return (
                        <div className="grid grid-cols-1 gap-y-1 mt-2 mb-2 p-0 pt-1 rounded-lg">
                          {sortedFeatures.map(([key, value]) => {
                            const featureData = matchedSub?.features?.find(
                              (f: any) => f.name === key,
                            );
                            const linkedSubId =
                              featureData?.subcategory?._id ||
                              featureData?.subcategory;
                            const linkedSub = subcategories.find(
                              (s: any) => s._id === linkedSubId,
                            );
                            const linkedSubName = linkedSub?.name;

                            const parentCatId =
                              linkedSub?.category?._id || linkedSub?.category;
                            const parentCat = categories.find(
                              (c: any) => c._id === parentCatId,
                            );
                            const parentCatName = parentCat?.name;
                            const rawValue = String(value ?? "").trim();
                            const valueParts = rawValue
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean);
                            const clickableValues =
                              valueParts.length > 0 ? valueParts : [rawValue];

                            const goToFilter = (
                              selectedValue: string,
                              searchOnly: boolean,
                            ) => {
                              const params = new URLSearchParams();

                              if (searchOnly) {
                                params.set("search", selectedValue);
                              } else if (linkedSubName) {
                                if (parentCatName)
                                  params.set("category", parentCatName);
                                params.set("subCategory", linkedSubName);
                              } else {
                                if (ad?.category)
                                  params.set("category", ad.category);
                                params.set("search", selectedValue);
                              }

                              router.push(`/d?${params.toString()}`);
                            };

                            return (
                              <div
                                key={key}
                                className="w-fit flex items-start gap-1.5 text-left rounded px-1 -mx-1"
                              >
                                <span className="text-xs text-black whitespace-nowrap shrink-0">
                                  {key}:
                                </span>
                                <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
                                  {clickableValues.map((item, idx) => (
                                    <React.Fragment
                                      key={`${key}-${item}-${idx}`}
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          goToFilter(
                                            item,
                                            clickableValues.length > 1,
                                          )
                                        }
                                        className="text-xs font-bold text-black outline-none underline-offset-2 hover:text-[#0088cc] hover:underline transition-colors cursor-pointer"
                                      >
                                        {item}
                                      </button>
                                      {idx < clickableValues.length - 1 && (
                                        <span className="text-xs text-slate-400">
                                          ,
                                        </span>
                                      )}
                                    </React.Fragment>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                    <div className="mt-3">
                      <h3 className="text-xs font-bold text-black mb-1.5">
                        {t("description")}
                      </h3>
                      <div className="text-xs text-slate-500 leading-relaxed">
                        <p
                          className={`whitespace-pre-wrap ${!isDescriptionExpanded ? "line-clamp-2" : ""}`}
                        >
                          {ad.description}
                          {isDescriptionExpanded && (
                            <button
                              onClick={() => setIsDescriptionExpanded(false)}
                              className="ml-2 text-xs font-bold text-black hover:underline"
                            >
                              {t("show_less")}
                            </button>
                          )}
                        </p>
                        {!isDescriptionExpanded && (
                          <div className="mt-0 flex justify-center">
                            <button
                              onClick={() => setIsDescriptionExpanded(true)}
                              className="px-3 py-1 rounded-full bg-gradient-to-r from-white via-slate-100 to-white text-xs font-bold text-black shadow-sm hover:text-[#0088cc] inline-flex items-center gap-1"
                            >
                              {t("read_more")}
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 7. Post Actions */}
            <div className="mt-4 mb-4 grid grid-cols-2 gap-2">
              <button
                onClick={handlePromotePost}
                className="w-full bg-white border border-black text-black text-sm rounded-lg py-2 flex items-center justify-center transition-colors shadow-sm hover:bg-slate-50 active:scale-[0.99]"
              >
                Add Free Post
              </button>
              <button
                onClick={handleSellFaster}
                className="w-full bg-white border border-black text-black text-sm rounded-lg py-2 flex items-center justify-center transition-colors shadow-sm hover:bg-slate-50 active:scale-[0.99]"
              >
                Sell Faster
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-200 w-full mb-1" />

            {/* 8. Promoted Section */}
            {promotedAds.length > 0 && (
              <div className="mb-2 relative group/promoted">
                <h3 className="text-black text-sm mb-2">Promoted</h3>
                <div
                  className="flex gap-3 overflow-x-auto no-scrollbar pb-2 scroll-smooth px-0.5"
                  id="promoted-scroll"
                >
                  {promotedAds.map((pad) => (
                    <div
                      key={pad._id}
                      className="min-w-[260px] max-w-[260px] bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm flex flex-col cursor-pointer shrink-0 snap-center"
                      onClick={() => {
                        if (
                          pad.adType === "Promoted" &&
                          pad.promoteType === "traffic" &&
                          pad.trafficLink
                        ) {
                          window.open(pad.trafficLink, "_blank");
                        } else {
                          const params = new URLSearchParams(
                            window.location.search,
                          );
                          params.set("ad", pad._id);
                          router.push(`/d?${params.toString()}`, {
                            scroll: false,
                          });
                        }
                      }}
                    >
                      <div className="relative h-40 bg-slate-100 overflow-hidden">
                        <img
                          src={getImageUrl(pad.images?.[0] || "")}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60"
                        />
                        <img
                          src={getImageUrl(pad.images?.[0] || "")}
                          alt={pad.headline}
                          className="relative z-10 w-full h-full object-contain"
                          loading="lazy"
                        />
                        {/* Top Left Badge */}
                        {/* <div className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-sm">
                                                    FEATURED
                                                </div> */}
                        {/* Top Right Star */}
                        <button className="absolute top-2 right-2 p-1.5 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-[2px] transition-colors">
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-2">
                        <h4 className="text-sm text-black truncate mb-1.5">
                          {pad.headline}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1.5">
                          <div className="flex items-center gap-1 min-w-0">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[100px]">
                              {pad.location}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 min-w-0">
                            <Grid className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[100px]">
                              {pad.category}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-black flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>
                              {pad.price
                                ? `৳ ${pad.price.toLocaleString()}`
                                : t("price_on_ask")}
                            </span>
                            {pad.price && (
                              <span className="text-[10px] text-slate-500 font-normal">
                                (
                                {pad.priceType === "Negotiable"
                                  ? t("price_negotiable")
                                  : t("price_fixed")}
                                )
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {promotedAds.length > 1 && (
                  <button
                    onClick={() => {
                      const el = document.getElementById("promoted-scroll");
                      if (el) el.scrollBy({ left: 270, behavior: "smooth" });
                    }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center text-slate-600 z-10"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
            <div className="h-px bg-slate-200 w-full mb-1" />
            {/* 9. Seller Information */}
            <div className="border-t border-b border-slate-100 py-3">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(
                      new CustomEvent("open-account-modal", {
                        detail: { userId: (ad as any).user?._id },
                      }),
                    );
                  }}
                >
                  {(ad as any).user?.storeLogo ? (
                    <img
                      src={getImageUrl((ad as any).user?.storeLogo)}
                      alt="Seller"
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-red-600 flex items-center justify-center text-white text-xl font-bold">
                      {(ad as any).user?.storeName?.charAt(0) ||
                        (ad as any).user?.name?.charAt(0) ||
                        "S"}
                    </div>
                  )}
                </div>

                {/* Info Column */}
                <div className="flex-1 flex flex-col pt-0.5">
                  <span className="text-[10px] text-slate-500 leading-none mb-0.5">
                    Seller Information
                  </span>

                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h4
                      className="font-bold text-slate-900 text-sm leading-tight cursor-pointer hover:text-blue-600 hover:underline max-w-[170px] sm:max-w-none truncate"
                      onClick={() => {
                        onClose();
                        window.dispatchEvent(
                          new CustomEvent("open-account-modal", {
                            detail: { userId: (ad as any).user?._id },
                          }),
                        );
                      }}
                    >
                      {(ad as any).user?.storeName ||
                        (ad as any).user?.name ||
                        "Store Name"}
                    </h4>
                    {(ad as any).user?.mVerified && (
                      <VerifiedBadge
                        className="-mt-0.5 ml-1"
                        iconClassName="w-5 h-5"
                        tooltipWidthClassName="w-[240px]"
                      />
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 leading-none mb-1">
                    {localFollowers?.length || 0} {t("follower")}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-black leading-tight mt-0.5">
                    <div className="text-black flex items-center font-medium">
                      {(ad as any).user?.rating || 0}
                      <span className="text-black font-normal ml-0.5">
                        ☆ Seller
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visit Shop Button */}
                <button
                  className="text-xs text-slate-600 hover:text-[#0088cc] whitespace-nowrap self-center pr-2 font-bold"
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(
                      new CustomEvent("open-account-modal", {
                        detail: { userId: (ad as any).user?._id },
                      }),
                    );
                  }}
                >
                  Visit Shop
                </button>
              </div>
            </div>
            <div className="h-px bg-slate-200 w-full mb-1" />

            {/* 10. Similar Product */}
            {similarAds.length > 0 && (
              <div className="">
                <h3 className="text-black text-sm mb-1">Similar Product</h3>
                <div className="space-y-3">
                  {similarAds.slice(0, 5).map((sad) => (
                    <div
                      key={sad._id}
                      className={cn(
                        "bg-white rounded-lg lg:rounded-lg p-0.5 lg:p-3 flex gap-2 cursor-pointer transition-colors hover:bg-slate-50 border mx-[5px] lg:mx-0",
                        hasHighlightLabel(sad)
                          ? "border-orange-500 shadow-[0_10px_25px_rgba(249,115,22,0.18)] ring-2 ring-orange-400/30"
                          : "border-transparent",
                      )}
                      onClick={() => {
                        if (
                          sad.adType === "Promoted" &&
                          sad.promoteType === "traffic" &&
                          sad.trafficLink
                        ) {
                          window.open(sad.trafficLink, "_blank");
                        } else {
                          const params = new URLSearchParams(
                            window.location.search,
                          );
                          params.set("ad", sad._id);
                          router.push(`/d?${params.toString()}`, {
                            scroll: false,
                          });
                        }
                      }}
                    >
                      <div className="w-[120px] h-[90px] lg:w-[160px] lg:h-[130px] rounded-lg overflow-hidden shrink-0 relative group-hover:scale-[1.02] transition-transform">
                        {getImageUrl(sad.images?.[0]) && (
                          <>
                            <img
                              src={getImageUrl(sad.images?.[0]) || ""}
                              alt=""
                              className="absolute inset-0 w-full h-full object-contain blur scale-140 opacity-80"
                            />
                            <img
                              src={getImageUrl(sad.images?.[0]) || ""}
                              alt={sad.headline}
                              className="relative z-10 w-full h-full object-contain"
                              loading="lazy"
                            />
                          </>
                        )}
                        {getNonHighlightLabels(sad).length > 0 && (
                          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                            {getNonHighlightLabels(sad).map((label: string) => (
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
                        <h4 className="text-[15px] text-black font-semibold line-clamp-1 leading-tight mb-0">
                          {sad.headline}
                        </h4>
                        <div className="text-[15px] lg:text-sm text-black font-semibold leading-tight mb-1">
                          {sad.price
                            ? `৳ ${sad.price.toLocaleString()}`
                            : t("price_on_ask")}
                        </div>
                        <div className="flex items-center gap-0 text-[9px] lg:text-[10px] text-black group-hover:text-black flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5 shrink-0">
                              <MapPin className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[110px] md:max-w-[120px]">
                                {sad.location}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <Grid className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[110px] md:max-w-[120px]">
                                {sad.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <AdDisplay positionId={3} className="mt-4 mb-2" />
          </div>
        </div>

        {/* Options Popup Overlay */}
        {showOptionsPopup && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/20 animate-in fade-in duration-200">
            <div
              ref={popupRef}
              className="w-[280px] bg-[#F8F9FB] rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.15)] border border-slate-200 p-4 animate-in zoom-in-95 duration-200"
            >
              {/* Top Row */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div
                  onClick={async () => {
                    const token = Cookies.get("token");
                    if (!token) {
                      window.dispatchEvent(
                        new CustomEvent("open-mobile-entry-modal"),
                      );
                      return;
                    }
                    try {
                      const res = await fetch(
                        `${API_BASE_URL}/api/user/notify-preference/toggle`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            subCategory:
                              typeof ad.subCategory === "object"
                                ? ad.subCategory?.name
                                : ad.subCategory,
                            location:
                              typeof ad.location === "object"
                                ? ad.location?.name
                                : ad.location,
                            adId: ad._id,
                          }),
                        },
                      );
                      const data = await res.json();
                      if (res.ok) {
                        setIsNotifying(data.isNotifying);
                        // toast.success(data.message);
                      } else {
                        alert(data.message || "Failed to update preference");
                      }
                    } catch (err) {
                      console.error("Error toggling notify preference:", err);
                    }
                  }}
                  className="flex flex-col items-center gap-1 cursor-pointer group"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full shadow-sm border flex items-center justify-center transition-colors",
                      isNotifying
                        ? "bg-teal-500 border-teal-600 text-white"
                        : "bg-slate-200 border-slate-200 text-slate-700 group-hover:bg-slate-300",
                    )}
                  >
                    <Bell
                      className={cn("w-5 h-5", isNotifying && "fill-current")}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium whitespace-nowrap",
                      isNotifying ? "text-teal-600" : "text-slate-600",
                    )}
                  >
                    {isNotifying ? "Notifying" : "Notify"}
                  </span>
                </div>
                <div
                  onClick={async () => {
                    const token = Cookies.get("token");
                    if (!token) {
                      window.dispatchEvent(
                        new CustomEvent("open-mobile-entry-modal", {
                          detail: { reason: "message", ad: ad },
                        }),
                      );
                      onClose();
                      return;
                    }
                    try {
                      const res = await fetch(
                        `${API_BASE_URL}/api/messages/call-me`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({ adId: ad._id }),
                        },
                      );
                      const data = await res.json();
                      if (data.success) {
                        setShowOptionsPopup(false);
                        // Open chat window after sending
                        window.dispatchEvent(
                          new CustomEvent("open-chat-modal", {
                            detail: { ad },
                          }),
                        );
                      } else {
                        alert(data.message || "Failed to send request");
                      }
                    } catch (err) {
                      console.error("Error sending call-me request:", err);
                    }
                  }}
                  className="flex flex-col items-center gap-1 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 shadow-sm border border-slate-200 flex items-center justify-center group-hover:bg-slate-300 transition-colors">
                    <Phone className="w-5 h-5 text-slate-700 fill-black" />
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap">
                    Call Me
                  </span>
                </div>
                <div
                  onClick={() => {
                    const cat =
                      typeof ad.category === "object"
                        ? ad.category?.name
                        : ad.category;
                    const sub =
                      typeof ad.subCategory === "object"
                        ? ad.subCategory?.name
                        : ad.subCategory;
                    const loc =
                      typeof ad.location === "object"
                        ? ad.location?.name
                        : ad.location;

                    const params = new URLSearchParams();
                    if (cat) params.set("category", cat);
                    if (sub) params.set("subCategory", sub);
                    if (loc) params.set("location", loc);

                    window.location.href = `/d?${params.toString()}`;
                  }}
                  className="flex flex-col items-center gap-1 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 shadow-sm border border-slate-200 flex items-center justify-center group-hover:bg-slate-300 transition-colors">
                    <Search className="w-5 h-5 text-slate-700" />
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium">
                    Similar
                  </span>
                </div>
                <div
                  onClick={() => {
                    const isMobile =
                      typeof window !== "undefined" &&
                      /Mobi|Android|iPhone|iPad|iPod/i.test(
                        navigator.userAgent,
                      );
                    if (isMobile && navigator.share) {
                      navigator
                        .share({
                          title: ad.headline,
                          text: ad.headline,
                          url: adLink,
                        })
                        .catch(() => {});
                    } else {
                      setShowShareOptions((v) => !v);
                    }
                  }}
                  className="flex flex-col items-center gap-1 cursor-pointer group"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full shadow-sm border flex items-center justify-center transition-colors",
                      showShareOptions
                        ? "bg-slate-700 border-slate-700"
                        : "bg-slate-200 border-slate-200 group-hover:bg-slate-300",
                    )}
                  >
                    <Share2
                      className={cn(
                        "w-5 h-5",
                        showShareOptions
                          ? "text-white fill-white"
                          : "text-slate-700 fill-black",
                      )}
                    />
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium">
                    Share
                  </span>
                </div>
              </div>

              {/* Share Options Sub-panel */}
              {showShareOptions && (
                <div className="flex items-center justify-center gap-4 py-3 border-t border-slate-200 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => {
                      window.open(
                        `https://wa.me/?text=${encodeURIComponent(adLink)}`,
                        "_blank",
                      );
                    }}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shadow-sm group-hover:opacity-90 transition-opacity">
                      <FaWhatsapp className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] text-slate-600 font-medium">
                      WhatsApp
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      const appId = "352947546661410"; // Replace with your Facebook App ID if you have one
                      const url = appId
                        ? `https://www.facebook.com/dialog/send?app_id=${appId}&link=${encodeURIComponent(adLink)}&redirect_uri=${encodeURIComponent(adLink)}`
                        : `https://www.facebook.com/dialog/send?link=${encodeURIComponent(adLink)}&redirect_uri=${encodeURIComponent(adLink)}`;
                      window.open(url, "_blank");
                    }}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#0099FF] flex items-center justify-center shadow-sm group-hover:opacity-90 transition-opacity">
                      <FaFacebookMessenger className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] text-slate-600 font-medium">
                      Messenger
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      window.open(
                        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(adLink)}`,
                        "_blank",
                      );
                    }}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center shadow-sm group-hover:opacity-90 transition-opacity">
                      <FaFacebook className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] text-slate-600 font-medium">
                      Facebook
                    </span>
                  </button>
                </div>
              )}

              {/* Bottom Row */}
              <div className="grid grid-cols-4 gap-2">
                <div
                  onClick={async () => {
                    const token = Cookies.get("token");
                    if (!token) {
                      window.dispatchEvent(
                        new CustomEvent("open-mobile-entry-modal"),
                      );
                      return;
                    }
                    try {
                      const res = await fetch(
                        `${API_BASE_URL}/api/user/favorite/${ad._id}`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                        },
                      );
                      const data = await res.json();
                      if (res.ok) {
                        setIsFavorited(data.isFavorited);
                        // toast.success(data.message);
                      } else {
                        alert(data.message || "Failed to update preferences");
                      }
                    } catch (err) {
                      console.error("Error toggling favorite:", err);
                    }
                  }}
                  className="flex flex-col items-center gap-1 cursor-pointer group"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full shadow-sm border flex items-center justify-center transition-colors",
                      isFavorited
                        ? "bg-blue-500 border-blue-600 text-white"
                        : "bg-slate-200 border-slate-100 group-hover:bg-slate-300 text-slate-700",
                    )}
                  >
                    <Heart
                      className={cn("w-5 h-5", isFavorited && "fill-current")}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      isFavorited ? "text-blue-600" : "text-slate-600",
                    )}
                  >
                    {isFavorited ? "Saved" : "Save"}
                  </span>
                </div>
                <div
                  className="flex flex-col items-center gap-1 cursor-pointer group"
                  onClick={handleReportClick}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 shadow-sm border border-slate-100 flex items-center justify-center group-hover:bg-slate-300 transition-colors">
                    <AlertCircle className="w-5 h-5 text-slate-700" />
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium">
                    Report
                  </span>
                </div>
                <div
                  onClick={() => {
                    navigator.clipboard.writeText(adLink);
                    toast.success("Link copied!");
                    setShowOptionsPopup(false);
                  }}
                  className="flex flex-col items-center gap-1 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 shadow-sm border border-slate-100 flex items-center justify-center group-hover:bg-slate-300 transition-colors">
                    <UserSquare2 className="w-5 h-5 text-slate-700" />
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium">
                    Copy Link
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EXPANDED IMAGE OVERLAY */}
      {isExpanded && (
        <div className="fixed inset-0 z-[300] bg-black flex flex-col animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 text-white">
            <span className="text-sm font-medium">
              {currentImageIndex + 1} / {images.length}
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Image Area */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            {hasImages && (
              <>
                <img
                  src={getImageUrl(images[currentImageIndex]) || undefined}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover blur-3xl scale-110 opacity-50"
                />
                <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
                  {images.length > 1 && (
                    <button
                      onClick={prevImage}
                      className="absolute left-4 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors z-20"
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </button>
                  )}

                  <img
                    src={getImageUrl(images[currentImageIndex]) || undefined}
                    alt="Expanded View"
                    className="max-w-full max-h-full object-contain shadow-2xl"
                    loading="lazy"
                  />

                  {/* {ad.adType === "Promoted" && settings.watermarkLogo && (
                    <div className="absolute bottom-10 right-10 z-30 pointer-events-none opacity-50">
                      <img
                        src={getImageUrl(settings.watermarkLogo)}
                        alt=""
                        className="w-24 h-24 object-contain"
                      />
                    </div>
                  )} */}
                  {settings.watermarkLogo && (
                    <div className="absolute transform translate-middle-x translate-middle-y z-30 pointer-events-none opacity-50">
                      <img
                        src={getImageUrl(settings.watermarkLogo)}
                        alt=""
                        className="w-24 h-24 object-contain"
                      />
                    </div>
                  )}

                  {images.length > 1 && (
                    <button
                      onClick={nextImage}
                      className="absolute right-4 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors z-20"
                    >
                      <ArrowLeft className="w-6 h-6 rotate-180" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails */}
          <div className="h-20 bg-black/50 overflow-x-auto flex items-center gap-2 px-4 pb-6 pt-2">
            {images.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-12 h-12 rounded overflow-hidden flex-shrink-0 border-2 transition-all ${
                  currentImageIndex === idx
                    ? "border-white opacity-100"
                    : "border-transparent opacity-50 hover:opacity-100"
                }`}
              >
                <img
                  src={getImageUrl(img) || undefined}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Shipping & Safety Info Modal */}
      <InfoModal
        isOpen={showShippingModal}
        onClose={() => setShowShippingModal(false)}
        title="সেফটি টিপস (Safety Tips)"
        content={`Shadamon.com-এ আপনার নিরাপত্তা আমাদের প্রথম অগ্রাধিকার। প্ল্যাটফর্ম ব্যবহার করার সময় নিরাপদ থাকার জন্য কিছু পরামর্শ:

পণ্য সরাসরি যাচাই করুন: পেমেন্ট করার আগে বিক্রেতার সাথে দেখা করুন এবং পণ্যটি ভালোভাবে পরীক্ষা করুন।
চাকরির জন্য আবেদন: নিয়োগকর্তা এবং চাকরির তথ্য যাচাই করুন। ব্যক্তিগত তথ্য শেয়ার করবেন না। দূরের বা অজানা স্থানে সাক্ষাৎ এড়িয়ে চলুন।

পণ্য ও পেমেন্ট একসাথে করুন:
• ক্রেতারা: পণ্য পাওয়ার আগে অর্থ প্রদান করবেন না।
• বিক্রেতারা: পেমেন্ট পাওয়ার আগে পণ্য পাঠাবেন না।

• সাধারণ বুদ্ধি ব্যবহার করুন: খুবই সস্তা অফার বা দ্রুত টাকা আয়ের প্রতিশ্রুতি এড়িয়ে চলুন।
• ব্যাংক বা আর্থিক তথ্য কখনও দেবেন না।

সতর্কতা (Scams)
• ভুয়া পেমেন্ট সার্ভিস: Shadamon.com কোনো পেমেন্ট সেবা বা প্রোটেকশন দেয় না। নিশ্চিত না হলে তৃতীয় পক্ষের পেমেন্ট ব্যবহার করবেন না।
• ভুয়া তথ্যের অনুরোধ: Shadamon.com কখনও ব্যক্তিগত তথ্য ইমেলে চায় না। সন্দেহজনক লিঙ্ক এড়িয়ে চলুন। রিপোর্ট করে ইমেল মুছে দিন।
• অতিরিক্ত ফি দাবি: সাধারণ সেবার জন্য অতিরিক্ত ফি দাবি করা হয় না।
• মানি ট্রান্সফার সার্ভিস (Western Union / MoneyGram): অচেনা ব্যক্তির সাথে ব্যবহার করবেন না।
• ভুয়া ডেলিভারি দাবী: Shadamon.com সরাসরি ডেলিভারি দেয় না। ভুয়া দাবী রিপোর্ট করুন।

Shadamon.com-এর নিরাপত্তা ব্যবস্থা
• ইমেল ঠিকানা লুকানো থাকে।
• ফোন নম্বর লুকানোর অপশন আছে।
• প্রযুক্তি উন্নতি চালু থাকে সন্দেহজনক কার্যকলাপ রোধের জন্য।
• পুনরাবৃত্ত অপরাধী ব্লক করা হয়।

নিরাপত্তা সমস্যা রিপোর্ট
প্রতারণার শিকার হলে দ্রুত রিপোর্ট করুন। প্রয়োজনে স্থানীয় পুলিশ বা আইন প্রয়োগকারীর সঙ্গে যোগাযোগ করুন।

সাবধানী নির্দেশনা: 
• Shadamon.com সর্বোচ্চ চেষ্টা করে নিরাপদ লেনদেন নিশ্চিত করতে, কিন্তু ব্যবহারকারীর কার্যকলাপের জন্য দায়ী নয়।
• ব্যবহারকারীরা সতর্ক থাকবেন এবং ব্যক্তিগত/আর্থিক তথ্য শেয়ার করার আগে যাচাই করবেন।
• ব্যবহারকারীর গোপনীয়তা রক্ষা করা হয়, তবে প্রতারণা বা অপরাধমূলক কার্যক্রমের ক্ষেত্রে আমরা আইন প্রয়োগকারীর সঙ্গে সহযোগিতা করি।`}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onBack={() => {
          setIsReportModalOpen(false);
          setShowOptionsPopup(true);
        }}
        adId={(ad as any)._id}
        ownerId={
          typeof (ad as any).user === "object"
            ? (ad as any).user?._id
            : (ad as any).user
        }
      />
    </div>
  );
}
