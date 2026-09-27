"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  useRouter,
  useSearchParams,
  useParams,
  usePathname,
} from "next/navigation";
import {
  User,
  Search,
  Bell,
  MessageSquare,
  Globe,
  Home,
  Plus,
  Inbox,
  LogOut,
  Settings,
  Menu,
  X,
  Grid,
  MapPin,
  ChevronRight,
  ChevronDown,
  Megaphone,
} from "lucide-react";
import {
  RiMailFill,
  RiMailLine,
  RiUser3Fill,
  RiHome5Fill,
  RiHome5Line,
  RiSearchLine,
  RiAddLine,
  RiUser3Line,
} from "react-icons/ri";
import Cookies from "js-cookie";
import { io } from "socket.io-client";
import { useLanguage } from "../context/LanguageContext";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useSettings } from "../context/SettingsContext";
import PostAdModal from "../../components/PostAdModal";
import PromoteModal from "../../components/PromoteModal";
import LoginModal from "../../components/LoginModal";
import RegisterModal from "../../components/RegisterModal";
import AccountActivityModal from "../../components/AccountActivityModal";
import MobileEntryModal from "../../components/MobileEntryModal";
import VerificationModal from "../../components/VerificationModal";
import AdDetailsModal from "../../components/AdDetailsModal";
import MessageModal from "../../components/MessageModal";
import ChatMessageModal from "../../components/ChatMessageModal";
import InfoModal from "../../components/InfoModal";
import AdDisplay from "../../components/AdDisplay";
import AdPopup from "../../components/AdPopup";
import SearchModal from "../../components/SearchModal";
import FilterModal, { FilterState } from "../../components/FilterModal";
import { toast } from "react-hot-toast";

import { API_BASE_URL } from "../../utils/apiConfig";
import { getImageUrl } from "../../utils/imageUrl";
import {
  INFO_CONTENT,
  getInfoContentForLanguage,
  type InfoPageType,
} from "@/utils/infoContent";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

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
  subcategories: SubItem[];
}

interface Location {
  _id: string;
  name: string;
  subLocations: SubItem[];
}

