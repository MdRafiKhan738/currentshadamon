"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Home,
  // CheckCircle2,
  // Store,
  Smartphone,
  Grid,
  Package,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  // Search,
  MapPin,
  // Menu,
  X,
  // Plus,
  // Inbox,
  // User,
  // Globe,
  // Clock,
  // Eye,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  SlidersHorizontal,
  Bookmark,
} from "lucide-react";
import {
  FaAndroid,
  FaFacebookF,
  FaTiktok,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import VerifiedBadge from "../../components/VerifiedBadge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
import { API_BASE_URL } from "../../utils/apiConfig";
import { useLanguage } from "../context/LanguageContext";
import { timeAgo } from "../../utils/timeAgo";
import { getImageUrl } from "../../utils/imageUrl";
import { getNonHighlightLabels, hasHighlightLabel } from "../../utils/labels";
import { INFO_PAGE_ROUTES } from "@/utils/infoContent";
import Image from "next/image";
import LatestFreeAdPromo from "../../components/LatestFreeAdPromo";

import MerchantsModal from "../../components/MerchantsModal" 
import FilterModal, { FilterState } from "../../components/FilterModal";
import InfoModal from "../../components/InfoModal";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import { useSettings } from "../context/SettingsContext"; 

// Key used to hand off the feed's scroll position to the layout right
// before navigating to an ad's detail view — read back in
// DashboardLayoutClient before it reopens the Ad Details modal, so the
// modal's close button can restore the exact scroll spot the user was at
// instead of the (possibly already-reset) live scrollTop.
const PENDING_AD_SCROLL_KEY = "pending_ad_scroll_top";

interface SubItem {
  _id: string;
  name: string;
  subCategoryNameBn?: string;
  slug: string;
  image?: string;
}

interface Category {
  _id: string;
  name: string;
  categoryNameBn?: string;
  icon?: string; // Changed from photo
  subcategories: SubItem[];
}

interface Location {
  _id: string;
  name: string;
  locationNameBn?: string;
  image?: string; // Changed from photo
  subLocations: SubItem[];
}

interface ActiveAd {
  _id: string;
  headline: string;
  description: string;
  images: string[];
  price?: number;
  category: string;
  subCategory?: string;
  location: string;
  subLocation?: string;
  user: {
    _id: string;
    name: string;
    storeName?: string;
    photo?: string;
    verifiedBy?: string;
    mVerified?: boolean;
    followers?: any[];
  };

  deliveryCount: number;
  createdAt: string;
  adType: "Free" | "Promoted";
  promoteTag?: string;
  promoteType?: "call_msg" | "traffic";
  trafficLink?: string;
  trafficButtonType?: string;
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

export default function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  const { settings } = useSettings();

  const getFilterQueryValue = (longKey: string, shortKey: string) => {
    return searchParams.get(longKey) || searchParams.get(shortKey);
  };

  const setShortFilterParam = (
    params: URLSearchParams,
    shortKey: string,
    longKey: string,
    value?: string,
  ) => {
    params.delete(shortKey);
    params.delete(longKey);
    if (value) {
      params.set(shortKey, value);
    }
  };
  

  const getFiltersFromSearchParams = (): FilterState => {
    const urlCategory = getFilterQueryValue("category", "c");
    const urlSubCategory = getFilterQueryValue("subCategory", "sc");
    const urlLocation = getFilterQueryValue("location", "l");
    const urlSubLocation = getFilterQueryValue("subLocation", "sl");
    const urlSearch = searchParams.get("search");

    return {
      category: urlCategory || "",
      subCategory: urlSubCategory || "",
      location: urlLocation || "",
      subLocation: urlSubLocation || "",
      search: urlSearch || "",
      promoteTag: searchParams.get("promoteTag") || "All",
      sort: searchParams.get("sort") || "newest",
    };
  };

  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [premiumUsers, setPremiumUsers] = useState<PremiumUser[]>([]);
  const [ads, setAds] = useState<ActiveAd[]>([]);
  const [totalAds, setTotalAds] = useState<ActiveAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [feedAdsCategories, setFeedAdsCategories] = useState<any[]>([]);

  const [isMerchantsModalOpen, setIsMerchantsModalOpen] = useState(false);

  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    "main",
  );
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);
  const [activeSelectorTab, setActiveSelectorTab] = useState<
    "category" | "location"
  >("category");
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [headerOffset, setHeaderOffset] = useState(0);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() =>
    getFiltersFromSearchParams(),
  );
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [showFooterPromoteModal, setShowFooterPromoteModal] = useState(false); 

  const sellerScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleNavVisibility = (e: any) => {
      setIsNavVisible(e.detail?.visible);
    };
    window.addEventListener(
      "nav-visibility",
      handleNavVisibility as EventListener,
    );
    return () =>
      window.removeEventListener(
        "nav-visibility",
        handleNavVisibility as EventListener,
      );
  }, []);

  const [isViewingSavedSearch, setIsViewingSavedSearch] = useState(false);
  const [savedAdsData, setSavedAdsData] = useState<ActiveAd[]>([]);
  const hasHandledAdminLoginRef = useRef(false);

  useEffect(() => {
    const adminLoginToken = searchParams.get("adminLoginToken");
    if (!adminLoginToken || hasHandledAdminLoginRef.current) {
      return;
    }

    hasHandledAdminLoginRef.current = true;

    const clearAdminLoginParams = () => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("adminLoginToken");
      params.delete("adminLogin");
      const query = params.toString();
      router.replace(query ? `/d?${query}` : "/d", { scroll: false });
    };

    const applyAdminLogin = async () => {
      try {
        const meRes = await fetch(`${API_BASE_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${adminLoginToken}` },
        });

        if (!meRes.ok) {
          throw new Error("Invalid admin login token");
        }

        Cookies.set("token", adminLoginToken, { expires: 7 });
        window.dispatchEvent(new Event("auth-change"));
        toast.success(
          language === "bn"
            ? "অ্যাডমিন লগইন সফল হয়েছে"
            : "Admin login successful",
        );
      } catch (error) {
        console.error("Admin redirect login failed", error);
        toast.error(
          language === "bn"
            ? "অ্যাডমিন লগইন লিংকটি কাজ করেনি"
            : "Admin login link is invalid or expired",
        );
      } finally {
        clearAdminLoginParams();
      }
    };

    applyAdminLogin();
  }, [language, router, searchParams]);

  const hasFetchedMetaRef = useRef(false);
  const seenAdIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    seenAdIdsRef.current = new Set(ads.map((a) => a._id));
  }, [ads]);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = React.useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      // Initial check after items render
      const timer = setTimeout(checkScroll, 500);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        clearTimeout(timer);
      };
    }
  }, [categories, locations, activeSelectorTab, checkScroll]);

  useEffect(() => {
    const saved = localStorage.getItem("saved_search_ads");
    if (saved) {
      try {
        setSavedAdsData(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing saved ads", e);
      }
    }
  }, []);

  const handleSaveSearch = () => {
    if (savedAdsData.length === 0) {
      if (ads.length === 0) return; // guard against saving an empty snapshot
      localStorage.setItem("saved_search_ads", JSON.stringify(ads));
      setSavedAdsData(ads);
      setIsViewingSavedSearch(false);
    } else if (!isViewingSavedSearch) {
      setIsViewingSavedSearch(true);
    } else {
      setIsViewingSavedSearch(false);
    }
  };

  const handleResetSavedSearch = React.useCallback(() => {
    setIsViewingSavedSearch(false);
    setSavedAdsData([]);
    localStorage.removeItem("saved_search_ads");
  }, []);

  const createSlug = (text: string) => {
    if (!text) return "";
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-") // Replace spaces with -
      .replace(/[^\u0980-\u09FF\w-]+/g, "") // Remove all non-word chars (keeping Bangla range)
      .replace(/--+/g, "-") // Replace multiple - with single -
      .replace(/^-+/, "") // Trim - from start of text
      .replace(/-+$/, ""); // Trim - from end of text
  };

  const hasBanglaChars = (value: string) => /[\u0980-\u09FF]/.test(value);
  const getLocalizedCategoryName = (rawName: string, rawNameBn?: string) => {
    const providedBn = String(rawNameBn || "").trim();
    if (language === "bn" && providedBn) {
      return providedBn;
    }

    const name = String(rawName || "").trim();
    if (!name) return "";

    const match = name.match(/^(.+?)\s*\((.+)\)\s*$/);
    if (!match) return name;

    const first = match[1].trim();
    const second = match[2].trim();
    const firstIsBn = hasBanglaChars(first);
    const secondIsBn = hasBanglaChars(second);

    if (language === "bn") {
      if (firstIsBn && !secondIsBn) return first;
      if (secondIsBn && !firstIsBn) return second;
      return firstIsBn ? first : second;
    }

    if (!firstIsBn && secondIsBn) return first;
    if (!secondIsBn && firstIsBn) return second;
    return firstIsBn ? second : first;
  };

  const getAdUrl = (ad: any) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("ad", ad._id);
    return `?${params.toString()}`;
  };

  // Hands the feed's current scroll position off to the layout (via
  // sessionStorage) synchronously, BEFORE the router.push that changes the
  // `?ad=` param. This must happen before the URL change, not after —
  // by the time DashboardLayoutClient's effect on the ad param runs (post
  // async fetch + re-render), the live scroller may already have jumped,
  // so reading it there is unreliable. Capturing it here at the moment of
  // the click is the fix.
  const openAdFromFeed = (ad: ActiveAd | null) => {
    if (!ad) return;
    try {
      const scroller = document.getElementById("main-dashboard-scroller");
      if (scroller) {
        sessionStorage.setItem(
          PENDING_AD_SCROLL_KEY,
          String(scroller.scrollTop),
        );
      }
    } catch {}
    router.push(getAdUrl(ad), { scroll: false });
  };

  const getCategoryUrl = (catName: string, subCatName: string = "") => {
    const params = new URLSearchParams(searchParams.toString());
    setShortFilterParam(params, "c", "category", catName || undefined);
    setShortFilterParam(params, "sc", "subCategory", subCatName || undefined);
    const str = params.toString();
    return str ? `/d?${str}` : "/d";
  };

  const getLocationUrl = (locName: string, subLocName: string = "") => {
    const params = new URLSearchParams(searchParams.toString());
    setShortFilterParam(params, "l", "location", locName || undefined);
    setShortFilterParam(params, "sl", "subLocation", subLocName || undefined);
    const str = params.toString();
    return str ? `/d?${str}` : "/d";
  };

  // Initialize filters from URL on mount
  useEffect(() => {
    const currentFilters = getFiltersFromSearchParams();

    // Only update state if values actually changed to avoid cycles
    if (
      currentFilters.category !== filters.category ||
      currentFilters.subCategory !== filters.subCategory ||
      currentFilters.location !== filters.location ||
      currentFilters.subLocation !== filters.subLocation ||
      currentFilters.search !== filters.search ||
      currentFilters.promoteTag !== filters.promoteTag ||
      currentFilters.sort !== filters.sort
    ) {
      setFilters((prev) => ({
        ...prev,
        ...currentFilters,
      }));

      // Handle sidebar expansion
      if (currentFilters.category && categories.length > 0) {
        const cat = categories.find((c) => c.name === currentFilters.category);
        if (cat) setExpandedCategory(cat._id);
      }
      if (currentFilters.location && locations.length > 0) {
        const loc = locations.find((l) => l.name === currentFilters.location);
        if (loc) setExpandedLocation(loc._id);
      }
    }
  }, [
    searchParams,
    categories.length,
    locations.length,
    filters,
    categories,
    locations,
  ]);

  // Update URL when filters change
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const params = new URLSearchParams();
    if (filters.category) params.set("c", filters.category);
    if (filters.subCategory) params.set("sc", filters.subCategory);
    if (filters.location) params.set("l", filters.location);
    if (filters.subLocation) params.set("sl", filters.subLocation);
    if (filters.search) params.set("search", filters.search);
    if (filters.promoteTag && filters.promoteTag !== "All")
      params.set("promoteTag", filters.promoteTag);
    if (filters.sort && filters.sort !== "newest")
      params.set("sort", filters.sort);

    // Keep the ad param if it exists
    const adParam = searchParams.get("ad");
    if (adParam) params.set("ad", adParam);

    const queryString = params.toString();
    const newUrl = queryString ? `/d?${queryString}` : "/d";

    const currentParams = new URLSearchParams(searchParams.toString());
    setShortFilterParam(
      currentParams,
      "c",
      "category",
      getFilterQueryValue("category", "c") || undefined,
    );
    setShortFilterParam(
      currentParams,
      "sc",
      "subCategory",
      getFilterQueryValue("subCategory", "sc") || undefined,
    );
    setShortFilterParam(
      currentParams,
      "l",
      "location",
      getFilterQueryValue("location", "l") || undefined,
    );
    setShortFilterParam(
      currentParams,
      "sl",
      "subLocation",
      getFilterQueryValue("subLocation", "sl") || undefined,
    );
    const currentQuery = currentParams.toString();

    if (queryString !== currentQuery) {
      router.push(newUrl, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, router]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };
  // I will stack them: Categories first, then Locations.

  const fetchData = React.useCallback(
    async (pageNum = 1, append = false) => {
      if (!append) {
        setLoading(true);
        setAds([]);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const AD_SESSION_VIEWS_KEY = "ad_session_views";
        const AD_SESSION_VIEW_TOKENS_KEY = "ad_session_view_tokens";
        const AD_SESSION_RESHOW_AT_KEY = "ad_session_reshow_at"; // absolute ms timestamp per ad
        const AD_SESSION_LIMIT_KEY = "ad_session_limit";

        const readSessionJson = <T,>(key: string, fallback: T): T => {
          try {
            const raw = sessionStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw) as T;
          } catch {
            return fallback;
          }
        };

        const writeSessionJson = (key: string, value: unknown) => {
          try {
            sessionStorage.setItem(key, JSON.stringify(value));
          } catch {}
        };

        const pageToken = String(
          (window as any)?.performance?.timeOrigin ??
            ((window as any).__shadamonAdPageToken ??= Date.now()),
        );

        const params = new URLSearchParams();
        if (filters.category) params.append("category", filters.category);
        if (filters.subCategory)
          params.append("subCategory", filters.subCategory);
        if (filters.location) params.append("location", filters.location);
        if (filters.subLocation)
          params.append("subLocation", filters.subLocation);
        if (filters.promoteTag && filters.promoteTag !== "All")
          params.append("promoteTag", filters.promoteTag);
        if (filters.sort) params.append("sort", filters.sort);
        if (filters.search) params.append("search", filters.search);

        const shouldFetchMeta = !append && !hasFetchedMetaRef.current;
        const metaPromises: Promise<any>[] = [];
        if (shouldFetchMeta) {
          metaPromises.push(
            fetch(`${API_BASE_URL}/api/categories`).then((res) => res.json()),
            fetch(`${API_BASE_URL}/api/categories/sub`).then((res) =>
              res.json(),
            ),
            fetch(`${API_BASE_URL}/api/locations`).then((res) => res.json()),
            fetch(`${API_BASE_URL}/api/locations/sub`).then((res) =>
              res.json(),
            ),
          );
        }

        const [catRes, subCatRes, locRes, subLocRes] =
          metaPromises.length > 0
            ? await Promise.all(metaPromises)
            : [undefined, undefined, undefined, undefined];

        if (catRes?.success && subCatRes?.success) {
          const cats = catRes.data
            .map((c: any) => ({
              ...c,
              subcategories: subCatRes.data
                .filter(
                  (sc: any) => (sc.category?._id || sc.category) === c._id,
                )
                .sort((a: any, b: any) => (a.order || 0) - (b.order || 0)),
            }))
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          setCategories(cats);
        }

        if (locRes?.success && subLocRes?.success) {
          const locs = locRes.data
            .map((l: any) => ({
              ...l,
              subLocations: subLocRes.data
                .filter(
                  (sl: any) => (sl.location?._id || sl.location) === l._id,
                )
                .sort((a: any, b: any) => (a.order || 0) - (b.order || 0)),
            }))
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          setLocations(locs);
        }

        if (
          catRes?.success &&
          subCatRes?.success &&
          locRes?.success &&
          subLocRes?.success
        ) {
          hasFetchedMetaRef.current = true;
        }

        const limit = settings.userRepeatAdViewTime || 0;
        const reShowAfterMs = (settings.adReShowAfterMinutes || 0) * 60 * 1000;
        const isFiltering = !!(
          filters.category ||
          filters.location ||
          filters.search ||
          (filters.promoteTag && filters.promoteTag !== "All")
        );

        type SessionViews = Record<string, number>;
        type SessionViewTokens = Record<string, string>;
        type SessionReShowAt = Record<string, number>;
        const sessionViews = readSessionJson<SessionViews>(
          AD_SESSION_VIEWS_KEY,
          {},
        );
        const sessionTokens = readSessionJson<SessionViewTokens>(
          AD_SESSION_VIEW_TOKENS_KEY,
          {},
        );
        // sessionReShowAt: absolute ms timestamp when each ad should become visible again
        // 0 = permanently blocked this session; >0 = re-show at that epoch ms
        const sessionReShowAt = readSessionJson<SessionReShowAt>(
          AD_SESSION_RESHOW_AT_KEY,
          {},
        );
        const storedLimit = readSessionJson<number>(AD_SESSION_LIMIT_KEY, 0);
        const effectiveLimit = limit > 0 ? limit : storedLimit;

        // Pre-loop: reset any ad whose absolute re-show timestamp has passed
        {
          const now = Date.now();
          let changed = false;
          Object.keys(sessionReShowAt).forEach((adId) => {
            const reshowAt = sessionReShowAt[adId];
            if (reshowAt > 0 && now >= reshowAt) {
              delete sessionViews[adId];
              delete sessionTokens[adId];
              delete sessionReShowAt[adId];
              changed = true;
            }
          });
          if (changed) {
            writeSessionJson(AD_SESSION_VIEWS_KEY, sessionViews);
            writeSessionJson(AD_SESSION_VIEW_TOKENS_KEY, sessionTokens);
            writeSessionJson(AD_SESSION_RESHOW_AT_KEY, sessionReShowAt);
          }
        }

        const collectAds: ActiveAd[] = [];
        const collectedIds = new Set<string>();
        const maxAutoPages = 6;
        let currentPage = pageNum;
        let lastHasMore = false;
        let allFeedCategories: any[] = [];

        for (let i = 0; i < maxAutoPages; i++) {
          const pageParams = new URLSearchParams(params.toString());
          pageParams.set("page", currentPage.toString());

          const adsRes = await fetch(
            `${API_BASE_URL}/api/ads/public/feed?${pageParams.toString()}`,
          ).then((res) => res.json());
          if (!adsRes?.success) break;

          lastHasMore = !!adsRes.hasMore;
          if (adsRes.feedCategories)
            allFeedCategories.push(...adsRes.feedCategories);
          const rawAds: ActiveAd[] = adsRes.data || [];

          let eligible = rawAds;
          if (!isFiltering) {
            eligible = rawAds.filter((ad: ActiveAd) => {
              // Block any ad that has a re-show record (blocked until timer fires or forever)
              if (sessionReShowAt[ad._id] !== undefined) return false;
              if (effectiveLimit > 0)
                return (sessionViews[ad._id] || 0) < effectiveLimit;
              return true;
            });
          }

          const alreadySeen = append ? seenAdIdsRef.current : new Set<string>();
          const deduped = eligible.filter(
            (ad: ActiveAd) =>
              !alreadySeen.has(ad._id) && !collectedIds.has(ad._id),
          );

          deduped.forEach((ad) => collectedIds.add(ad._id));
          collectAds.push(...deduped);

          if (collectAds.length > 0 || !lastHasMore) {
            break;
          }

          currentPage += 1;
        }

        if (limit > 0 && !isFiltering) {
          collectAds.forEach((ad: ActiveAd) => {
            if (
              sessionTokens[ad._id] === pageToken &&
              (sessionViews[ad._id] || 0) > 0
            )
              return;
            const prevCount = sessionViews[ad._id] || 0;
            const newCount = Math.min(limit, prevCount + 1);
            sessionViews[ad._id] = newCount;
            sessionTokens[ad._id] = pageToken;
            // Only set reshowAt when reShowAfterMs>0; otherwise blocked by count alone
            if (
              newCount >= limit &&
              reShowAfterMs > 0 &&
              sessionReShowAt[ad._id] === undefined
            ) {
              sessionReShowAt[ad._id] = Date.now() + reShowAfterMs;
            }
          });

          // Upgrade any ad at the limit without a timer now that reShowAfterMs is known,
          // and fix legacy reshowAt=0 entries (set when settings hadn't loaded yet)
          if (reShowAfterMs > 0) {
            Object.keys(sessionViews).forEach((adId) => {
              if (
                sessionViews[adId] >= limit &&
                sessionReShowAt[adId] === undefined
              ) {
                sessionReShowAt[adId] = Date.now() + reShowAfterMs;
              }
              if (sessionReShowAt[adId] === 0) {
                sessionReShowAt[adId] = Date.now() + reShowAfterMs;
              }
            });
          }

          writeSessionJson(AD_SESSION_VIEWS_KEY, sessionViews);
          writeSessionJson(AD_SESSION_VIEW_TOKENS_KEY, sessionTokens);
          writeSessionJson(AD_SESSION_RESHOW_AT_KEY, sessionReShowAt);
          writeSessionJson(AD_SESSION_LIMIT_KEY, limit);
        }

        setAds((prev) => (append ? [...prev, ...collectAds] : collectAds));
        if (allFeedCategories.length > 0) {
          setFeedAdsCategories((prev) =>
            append ? [...prev, ...allFeedCategories] : allFeedCategories,
          );
        }
        setHasMore(lastHasMore);
        setPage(currentPage);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        if (!append) setLoading(false);
        else setIsLoadingMore(false);
      }
    },
    [filters, settings.userRepeatAdViewTime, settings.adReShowAfterMinutes],
  );

  const fetchInitialData = React.useCallback(async () => {
    try {
      // 1. Fetch All Ads for global state
      const allAdsRes = await fetch(`${API_BASE_URL}/api/ads/public/all`).then(
        (res) => res.json(),
      );
      if (allAdsRes.success) {
        setTotalAds(allAdsRes.data);
      }

      // 2. Fetch Popular Sellers from Backend
      const premiumRes = await fetch(`${API_BASE_URL}/api/user/premium`).then(
        (res) => res.json(),
      );

      if (premiumRes.success) {
        let sellers = premiumRes.data;

        // 3. Check following status if logged in
        const token = Cookies.get("token");
        if (token) {
          try {
            const meRes = await fetch(`${API_BASE_URL}/api/user/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const meData = await meRes.json();
            if (meRes.ok && meData.following) {
              sellers = sellers.map((u: any) => ({
                ...u,
                isFollowing: meData.following.includes(u._id),
              }));
            }
          } catch (e) {}
        }

        setPremiumUsers(sellers);
      }
    } catch (error) {
      console.error("Failed to load initial data", error);
    }
  }, []);

  const handleProfileClick = async (userId: string) => {
    // Increment view count optimistically
    setPremiumUsers((prev) =>
      prev.map((u) =>
        u._id === userId
          ? { ...u, profileViews: (u.profileViews || 0) + 1 }
          : u,
      ),
    );

    // Send to backend
    try {
      fetch(`${API_BASE_URL}/api/user/profile/${userId}/view`, {
        method: "POST",
      });
    } catch (e) {}

    // Open modal
    window.dispatchEvent(
      new CustomEvent("open-account-modal", { detail: { userId } }),
    );
  };

  const handleFollowUser = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    const token = Cookies.get("token");
    if (!token) {
      window.dispatchEvent(new CustomEvent("open-mobile-entry-modal"));
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/user/follow/${userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setPremiumUsers((prev) =>
          prev.map((u) =>
            u._id === userId
              ? {
                  ...u,
                  isFollowing: data.isFollowing,
                  followers: data.followers,
                }
              : u,
          ),
        );

        // Sync with other components
        window.dispatchEvent(
          new CustomEvent("user-followed", {
            detail: {
              userId: userId,
              isFollowing: data.isFollowing,
              followers: data.followers,
            },
          }),
        );
      }
    } catch (error) {
      console.error("Follow error", error);
    }
  };

  const observerOptions = {
    root: null,
    rootMargin: "20px",
    threshold: 1.0,
  };

  const handleObserver = React.useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (
        target.isIntersecting &&
        hasMore &&
        !loading &&
        !isLoadingMore &&
        !isViewingSavedSearch
      ) {
        fetchData(page + 1, true);
      }
    },
    [hasMore, loading, isLoadingMore, page, fetchData, isViewingSavedSearch],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, observerOptions);
    const target = document.getElementById("load-more-trigger");
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [handleObserver]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (!isViewingSavedSearch) {
      fetchData(1, false);
    }
  }, [fetchData, isViewingSavedSearch]);

  useEffect(() => {
    const handleRefresh = () => {
      if (!isViewingSavedSearch) {
        fetchData(1, false);
      }
      fetchInitialData();
    };

    const handleSearch = (e: any) => {
      const query = e.detail?.query || "";
      setFilters((prev) => ({ ...prev, search: query }));
    };

    const handleGlobalFollow = (e: any) => {
      const { userId, isFollowing, followers } = e.detail;
      setPremiumUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isFollowing, followers } : u,
        ),
      );
      setAds((prev) =>
        prev.map((ad) => {
          const adUserId = ad.user?._id || ad.user;
          if (adUserId === userId) {
            return { ...ad, user: { ...ad.user, followers } };
          }
          return ad;
        }),
      );
    };

    const handleOpenFooterPromoteModal = () => {
      setShowFooterPromoteModal(true);
    };

    window.addEventListener("refresh-ads", handleRefresh);
    window.addEventListener(
      "user-followed",
      handleGlobalFollow as EventListener,
    );
    window.addEventListener(
      "show-search-results",
      handleSearch as EventListener,
    );
    window.addEventListener("reset-saved-search", handleResetSavedSearch);
    window.addEventListener(
      "open-footer-promote-modal",
      handleOpenFooterPromoteModal,
    );
    return () => {
      window.removeEventListener("refresh-ads", handleRefresh);
      window.removeEventListener(
        "user-followed",
        handleGlobalFollow as EventListener,
      );
      window.removeEventListener(
        "show-search-results",
        handleSearch as EventListener,
      );
      window.removeEventListener("reset-saved-search", handleResetSavedSearch);
      window.removeEventListener(
        "open-footer-promote-modal",
        handleOpenFooterPromoteModal,
      );
    };
  }, [
    fetchData,
    fetchInitialData,
    handleResetSavedSearch,
    isViewingSavedSearch,
  ]);

  const toggleCategory = (id: string) => {
    setExpandedCategory(expandedCategory === id ? "main" : id);
  };

  const toggleLocation = (id: string) => {
    setExpandedLocation(expandedLocation === id ? null : id);
  };

  const handleFooterPromoteClick = () => {
    setShowFooterPromoteModal(true);
  };

  const handleFooterPromotePostAdd = () => {
    setShowFooterPromoteModal(false);

    const token = Cookies.get("token");
    if (!token) {
      window.dispatchEvent(
        new CustomEvent("open-mobile-entry-modal", {
          detail: { reason: "promote" },
        }),
      );
      return;
    }

    window.dispatchEvent(
      new CustomEvent("open-account-modal", { detail: { activeTab: "Post" } }),
    );
  };

  return (
    <div className="w-full max-w-[1320px] mx-auto px-0 lg:px-4 xl:px-0 flex flex-col lg:flex-row items-start justify-center">
      {/* Left Sidebar - 300px */}
      <div className="hidden lg:block w-[300px] flex-none sticky top-4 h-[calc(100vh-32px)] overflow-y-auto no-scrollbar pb-10">
        <div className="flex flex-col min-h-full space-y-4">
          <div className="flex-1 space-y-4">
            {/* 1. All Categories & Locations Card */}
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="p-2 space-y-2">
                {/* Categories Section */}
                <div className="space-y-1">
                  <div
                    className="flex items-center justify-between group cursor-pointer"
                    onClick={() =>
                      setExpandedCategory(
                        expandedCategory === "main" ? null : "main",
                      )
                    }
                  >
                    <h3 className="text-[13px] text-black">{t("category")}</h3>
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 text-black group-hover:text-black transition-all",
                        (expandedCategory === "main" ||
                          expandedCategory !== null) &&
                          "rotate-180",
                      )}
                    />
                  </div>

                  {expandedCategory !== null && (
                    <div className="pl-1 space-y-1">
                      <Link
                        href={getCategoryUrl("")}
                        scroll={false}
                        className="block text-[13px] text-black ml-4 tracking-wider cursor-pointer hover:text-[#0088cc] transition-colors"
                        onClick={() => {
                          setFilters({
                            ...filters,
                            category: "",
                            subCategory: "",
                          });
                          // handleResetSavedSearch();
                        }}
                      >
                        {t("all_categories")}
                      </Link>

                      {categories.map((cat, idx) => {
                        // Assign icons based on name or index to match image
                        const CategoryIcon =
                          idx === 0 ? Smartphone : idx === 1 ? Grid : Package;

                        return (
                          <div key={cat._id} className="space-y-0.5">
                            <Link
                              href={getCategoryUrl(cat.name)}
                              scroll={false}
                              className="flex items-center justify-between group cursor-pointer"
                              onClick={() => {
                                toggleCategory(cat._id);
                                setFilters({
                                  ...filters,
                                  category: cat.name,
                                  subCategory: "",
                                });
                                setActiveSelectorTab("category");
                              }}
                            >
                              <div className="flex items-center gap-1 text-[15px] text-[#0088cc] font-medium hover:underline">
                                {cat.icon && getImageUrl(cat.icon) ? (
                                  <img
                                    src={getImageUrl(cat.icon) || undefined}
                                    className="w-4 h-4 object-contain shrink-0"
                                    alt=""
                                    loading="lazy"
                                  />
                                ) : (
                                  <CategoryIcon className="w-4 h-4 text-black shrink-0" />
                                )}
                                <span
                                  className={cn(
                                    (expandedCategory === cat._id ||
                                      filters.category === cat.name) &&
                                      "text-black",
                                  )}
                                >
                                  {getLocalizedCategoryName(
                                    cat.name,
                                    cat.categoryNameBn,
                                  )}
                                </span>
                                <span className="text-black font-normal ml-0.5">
                                  (
                                  {totalAds
                                    .filter((ad) => ad.category === cat.name)
                                    .length.toLocaleString()}
                                  )
                                </span>
                              </div>
                              {cat.subcategories.length > 0 && (
                                <ChevronDown
                                  className={cn(
                                    "w-3.5 h-3.5 text-black transition-all",
                                    expandedCategory === cat._id &&
                                      "rotate-180",
                                  )}
                                />
                              )}
                            </Link>

                            {/* Subcategories with correct indentation and bullet points */}
                            {expandedCategory === cat._id &&
                              cat.subcategories.length > 0 && (
                                <div className="pl-6 space-y-0.5 border-l border-slate-100 ml-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                  {cat.subcategories.map((sub) => (
                                    <Link
                                      key={sub._id}
                                      href={getCategoryUrl(cat.name, sub.name)}
                                      scroll={false}
                                      className="flex items-center gap-1 text-[13px] text-[#0088cc] hover:underline cursor-pointer group"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setFilters({
                                          ...filters,
                                          category: cat.name,
                                          subCategory: sub.name,
                                        });
                                        setActiveSelectorTab("category");
                                      }}
                                    >
                                      {sub.image && getImageUrl(sub.image) ? (
                                        <img
                                          src={
                                            getImageUrl(sub.image) || undefined
                                          }
                                          className="w-4 h-4 object-contain shrink-0"
                                          alt=""
                                          loading="lazy"
                                        />
                                      ) : (
                                        <div
                                          className={cn(
                                            "w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-[#0088cc] transition-colors",
                                            filters.subCategory === sub.name &&
                                              "bg-[#0088cc]",
                                          )}
                                        />
                                      )}
                                      <span
                                        className={cn(
                                          filters.subCategory === sub.name &&
                                            "text-black",
                                        )}
                                      >
                                        {getLocalizedCategoryName(
                                          sub.name,
                                          sub.subCategoryNameBn,
                                        )}
                                      </span>
                                      <span className="text-black">
                                        (
                                        {totalAds
                                          .filter(
                                            (ad) => ad.subCategory === sub.name,
                                          )
                                          .length.toLocaleString()}
                                        )
                                      </span>
                                    </Link>
                                  ))}
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="h-[1px] bg-slate-100 w-full" />
              </div>
            </div>
          </div>

          {/* 3. Footer Links & Apps Card */}
          <div className="bg-white rounded-lg p-3 space-y-4 mt-auto shadow-sm border border-slate-50">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-black font-medium">
              <Link
                href={INFO_PAGE_ROUTES.about}
                className="hover:text-black transition-colors"
              >
                {t("about_us")}
              </Link>
              <span>•</span>
              <Link
                href={INFO_PAGE_ROUTES.terms}
                className="hover:text-black transition-colors"
              >
                {t("terms_and_con")}
              </Link>
              <span>•</span>
              <Link
                href={INFO_PAGE_ROUTES.privacy}
                className="hover:text-black transition-colors"
              >
                {t("privacy_policy")}
              </Link>
              <span>•</span>
              <Link
                href={INFO_PAGE_ROUTES.contact}
                className="hover:text-black transition-colors"
              >
                {t("contact_us")}
              </Link>
              <span>•</span>
              <Link
                href={INFO_PAGE_ROUTES.safety}
                className="hover:text-black transition-colors"
              >
                {language === "bn" ? "Safety Tips" : "Safety Tips"}
              </Link>
              <span>•</span>
              <button
                onClick={handleFooterPromoteClick}
                className="hover:text-black transition-colors"
              >
                {t("promote")}
              </button>
            </div>

            <div className="space-y-2.5">
              <p className="text-[12px] text-black font-semibold">
                {t("follow_us")}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    window.open(
                      "https://www.facebook.com/ShadamonDotCom",
                      "_blank",
                    )
                  }
                  className="w-7 h-7 bg-[#1877F2] rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                >
                  <FaFacebookF className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    window.open(
                      "https://www.tiktok.com/@shadamondotcom",
                      "_blank",
                    )
                  }
                  className="w-7 h-7 bg-black rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                >
                  <FaTiktok className="w-3 h-3" />
                </button>
                <button
                  onClick={() =>
                    window.open(
                      "https://www.instagram.com/shadamondotcom/",
                      "_blank",
                    )
                  }
                  className="w-7 h-7 bg-gradient-to-tr from-[#FFB344] via-[#F43C78] to-[#9932CC] rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                >
                  <FaInstagram className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    window.open(
                      "https://www.youtube.com/@ShadaMondotcom",
                      "_blank",
                    )
                  }
                  className="w-7 h-7 bg-[#FF0000] rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                >
                  <FaYoutube className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-0.5 border-t border-slate-100">
              <p className="text-[11px] text-slate-500 font-medium tracking-tight">
                &copy; {new Date().getFullYear()} shadamon.com
              </p>
              <p className="text-[11px] text-slate-500 leading-tight">
                Manage by Shadamon
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gap 1: 50px */}
      <div className="hidden lg:block w-[50px] flex-none"></div>

      {/* Center Content - Feed / Ads: 565px */}
      <div
        id="center-feed-container"
        className="w-full lg:w-[565px] flex-none space-y-4 pb-32 lg:pb-20"
      >
        {/* Secondary Filter Bar */}
        <div
          className={cn(
            "bg-white rounded-none lg:rounded-lg flex divide-x divide-slate-100 overflow-hidden sticky z-[49] shadow-sm transition-all duration-300",
            isNavVisible ? "top-16" : "top-0", // Shift to top-0 when header is hidden
          )}
        >
          <button
            onClick={() => {
              setIsFilterModalOpen(true);
              setTimeout(() => {
                window.dispatchEvent(
                  new CustomEvent("open-filter-view", {
                    detail: { view: "category" },
                  }),
                );
              }, 50);
            }}
            className="flex-1 px-4 py-2.5 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors group"
          >
            <Grid className="w-5 h-5 text-black" />
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-xs sm:text-sm text-black truncate">
                {filters.category
                  ? filters.subCategory || filters.category
                  : language === "bn"
                    ? "ক্যাটাগরি"
                    : "Category"}
              </span>
              {filters.category && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilters((prev) => ({
                      ...prev,
                      category: "",
                      subCategory: "",
                    }));
                  }}
                  className="p-1 rounded-full hover:bg-slate-200 transition-colors shrink-0"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </div>
              )}
            </div>
          </button>
          <button
            onClick={() => {
              setIsFilterModalOpen(true);
              setTimeout(() => {
                window.dispatchEvent(
                  new CustomEvent("open-filter-view", {
                    detail: { view: "location" },
                  }),
                );
              }, 100);
            }}
            className="flex-1 px-4 py-2.5 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors group"
          >
            <MapPin className="w-5 h-5 text-black" />
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-xs sm:text-sm text-black truncate">
                {filters.location
                  ? filters.subLocation || filters.location
                  : language === "bn"
                    ? "লোকেশন"
                    : "Location"}
              </span>
              {filters.location && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilters((prev) => ({
                      ...prev,
                      location: "",
                      subLocation: "",
                    }));
                  }}
                  className="p-1 rounded-full hover:bg-slate-200 transition-colors shrink-0"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </div>
              )}
            </div>
          </button>
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="flex-1 px-4 py-2.5 flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5 text-black" />
            <span className="text-xs sm:text-sm text-black">
              {language === "bn" ? "ফিল্টার" : "Filter"}
            </span>
          </button>
        </div>

        {/* Category Selector Card */}
        <div className="bg-white rounded-none lg:rounded-lg overflow-hidden">
          {/* Selector Header Tabs */}
          <div className="pl-2 pr-0 lg:px-5 pt-2.5 lg:pt-4 flex items-center justify-between border-b border-slate-50">
            <div className="flex items-center gap-5 lg:gap-8">
              <div
                className="relative pb-1.5 lg:pb-2 cursor-pointer"
                onClick={() => setActiveSelectorTab("category")}
              >
                <span
                  className={cn(
                    "text-[13px] lg:text-[15px] transition-colors",
                    activeSelectorTab === "category"
                      ? "text-black"
                      : "text-black hover:text-black",
                  )}
                >
                  Select Category
                </span>
                {activeSelectorTab === "category" && (
                  <div className="absolute -top-2.5 lg:-top-4 left-0 right-0 h-[3px] bg-blue-500 rounded-b-full" />
                )}
              </div>
              <div
                className="relative pb-1.5 lg:pb-2 cursor-pointer"
                onClick={() => setActiveSelectorTab("location")}
              >
                <span
                  className={cn(
                    "text-[13px] lg:text-[15px] transition-colors",
                    activeSelectorTab === "location"
                      ? "text-black"
                      : "text-black hover:text-black",
                  )}
                >
                  Select Location
                </span>
                {activeSelectorTab === "location" && (
                  <div className="absolute -top-2.5 lg:-top-4 left-0 right-0 h-[3px] bg-blue-500 rounded-b-full" />
                )}
              </div>
            </div>
          </div>

          {/* Category/Location Bubbles */}
          <div className="pl-2 pr-0 lg:px-5 pb-3 lg:pb-5 pt-1 lg:pt-2 relative group/bubbles flex items-center">
            {/* Left Scroll Arrow */}
            <button
              onClick={scrollLeft}
              className={cn(
                "absolute left-4 top-[36px] lg:top-[42px] w-9 h-9 rounded-full bg-white shadow-md border border-slate-100 items-center justify-center text-black hover:bg-slate-50 hover:scale-110 active:scale-95 transition-all z-20",
                canScrollLeft ? "flex" : "hidden",
              )}
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>

            <div
              ref={scrollContainerRef}
              className="flex items-center gap-3 lg:gap-4 overflow-x-auto no-scrollbar scroll-smooth w-full py-0.5 lg:py-1"
            >
              {activeSelectorTab === "category" ? (
                <>
                  {/* All Category Bubble */}
                  <Link
                    key="all-cat"
                    href={getCategoryUrl("")}
                    scroll={false}
                    className={cn(
                      "flex flex-col items-center gap-1.5 lg:gap-2 flex-none group cursor-pointer",
                      !filters.category && "relative",
                    )}
                    onClick={() => {
                      setFilters({ ...filters, category: "", subCategory: "" });
                      setExpandedCategory("main");
                    }}
                  >
                    <div
                      className={cn(
                        "w-[62px] h-[62px] lg:w-[70px] lg:h-[70px] rounded-full border-2 p-1 transition-all",
                        !filters.category
                          ? "border-[#0088cc] bg-blue-50"
                          : "border-slate-200",
                      )}
                    >
                      <div className="w-full h-full rounded-full bg-slate-50 overflow-hidden flex items-center justify-center">
                        <Grid
                          className="w-8 h-8 text-[#0088cc] opacity-60"
                          strokeWidth={2}
                        />
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] lg:text-[11px] font-bold text-center max-w-[62px] lg:max-w-[70px] truncate transition-colors",
                        !filters.category ? "text-[#0088cc]" : "text-black",
                      )}
                    >
                      {language === "bn" ? "সব বিজ্ঞাপন" : "All Categories"}
                    </span>
                  </Link>

                  {categories.map((cat) => (
                    <Link
                      key={cat._id}
                      href={
                        cat.name === filters.category
                          ? getCategoryUrl("")
                          : getCategoryUrl(cat.name)
                      }
                      scroll={false}
                      className={cn(
                        "flex flex-col items-center gap-1.5 lg:gap-2 flex-none group cursor-pointer",
                        cat.name === filters.category && "relative",
                      )}
                      onClick={() => {
                        const isSelected = cat.name === filters.category;
                        setFilters({
                          ...filters,
                          category: isSelected ? "" : cat.name,
                          subCategory: "",
                        });
                        if (!isSelected) {
                          setExpandedCategory(cat._id);
                        } else {
                          setExpandedCategory("main");
                        }
                      }}
                    >
                      <div
                        className={cn(
                          "w-[62px] h-[62px] lg:w-[70px] lg:h-[70px] rounded-full border-2 p-1 transition-all",
                          cat.name === filters.category
                            ? "border-[#0088cc] bg-blue-50"
                            : "border-slate-200",
                        )}
                      >
                        <div className="w-full h-full rounded-full bg-blue-50 overflow-hidden flex items-center justify-center">
                          {cat.icon ? (
                            <img
                              src={getImageUrl(cat.icon) || undefined}
                              alt={getLocalizedCategoryName(
                                cat.name,
                                cat.categoryNameBn,
                              )}
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <img
                              src={`https://placehold.co/100x100?text=${getLocalizedCategoryName(cat.name, cat.categoryNameBn).charAt(0)}`}
                              alt={getLocalizedCategoryName(
                                cat.name,
                                cat.categoryNameBn,
                              )}
                              className="w-full h-full object-contain opacity-50"
                              loading="lazy"
                            />
                          )}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] lg:text-[11px] font-bold text-center max-w-[62px] lg:max-w-[70px] truncate transition-colors",
                          cat.name === filters.category
                            ? "text-[#0088cc]"
                            : "text-black",
                        )}
                      >
                        {getLocalizedCategoryName(cat.name, cat.categoryNameBn)}
                      </span>
                    </Link>
                  ))}
                </>
              ) : (
                <>
                  {/* All Location Bubble */}
                  <Link
                    key="all-loc"
                    href={getLocationUrl("")}
                    scroll={false}
                    className={cn(
                      "flex flex-col items-center gap-1.5 lg:gap-2 flex-none group cursor-pointer",
                      !filters.location && "relative",
                    )}
                    onClick={() => {
                      setFilters({ ...filters, location: "", subLocation: "" });
                      setExpandedLocation(null);
                    }}
                  >
                    <div
                      className={cn(
                        "w-[62px] h-[62px] lg:w-[70px] lg:h-[70px] rounded-full border-2 p-1 transition-all",
                        !filters.location
                          ? "border-[#0088cc] bg-blue-50"
                          : "border-slate-200",
                      )}
                    >
                      <div className="w-full h-full rounded-full bg-slate-50 overflow-hidden flex items-center justify-center">
                        <MapPin
                          className="w-8 h-8 text-[#0088cc] opacity-60"
                          strokeWidth={2}
                        />
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] lg:text-[11px] font-bold text-center max-w-[62px] lg:max-w-[70px] truncate transition-colors",
                        !filters.location ? "text-[#0088cc]" : "text-black",
                      )}
                    >
                      {language === "bn" ? "সব এলাকা" : "All Location"}
                    </span>
                  </Link>

                  {locations.map((loc) => (
                    <Link
                      key={loc._id}
                      href={
                        loc.name === filters.location
                          ? getLocationUrl("")
                          : getLocationUrl(loc.name)
                      }
                      scroll={false}
                      className={cn(
                        "flex flex-col items-center gap-1.5 lg:gap-2 flex-none group cursor-pointer",
                        loc.name === filters.location && "relative",
                      )}
                      onClick={() => {
                        const isSelected = loc.name === filters.location;
                        setFilters({
                          ...filters,
                          location: isSelected ? "" : loc.name,
                          subLocation: "",
                        });
                        if (!isSelected) {
                          setExpandedLocation(loc._id);
                        } else {
                          setExpandedLocation(null);
                        }
                      }}
                    >
                      <div
                        className={cn(
                          "w-[62px] h-[62px] lg:w-[70px] lg:h-[70px] rounded-full border-2 p-1 transition-all",
                          loc.name === filters.location
                            ? "border-[#0088cc] bg-blue-50"
                            : "border-slate-200",
                        )}
                      >
                        <div className="w-full h-full rounded-full bg-blue-50 overflow-hidden flex items-center justify-center">
                          {loc.image ? (
                            <img
                              src={getImageUrl(loc.image) || undefined}
                              alt={loc.name}
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <img
                              src={`https://placehold.co/100x100?text=${loc.name.charAt(0)}`}
                              alt={loc.name}
                              className="w-full h-full object-contain opacity-50"
                              loading="lazy"
                            />
                          )}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] lg:text-[11px] font-bold text-center max-w-[62px] lg:max-w-[70px] truncate transition-colors",
                          loc.name === filters.location
                            ? "text-[#0088cc]"
                            : "text-black",
                        )}
                      >
                        {language === "bn" && loc.locationNameBn
                          ? loc.locationNameBn
                          : loc.name}
                      </span>
                    </Link>
                  ))}
                </>
              )}
            </div>

            {/* Right Scroll Arrow */}
            <button
              onClick={scrollRight}
              className={cn(
                "absolute right-4 top-[36px] lg:top-[42px] w-9 h-9 rounded-full bg-white shadow-md border border-slate-100 items-center justify-center text-black hover:bg-slate-50 hover:scale-110 active:scale-95 transition-all z-20",
                canScrollRight ? "flex" : "hidden",
              )}
            >
              <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {!filters.category &&
          !filters.location &&
          !filters.search &&
          filters.promoteTag === "All" && <LatestFreeAdPromo />}

        {loading ? (
          <div className="text-center py-20 pb-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4"></div>
            <p className="text-black text-sm">{t("loading_feed")}</p>
          </div>
        ) : ads.length === 0 ? (
          <div className="bg-white rounded-none lg:rounded-2xl p-8 border border-slate-200 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-black">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
              <Home className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-lg font-bold text-black">{t("no_ads_yet")}</h3>
          </div>
        ) : (
          (() => {
            const displayAdsList = isViewingSavedSearch ? savedAdsData : ads;

            const filteredTotalAdsCount = (() => {
              if (isViewingSavedSearch) return savedAdsData.length;
              return totalAds.filter((ad) => {
                if (filters.category && ad.category !== filters.category)
                  return false;
                if (
                  filters.subCategory &&
                  ad.subCategory !== filters.subCategory
                )
                  return false;
                if (filters.location && ad.location !== filters.location)
                  return false;
                if (
                  filters.subLocation &&
                  ad.subLocation !== filters.subLocation
                )
                  return false;
                if (filters.promoteTag && filters.promoteTag !== "All") {
                  if (filters.promoteTag === "Verified") {
                    if (!ad.user?.mVerified) return false;
                  } else {
                    if (ad.promoteTag !== filters.promoteTag) return false;
                  }
                }
                if (filters.search) {
                  const q = filters.search.toLowerCase();
                  const matched =
                    ad.headline?.toLowerCase().includes(q) ||
                    ad.description?.toLowerCase().includes(q) ||
                    ad._id === filters.search ||
                    ad.user?._id === filters.search;
                  if (!matched) return false;
                }
                return true;
              }).length;
            })();

            const promotedPool = [
              ...displayAdsList.filter((ad) => ad.adType === "Promoted"),
            ];
            const freePool = [
              ...displayAdsList.filter((ad) => ad.adType !== "Promoted"),
            ];
            const promotedForFreePool = [
              ...displayAdsList.filter((ad) => ad.adType === "Promoted"),
            ];
            const chunks = [];

            // 1. Process Promoted Ads until pool is empty
            while (promotedPool.length > 0) {
              const b1 = promotedPool.shift() || null;
              const s1 = promotedPool.splice(0, 5);
              const b2 = promotedPool.shift() || null;
              const s2 = promotedPool.splice(0, 5);

              chunks.push({
                type: "promoted",
                blocks: [
                  { bigAd: b1, smallAds: s1 },
                  { bigAd: b2, smallAds: s2 },
                ].filter((b) => b.bigAd || b.smallAds.length > 0),
                showCategoryBatch: true,
              });
            }

            // 2. Process Free Ads with inserted big promoted cards
            while (freePool.length > 0) {
              const b1 = promotedForFreePool.shift() || null;
              const s1 = freePool.splice(0, 5);
              const b2 = promotedForFreePool.shift() || null;
              const s2 = freePool.splice(0, 5);

              if (s1.length > 0 || s2.length > 0) {
                chunks.push({
                  type: "free",
                  blocks: [
                    { bigAd: b1, smallAds: s1 },
                    { bigAd: b2, smallAds: s2 },
                  ].filter((b) => b.smallAds.length > 0),
                  showCategoryBatch: freePool.length > 0, // Maybe show category row between free chunks too?
                });
              }
            }

            const categoriesWithAds = categories.filter((cat) =>
              ads.some((ad) => ad.category === cat.name),
            );

            return (
              <div className="space-y-1">
                <div className="flex items-center justify-between px-1 lg:px-0">
                  <div className="text-xs lg:text-sm text-black flex items-center gap-1 px-1 lg:px-0">
                    <span className="font-medium">
                      {language === "bn"
                        ? `${filteredTotalAdsCount.toLocaleString("bn-BD")} টি বিজ্ঞাপন দেখছেন`
                        : `Viewing ${filteredTotalAdsCount.toLocaleString("en-US")} ads`}
                    </span>
                  </div>
                  <div className="flex item-center gap-0.5">
                    {savedAdsData.length > 0 && (
                      <button
                        onClick={handleResetSavedSearch}
                        className="flex items-center gap-1.5 text-[11px] lg:text-xs px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-full transition-colors text-black bg-white border border-slate-200 hover:bg-red-50"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-bookmark-off-icon lucide-bookmark-off"
                        >
                          <path d="M19 19v1a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5" />
                          <path d="m2 2 20 20" />
                          <path d="M8.656 3H17a2 2 0 0 1 2 2v8.344" />
                        </svg>{" "}
                      </button>
                    )}

                    <button
                      onClick={handleSaveSearch}
                      className={cn(
                        "flex items-center gap-1.5 text-[11px] lg:text-xs px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-full transition-colors",
                        isViewingSavedSearch
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "text-black bg-white border border-slate-200 hover:bg-slate-50",
                      )}
                    >
                      <Bookmark
                        className={cn(
                          "w-3.5 h-3.5 transition-all",
                          savedAdsData.length > 0
                            ? "fill-blue-600 text-blue-600"
                            : "text-slate-400",
                          isViewingSavedSearch && "fill-white text-white",
                        )}
                      />
                      {savedAdsData.length === 0
                        ? language === "bn"
                          ? "সেভ সার্চ"
                          : "Save Search"
                        : !isViewingSavedSearch
                          ? language === "bn"
                            ? "সেভ সার্চ দেখুন"
                            : "Show saved search"
                          : language === "bn"
                            ? "সেভ করা দেখাচ্ছে"
                            : "Showing save searched"}
                    </button>
                  </div>
                </div>

                {chunks.map((chunk, chunkIndex) => {
                  const categoryToShow =
                    feedAdsCategories[chunkIndex % feedAdsCategories.length];

                  return (
                    <div key={chunkIndex} className="flex flex-col gap-4">
                      {chunk.blocks.map((block, blockIndex) => {
                        return (
                          <React.Fragment key={blockIndex}>
                            {block.bigAd && (
                              <div
                                onClick={(e) => {
                                  if (block.bigAd) {
                                    openAdFromFeed(block.bigAd);
                                  }
                                }}
                                className={cn(
                                  "bg-white rounded-lg lg:rounded-xl cursor-pointer group block border shadow-sm mx-[5px] lg:mx-0",
                                  hasHighlightLabel(block.bigAd)
                                    ? "border-orange-500 shadow-[0_12px_30px_rgba(249,115,22,0.25)] ring-2 ring-orange-400/40"
                                    : "border-slate-100",
                                )}
                              >
                                {/* <div className="relative h-[315px] w-full rounded-t-lg lg:rounded-t-xl overflow-hidden group"> */}
                                <div className="relative aspect-[16/9] w-full rounded-t-lg lg:rounded-t-xl overflow-hidden group">
                                  {getImageUrl(block.bigAd.images?.[0]) && (
                                    <>
                                      <img
                                        src={
                                          getImageUrl(
                                            block.bigAd.images?.[0],
                                          ) || undefined
                                        }
                                        alt=""
                                        className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-80"
                                      />
                                      <img
                                        src={
                                          getImageUrl(
                                            block.bigAd.images?.[0],
                                          ) || undefined
                                        }
                                        alt={block.bigAd.headline}
                                        className="relative z-10 w-full h-full object-contain"
                                        loading="lazy"
                                      />
                                    </>
                                  )}
                                  {getNonHighlightLabels(block.bigAd).length >
                                    0 && (
                                    <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                                      {getNonHighlightLabels(block.bigAd).map(
                                        (label: string) => (
                                          <span
                                            key={label}
                                            className="bg-white/90 text-[10px] font-bold text-slate-800 px-2 py-0.5 rounded border border-slate-200 shadow-sm"
                                          >
                                            {label}
                                          </span>
                                        ),
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="p-2.5 lg:p-3">
                                  <div className="flex items-start justify-between">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1 text-[10px] lg:text-[11px] text-black mb-0.5">
                                        <span>
                                          {block.bigAd.adType === "Promoted"
                                            ? "Promoted By"
                                            : "Post By"}
                                        </span>
                                        <span
                                          className="font-bold text-black cursor-pointer hover:text-blue-600 hover:underline"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.dispatchEvent(
                                              new CustomEvent(
                                                "open-account-modal",
                                                {
                                                  detail: {
                                                    userId:
                                                      block.bigAd?.user?._id,
                                                  },
                                                },
                                              ),
                                            );
                                          }}
                                        >
                                          {block.bigAd.user?.storeName ||
                                            block.bigAd.user?.name ||
                                            "User"}
                                        </span>
                                        {block.bigAd.user?.mVerified && (
                                          <VerifiedBadge className="translate-y-[0.5px]" />
                                        )}
                                      </div>
                                      <div className="border-l-0 border-slate-300 pl-0 lg:border-l-0 lg:pl-0">
                                        <h3 className="font-bold text-base lg:text-lg text-black leading-tight mb-0 line-clamp-1">
                                          {block.bigAd.headline}
                                        </h3>
                                        <div className="font-bold text-sm lg:text-base text-black mb-0.5 lg:mb-1">
                                          ৳{" "}
                                          {block.bigAd.price?.toLocaleString() ||
                                            "N/A"}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 lg:gap-3 text-[10px] text-black">
                                        <div className="flex items-center gap-1">
                                          <MapPin className="w-3 h-3 text-black" />
                                          {block.bigAd.location}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Grid className="w-3 h-3 text-black" />
                                          {block.bigAd.category}
                                        </div>
                                      </div>
                                    </div>
                                    {block.bigAd.adType === "Promoted" &&
                                    block.bigAd.promoteType === "traffic" &&
                                    block.bigAd.trafficLink ? (
                                      <a
                                        href={block.bigAd.trafficLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="border border-slate-300 text-black bg-gray-200 px-2 lg:px-3 py-0.5 lg:py-1 rounded text-[10px] lg:text-xs font-bold hover:bg-slate-50"
                                      >
                                        {block.bigAd.trafficButtonType ||
                                          "Visit"}
                                      </a>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openAdFromFeed(block.bigAd);
                                        }}
                                        className="border border-slate-300 text-black bg-gray-200 px-2 lg:px-3 py-0.5 lg:py-1 rounded text-[10px] lg:text-xs font-bold hover:bg-slate-50"
                                      >
                                        Detail
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {block.smallAds.length > 0 && (
                              <div className="flex flex-col gap-2 bg-transparent lg:bg-white rounded-lg pb-2">
                                {block.smallAds.map((ad) => (
                                  <div
                                    key={ad._id}
                                    onClick={() => {
                                      openAdFromFeed(ad);
                                    }}
                                    className={cn(
                                      "bg-white rounded-lg lg:rounded-lg p-0.5 lg:p-3 flex gap-2 cursor-pointer transition-colors hover:bg-slate-50 border mx-[5px] lg:mx-0",
                                      hasHighlightLabel(ad)
                                        ? "border-orange-500 shadow-[0_10px_25px_rgba(249,115,22,0.18)] ring-2 ring-orange-400/30"
                                        : "border-transparent",
                                    )}
                                  >
                                    <div className="w-[120px] h-[90px] lg:w-[160px] lg:h-[130px] rounded-lg overflow-hidden shrink-0 relative group-hover:scale-[1.02] transition-transform">
                                      {getImageUrl(ad.images?.[0]) && (
                                        <>
                                          <img
                                            src={
                                              getImageUrl(ad.images?.[0]) ||
                                              undefined
                                            }
                                            alt=""
                                            className="absolute inset-0 w-full h-full object-contain blur scale-140 opacity-80"
                                          />
                                          <img
                                            src={
                                              getImageUrl(ad.images?.[0]) ||
                                              undefined
                                            }
                                            alt={ad.headline}
                                            className="relative z-10 w-full h-full object-contain"
                                            loading="lazy"
                                          />
                                        </>
                                      )}
                                      {getNonHighlightLabels(ad).length > 0 && (
                                        <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                                          {getNonHighlightLabels(ad).map(
                                            (label: string) => (
                                              <span
                                                key={label}
                                                className="bg-white/90 text-[10px] font-bold text-slate-800 px-2 py-0.5 rounded border border-slate-200 shadow-sm"
                                              >
                                                {label}
                                              </span>
                                            ),
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                      <div className="flex items-center gap-1 text-[9px] lg:text-[10px] text-slate-500 lg:text-black mb-0.5 flex-wrap">
                                        <span>
                                          {ad.adType === "Promoted"
                                            ? "Promoted By"
                                            : "Post By"}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <span
                                            className="font-bold text-black hover:text-blue-600 hover:underline"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.dispatchEvent(
                                                new CustomEvent(
                                                  "open-account-modal",
                                                  {
                                                    detail: {
                                                      userId: ad.user?._id,
                                                    },
                                                  },
                                                ),
                                              );
                                            }}
                                          >
                                            {ad.user?.storeName ||
                                              ad.user?.name ||
                                              "User"}
                                          </span>
                                          {ad.user?.mVerified && (
                                            <VerifiedBadge className="translate-y-[0.5px]" />
                                          )}
                                        </div>
                                      </div>
                                      <h4 className="text-[15px] text-black font-semibold line-clamp-1 leading-tight mb-0">
                                        {ad.headline}
                                      </h4>
                                      {ad.price && (
                                        <div className="text-[15px] lg:text-sm text-black font-semibold leading-tight mb-1">
                                          ৳ {ad.price?.toLocaleString()}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-0 text-[9px] lg:text-[10px] text-black group-hover:text-black flex-wrap">
                                        <div className="flex items-center gap-2">
                                          <div className="flex items-center gap-0.5 shrink-0">
                                            <MapPin className="w-2.5 h-2.5" />
                                            <span className="truncate max-w-[110px] md:max-w-[120px]">
                                              {ad.location}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-0.5 shrink-0">
                                            <Grid className="w-2.5 h-2.5" />
                                            <span className="truncate max-w-[110px] md:max-w-[120px]">
                                              {ad.category}
                                            </span>
                                          </div>
                                        </div>
                                        {ad.adType !== "Promoted" && (
                                          <div className="w-full text-right text-black/60 text-[9px] lg:text-[10px] whitespace-nowrap">
                                            {timeAgo(
                                              ad.createdAt,
                                              language as "en" | "bn",
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Category row moved outside block map */}
                          </React.Fragment>
                        );
                      })}

                      {/* Render Category Row after the chunk (every 2 blocks) */}
                      {chunk.showCategoryBatch && categoryToShow && (
                        <div className="bg-white relative group/cat rounded-lg p-2 pb-0 mt-2">
                          <div className="bg-white flex items-center justify-between px-2 mb-2">
                            <h3 className="text-sm font-medium text-black">
                              {getLocalizedCategoryName(
                                categoryToShow.name,
                                categoryToShow.categoryNameBn,
                              )}
                            </h3>
                            <button
                              onClick={() => {
                                const params = new URLSearchParams(
                                  searchParams.toString(),
                                );
                                setShortFilterParam(
                                  params,
                                  "c",
                                  "category",
                                  categoryToShow.name,
                                );
                                router.push(`/d?${params.toString()}`, {
                                  scroll: false,
                                });
                                setFilters((prev) => ({
                                  ...prev,
                                  category: categoryToShow.name,
                                }));
                              }}
                              className="text-xs text-black hover:underline"
                            >
                              {language === "bn" ? "সব দেখুন" : "See All"}
                            </button>
                          </div>
                          <div className="relative">
                            <div
                              id={`feed-scroll-cat-${categoryToShow._id}-${chunkIndex}`}
                              className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-2"
                            >
                              {totalAds
                                .filter(
                                  (ad) => ad.category === categoryToShow.name,
                                )
                                .slice(0, 10)
                                .map((ad) => (
                                  <div
                                    key={ad._id}
                                    className={cn(
                                      "min-w-[240px] w-[240px] bg-white border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow",
                                      hasHighlightLabel(ad)
                                        ? "border-orange-500 shadow-[0_10px_25px_rgba(249,115,22,0.18)] ring-2 ring-orange-400/30"
                                        : "border-slate-200",
                                    )}
                                    onClick={() => {
                                      openAdFromFeed(ad);
                                    }}
                                  >
                                    <div className="h-40 relative rounded-t-lg overflow-hidden bg-slate-100">
                                      {getImageUrl(ad.images?.[0]) && (
                                        <>
                                          <img
                                            src={
                                              getImageUrl(ad.images?.[0]) ||
                                              undefined
                                            }
                                            alt=""
                                            className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-70"
                                          />
                                          <img
                                            src={
                                              getImageUrl(ad.images?.[0]) ||
                                              undefined
                                            }
                                            alt={ad.headline}
                                            className="relative z-10 w-full h-full object-contain"
                                            loading="lazy"
                                          />
                                        </>
                                      )}
                                      {getNonHighlightLabels(ad).length > 0 && (
                                        <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                                          {getNonHighlightLabels(ad).map(
                                            (label: string) => (
                                              <span
                                                key={label}
                                                className="bg-white/90 text-[10px] font-bold text-slate-800 px-2 py-0.5 rounded border border-slate-200 shadow-sm"
                                              >
                                                {label}
                                              </span>
                                            ),
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="p-2.5 flex items-center justify-between gap-2">
                                      <div className="min-w-0">
                                        <h4 className="text-black truncate text-sm mb-0.5">
                                          {ad.headline}
                                        </h4>
                                        <p className="text-black text-sm">
                                          TK{" "}
                                          {ad.price?.toLocaleString() || "N/A"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                            <button
                              onClick={() => {
                                const el = document.getElementById(
                                  `feed-scroll-cat-${categoryToShow._id}-${chunkIndex}`,
                                );
                                if (el)
                                  el.scrollBy({
                                    left: -250,
                                    behavior: "smooth",
                                  });
                              }}
                              className="absolute -left-3 top-[43%] -translate-y-1/2 w-9 h-9 bg-white shadow-md rounded-full flex items-center justify-center text-black z-20 border border-slate-100 hover:bg-slate-50"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                const el = document.getElementById(
                                  `feed-scroll-cat-${categoryToShow._id}-${chunkIndex}`,
                                );
                                if (el)
                                  el.scrollBy({
                                    left: 250,
                                    behavior: "smooth",
                                  });
                              }}
                              className="absolute -right-3 top-[43%] -translate-y-1/2 w-9 h-9 bg-white shadow-md rounded-full flex items-center justify-center text-black z-20 border border-slate-100 hover:bg-slate-50"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Popular Sellers for Mobile - Horizontal Scroll */}
                     {chunk.showCategoryBatch && premiumUsers.length > 0 && (
  <div className="lg:hidden mt-2 bg-white rounded-lg p-2 pb-4">
    <div className="flex items-center justify-between px-2 mb-3">
      <h3 className="text-[13px] text-slate-600">
        {language === "bn" ? "জনপ্রিয় বিক্রেতা" : "Popular Seller"}
      </h3>
    </div>

    <div className="relative">
      <div
        ref={sellerScrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar pb-1 px-1 scroll-smooth"
      >
        {premiumUsers.slice(0,5).map((user) => (
          <div
            key={user._id}
            className="flex-none flex flex-col items-center w-[90px] gap-2 cursor-pointer"
            onClick={() => handleProfileClick(user._id)}
          >
            <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-100 bg-slate-200 relative shrink-0">
              {user.photo ? (
                <img
                  src={getImageUrl(user.photo) || undefined}
                  alt={user.storeName || user.name}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-lg uppercase">
                  {(user.storeName || user.name).charAt(0)}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center w-full text-center">
              <h4 className="font-semibold text-slate-600 text-[11px] leading-tight line-clamp-1 w-full">
                {user.storeName || user.name}
              </h4>

              <p className="text-[9px] text-slate-400 mt-0.5 mb-1">
                {user.followers?.length || 0} {t("follower")}
              </p>

              <button
                onClick={(e) => handleFollowUser(e, user._id)}
                className="mt-1 px-3 py-1 rounded-full text-[10px] font-bold transition-all w-full bg-white text-slate-500 border border-slate-300 hover:bg-slate-50 hover:border-slate-400"
              >
                {user.isFollowing ? t("Unfollow") : t("Follow")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {premiumUsers.length > 5 && (
        <button
          onClick={() =>
            setIsMerchantsModalOpen(true)
          }
          className="absolute -right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white shadow-lg rounded-full flex items-center justify-center border border-slate-200 z-20"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  </div>
)}
                    </div>
                  );
                })}

                {isLoadingMore && (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                  </div>
                )}
                <div id="load-more-trigger" className="h-4 w-full" />
              </div>
            );
          })()
        )}

        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          categories={categories}
          locations={locations}
          initialFilters={filters}
          onApply={(newFilters) => {
            setFilters(newFilters);
            setIsFilterModalOpen(false);

            // Sync sidebar expansion
            if (newFilters.category) {
              const cat = categories.find(
                (c) => c.name === newFilters.category,
              );
              if (cat) setExpandedCategory(cat._id);
            }
            if (newFilters.location) {
              const loc = locations.find((l) => l.name === newFilters.location);
              if (loc) setExpandedLocation(loc._id);
            }
          }}
        />
      </div>

      {/* Mobile Scroll-To-Top */}
      <div className="fixed md:hidden right-3 bottom-[70px] z-40">
        <button
          onClick={() =>
            document
              .getElementById("main-dashboard-scroller")
              ?.scrollTo({ top: 0, behavior: "smooth" })
          }
          className="w-10 h-10 bg-[#0088cc] rounded-full shadow-md flex items-center justify-center hover:bg-[#0077b5] transition-colors"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-6 h-6 text-white" strokeWidth={2.5} />
        </button>
      </div>

      {/* Gap 2: 50px */}
      <div className="hidden xl:block w-[50px] flex-none relative self-stretch">
        <div className="sticky top-[90vh] pl-1">
          <button
            onClick={() =>
              document
                .getElementById("main-dashboard-scroller")
                ?.scrollTo({ top: 0, behavior: "smooth" })
            }
            className="w-10 h-10 bg-[#0088cc] rounded-full shadow-md flex items-center justify-center hover:bg-[#0077b5] transition-colors"
          >
            <ArrowUp className="w-6 h-6 text-white" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Right Sidebar - Popular Seller: 230px */}
      <div className="hidden xl:block w-[230px] flex-none sticky top-4 h-[calc(100vh-32px)] overflow-y-auto no-scrollbar pb-10 z-40">
        <div className="bg-white rounded-lg w-full">
          <div className="p-3 pb-1">
            <h3 className="text-[13px] text-black">{t("popular_seller")}</h3>
          </div>

          <div className="space-y-3.5 px-3 pb-3">
            {premiumUsers.length === 0 ? (
              <div className="py-8 text-center text-black text-sm italic">
                <p>{t("no_premium_merchants")}</p>
              </div>
            ) : (
              premiumUsers.slice(0,9).map((user) => (
                <div key={user._id} className="flex gap-3">
                  <div
                    className="shrink-0 cursor-pointer"
                    onClick={() => handleProfileClick(user._id)}
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
                  <div className="flex-1 min-w-0 h-14 flex flex-col justify-between py-0.5">
                    <div className="flex flex-col">
                      <div
                        className="flex items-center gap-1.5 leading-tight cursor-pointer group/name"
                        onClick={() => handleProfileClick(user._id)}
                      >
                        <h4 className=" text-black text-[15px] truncate group-hover/name:text-[#0088cc] transition-colors">
                          {user.storeName || user.name}
                        </h4>
                        {user.mVerified && (
                          <VerifiedBadge className="translate-y-[0.5px]" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 -mt-0.5">
                        {user.followers?.length || 0} {t("follower")}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleFollowUser(e, user._id)}
                      className={cn(
                        "flex items-center justify-center gap-1 px-2.5 h-5 border rounded-full text-[10px] font-bold transition-all w-fit",
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
                </div>
              ))
            )}
            {!premiumUsers.length ? "" : (
              <div className="flex justify-center pt-2">
  <button
    onClick={() => setIsMerchantsModalOpen(true)}
    className="flex items-center justify-center w-full gap-1 px-4 py-2 border border-slate-300 rounded-full text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-all"
  >
    {language === "bn" ? "আরও বিক্রেতা" : "More Merchant"}
    <ChevronRight className = "w-3.5 h-3.5 text-black"/>
  </button>
</div>
            )  }
          </div>
        </div>
      </div>

      {/* Balancing Spacer: 70px,, */}
      <div className="hidden xl:block w-[70px] flex-none" />

      <InfoModal
        isOpen={showFooterPromoteModal}
        onClose={() => setShowFooterPromoteModal(false)}
        title={language === "bn" ? "প্রমোট (Promote)" : "Promote"}
        content={
          <div className="space-y-4 text-slate-700">
            {language === "bn" ? (
              <>
                <p>
                  Shadamon-এ প্রমোট করা অত্যন্ত সহজ এবং ঝামেলামুক্ত। আপনার
                  পোস্টটি দ্রুত সঠিক ক্রেতাদের কাছে পৌঁছে দিতে আপনি সরাসরি এর
                  ব্যাপ্তি (Reach), বাজেট এবং টার্গেটিং নিয়ন্ত্রণ করতে পারেন।
                  সবকিছু আপনার নিয়ন্ত্রণেই থাকবে-কে আপনার পোস্ট দেখবে, কতজন
                  দেখবে এবং কত দ্রুত তাদের কাছে পৌঁছাবে, তা আপনিই ঠিক করবেন।
                </p>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2">ফিচারসমূহ</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      অধিক ভিউ এবং রিচ - আপনার পোস্টটি বিপুল সংখ্যক সম্ভাব্য
                      ক্রেতার কাছে পৌঁছাতে পারে, যা বিক্রির সম্ভাবনা বাড়িয়ে দেয়।
                      পুরো প্রক্রিয়াটি সম্পূর্ণ আপনার নিয়ন্ত্রণে থাকে।
                    </li>
                    <li>
                      টার্গেটেড রিচ - আপনার পোস্ট নির্দিষ্ট ক্যাটাগরি বা লোকেশনে
                      প্রমোট করুন যাতে আপনার কাঙ্ক্ষিত ক্রেতারা আপনাকে সহজেই
                      খুঁজে পায়।
                    </li>
                    <li>
                      সরাসরি রেসপন্স - দ্রুত যোগাযোগের জন্য আগ্রহী ক্রেতাদের কাছ
                      থেকে সরাসরি মেসেজ এবং কল পান।
                    </li>
                    <li>
                      তাৎক্ষণিক প্রমোশন - কোনো জটিল রিভিউ বা বিলম্ব ছাড়াই আপনার
                      প্রমোশন সাথে সাথে লাইভ বা চালু হয়ে যায়।
                    </li>
                    <li>
                      পোস্ট হাইলাইটিং - আপনার পোস্টকে আরও আকর্ষণীয় করতে 'New',
                      'Offer' অথবা 'Featured'-এর মতো লেবেল ব্যবহার করুন।
                    </li>
                    <li>
                      পারফরম্যান্স ট্র্যাকিং - আপনার প্রমোশন কেমন চলছে তা
                      রিয়েল-টাইমে সহজেই ট্র্যাক করুন।
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2">
                    ভেরিফাইড মেম্বার হওয়ার সুবিধা
                  </h4>
                  <p>
                    ভেরিফাইড মেম্বার হওয়া প্ল্যাটফর্মে আপনার বিশ্বাসযোগ্যতা ও
                    গ্রহণযোগ্যতা বৃদ্ধি করে। ক্রেতাদের কাছে আপনার প্রোফাইল এবং
                    পোস্টগুলো আরও নির্ভরযোগ্য মনে হয়, যা যোগাযোগ এবং বিক্রির হার
                    বাড়িয়ে দেয়।
                  </p>
                  <p className="mt-2 font-semibold">আপনি আরও পাবেন:</p>
                  <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>উচ্চতর বিশ্বাসযোগ্যতা এবং প্রফেশনাল উপস্থিতি</li>
                    <li>ক্রেতাদের কাছ থেকে দ্রুত সাড়া</li>
                    <li>প্ল্যাটফর্মে আরও ভালো অবস্থান</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2">
                    কেন Shadamon Promote ব্যবহার করবেন?
                  </h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>কোনো জটিল বুস্ট বা লুকানো সিস্টেম নেই</li>
                    <li>সম্পূর্ণ নিয়ন্ত্রণ আপনার হাতে</li>
                    <li>দ্রুত ফলাফল</li>
                    <li>সময় বাঁচায় এবং প্রমোশনকে সহজ করে</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <p>
                  Promoting on Shadamon is simple and completely hassle-free.
                  You can directly control your reach, budget, and targeting to
                  quickly connect your posts with the right customers.
                  Everything stays in your control-you decide who sees your
                  post, how many people see it, and how fast it reaches them.
                </p>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Features</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      More Views & Reach - Your post can reach a large number of
                      potential customers, increasing your chances of
                      engagement. The entire process is fully under your
                      control.
                    </li>
                    <li>
                      Targeted Reach - Promote your posts to specific categories
                      or locations so your ideal audience can easily find you.
                    </li>
                    <li>
                      Direct Responses - Get messages and calls directly from
                      interested customers for faster communication.
                    </li>
                    <li>
                      Instant Promotion - Your promotion goes live immediately
                      without any complex review or delay.
                    </li>
                    <li>
                      Post Highlighting - Make your post more attractive with
                      labels like New, Offer, or Featured.
                    </li>
                    <li>
                      Performance Tracking - Easily track how your promotion is
                      performing in real time.
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2">
                    Verified Member Benefits
                  </h4>
                  <p>
                    Becoming a verified member increases your trust and
                    credibility on the platform. Your profile and posts appear
                    more reliable to customers, increasing engagement and
                    response rates.
                  </p>
                  <p className="mt-2 font-semibold">You also get:</p>
                  <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>Higher trust and professional visibility</li>
                    <li>Faster customer responses</li>
                    <li>Better overall platform presence</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2">
                    Why Shadamon Promote?
                  </h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>No complex boost or hidden systems</li>
                    <li>Full control is in your hands</li>
                    <li>Faster results</li>
                    <li>Saves time and simplifies promotion</li>
                  </ul>
                </div>
              </>
            )}

            <div className="pt-1">
              <button
                onClick={handleFooterPromotePostAdd}
                className="w-full sm:w-auto px-5 py-2.5 rounded-md bg-[#4285F4] text-white font-bold hover:bg-blue-600 transition-colors"
              >
                Post Add
              </button>
            </div>
          </div>
        }
      />
      <MerchantsModal
  isOpen={isMerchantsModalOpen}
  onClose={() => setIsMerchantsModalOpen(false)}
  premiumUsers={premiumUsers}
  onProfileClick={handleProfileClick}
  onFollowUser={handleFollowUser}
/>
    </div>
  );
}