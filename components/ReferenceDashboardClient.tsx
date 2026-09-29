"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Heart,
  Inbox,
  MapPin,
  Megaphone,
  Menu,
  MessageCircle,
  Package,
  Search,
  Send,
  SlidersHorizontal,
  User,
  UserPlus,
  X,
} from "lucide-react";
import {
  RiHome5Fill,
  RiMailFill,
  RiSearchLine,
  RiAddLine,
  RiUser3Line,
} from "react-icons/ri";
import Cookies from "js-cookie";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

import { API_BASE_URL } from "../../utils/apiConfig";
import { getImageUrl } from "../../utils/imageUrl";
import { useLanguage } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";

import InvestmentPostCard from "../../components/InvestmentPostCard";
import InvestmentPostFormModal from "../../components/InvestmentPostFormModal";
import PackagePurchaseModal from "../../components/PackagePurchaseModal";
import AccountActivityModal from "../../components/AccountActivityModal";
import LatestFreeAdPromo from "../../components/LatestFreeAdPromo";
import AdDisplay from "../../components/AdDisplay";
import MessageModal from "../../components/MessageModal";
import ChatMessageModal from "../../components/ChatMessageModal";
import InviteModal from "../../components/InviteModal";
import PromoteModal from "../../components/PromoteModal";
import FilterModal, { type FilterState } from "../../components/FilterModal";
import MobileEntryModal from "../../components/MobileEntryModal";
import LoginModal from "../../components/LoginModal";
import RegisterModal from "../../components/RegisterModal";

type InvestmentRole = "investor" | "business_owner";

type Category = {
  _id: string;
  name: string;
  categoryNameBn?: string;
  icon?: string;
};

type Location = {
  _id: string;
  name: string;
  locationNameBn?: string;
  image?: string;
};

type UserShape = {
  _id?: string;
  name?: string;
  email?: string;
  mobile?: string;
  photo?: string;
  storeName?: string;
  mVerified?: boolean;
  merchantType?: string;
  profileViews?: number;
  connectsBalance?: number;
  creditsUsed?: number;
  activePackage?: {
    packageId?: string;
    name?: string;
    type?: "You" | "Both";
    creditsRemaining?: number;
    totalCredits?: number;
    usedCredits?: number;
    validTill?: string;
    activatedAt?: string;
  };
};