// Key used to hand off the feed's scroll position to this layout right
// before it navigates to an ad's detail view. Written synchronously by
// DashboardClient's openAdFromFeed() at click time (not after the URL
// change), so it survives the async round-trip and re-render that used
// to zero it out.
const PENDING_AD_SCROLL_KEY = "pending_ad_scroll_top";

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

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

  const [isPostAdModalOpen, setIsPostAdModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isMobileEntryModalOpen, setIsMobileEntryModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [initialMobile, setInitialMobile] = useState("");
  const [tempMobile, setTempMobile] = useState<string>("");
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalInitialTab, setAccountModalInitialTab] = useState<
    "Page" | "Profile" | "Settings" | "Post" | "Activity"
  >("Page");
  const [viewingUserId, setViewingUserId] = useState<string | undefined>(
    undefined,
  );
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isChatMessageModalOpen, setIsChatMessageModalOpen] = useState(false);
  const [chatAd, setChatAd] = useState<any>(null);
  const [chatOtherUser, setChatOtherUser] = useState<any>(null);

  const [adToPromote, setAdToPromote] = useState<any>(null);
  const [adToEdit, setAdToEdit] = useState<any>(null);
  const [verificationToken, setVerificationToken] = useState<
    string | undefined
  >(undefined);
  const [user, setUser] = useState<any>(null);

  const [mobileEntryReason, setMobileEntryReason] = useState<
    "post_ad" | "account" | "message" | "report" | "promote" | "send_cv"
  >("post_ad");
  const [reportAd, setReportAd] = useState<any>(null);
  const [shouldOpenReportAfterLogin, setShouldOpenReportAfterLogin] =
    useState(false);

  const [infoModal, setInfoModal] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
  }>({
    isOpen: false,
    title: "",
    content: "",
  });

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    const token = Cookies.get("token");
    if (!token) {
      setUnreadCount(0);
      return;
    }
    try {
      const [convRes, notifRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/messages/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/user/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const convData = await convRes.json();
      const notifData = await notifRes.json();

      let total = 0;

      if (convData.success && Array.isArray(convData.data)) {
        total += convData.data.filter(
          (conv: any) => (conv.unreadCount || 0) > 0,
        ).length;
      }

      if (Array.isArray(notifData)) {
        total += notifData.filter((n: any) => !n.isRead).length;
      }

      setUnreadCount(total);
    } catch (err) {
      console.error("Unread count fetch error:", err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    window.addEventListener("refresh-unread-count", fetchUnreadCount);
    return () => {
      clearInterval(interval);
      window.removeEventListener("refresh-unread-count", fetchUnreadCount);
    };
  }, []);

  const openInfoModal = (type: InfoPageType) => {
    const selected = INFO_CONTENT[type];
    if (selected) {
      const localized = getInfoContentForLanguage(selected, language);
      setInfoModal({
        isOpen: true,
        title: localized.title,
        content: localized.content,
      });
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAdForDetail, setSelectedAdForDetail] = useState<any | null>(
    null,
  );

  // --- Scroll-position preservation around the Ad Details modal ---
  const savedScrollRef = useRef(0);
  const getScroller = () => document.getElementById("main-dashboard-scroller");

  const openAdDetail = (ad: any) => {
    savedScrollRef.current = getScroller()?.scrollTop || 0;
    setSelectedAdForDetail(ad);
  };

  // Same as openAdDetail, but takes the scroll position handed off by the
  // feed (captured at click time, before the URL/query-param change) instead
  // of reading the live scroller — which by the time this effect runs may
  // already have been reset by the navigation/re-render.
  const openAdDetailWithScroll = (ad: any, scrollTop: number) => {
    savedScrollRef.current = scrollTop;
    setSelectedAdForDetail(ad);
  };

  const closeAdDetail = () => {
    savedScrollRef.current = getScroller()?.scrollTop || 0;
    setSelectedAdForDetail(null);
  };

  useEffect(() => {
    const el = getScroller();
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = savedScrollRef.current;
    });
  }, [selectedAdForDetail]);

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

  const [isGlobalFilterModalOpen, setIsGlobalFilterModalOpen] = useState(false);
  const [globalFilters, setGlobalFilters] = useState<FilterState>(() =>
    getFiltersFromSearchParams(),
  );

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGlobalFilters(getFiltersFromSearchParams());
  }, [searchParams]);

  const openGlobalFilterFromSearch = (
    view: "main" | "category" | "location",
  ) => {
    setIsSearchModalOpen(false);
    setGlobalFilters(getFiltersFromSearchParams());
    setIsGlobalFilterModalOpen(true);

    if (view !== "main") {
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("open-filter-view", { detail: { view } }),
        );
      }, 50);
    }
  };

  const applyGlobalFilters = (newFilters: FilterState) => {
    setGlobalFilters(newFilters);
    setIsGlobalFilterModalOpen(false);

    const params = new URLSearchParams(searchParams.toString());
    const nextSearch = (
      newFilters.search ??
      searchParams.get("search") ??
      ""
    ).trim();

    setShortFilterParam(
      params,
      "c",
      "category",
      newFilters.category || undefined,
    );
    setShortFilterParam(
      params,
      "sc",
      "subCategory",
      newFilters.subCategory || undefined,
    );
    setShortFilterParam(
      params,
      "l",
      "location",
      newFilters.location || undefined,
    );
    setShortFilterParam(
      params,
      "sl",
      "subLocation",
      newFilters.subLocation || undefined,
    );
    if (newFilters.promoteTag && newFilters.promoteTag !== "All")
      params.set("promoteTag", newFilters.promoteTag);
    else params.delete("promoteTag");
    if (newFilters.sort && newFilters.sort !== "newest")
      params.set("sort", newFilters.sort);
    else params.delete("sort");
    if (nextSearch) params.set("search", nextSearch);
    else params.delete("search");

    const queryString = params.toString();
    router.push(queryString ? `/d?${queryString}` : "/d", { scroll: false });
  };

  // Event Listener for opening account modal from children
  useEffect(() => {
    const handleOpenAccount = (e: any) => {
      const userId = e.detail?.userId;
      const activeTab = e.detail?.activeTab;

      setViewingUserId(userId);
      if (activeTab) {
        setAccountModalInitialTab(activeTab);
      } else {
        setAccountModalInitialTab("Page");
      }

      setIsAccountModalOpen(true);

      if (userId) {
        const params = new URLSearchParams(window.location.search);
        params.set("profile", userId);
        router.push(`/d?${params.toString()}`, { scroll: false });
      }
    };

    window.addEventListener(
      "open-account-modal",
      handleOpenAccount as EventListener,
    );

    const handleOpenMobileEntry = (e: any) => {
      if (e.detail?.reason) {
        setMobileEntryReason(e.detail.reason);
        if (
          (e.detail.reason === "report" || e.detail.reason === "send_cv") &&
          e.detail.ad
        ) {
          setReportAd(e.detail.ad);
        }
      } else {
        setMobileEntryReason("post_ad");
        setReportAd(null);
      }
      setIsMobileEntryModalOpen(true);
    };

    window.addEventListener(
      "open-mobile-entry-modal",
      handleOpenMobileEntry as EventListener,
    );

    const handleOpenChat = (e: CustomEvent) => {
      setChatAd(e.detail?.ad);
      setChatOtherUser(e.detail?.otherUser || null);
      setIsChatMessageModalOpen(true);
    };
    window.addEventListener("open-chat-modal", handleOpenChat as EventListener);

    const handleOpenInfo = (e: CustomEvent) => {
      openInfoModal(e.detail?.type);
    };
    window.addEventListener("open-info-modal", handleOpenInfo as EventListener);

    const handleOpenPostAd = (e: CustomEvent) => {
      setAdToEdit(e.detail?.ad || null);
      setIsPostAdModalOpen(true);
    };
    window.addEventListener(
      "open-post-ad-modal",
      handleOpenPostAd as EventListener,
    );

    const handleOpenPromote = (e: CustomEvent) => {
      setAdToPromote(e.detail?.ad || null);
      setIsPromoteModalOpen(true);
    };
    window.addEventListener(
      "open-promote-modal",
      handleOpenPromote as EventListener,
    );

    return () => {
      window.removeEventListener(
        "open-account-modal",
        handleOpenAccount as EventListener,
      );
      window.removeEventListener(
        "open-mobile-entry-modal",
        handleOpenMobileEntry,
      );
      window.removeEventListener(
        "open-chat-modal",
        handleOpenChat as EventListener,
      );
      window.removeEventListener(
        "open-info-modal",
        handleOpenInfo as EventListener,
      );
      window.removeEventListener(
        "open-post-ad-modal",
        handleOpenPostAd as EventListener,
      );
      window.removeEventListener(
        "open-promote-modal",
        handleOpenPromote as EventListener,
      );
    };
  }, [language, router]);

  // Handle clicking outside of search to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [socket, setSocket] = useState<any>(null);

  const { settings, fetchDashboardSettings, fetchAdPositions } = useSettings();

  // Socket.io for notifications and Auth Sync
  useEffect(() => {
    const fetchUserAndSetupSocket = async () => {
      const token = Cookies.get("token");
      if (!token) {
        setUser(null);
        setUnreadCount(0);
        if (socket) {
          socket.disconnect();
          setSocket(null);
        }
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setUser(null);
          return;
        }
        const userData = await res.json();

        if (userData && userData._id) {
          setUser(userData);
          const socketUrl = API_BASE_URL.replace("/api", "");
          const newSocket = io(socketUrl);
          setSocket(newSocket);

          newSocket.emit("setup", { id: userData._id });

          newSocket.on("notification received", () => {
            fetchUnreadCount();
            window.dispatchEvent(new Event("refresh-unread-count"));
          });

          return () => {
            newSocket.disconnect();
          };
        }
      } catch (err) {
        console.error("Socket setup error:", err);
      }
    };

    fetchUserAndSetupSocket();

    const handleAuthChange = () => {
      fetchUserAndSetupSocket();
      fetchUnreadCount();
    };

    window.addEventListener("auth-change", handleAuthChange);
    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  // Mobile Sidebar State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);
  const [totalAds, setTotalAds] = useState<number>(0);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/ads/public/all`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setTotalAds(data.data.length);
        }
      } catch (err) {
        console.error("Meta fetch error:", err);
      }
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchDashboardSettings();
    fetchAdPositions();
  }, [fetchDashboardSettings, fetchAdPositions]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, subCatRes, locRes, subLocRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/categories`).then((res) => res.json()),
          fetch(`${API_BASE_URL}/api/categories/sub`).then((res) => res.json()),
          fetch(`${API_BASE_URL}/api/locations`).then((res) => res.json()),
          fetch(`${API_BASE_URL}/api/locations/sub`).then((res) => res.json()),
        ]);

        if (catRes.success && subCatRes.success) {
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

        if (locRes.success && subLocRes.success) {
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
      } catch (error) {
        console.error("Failed to load menu data", error);
      }
    };
    fetchData();

    const openModal = searchParams.get("openModal");
    const openUsersProfile = searchParams.get("openUsersProfile");
    const openMessageModal = searchParams.get("openMessageModal");
    const profileId = searchParams.get("profile");
    const openPromoteTab = searchParams.get("openPromoteTab");
    const token = Cookies.get("token");

    if (openPromoteTab === "true" && token) {
      setAccountModalInitialTab("Post");
      setIsAccountModalOpen(true);
      const params = new URLSearchParams(window.location.search);
      params.delete("openPromoteTab");
      router.replace(`${window.location.pathname}?${params.toString()}`, {
        scroll: false,
      });
    }

    if (openMessageModal === "true" && token) {
      setIsMessageModalOpen(true);
      const params = new URLSearchParams(window.location.search);
      params.delete("openMessageModal");
      router.replace(`${window.location.pathname}?${params.toString()}`, {
        scroll: false,
      });
    }

    if (openUsersProfile === "true" && token) {
      setAccountModalInitialTab("Post");
      setIsAccountModalOpen(true);
      const params = new URLSearchParams(window.location.search);
      params.delete("openUsersProfile");
      router.replace(`${window.location.pathname}?${params.toString()}`, {
        scroll: false,
      });
    }

    if (openModal === "true" && token) {
      setIsPostAdModalOpen(true);
      const params = new URLSearchParams(window.location.search);
      params.delete("openModal");
      router.replace(`${window.location.pathname}?${params.toString()}`, {
        scroll: false,
      });
    }

    if (profileId) {
      setViewingUserId(profileId);
      setIsAccountModalOpen(true);
    }

    const adParam = searchParams.get("ad");
    if (adParam) {
      const idMatch = adParam.match(/--([a-f\d]{24})$/i);
      const adId = idMatch ? idMatch[1] : adParam;

      // Consume the scroll position the feed handed off (if any) BEFORE the
      // async fetch below, so a second effect run can't miss it.
      let pendingScroll: number | null = null;
      try {
        const raw = sessionStorage.getItem(PENDING_AD_SCROLL_KEY);
        if (raw !== null) {
          const parsed = parseInt(raw, 10);
          if (!Number.isNaN(parsed)) pendingScroll = parsed;
          sessionStorage.removeItem(PENDING_AD_SCROLL_KEY);
        }
      } catch {}

      fetch(`${API_BASE_URL}/api/ads/public/${adId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const ad = data.data;
            if (ad.promoteType === "traffic" && ad.trafficLink) {
              const directLink = ad.trafficLink.startsWith("http")
                ? ad.trafficLink
                : `https://${ad.trafficLink}`;
              window.open(directLink, "_blank");
              const params = new URLSearchParams(searchParams.toString());
              params.delete("ad");
              router.replace(
                params.toString()
                  ? `${pathname}?${params.toString()}`
                  : pathname,
                { scroll: false },
              );
            }
            if (pendingScroll !== null) {
              openAdDetailWithScroll(ad, pendingScroll);
            } else {
              openAdDetail(ad);
            }
          }
        })
        .catch((err) => console.error("Error fetching ad from URL:", err));
    } else {
      closeAdDetail();
    }

    if (pathname === "/dashboard/post-ad" || pathname === "/d/post-ad") {
      const token = Cookies.get("token");
      if (!token) {
        setMobileEntryReason("post_ad");
        setIsMobileEntryModalOpen(true);
      } else {
        setTempMobile("");
        setIsPostAdModalOpen(true);
      }
    }
  }, [searchParams, pathname]);

  // Apply Site Settings (Favicon, etc)
  useEffect(() => {
    if (settings.favIcon) {
      const faviconUrl = getImageUrl(settings.favIcon);

      let link: HTMLLinkElement | null =
        document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.getElementsByTagName("head")[0].appendChild(link);
      }
      link.href = faviconUrl;

      let appleIcon: HTMLLinkElement | null = document.querySelector(
        "link[rel='apple-touch-icon']",
      );
      if (!appleIcon) {
        appleIcon = document.createElement("link");
        appleIcon.rel = "apple-touch-icon";
        document.getElementsByTagName("head")[0].appendChild(appleIcon);
      }
      appleIcon.href = faviconUrl;

      let shortcutIcon: HTMLLinkElement | null = document.querySelector(
        "link[rel='shortcut icon']",
      );
      if (!shortcutIcon) {
        shortcutIcon = document.createElement("link");
        shortcutIcon.rel = "shortcut icon";
        document.getElementsByTagName("head")[0].appendChild(shortcutIcon);
      }
      shortcutIcon.href = faviconUrl;
    }
  }, [settings.favIcon]);

  // Handle Search Suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/ads/public/all?search=${encodeURIComponent(searchQuery)}&limit=5`,
          );
          const data = await res.json();
          if (data.success) {
            setSuggestions(data.data);
            setShowSuggestions(true);
          }
        } catch (err) {
          console.error("Suggestion fetch error:", err);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 50);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearchExecution = () => {
    window.dispatchEvent(
      new CustomEvent("show-search-results", {
        detail: { query: searchQuery },
      }),
    );
    setShowSuggestions(false);
    setIsMobileSearchOpen(false);
  };

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("user");
    setUser(null);
    setUnreadCount(0);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    sessionStorage.removeItem("ad_session_views");
    sessionStorage.removeItem("ad_session_view_tokens");
    window.dispatchEvent(new Event("auth-change"));
    toast.success("Logged out successfully");
    window.location.href = "/d";
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "bn" : "en");
  };

  const toggleCategory = (id: string) => {
    setExpandedCategory(expandedCategory === id ? null : id);
  };

  const toggleLocation = (id: string) => {
    setExpandedLocation(expandedLocation === id ? null : id);
  };

  const handleAddAdClick = () => {
    const token = Cookies.get("token");
    if (!token) {
      setMobileEntryReason("post_ad");
      setIsMobileEntryModalOpen(true);
    } else {
      setTempMobile("");
      setIsPostAdModalOpen(true);
    }
  };

  const handleAccountClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const token = Cookies.get("token");
    if (!token) {
      setMobileEntryReason("account");
      setIsMobileEntryModalOpen(true);
    } else {
      setViewingUserId(undefined);
      setAccountModalInitialTab("Post");
      setIsAccountModalOpen(true);
    }
  };

  const handleMessageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const token = Cookies.get("token");
    if (!token) {
      setMobileEntryReason("message");
      setIsMobileEntryModalOpen(true);
    } else {
      setIsMessageModalOpen(true);
      fetchUnreadCount();
    }
  };

  const handlePromoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new Event("open-footer-promote-modal"));
  };

  const [headerOffset, setHeaderOffset] = useState(0);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollTop, setLastScrollTop] = useState(0);

  useEffect(() => {
    const handleCenterScroll = (e: any) => {
      setHeaderOffset(e.detail?.offset || 0);
    };
    window.addEventListener(
      "center-scroll",
      handleCenterScroll as EventListener,
    );
    return () =>
      window.removeEventListener(
        "center-scroll",
        handleCenterScroll as EventListener,
      );
  }, []);

  const isHomeNavActive =
    pathname === "/dashboard" || pathname === "/d" || pathname === "/";
  const isInboxNavActive =
    pathname.startsWith("/dashboard/inbox") || pathname.startsWith("/d/inbox");
  const isProfileNavActive =
    pathname.startsWith("/dashboard/profile") ||
    pathname.startsWith("/d/profile");

  return (
    <div className="h-screen bg-[#F1F5F9] font-sans overflow-hidden flex flex-col relative">
      <AdPopup />
      <nav
        className={cn(
          "md:hidden fixed bottom-0 inset-x-0 z-[60] h-[52px] pb-[max(1px,env(safe-area-inset-bottom))] transition-transform duration-300",
          !isNavbarVisible && "translate-y-[115%]",
        )}
      >
        <div className="absolute inset-x-0 top-0 bottom-0 rounded-t-[22px] rounded-b-none bg-gradient-to-b from-white to-[#F6FAFF] border-t border-slate-200 shadow-[0_-12px_24px_-10px_rgba(15,23,42,0.45)]" />

        <div className="relative h-full flex items-end justify-between px-5 z-10 py-0">
          {/* Home */}
          <Link
            href="/d"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = "/d";
            }}
            className="flex flex-col items-center justify-center min-w-[44px] h-full gap-0"
          >
            <div
              className={cn(
                "w-7 h-7 flex items-center justify-center transition-colors duration-200",
                isHomeNavActive ? "text-[#0079b8]" : "text-slate-600",
              )}
            >
              {isHomeNavActive ? (
                <RiHome5Fill className="w-4.5 h-4.5" />
              ) : (
                <RiHome5Line className="w-4.5 h-4.5" />
              )}
            </div>
            <span
              className={cn(
                "text-[8px] leading-none font-medium",
                isHomeNavActive ? "text-[#0079b8]" : "text-slate-500",
              )}
            >
              {t("home")}
            </span>
          </Link>

          {/* Search */}
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center min-w-[44px] h-full gap-0 transition-colors",
              isSearchModalOpen ? "text-[#0079b8]" : "text-slate-600",
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-200",
                isSearchModalOpen &&
                  "bg-[#E6F4FF] shadow-[inset_0_0_0_1px_rgba(0,136,204,0.18)]",
              )}
            >
              <RiSearchLine className="w-4.5 h-4.5" />
            </div>
            <span
              className={cn(
                "text-[8px] leading-none font-medium",
                isSearchModalOpen ? "text-[#0079b8]" : "text-slate-500",
              )}
            >
              {t("search_nav")}
            </span>
          </button>

          {/* Centered Floating Post Ad Button */}
          <div className="relative h-full flex flex-col items-center justify-end">
            <button
              onClick={handleAddAdClick}
              className="absolute -top-0.5 w-10 h-10 bg-[#0088cc] rounded-full flex items-center justify-center text-white shadow-[0_7px_14px_-6px_rgba(0,136,204,0.65)] active:scale-95 transition-transform"
            >
              <RiAddLine className="w-5.5 h-5.5" />
            </button>
            <div className="w-10 flex flex-col items-center">
              <span className="text-[8px] text-transparent leading-none mb-0 mt-0.5">
                .
              </span>
            </div>
          </div>

          {/* Inbox */}
          <Link
            href="/d/inbox"
            onClick={handleMessageClick}
            className={cn(
              "flex flex-col items-center justify-center min-w-[44px] h-full gap-0 relative",
              isInboxNavActive ? "text-[#0079b8]" : "text-slate-600",
            )}
          >
            <div
              className={cn(
                "relative w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-200",
                isInboxNavActive &&
                  "bg-[#E6F4FF] shadow-[inset_0_0_0_1px_rgba(0,136,204,0.18)]",
              )}
            >
              {isInboxNavActive ? (
                <RiMailFill className="w-4.5 h-4.5" />
              ) : (
                <RiMailLine className="w-4.5 h-4.5" />
              )}
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <span
              className={cn(
                "text-[8px] leading-none font-medium",
                isInboxNavActive ? "text-[#0079b8]" : "text-slate-500",
              )}
            >
              {t("inbox")}
            </span>
          </Link>

          {/* Account */}
          <Link
            href="/d/profile"
            onClick={handleAccountClick}
            className={cn(
              "flex flex-col items-center justify-center min-w-[44px] h-full gap-0 transition-all",
              isProfileNavActive ? "text-[#0079b8]" : "text-slate-600",
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-200",
                isProfileNavActive
                  ? "bg-[#E6F4FF] shadow-[inset_0_0_0_1px_rgba(0,136,204,0.18)]"
                  : "bg-transparent",
              )}
            >
              {user && user.photo ? (
                <img
                  src={getImageUrl(user.photo)}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <RiUser3Line className="w-4.5 h-4.5" />
              )}
            </div>
            <span
              className={cn(
                "text-[8px] leading-none font-medium",
                isProfileNavActive ? "text-[#0079b8]" : "text-slate-500",
              )}
            >
              {t("account")}
            </span>
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main
        id="main-dashboard-scroller"
        className="flex-1 w-full overflow-y-auto overflow-x-hidden"
        onScroll={(e) => {
          const scrollTop = e.currentTarget.scrollTop;
          const clamped = Math.min(scrollTop, 64);
          setHeaderOffset(clamped);
          window.dispatchEvent(
            new CustomEvent("center-scroll", { detail: { offset: clamped } }),
          );

          if (scrollTop > lastScrollTop && scrollTop > 100) {
            if (isNavbarVisible) {
              setIsNavbarVisible(false);
              window.dispatchEvent(
                new CustomEvent("nav-visibility", {
                  detail: { visible: false },
                }),
              );
            }
          } else if (scrollTop < lastScrollTop) {
            if (!isNavbarVisible) {
              setIsNavbarVisible(true);
              window.dispatchEvent(
                new CustomEvent("nav-visibility", {
                  detail: { visible: true },
                }),
              );
            }
          }
          setLastScrollTop(scrollTop);
        }}
      >
        {/* Pos 1: Website Top */}
        {settings.adPositions && settings.adPositions.length > 0 && (
          <AdDisplay
            positionId={1}
            className="bg-white border-b border-slate-100"
          />
        )}

        {/* Header Wrapper */}
        <div
          className={cn(
            "z-50 sticky top-0 transition-transform duration-300",
            !isNavbarVisible && "-translate-y-full",
          )}
        >
          <header className="bg-white border-b border-slate-200 h-14 md:h-16 w-full">
            <div className="max-w-[1320px] mx-auto px-2.5 md:px-4 h-full flex items-center justify-between md:justify-center">
              <div
                className={cn(
                  "md:w-[300px] flex-none flex items-center gap-1.5 md:gap-2",
                  isMobileSearchOpen && "hidden md:flex",
                )}
              >
                <button
                  className="hidden p-2 -ml-2 text-black hover:bg-slate-100 rounded-full transition-colors"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu className="w-6 h-6" />
                </button>

                <Link
                  href="/d"
                  className="flex items-center gap-1.5 md:gap-2 shrink-0"
                  onClick={() => {
                    window.dispatchEvent(new Event("refresh-ads"));
                  }}
                >
                  {settings.siteLogo ? (
                    <div className="h-6 md:h-10 w-auto">
                      <img
                        src={getImageUrl(settings.siteLogo)}
                        alt="Logo"
                        className="h-full w-auto object-contain"
                      />
                    </div>
                  ) : (
                    <span className="text-3xl font-bold text-[#1A202C] tracking-tighter uppercase whitespace-nowrap"></span>
                  )}
                </Link>
              </div>

              <div className="w-[50px] flex-none hidden md:block"></div>

              <div
                className={cn(
                  "md:w-[565px] flex-1 md:flex-none flex items-center gap-1.5 md:gap-4 relative",
                  !isMobileSearchOpen
                    ? "flex justify-end md:justify-center"
                    : "flex",
                )}
                ref={searchRef}
              >
                <div
                  className={cn(
                    "flex-1 flex bg-[#EDF2F7] rounded relative",
                    !isMobileSearchOpen && "hidden md:flex",
                  )}
                >
                  <div className="flex-1 relative flex items-center">
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder={language === "bn" ? "সার্চ করুন" : "Search"}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSearchExecution()
                      }
                      onFocus={() => {
                        if (
                          searchQuery.trim().length >= 2 &&
                          suggestions.length > 0
                        )
                          setShowSuggestions(true);
                      }}
                      className="flex-1 bg-transparent px-4 py-2 pr-10 outline-none text-sm text-black placeholder-slate-400"
                    />

                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setShowSuggestions(false);
                        }}
                        className="absolute right-2 p-1 text-slate-400 hover:text-black transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 w-full bg-[#EDF2F7] border border-brand-500/20 shadow-2xl z-[100] mt-1 overflow-hidden divide-y divide-slate-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
                        {suggestions.map((ad) => (
                          <div
                            key={ad._id}
                            className="p-3 hover:bg-slate-200 cursor-pointer flex items-center justify-between group transition-colors"
                            onClick={async () => {
                              setShowSuggestions(false);
                              try {
                                const res = await fetch(
                                  `${API_BASE_URL}/api/ads/public/${ad._id}`,
                                );
                                const data = await res.json();
                                if (data.success) {
                                  const fullAd = data.data;
                                  if (
                                    fullAd.promoteType === "traffic" &&
                                    fullAd.trafficLink
                                  ) {
                                    const directLink =
                                      fullAd.trafficLink.startsWith("http")
                                        ? fullAd.trafficLink
                                        : `https://${fullAd.trafficLink}`;
                                    window.open(directLink, "_blank");
                                  }
                                  openAdDetail(fullAd);
                                  const params = new URLSearchParams(
                                    window.location.search,
                                  );
                                  params.set("ad", fullAd._id);
                                  router.push(
                                    `${pathname}?${params.toString()}`,
                                    { scroll: false },
                                  );
                                  return;
                                }
                              } catch (err) {
                                console.error(
                                  "Error fetching ad from search:",
                                  err,
                                );
                              }
                              openAdDetail(ad);
                            }}
                          >
                            <div className="flex-1 min-w-0 pr-4">
                              <h4 className="text-sm font-medium text-black truncate group-hover:text-[#0088cc]">
                                {ad.headline}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                                  {ad.user?.name || ad.user?.storeName}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="text-[10px] text-[#0088cc] font-medium">
                                  {ad.category}
                                </span>
                              </div>
                            </div>
                            {ad.images && ad.images[0] && (
                              <div className="w-12 h-12 rounded bg-white overflow-hidden shrink-0 border border-slate-200">
                                <img
                                  src={getImageUrl(ad.images[0])}
                                  alt=""
                                  className="w-full h-full object-contain"
                                  onError={(e) =>
                                    (e.currentTarget.src = "/placeholder.png")
                                  }
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSearchExecution}
                    className="bg-[#1A202C] text-white px-6 py-2 text-xs hover:bg-slate-800 transition-colors tracking-wider rounded-r"
                  >
                    {language === "bn" ? "সার্চ" : "Search"}
                  </button>
                </div>

                <div
                  className={cn(
                    "flex items-center gap-2 md:gap-3 shrink-0",
                    isMobileSearchOpen && "hidden md:flex",
                  )}
                >
                  <button
                    onClick={() => setIsSearchModalOpen(true)}
                    className="md:hidden h-7 w-[40vw] max-w-[210px] rounded-full border-[1px] border-slate-300 bg-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] px-3 flex items-center gap-2 text-left"
                    aria-label={
                      language === "bn" ? "সার্চ খুলুন" : "Open search"
                    }
                  >
                    <Search className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-[11px] text-slate-400 truncate">
                      {language === "bn"
                        ? "আপনি কী খুঁজছেন?"
                        : "what are you search?"}
                    </span>
                  </button>

                  <button
                    onClick={toggleLanguage}
                    className="w-7 h-7 md:w-10 md:h-10 bg-[#EDF2F7] rounded-full border border-slate-200 flex items-center justify-center text-[10px] md:text-[14px] text-black uppercase shadow-sm"
                  >
                    {language}
                  </button>
                  <button
                    onClick={handleMessageClick}
                    className="w-10 h-10 bg-[#EDF2F7] rounded-full hidden md:flex items-center justify-center text-[#1A202C] hover:bg-slate-200 transition-all relative"
                  >
                    <RiMailFill className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#0088cc] text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={handlePromoteClick}
                    className="w-7 h-7 bg-[#EDF2F7] rounded-full border border-slate-200 shadow-sm flex md:hidden items-center justify-center text-[#1A202C] hover:bg-slate-200 transition-all relative"
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                  </button>

                  <Link
                    href="/d/profile"
                    onClick={handleAccountClick}
                    className={cn(
                      "w-10 h-10 bg-[#EDF2F7] rounded-full hidden md:flex items-center justify-center text-[#1A202C] hover:bg-slate-200 transition-all overflow-hidden",
                      user?.photo && "border-2 border-[#0088cc]",
                    )}
                  >
                    {user && user.photo ? (
                      <img
                        src={getImageUrl(user.photo)}
                        alt={user.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <RiUser3Fill className="w-5 h-5" />
                    )}
                  </Link>
                </div>
              </div>

              <div className="w-[50px] flex-none hidden md:block"></div>

              <div className="w-[230px] flex-none hidden md:block">
                <Link
                  href="/d/post-ad"
                  className="w-full bg-[#EDF2F7] border border-slate-400 shadow-sm text-black py-1.5 rounded text-sm uppercase tracking-widest flex items-center justify-center"
                >
                  {language === "bn" ? "ফ্রি বিজ্ঞাপন দিন" : "Post Free"}
                </Link>
              </div>
              <div className="w-[70px] flex-none hidden lg:block"></div>
            </div>
          </header>
        </div>

        {/* Pos 2: Bottom of Header */}
        {settings.adPositions && settings.adPositions.length > 0 && (
          <AdDisplay
            positionId={2}
            className="bg-white border-b border-slate-100"
          />
        )}

        <div className="max-w-[1320px] mx-auto px-0 lg:px-4 pt-0 lg:pt-4">
          {children}
        </div>
      </main>

      {/* Mobile Sidebar (Drawer) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="absolute inset-y-0 left-0 w-[80%] max-w-sm bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-lg text-black">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 -mr-2 text-black hover:bg-slate-200 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-black font-bold border-b border-slate-100 pb-2">
                  <Grid className="w-5 h-5 text-brand-600" />
                  <h3>{t("category")}</h3>
                </div>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <div key={cat._id}>
                      <button
                        onClick={() => toggleCategory(cat._id)}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-black transition-colors text-sm font-medium"
                      >
                        <span>
                          {getLocalizedCategoryName(
                            cat.name,
                            cat.categoryNameBn,
                          )}
                        </span>
                        {cat.subcategories.length > 0 &&
                          (expandedCategory === cat._id ? (
                            <ChevronDown className="w-4 h-4 text-black" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-black" />
                          ))}
                      </button>
                      {expandedCategory === cat._id &&
                        cat.subcategories.length > 0 && (
                          <div className="ml-4 pl-4 border-l border-slate-100 mt-1 space-y-1">
                            {cat.subcategories.map((sub) => (
                              <button
                                key={sub._id}
                                className="flex items-center gap-2 w-full text-left py-1.5 text-xs text-black hover:text-brand-600"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                {sub.image && (
                                  <img
                                    src={getImageUrl(sub.image)}
                                    className="w-4 h-4 object-contain rounded shrink-0"
                                    alt=""
                                  />
                                )}
                                {getLocalizedCategoryName(
                                  sub.name,
                                  sub.subCategoryNameBn,
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-black font-bold border-b border-slate-100 pb-2">
                  <MapPin className="w-5 h-5 text-brand-600" />
                  <h3>{t("location")}</h3>
                </div>
                <div className="space-y-1">
                  {locations.map((loc) => (
                    <div key={loc._id}>
                      <button
                        onClick={() => toggleLocation(loc._id)}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-black transition-colors text-sm font-medium"
                      >
                        <span>{loc.name}</span>
                        {loc.subLocations.length > 0 &&
                          (expandedLocation === loc._id ? (
                            <ChevronDown className="w-4 h-4 text-black" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-black" />
                          ))}
                      </button>
                      {expandedLocation === loc._id &&
                        loc.subLocations.length > 0 && (
                          <div className="ml-4 pl-4 border-l border-slate-100 mt-1 space-y-1">
                            {loc.subLocations.map((sub) => (
                              <button
                                key={sub._id}
                                className="flex items-center gap-2 w-full text-left py-1.5 text-xs text-black hover:text-brand-600"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                {sub.image && (
                                  <img
                                    src={getImageUrl(sub.image)}
                                    className="w-4 h-4 object-contain rounded shrink-0"
                                    alt=""
                                  />
                                )}
                                {sub.name}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-2.5 bg-white border border-slate-200 text-black rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all font-bold text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>{t("logout")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <PostAdModal
        isOpen={isPostAdModalOpen}
        onClose={() => {
          setIsPostAdModalOpen(false);
          setAdToEdit(null);
          if (pathname === "/dashboard/post-ad" || pathname === "/d/post-ad") {
            router.push("/d");
          }
        }}
        editAd={adToEdit}
        initialMobile={tempMobile}
        onSuccess={(newAd) => {
          setIsPostAdModalOpen(false);
          window.dispatchEvent(new Event("refresh-ads"));
          setAccountModalInitialTab("Post");
          setIsAccountModalOpen(true);

          if (pathname === "/dashboard/post-ad" || pathname === "/d/post-ad") {
            router.replace("/d");
          }
        }}
      />

      <PromoteModal
        isOpen={isPromoteModalOpen}
        onClose={() => {
          setIsPromoteModalOpen(false);
          setAdToPromote(null);
        }}
        ad={adToPromote}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
        initialMobile={initialMobile}
        onSuccess={() => {
          if (mobileEntryReason === "report") {
            setIsLoginModalOpen(false);
            openAdDetail(reportAd);
            setShouldOpenReportAfterLogin(true);
            window.dispatchEvent(new Event("auth-change"));
            return;
          }
          const url = new URL(window.location.href);
          if (mobileEntryReason === "message") {
            url.searchParams.set("openMessageModal", "true");
          } else {
            url.searchParams.set("openUsersProfile", "true");
          }
          window.location.href = url.toString();
        }}
      />

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
        initialMobile={initialMobile}
        onSuccess={(needsVerification = true, token) => {
          setIsRegisterModalOpen(false);
          if (needsVerification && token) {
            setVerificationToken(token);
            setIsVerificationModalOpen(true);
          } else {
            if (mobileEntryReason === "report") {
              openAdDetail(reportAd);
              setShouldOpenReportAfterLogin(true);
              window.dispatchEvent(new Event("auth-change"));
              return;
            }
            const url = new URL(window.location.href);
            if (mobileEntryReason === "message") {
              url.searchParams.set("openMessageModal", "true");
            } else {
              url.searchParams.set("openUsersProfile", "true");
            }
            window.location.href = url.toString();
          }
        }}
      />

      <MobileEntryModal
        isOpen={isMobileEntryModalOpen}
        onClose={() => {
          setIsMobileEntryModalOpen(false);
          if (pathname === "/dashboard/post-ad" || pathname === "/d/post-ad") {
            router.push("/d");
          }
        }}
        onUserExists={(mobile) => {
          setTempMobile(mobile);
          setIsMobileEntryModalOpen(false);
          if (mobileEntryReason === "post_ad") {
            setIsPostAdModalOpen(true);
          } else {
            setInitialMobile(mobile);
            setIsLoginModalOpen(true);
          }
        }}
        onUserNew={(mobile) => {
          setTempMobile(mobile);
          setIsMobileEntryModalOpen(false);
          if (mobileEntryReason === "post_ad") {
            setIsPostAdModalOpen(true);
          } else {
            setInitialMobile(mobile);
            setIsRegisterModalOpen(true);
          }
        }}
      />

      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => {
          setIsVerificationModalOpen(false);
          setVerificationToken(undefined);
        }}
        verificationToken={verificationToken}
        onSuccess={() => {
          setIsVerificationModalOpen(false);
          if (mobileEntryReason === "report") {
            openAdDetail(reportAd);
            setShouldOpenReportAfterLogin(true);
            window.dispatchEvent(new Event("auth-change"));
            return;
          }
          const url = new URL(window.location.href);
          if (mobileEntryReason === "message") {
            url.searchParams.set("openMessageModal", "true");
          } else {
            url.searchParams.set("openUsersProfile", "true");
          }
          window.location.href = url.toString();
        }}
      />
      <AccountActivityModal
        isOpen={isAccountModalOpen}
        initialTab={accountModalInitialTab}
        onClose={() => {
          setIsAccountModalOpen(false);
          setAccountModalInitialTab("Page");
          setViewingUserId(undefined);
          const params = new URLSearchParams(window.location.search);
          params.delete("profile");
          router.replace(
            `/d${params.toString() ? `?${params.toString()}` : ""}`,
            { scroll: false },
          );
        }}
        userId={viewingUserId}
        onOpenPostAd={() => {
          setIsAccountModalOpen(false);
          setIsPostAdModalOpen(true);
        }}
        onEditAd={(ad) => {
          setIsAccountModalOpen(false);
          setAdToEdit(ad);
          setIsPostAdModalOpen(true);
        }}
      />

      <AdDetailsModal
        isOpen={!!selectedAdForDetail}
        ad={selectedAdForDetail}
        onClose={() => {
          closeAdDetail();
          setShouldOpenReportAfterLogin(false);
          const params = new URLSearchParams(window.location.search);
          params.delete("ad");
          const queryString = params.toString();
          const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
          window.history.replaceState(null, "", newUrl);
        }}
        initialReportOpen={shouldOpenReportAfterLogin}
      />

      <MessageModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        onOpenChat={(ad, otherUser) => {
          setIsMessageModalOpen(false);
          setChatAd(ad);
          setChatOtherUser(otherUser);
          setIsChatMessageModalOpen(true);
        }}
      />

      <ChatMessageModal
        isOpen={isChatMessageModalOpen}
        onClose={() => {
          setIsChatMessageModalOpen(false);
          fetchUnreadCount();
        }}
        onBack={() => {
          setIsChatMessageModalOpen(false);
          setIsMessageModalOpen(true);
        }}
        ad={chatAd}
        otherUser={chatOtherUser}
      />

      <InfoModal
        isOpen={infoModal.isOpen}
        onClose={() => setInfoModal((prev) => ({ ...prev, isOpen: false }))}
        title={infoModal.title}
        content={infoModal.content}
      />

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSearch={(query) => {
          window.dispatchEvent(
            new CustomEvent("show-search-results", { detail: { query } }),
          );
        }}
        categories={categories}
        locations={locations}
        onSelectAd={(ad) => {
          openAdDetail(ad);
          if (ad?._id) {
            const params = new URLSearchParams(window.location.search);
            params.set("ad", ad._id);
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
          }
        }}
      />

      <FilterModal
        isOpen={isGlobalFilterModalOpen}
        onClose={() => setIsGlobalFilterModalOpen(false)}
        categories={categories}
        locations={locations}
        initialFilters={globalFilters}
        onApply={applyGlobalFilters}
      />
    </div>
  );
}