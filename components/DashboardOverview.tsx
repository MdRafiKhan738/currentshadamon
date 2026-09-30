"use client";

import { useEffect, useState } from "react";
import { Bell, Check, CircleDot, Copy, LockKeyhole, LogOut, Settings, ShieldCheck } from "lucide-react";
import Cookies from "js-cookie";
import { API_BASE_URL } from "../utils/apiConfig";
import { useLanguage } from "../app/context/LanguageContext";
import { getImageUrl } from "../utils/imageUrl";

type DashboardSummary = {
  pendingProposals: number;
  acceptedProposals: number;
  pendingInvitations: number;
  acceptedInvitations: number;
  profileVisitors: number;
  packageName: string;
  packageType?: string;
  packageValidTill?: string;
  usedConnects: number;
  availableConnects: number;
  pendingVerification: number;
};

type DashboardUser = {
  _id?: string;
  name?: string;
  storeName?: string;
  email?: string;
  mobile?: string;
  photo?: string;
  merchantType?: string;
  mVerified?: boolean;
  verifiedBy?: string;
};

export default function DashboardOverview({
  summary,
  user,
}: {
  summary: DashboardSummary;
  user?: DashboardUser | null;
}) {
  const { language } = useLanguage();
  const bn = language === "bn";
  const [loadedUser, setLoadedUser] = useState<DashboardUser | null>(user || null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setLoadedUser(user);
      return;
    }

    const token = Cookies.get("token");
    if (!token) return;

    fetch(API_BASE_URL + "/api/user/me", {
      headers: { Authorization: "Bearer " + token },
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((result) => {
        const me = result?.user || result?.data?.user || result?.data || result;
        if (me?._id) setLoadedUser(me);
      })
      .catch(() => {});
  }, [user]);

  const profileName = loadedUser?.name || loadedUser?.storeName || "Shadamon.com Support";
  const userId = loadedUser?._id || "";
  const accountType = loadedUser?.merchantType || "Free";
  const mobile = loadedUser?.mobile || "—";
  const photo = getImageUrl(loadedUser?.photo || undefined) || "";
  const verified = Boolean(loadedUser?.mVerified);

  const dispatchAccount = (activeTab: "Profile" | "Post" | "Settings" | "Activity") => {
    window.dispatchEvent(new CustomEvent("open-account-modal", { detail: { activeTab } }));
  };

  const copyId = async () => {
    if (!userId) return;
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const validTo = summary.packageValidTill
    ? new Date(summary.packageValidTill).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

  const packageName = summary.packageName || "";
  const isPremium = Boolean(packageName) && packageName.toLowerCase() !== "free";

  const statCell = (value: number | string, label: React.ReactNode) => (
    <div className="px-3 first:pl-0">
      <div className="text-[18px] font-bold leading-none text-slate-900">{value}</div>
      <div className="mt-1.5 text-[12px] font-medium leading-[1.2] text-slate-500">{label}</div>
    </div>
  );

  return (
    <section className="w-full bg-white px-3 pb-4 pt-3">
      {/* Profile card */}
      <div className="rounded-[10px] border border-[#e2e6ec] bg-white p-3 shadow-sm">
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-[104px] w-[104px] overflow-hidden rounded-full bg-[#2f9b86] ring-1 ring-slate-200">
              {photo ? (
                <img src={photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[22px] font-bold text-white">
                  {profileName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => dispatchAccount("Profile")}
              className="absolute bottom-0.5 right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#f51f47] text-[18px] font-bold leading-none text-white shadow"
              aria-label="Edit profile photo"
            >
              +
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-bold text-slate-900">{profileName}</div>
            {userId ? (
              <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <span className="truncate">{userId}</span>
                <button type="button" onClick={copyId} aria-label="Copy ID" className="shrink-0 text-slate-500">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[12px] font-medium text-[#8f95c4]">{bn ? "অ্যাকাউন্ট টাইপ" : "Account Type"}</div>
            <div className="mt-0.5 text-[12px] font-semibold text-slate-600">{accountType}</div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2.5">
          <div className="flex min-w-0 flex-1 items-center justify-between rounded-[6px] border border-[#d9dee5] bg-white px-3 py-2.5">
            <span className="truncate text-[13px] font-medium text-slate-800">{mobile}</span>
            <CircleDot className="h-4 w-4 shrink-0 text-slate-400" />
          </div>
          <button
            type="button"
            onClick={() => dispatchAccount("Profile")}
            className={
              "flex shrink-0 items-center gap-1.5 rounded-[6px] px-4 py-2.5 text-[13px] font-bold text-white shadow-sm " +
              (verified ? "bg-[#2e9c85]" : "bg-[#f0294b]")
            }
          >
            <ShieldCheck className="h-4 w-4" />
            {verified ? (bn ? "ভেরিফাইড" : "Verified") : bn ? "ভেরিফাই" : "Verify"}
          </button>
        </div>
      </div>

      {/* Account Activity */}
      <div className="mt-4">
        <div className="text-[14px] font-bold text-slate-900">{bn ? "অ্যাকাউন্ট অ্যাক্টিভিটি" : "Account Activity"}</div>

        <div className="mt-2 border-t border-[#e3e6ea]">
          <div className="grid grid-cols-3 divide-x divide-[#e3e6ea] py-3">
            {statCell(
              summary.pendingInvitations,
              bn ? "অপেক্ষমাণ আমন্ত্রণ" : <>Pending<br />Invitations</>,
            )}
            {statCell(
              summary.acceptedInvitations,
              bn ? "গৃহীত আমন্ত্রণ" : <>Accepted<br />Invitations</>,
            )}
            {statCell(summary.profileVisitors, bn ? "মোট ভিজিটর" : <>Total<br />Visitors</>)}
          </div>

          <div className="grid grid-cols-[1.35fr_1fr_1fr] divide-x divide-[#e3e6ea] border-t border-[#e3e6ea] py-3">
            <div className="flex items-start justify-between gap-2 pr-2">
              <div className="min-w-0">
                {isPremium ? (
                  <>
                    <div className="truncate text-[13px] font-bold text-[#2f9a80]">{packageName}</div>
                    <div className="mt-1 text-[11px] font-medium leading-[1.25] text-slate-400">
                      {bn ? "মেয়াদ শেষ" : "Valid to"} {validTo || "—"}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[13px] font-bold text-slate-800">
                      {bn ? "শুধুমাত্র " : "Only "}
                      <span className="text-[#2f9a80]">PREMIUM</span>
                    </div>
                    <div className="mt-1 text-[11px] font-medium leading-[1.25] text-slate-400">
                      {bn ? "সদস্যরা এই সুযোগ পাবেন।" : "Members Access this opportunity."}
                    </div>
                  </>
                )}
              </div>
              {!isPremium ? <LockKeyhole className="mt-1 h-4 w-4 shrink-0 text-[#ef294b]" /> : null}
            </div>
            <div className="px-3">
              <div className="text-[18px] font-bold leading-none text-slate-900">{Number(summary.usedConnects || 0)}</div>
              <div className="mt-1.5 text-[12px] font-medium leading-[1.2] text-slate-500">
                {bn ? "ব্যবহৃত কানেক্ট" : <>Used<br />Connect</>}
              </div>
            </div>
            <div className="px-3">
              <div className="text-[18px] font-bold leading-none text-slate-900">{Number(summary.availableConnects || 0)}</div>
              <div className="mt-1.5 text-[12px] font-medium leading-[1.2] text-slate-500">
                {bn ? "অব্যবহৃত কানেক্ট" : <>UnUsed<br />Connect</>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="mt-4">
        <div className="text-[14px] font-bold text-slate-900">{bn ? "অ্যাকাউন্ট সেটিংস" : "Account Settings"}</div>

        <div className="mt-2 divide-y divide-[#eceef1] border-t border-[#e3e6ea]">
          <button
            type="button"
            onClick={() => dispatchAccount("Settings")}
            className="flex w-full items-center gap-3 px-2 py-3 text-left text-[13px] font-medium text-slate-700"
          >
            <Bell className="h-4 w-4 text-slate-800" fill="currentColor" />
            {bn ? "নোটিফিকেশন" : "Notifications"}
          </button>
          <button
            type="button"
            onClick={() => dispatchAccount("Settings")}
            className="flex w-full items-center gap-3 px-2 py-3 text-left text-[13px] font-medium text-slate-700"
          >
            <Settings className="h-4 w-4 text-slate-800" fill="currentColor" />
            {bn ? "অ্যাকাউন্ট সেটিংস" : "Account Settings"}
          </button>
          <button
            type="button"
            onClick={() => {
              Cookies.remove("token");
              window.location.href = "/dashboard";
            }}
            className="flex w-full items-center gap-3 px-2 py-3 text-left text-[13px] font-medium text-slate-700"
          >
            <LogOut className="h-4 w-4 text-slate-800" />
            {bn ? "লগ আউট" : "Log out"}
          </button>
        </div>
      </div>
    </section>
  );
}