const EMPTY_FILTERS: FilterState = {
  category: "",
  subCategory: "",
  location: "",
  subLocation: "",
  search: "",
  promoteTag: "All",
  sort: "newest",
};

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function timeAgo(value?: string) {
  if (!value) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function localized(name: string, bn: string | undefined, language: string) {
  if (language === "bn" && bn) return bn;
  return name;
}

export default function ReferenceDashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();
  const { settings } = useSettings();

  const [user, setUser] = useState<UserShape | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [investmentPosts, setInvestmentPosts] = useState<any[]>([]);
  const [premiumUsers, setPremiumUsers] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [activeSelector, setActiveSelector] = useState<"category" | "location">("category");
  const [dashboardView, setDashboardView] = useState(searchParams.get("view") === "dashboard");
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [packageOpen, setPackageOpen] = useState(false);
  const [postChoiceOpen, setPostChoiceOpen] = useState(false);
  const [postRole, setPostRole] = useState<InvestmentRole | undefined>();
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountTab, setAccountTab] = useState<"Dashboard" | "Page" | "Profile" | "Settings" | "Post" | "Activity">("Dashboard");
  const [messageOpen, setMessageOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatAd, setChatAd] = useState<any>(null);
  const [chatOtherUser, setChatOtherUser] = useState<any>(null);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteAd, setPromoteAd] = useState<any>(null);
  const [mobileEntryOpen, setMobileEntryOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [initialMobile, setInitialMobile] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterBubble, setSelectedFilterBubble] = useState("");
  const [dashboardSummary, setDashboardSummary] = useState({ pendingProposals: 0, acceptedProposals: 0, pendingInvitations: 0, pendingVerification: 0 });

  const loadUser = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const [response, packageResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
        fetch(`${API_BASE_URL}/api/packages/mine`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }).catch(() => null),
      ]);
      if (!response.ok) {
        setUser(null);
        return;
      }
      const userData = await response.json();
      const packageData = packageResponse?.ok ? await packageResponse.json().catch(() => ({})) : {};
      setUser({
        ...userData,
        activePackage: packageData?.success && packageData?.data?.activePackage
          ? packageData.data.activePackage
          : userData?.activePackage,
        connectsBalance: packageData?.success && typeof packageData?.data?.connectsBalance === "number"
          ? packageData.data.connectsBalance
          : userData?.connectsBalance,
        creditsUsed: packageData?.success && typeof packageData?.data?.creditsUsed === "number"
          ? packageData.data.creditsUsed
          : userData?.creditsUsed,
      });
    } catch {
      setUser(null);
    }
  }, []);

  const loadDashboardSummary = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token) {
      setDashboardSummary({ pendingProposals: 0, acceptedProposals: 0, pendingInvitations: 0, pendingVerification: 0 });
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [proposalRes, inviteRes, adsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/proposals`, { headers, cache: "no-store" }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/invites`, { headers, cache: "no-store" }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/ads/me`, { headers, cache: "no-store" }).then((r) => r.json()),
      ]);
      const proposals = Array.isArray(proposalRes?.data)
        ? proposalRes.data
        : [...(proposalRes?.received || []), ...(proposalRes?.sent || [])];
      const invitations = Array.isArray(inviteRes?.received) ? inviteRes.received : [];
      const ads = Array.isArray(adsRes?.data) ? adsRes.data : [];
      setDashboardSummary({
        pendingProposals: proposals.filter((x: any) => x?.status === "pending").length,
        acceptedProposals: proposals.filter((x: any) => x?.status === "accepted").length,
        pendingInvitations: invitations.filter((x: any) => x?.status === "pending").length,
        pendingVerification: ads.filter((x: any) => ["review", "pending"].includes(String(x?.status || "").toLowerCase())).length,
      });
    } catch {
      // Keep the most recent dashboard counters when a secondary request fails.
    }
  }, []);

  const loadMeta = useCallback(async () => {
    try {
      const [catRes, locRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/categories`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/locations`, { cache: "no-store" }).then((r) => r.json()),
      ]);
      setCategories(Array.isArray(catRes?.data) ? catRes.data.filter((x: any) => x.status !== false) : []);
      setLocations(Array.isArray(locRes?.data) ? locRes.data.filter((x: any) => x.status !== false) : []);
    } catch (error) {
      console.error("Reference dashboard metadata load failed", error);
    }
  }, []);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "60");
      if (filters.category) params.set("category", filters.category);
      if (filters.subCategory) params.set("subCategory", filters.subCategory);
      if (filters.location) params.set("location", filters.location);
      if (filters.subLocation) params.set("subLocation", filters.subLocation);
      if (filters.search) params.set("search", filters.search);
      if (filters.promoteTag && filters.promoteTag !== "All") params.set("promoteTag", filters.promoteTag);
      if (filters.sort) params.set("sort", filters.sort);

      const [feedRes, investorRes, ownerRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/ads/public/all?${params.toString()}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/ads/public/all?postRole=investor&limit=20`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`${API_BASE_URL}/api/ads/public/all?postRole=business_owner&limit=20`, { cache: "no-store" }).then((r) => r.json()),
      ]);

      setAds(feedRes?.success && Array.isArray(feedRes.data) ? feedRes.data : []);

      const combined = [
        ...(investorRes?.success && Array.isArray(investorRes.data) ? investorRes.data : []),
        ...(ownerRes?.success && Array.isArray(ownerRes.data) ? ownerRes.data : []),
      ]
        .filter((item, index, list) => item?._id && list.findIndex((x) => x?._id === item._id) === index)
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      setInvestmentPosts(combined);
    } catch (error) {
      console.error("Reference dashboard feed load failed", error);
      setAds([]);
      setInvestmentPosts([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadRightRail = useCallback(async () => {
    try {
      const [premiumRes, convoRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/user/premium`, { cache: "no-store" }).then((r) => r.json()),
        Cookies.get("token")
          ? fetch(`${API_BASE_URL}/api/messages/conversations`, {
              headers: { Authorization: `Bearer ${Cookies.get("token")}` },
              cache: "no-store",
            }).then((r) => r.json())
          : Promise.resolve({ success: false }),
      ]);
      setPremiumUsers(Array.isArray(premiumRes?.data) ? premiumRes.data : []);
      setConversations(convoRes?.success && Array.isArray(convoRes.data) ? convoRes.data.slice(0, 8) : []);
    } catch (error) {
      console.error("Right rail load failed", error);
    }
  }, []);

  useEffect(() => {
    const current = {
      category: searchParams.get("c") || searchParams.get("category") || "",
      subCategory: searchParams.get("sc") || searchParams.get("subCategory") || "",
      location: searchParams.get("l") || searchParams.get("location") || "",
      subLocation: searchParams.get("sl") || searchParams.get("subLocation") || "",
      search: searchParams.get("search") || "",
      promoteTag: searchParams.get("promoteTag") || "All",
      sort: searchParams.get("sort") || "newest",
    };
    setFilters(current);
    setSearchQuery(current.search);
    setDashboardView(searchParams.get("view") === "dashboard");
  }, [searchParams]);

  useEffect(() => {
    loadUser().then(() => loadDashboardSummary());
    loadMeta();
    loadRightRail();
    const timer = window.setInterval(() => {
      loadUser();
      loadDashboardSummary();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [loadUser, loadDashboardSummary, loadMeta, loadRightRail]);

  useEffect(() => {
    if (!dashboardView) loadFeed();
  }, [dashboardView, loadFeed]);

  useEffect(() => {
    const refresh = () => {
      loadUser();
      loadDashboardSummary();
      loadRightRail();
      if (!dashboardView) loadFeed();
    };
    window.addEventListener("auth-change", refresh);
    window.addEventListener("package-updated", refresh);
    window.addEventListener("connect-balance-updated", refresh);
    window.addEventListener("refresh-ads", refresh);
    return () => {
      window.removeEventListener("auth-change", refresh);
      window.removeEventListener("package-updated", refresh);
      window.removeEventListener("connect-balance-updated", refresh);
      window.removeEventListener("refresh-ads", refresh);
    };
  }, [dashboardView, loadDashboardSummary, loadFeed, loadRightRail, loadUser]);

  useEffect(() => {
    if (searchParams.get("openModal") === "true") {
      setPostChoiceOpen(true);
    }
  }, [searchParams]);

  const activePackage = user?.activePackage;
  const packageSummary = useMemo(() => {
    if (!activePackage?.name) return "Free";
    const remaining = Number(activePackage.creditsRemaining || user?.connectsBalance || 0);
    return `${activePackage.name} • ${remaining} Connects`;
  }, [activePackage, user?.connectsBalance]);

  const applyFilters = (next: FilterState) => {
    setFilters(next);
    const params = new URLSearchParams();
    if (next.category) params.set("c", next.category);
    if (next.subCategory) params.set("sc", next.subCategory);
    if (next.location) params.set("l", next.location);
    if (next.subLocation) params.set("sl", next.subLocation);
    if (next.search) params.set("search", next.search);
    if (next.promoteTag && next.promoteTag !== "All") params.set("promoteTag", next.promoteTag);
    if (next.sort && next.sort !== "newest") params.set("sort", next.sort);
    if (dashboardView) params.set("view", "dashboard");
    router.replace(`/dashboard${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  };

  const openDashboard = () => {
    setDashboardView(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", "dashboard");
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  };

  const openFeed = () => {
    setDashboardView(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("view");
    router.replace(`/dashboard${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  };

  const executeSearch = () => {
    applyFilters({ ...filters, search: searchQuery.trim() });
  };

  const selectBubble = (kind: "category" | "location", value: string) => {
    setSelectedFilterBubble(value);
    setActiveSelector(kind);
    if (kind === "category") applyFilters({ ...filters, category: value, subCategory: "" });
    else applyFilters({ ...filters, location: value, subLocation: "" });
  };

  const openPostFlow = () => {
    const token = Cookies.get("token");
    if (!token) {
      setMobileEntryOpen(true);
      return;
    }
    setPostChoiceOpen(true);
  };

  const openRolePost = (role: InvestmentRole) => {
    setPostRole(role);
    setPostChoiceOpen(false);
    setPostModalOpen(true);
  };

  const openAccount = (tab: typeof accountTab = "Dashboard") => {
    if (!Cookies.get("token")) {
      setMobileEntryOpen(true);
      return;
    }
    setAccountTab(tab);
    setAccountOpen(true);
  };

  const filteredInvestmentPosts = useMemo(() => {
    if (!filters.category && !filters.location && !filters.search) return investmentPosts;
    return investmentPosts.filter((post) => {
      if (filters.category && post.category !== filters.category) return false;
      if (filters.subCategory && post.subCategory !== filters.subCategory) return false;
      if (filters.location && post.location !== filters.location) return false;
      if (filters.subLocation && post.subLocation !== filters.subLocation) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hay = [post.headline, post.description, post.category, post.subCategory, post.location].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [filters, investmentPosts]);

  const displayPosts = filteredInvestmentPosts.slice(0, 8);
  const displayFreeAds = ads.filter((ad) => !ad.postRole).slice(0, 8);

  return (
    <div className="min-h-screen bg-[#eef3f6] text-slate-900">
      <header className="sticky top-0 z-[80] border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto grid h-[66px] w-full max-w-[1090px] grid-cols-[180px_minmax(0,580px)_230px] items-center gap-[50px] px-3 xl:grid-cols-[180px_580px_230px]">
          <div className="flex items-center gap-2">
            <button className="rounded p-1 lg:hidden" onClick={() => setIsMobileMenuOpen(true)} aria-label="Menu">
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/dashboard" onClick={(e) => { e.preventDefault(); openFeed(); }} className="shrink-0">
              {settings.siteLogo ? (
                <img src={getImageUrl(settings.siteLogo) || undefined} alt="shadamon" className="h-9 w-auto object-contain" />
              ) : (
                <span className="text-2xl font-semibold tracking-[-0.03em]">shadamon</span>
              )}
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-10 flex-1 overflow-hidden rounded-md border border-slate-200 bg-[#f4f5f5]">
              <div className="relative flex-1">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && executeSearch()}
                  placeholder={language === "bn" ? "সার্চ করুন" : "what are you search?"}
                  className="h-full w-full bg-transparent px-3 text-sm outline-none placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button onClick={executeSearch} className="w-12 bg-[#1786a6] text-white">
                <Search className="mx-auto h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => {
                if (dashboardView) openFeed();
                else setActiveSelector("category");
              }}
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] font-semibold sm:flex"
            >
              {language.toUpperCase()}
            </button>
            <button onClick={() => setMessageOpen(true)} className="hidden h-9 w-9 items-center justify-center rounded-full bg-slate-100 md:flex">
              <RiMailFill className="h-4.5 w-4.5" />
            </button>
            <button onClick={() => openAccount("Dashboard")} className="hidden h-9 w-9 overflow-hidden rounded-full bg-emerald-100 md:flex">
              {user?.photo ? <img src={getImageUrl(user.photo) || undefined} alt="" className="h-full w-full object-cover" /> : <RiUser3Line className="m-auto h-4 w-4" />}
            </button>
          </div>

          <div className="hidden items-center justify-end gap-2 xl:flex">
            <button onClick={() => setPackageOpen(true)} className="rounded-md border border-emerald-200 bg-white px-2.5 py-2 text-left shadow-sm">
              <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Active package</div>
              <div className="max-w-[150px] truncate text-[11px] font-bold text-slate-800">{packageSummary}</div>
            </button>
            <button onClick={openPostFlow} className="rounded-md bg-[#1587a6] px-4 py-2 text-xs font-bold text-white shadow-sm">
              {language === "bn" ? "ফ্রি বিজ্ঞাপন দিন" : "Post Free"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1090px] items-start gap-[50px] px-0 pb-24 lg:px-2">
        <aside className="sticky top-[82px] hidden h-[calc(100vh-96px)] w-[180px] flex-none overflow-y-auto no-scrollbar lg:block">
          <div className="rounded-lg border border-slate-200 bg-white">
            <nav className="p-2">
              <button onClick={openDashboard} className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-xs font-semibold", dashboardView ? "bg-[#ecf7f2] text-emerald-700" : "text-slate-700 hover:bg-slate-50")}>
                <RiHome5Fill className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
              <button onClick={() => setMessageOpen(true)} className="flex w-full items-center gap-3 rounded-md bg-[#eff9f5] px-3 py-2.5 text-xs font-bold text-emerald-700">
                <Inbox className="h-4 w-4" />
                <span className="flex-1 text-left">Inbox</span>
                {conversations.reduce((n, c) => n + Number(c.unreadCount || 0), 0) > 0 ? <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] text-white">{conversations.reduce((n, c) => n + Number(c.unreadCount || 0), 0)}</span> : null}
              </button>
              <button onClick={() => window.dispatchEvent(new Event("open-proposal-modal"))} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><UserPlus className="h-4 w-4" /><span>Proposals</span></button>
              <button onClick={() => openAccount("Profile")} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><User className="h-4 w-4" /><span>Profile</span></button>
              <button onClick={openPostFlow} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><FileText className="h-4 w-4" /><span>Post</span></button>
              <button onClick={() => openAccount("Activity")} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Activity className="h-4 w-4" /><span>Activity</span></button>
              <button onClick={() => openAccount("Activity")} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Heart className="h-4 w-4" /><span>Favourite</span></button>
              <button onClick={() => setInviteOpen(true)} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><UserPlus className="h-4 w-4" /><span>Invite</span></button>
              <button onClick={() => setPromoteOpen(true)} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Megaphone className="h-4 w-4" /><span>Promote</span></button>
            </nav>
            <div className="border-t border-slate-100 px-3 py-3">
              <h3 className="text-[10px] font-bold text-slate-700">About Shadamon</h3>
              <div className="mt-2 space-y-1 text-[9px] text-slate-400">
                <Link href="/about" className="block">About Us</Link>
                <Link href="/terms-and-conditions" className="block">Terms & Conditions</Link>
                <Link href="/privacy-policy" className="block">Privacy Policy</Link>
                <Link href="/safety-tips" className="block">Safety tips</Link>
              </div>
            </div>
          </div>
        </aside>

        <section className="w-full min-w-0 lg:w-[580px] lg:flex-none">
          {dashboardView ? (
            <DashboardReferencePanel user={user} summary={dashboardSummary} onBack={openFeed} onOpenPackage={() => setPackageOpen(true)} onOpenAccount={openAccount} />
          ) : (
            <>
              <div className="sticky top-[66px] z-[60] rounded-none border-b border-slate-200 bg-white lg:rounded-md">
                <div className="grid grid-cols-3 divide-x divide-slate-100">
                  <button onClick={() => { setFilterOpen(true); setActiveSelector("category"); }} className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium hover:bg-slate-50"><GridIcon />{filters.category || "Select Category"}</button>
                  <button onClick={() => { setFilterOpen(true); setActiveSelector("location"); }} className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium hover:bg-slate-50"><MapPin className="h-4 w-4" />{filters.location || "Location"}</button>
                  <button onClick={() => setFilterOpen(true)} className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium hover:bg-slate-50"><SlidersHorizontal className="h-4 w-4" />Filter</button>
                </div>
              </div>

              <div className="mt-2 rounded-none border border-slate-200 bg-white lg:rounded-lg">
                <div className="flex items-center gap-5 border-b border-slate-100 px-4 pt-3 text-xs font-medium">
                  <button onClick={() => setActiveSelector("category")} className={cn("relative pb-2", activeSelector === "category" ? "text-black" : "text-slate-400")}>Select Category{activeSelector === "category" ? <span className="absolute inset-x-0 -top-3 h-0.5 bg-blue-500" /> : null}</button>
                  <button onClick={() => setActiveSelector("location")} className={cn("relative pb-2", activeSelector === "location" ? "text-black" : "text-slate-400")}>Select Location{activeSelector === "location" ? <span className="absolute inset-x-0 -top-3 h-0.5 bg-blue-500" /> : null}</button>
                </div>
                <div className="relative">
                  <div id="ref-category-scroll" className="flex gap-4 overflow-x-auto px-3 py-3 no-scrollbar">
                    {(activeSelector === "category" ? categories : locations).map((item: any) => {
                      const value = item.name;
                      const selected = activeSelector === "category" ? filters.category === value : filters.location === value;
                      return (
                        <button key={item._id} onClick={() => selectBubble(activeSelector, value)} className="flex w-[66px] flex-none flex-col items-center gap-1.5">
                          <span className={cn("h-[58px] w-[58px] overflow-hidden rounded-full border-2 bg-slate-50 p-1", selected ? "border-[#0088cc]" : "border-slate-200")}>
                            {activeSelector === "category" && item.icon ? <img src={getImageUrl(item.icon) || undefined} alt="" className="h-full w-full rounded-full object-cover" /> : activeSelector === "location" && item.image ? <img src={getImageUrl(item.image) || undefined} alt="" className="h-full w-full rounded-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-slate-400">{activeSelector === "category" ? <GridIcon /> : <MapPin className="h-5 w-5" />}</span>}
                          </span>
                          <span className={cn("w-full truncate text-center text-[10px] font-semibold", selected ? "text-[#0088cc]" : "text-slate-700")}>{localized(item.name, activeSelector === "category" ? item.categoryNameBn : item.locationNameBn, language)}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={() => { const el = document.getElementById("ref-category-scroll"); el?.scrollBy({ left: -260, behavior: "smooth" }); }} className="absolute left-1 top-1/2 hidden -translate-y-1/2 rounded-full bg-white p-2 shadow md:flex"><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={() => { const el = document.getElementById("ref-category-scroll"); el?.scrollBy({ left: 260, behavior: "smooth" }); }} className="absolute right-1 top-1/2 hidden -translate-y-1/2 rounded-full bg-white p-2 shadow md:flex"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="mt-3">
                <AdDisplay positionId={2} className="rounded-lg bg-white" />
              </div>

              <div className="mt-3 space-y-3">
                {loading ? (
                  <div className="rounded-lg bg-white p-12 text-center text-sm text-slate-400">Loading posts...</div>
                ) : (
                  <>
                    {displayPosts.slice(0, 4).map((post) => (
                      <InvestmentPostCard
                        key={post._id}
                        post={post}
                        onOpen={() => {
                          const params = new URLSearchParams(searchParams.toString());
                          params.set("ad", post._id);
                          router.push(`/dashboard?${params.toString()}`, { scroll: false });
                        }}
                      />
                    ))}

                    <div className="xl:hidden rounded-lg border border-slate-200 bg-white">
                      <div className="flex items-center justify-between px-3 py-2">
                        <div>
                          <div className="text-xs font-bold">Messages</div>
                          <div className="text-[9px] text-slate-400">Chat with investors and business owners</div>
                        </div>
                        <button onClick={() => setMessageOpen(true)} className="rounded-full bg-emerald-50 p-2 text-emerald-700"><MessageCircle className="h-4 w-4" /></button>
                      </div>
                      {conversations.slice(0, 3).map((conv) => (
                        <button key={conv._id} onClick={() => setMessageOpen(true)} className="w-full border-t border-slate-100 px-3 py-2 text-left text-[10px]">
                          <span className="font-bold">{conv.participants?.map((p: any) => p?.name).filter(Boolean).join(" · ") || "Conversation"}</span>
                          <span className="ml-2 text-slate-400">{conv.lastMessage?.text || conv.lastMessage?.message || ""}</span>
                        </button>
                      ))}
                    </div>

                    {displayFreeAds.slice(0, 2).map((ad) => (
                      <InvestmentPostCard
                        key={ad._id}
                        post={{ ...ad, postRole: ad.postRole || undefined } as any}
                        onOpen={() => {
                          const params = new URLSearchParams(searchParams.toString());
                          params.set("ad", ad._id);
                          router.push(`/dashboard?${params.toString()}`, { scroll: false });
                        }}
                      />
                    ))}

                    <LatestFreeAdPromo />

                    <AdDisplay positionId={3} className="rounded-lg bg-white" />
                  </>
                )}
              </div>
            </>
          )}
        </section>

        <aside className="sticky top-[82px] hidden h-[calc(100vh-96px)] w-[230px] flex-none overflow-y-auto no-scrollbar xl:block">
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-slate-800">Active Contacts</div>
                <span className="text-[9px] text-slate-400">{premiumUsers.length}</span>
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                {premiumUsers.slice(0, 8).map((contact: any) => (
                  <button key={contact._id} onClick={() => openAccount("Profile")} className="flex w-[42px] flex-none flex-col items-center gap-1">
                    <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                      {contact.photo ? <img src={getImageUrl(contact.photo) || undefined} alt="" className="h-full w-full object-cover" /> : <User className="m-auto h-4 w-4 text-slate-400" />}
                    </div>
                    <span className="w-full truncate text-center text-[8px] text-slate-600">{contact.name || contact.storeName || "User"}</span>
                  </button>
                ))}
              </div>
            </div>

            <AdDisplay positionId={4} className="rounded-lg border border-slate-200 bg-white" />

            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                <div>
                  <div className="text-[11px] font-bold text-slate-800">Chat History</div>
                  <div className="text-[9px] text-slate-400">Recent conversations</div>
                </div>
                <button onClick={() => setMessageOpen(true)} className="rounded-full bg-slate-100 p-1.5"><MessageCircle className="h-3.5 w-3.5" /></button>
              </div>
              <div className="p-1.5">
                {conversations.length === 0 ? (
                  <button onClick={() => setMessageOpen(true)} className="w-full rounded-md border border-dashed border-slate-200 p-5 text-[9px] text-slate-400">No conversations yet.<br /><span className="font-bold text-emerald-600">Open Messenger</span></button>
                ) : conversations.map((conv: any) => {
                  const other = conv.participants?.find((p: any) => p?._id !== conv.currentUserId) || conv.participants?.[0];
                  return (
                    <button key={conv._id} onClick={() => setMessageOpen(true)} className="flex w-full items-center gap-2 rounded-md px-1.5 py-2 text-left hover:bg-emerald-50">
                      <div className="h-8 w-8 overflow-hidden rounded-full bg-emerald-50">
                        {other?.photo ? <img src={getImageUrl(other.photo) || undefined} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-xs font-bold text-emerald-700">{String(other?.name || "U").charAt(0)}</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[9px] font-bold">{other?.name || other?.storeName || "Member"}</div>
                        <div className="truncate text-[8px] text-slate-400">{conv.lastMessage?.text || conv.lastMessage?.message || "Open conversation"}</div>
                      </div>
                      {conv.unreadCount ? <span className="rounded-full bg-emerald-600 px-1 text-[8px] text-white">{conv.unreadCount}</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-[100] flex h-14 items-center justify-around border-t border-slate-200 bg-white/97 px-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] lg:hidden">
        <button onClick={openFeed} className="flex flex-col items-center gap-0.5 text-[9px] text-slate-600"><RiHome5Fill className="h-4 w-4" /><span>Home</span></button>
        <button onClick={() => setFilterOpen(true)} className="flex flex-col items-center gap-0.5 text-[9px] text-slate-600"><RiSearchLine className="h-4 w-4" /><span>Search</span></button>
        <button onClick={openPostFlow} className="-mt-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#1294cf] text-white shadow-lg"><RiAddLine className="h-5 w-5" /></button>
        <button onClick={() => setMessageOpen(true)} className="flex flex-col items-center gap-0.5 text-[9px] text-slate-600"><RiMailFill className="h-4 w-4" /><span>Inbox</span></button>
        <button onClick={() => openAccount("Profile")} className="flex flex-col items-center gap-0.5 text-[9px] text-slate-600"><RiUser3Line className="h-4 w-4" /><span>Profile</span></button>
      </nav>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[150] lg:hidden">
          <button className="absolute inset-0 bg-black/45" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu" />
          <div className="absolute left-0 top-0 h-full w-[82%] max-w-[320px] overflow-y-auto bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="text-lg font-bold">Menu</div>
              <button onClick={() => setIsMobileMenuOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 space-y-1">
              <button onClick={() => { setIsMobileMenuOpen(false); openDashboard(); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold"><RiHome5Fill className="h-4 w-4" />Dashboard</button>
              <button onClick={() => { setIsMobileMenuOpen(false); openPostFlow(); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold"><FileText className="h-4 w-4" />Post</button>
              <button onClick={() => { setIsMobileMenuOpen(false); openAccount("Activity"); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold"><Activity className="h-4 w-4" />Activity</button>
              <button onClick={() => { setIsMobileMenuOpen(false); setPackageOpen(true); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold"><Package className="h-4 w-4" />{activePackage?.name || "Package"}</button>
            </div>
          </div>
        </div>
      )}

      {postChoiceOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[520px] rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">What do you want to post?</h2>
                <p className="mt-1 text-xs text-slate-500">Choose the post type. The correct category is selected automatically.</p>
              </div>
              <button onClick={() => setPostChoiceOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button onClick={() => openRolePost("investor")} className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-left">
                <div className="text-sm font-extrabold">I wanna invest</div>
                <div className="mt-1 text-xs text-slate-500">Investor / Looking to invest</div>
              </button>
              <button onClick={() => openRolePost("business_owner")} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left">
                <div className="text-sm font-extrabold">I need investment</div>
                <div className="mt-1 text-xs text-slate-500">Business owner / Need funding</div>
              </button>
            </div>
          </div>
        </div>
      )}

      <InvestmentPostFormModal
        isOpen={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        initialRole={postRole}
        referenceDesign
        onSuccess={() => {
          setPostModalOpen(false);
          loadFeed();
          loadUser();
        }}
      />

      <PackagePurchaseModal isOpen={packageOpen} onClose={() => setPackageOpen(false)} />

      <AccountActivityModal
        isOpen={accountOpen}
        onClose={() => setAccountOpen(false)}
        initialTab={accountTab}
      />

      <MessageModal
        isOpen={messageOpen}
        onClose={() => setMessageOpen(false)}
        onOpenChat={(ad, otherUser) => {
          setMessageOpen(false);
          setChatAd(ad);
          setChatOtherUser(otherUser);
          setChatOpen(true);
        }}
      />

      <ChatMessageModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onBack={() => { setChatOpen(false); setMessageOpen(true); }}
        ad={chatAd}
        otherUser={chatOtherUser}
      />

      <InviteModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} />

      <PromoteModal isOpen={promoteOpen} onClose={() => { setPromoteOpen(false); setPromoteAd(null); }} ad={promoteAd} />

      <FilterModal
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={categories as any}
        locations={locations as any}
        initialFilters={filters}
        onApply={(next) => { setFilterOpen(false); applyFilters(next); }}
      />

      <MobileEntryModal
        isOpen={mobileEntryOpen}
        onClose={() => setMobileEntryOpen(false)}
        onUserExists={(mobile) => { setInitialMobile(mobile); setMobileEntryOpen(false); setLoginOpen(true); }}
        onUserNew={(mobile) => { setInitialMobile(mobile); setMobileEntryOpen(false); setRegisterOpen(true); }}
      />

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        initialMobile={initialMobile}
        onSwitchToRegister={() => { setLoginOpen(false); setRegisterOpen(true); }}
        onSuccess={() => { setLoginOpen(false); openPostFlow(); }}
      />

      <RegisterModal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
        initialMobile={initialMobile}
        onSwitchToLogin={() => { setRegisterOpen(false); setLoginOpen(true); }}
        onSuccess={() => { setRegisterOpen(false); openPostFlow(); }}
      />
    </div>
  );
}

function GridIcon() {
  return <span className="inline-grid h-4 w-4 grid-cols-2 gap-[2px]">{[0, 1, 2, 3].map((i) => <span key={i} className="rounded-[1px] bg-current" />)}</span>;
}

function DashboardReferencePanel({
  user,
  summary,
  onBack,
  onOpenPackage,
  onOpenAccount,
}: {
  user: UserShape | null;
  summary: { pendingProposals: number; acceptedProposals: number; pendingInvitations: number; pendingVerification: number };
  onBack: () => void;
  onOpenPackage: () => void;
  onOpenAccount: (tab?: "Dashboard" | "Page" | "Profile" | "Settings" | "Post" | "Activity") => void;
}) {
  const packageName = user?.activePackage?.name || "Free";
  const packageType = user?.activePackage?.type || "";
  const validTill = user?.activePackage?.validTill ? new Date(user.activePackage.validTill).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";
  const available = Number(user?.connectsBalance ?? user?.activePackage?.creditsRemaining ?? 0);
  const used = Number(user?.creditsUsed ?? user?.activePackage?.usedCredits ?? 0);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <div className="flex items-center gap-1 text-[10px] font-semibold">
          <button className="rounded bg-violet-100 px-2 py-1 text-violet-700">Dashboard</button>
          <button onClick={() => onOpenAccount("Profile")} className="rounded px-2 py-1 text-slate-500 hover:bg-slate-50">Profile</button>
          <button onClick={() => onOpenAccount("Post")} className="rounded px-2 py-1 text-slate-500 hover:bg-slate-50">Post</button>
          <button onClick={() => onOpenAccount("Activity")} className="rounded px-2 py-1 text-slate-500 hover:bg-slate-50">Activity</button>
        </div>
        <button onClick={onBack} className="rounded-full p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
      </div>

      <div className="p-3">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <div className="h-20 w-20 overflow-hidden rounded-full bg-emerald-100 ring-1 ring-emerald-200">
              {user?.photo ? <img src={getImageUrl(user.photo) || undefined} alt="" className="h-full w-full object-cover" /> : <User className="m-auto mt-6 h-8 w-8 text-emerald-700" />}
            </div>
            <button onClick={() => onOpenAccount("Profile")} className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-white">+</button>
          </div>
          <div className="min-w-0 flex-1 text-[10px]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-800">Account Activity</div>
                <div className="truncate text-sm font-bold">{user?.name || user?.storeName || "Member"}</div>
                <div className="truncate text-[9px] text-slate-400">{user?.email || user?.mobile || "Profile"}</div>
              </div>
              <div className="text-right">
                <div className="text-[8px] text-slate-400">Account Type</div>
                <div className="text-[10px] font-bold text-slate-700">{user?.merchantType || "Free"}</div>
                <button onClick={() => onOpenAccount("Profile")} className="mt-1 rounded bg-rose-500 px-2 py-1 text-[8px] font-bold text-white">Verify</button>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded border border-slate-200 px-2 py-1 text-[9px] text-slate-500">{user?.mobile || "No mobile"}</span>
              <Bell className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 border-y border-slate-100">
          <Metric label="Pending Invitations" value={summary.pendingInvitations} />
          <Metric label="Accepted Invitations" value={summary.acceptedProposals} />
          <Metric label="Profile Visitors" value={Number(user?.profileViews || 0)} />
        </div>

        <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-2">
          <div className="text-[9px] font-semibold text-slate-500">Current Package</div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-slate-800">{packageName}{packageType ? ` • ${packageType}` : ""}</div>
              <div className="text-[9px] text-slate-400">{validTill ? `Valid to ${validTill}` : "No active package"}</div>
            </div>
            <button onClick={onOpenPackage} className="rounded bg-emerald-600 px-2.5 py-1.5 text-[9px] font-bold text-white">Upgrade</button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <StatBox label="Used Connect" value={used} />
          <StatBox label="Available Connect" value={available} />
        </div>

        <div className="mt-3 border-t border-slate-100 pt-2">
          <div className="mb-1 text-[9px] font-bold text-slate-500">Account Settings</div>
          <div className="grid grid-cols-1 gap-1">
            <button onClick={() => onOpenAccount("Settings")} className="flex items-center gap-2 rounded px-2 py-1.5 text-[10px] text-slate-600 hover:bg-slate-50"><Bell className="h-3 w-3" />Notifications</button>
            <button onClick={() => onOpenAccount("Settings")} className="flex items-center gap-2 rounded px-2 py-1.5 text-[10px] text-slate-600 hover:bg-slate-50"><SlidersHorizontal className="h-3 w-3" />Account Settings</button>
            <button onClick={() => { Cookies.remove("token"); window.location.href = "/dashboard"; }} className="flex items-center gap-2 rounded px-2 py-1.5 text-[10px] text-slate-600 hover:bg-red-50 hover:text-red-600"><Send className="h-3 w-3" />Log out</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="border-r border-slate-100 px-2 py-2 last:border-r-0"><div className="text-[9px] text-slate-400">{label}</div><div className="mt-1 text-sm font-bold">{value}</div></div>;
}
function StatBox({ label, value }: { label: string; value: number }) {
  return <div className="rounded border border-slate-200 bg-white p-2"><div className="text-[9px] text-slate-400">{label}</div><div className="mt-1 text-lg font-bold text-slate-800">{value}</div></div>;
}
