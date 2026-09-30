"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Check, Eye, FileText, LockKeyhole, LogOut, Settings } from "lucide-react";
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

export default function DashboardOverview({ summary, user }: { summary: DashboardSummary; user?: DashboardUser | null }) {
  const { language } = useLanguage();
  const [loadedUser, setLoadedUser] = useState<DashboardUser | null>(user || null);

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

  const profileName = loadedUser?.name || loadedUser?.storeName || (language === "bn" ? "সদস্য" : "Member");
  const profileLine = loadedUser?.email || loadedUser?.storeName || "Profile";
  const accountType = loadedUser?.merchantType || "Free";
  const mobile = loadedUser?.mobile || "—";
  const photo = getImageUrl(loadedUser?.photo || undefined) || "";

  const dispatchAccount = (activeTab: "Profile" | "Post" | "Settings" | "Activity") => {
    window.dispatchEvent(new CustomEvent("open-account-modal", { detail: { activeTab } }));
  };

  const verifyLabel = loadedUser?.mVerified
    ? (language === "bn" ? "ভেরিফাইড" : "Verified")
    : (language === "bn" ? "ভেরিফাই" : "Verify");

  const validTo = summary.packageValidTill
    ? new Date(summary.packageValidTill).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";

  return (
    <section className="w-full overflow-hidden rounded-[6px] border border-[#dfe3e8] bg-white shadow-sm">
      <div className="border-b border-[#e1e4e8] bg-white px-4 pb-5 pt-5">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="h-[92px] w-[92px] overflow-hidden rounded-full border-4 border-white bg-[#2f9b86] shadow-md ring-1 ring-slate-200">
              {photo ? (
                <img src={photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[16px] font-bold text-white">
                  {profileName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => dispatchAccount("Profile")}
              className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#f51f47] text-[18px] font-bold text-white shadow"
              aria-label="Edit profile photo"
            >
              +
            </button>
          </div>

          <div className="mt-3 text-[20px] font-extrabold text-slate-900">{profileName}</div>
          <div className="mt-1 max-w-full truncate px-3 text-[14px] font-medium text-slate-500">{profileLine}</div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-[#dce3ea] bg-white px-3 py-2">
              <span className="text-[13px] font-semibold text-slate-700">{mobile}</span>
              <Bell className="h-4 w-4 text-slate-400" />
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-2 text-[13px] font-bold text-slate-700">
              {accountType}
            </div>
            <button
              type="button"
              onClick={() => dispatchAccount("Profile")}
              className={"rounded-full px-3 py-2 text-[13px] font-bold text-white " + (loadedUser?.mVerified ? "bg-[#2e9c85]" : "bg-[#ef294b]")}
            >
              {verifyLabel}
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-[#e2e5e8] bg-white px-4 py-4">
        <div className="text-[15px] font-extrabold text-slate-800">
          {language === "bn" ? "অ্যাকাউন্ট অ্যাক্টিভিটি" : "Account Activity"}
        </div>

        <div className="mt-3 grid grid-cols-3 divide-x divide-[#e7eaee]">
          <div className="px-3 text-center">
            <div className="text-[20px] font-extrabold text-slate-900">{summary.pendingInvitations}</div>
            <div className="mt-1 text-[13px] font-semibold leading-4 text-slate-500">{language === "bn" ? "অপেক্ষমাণ আমন্ত্রণ" : <>Pending<br />Invitations</>}</div>
          </div>
          <div className="px-3 text-center">
            <div className="text-[20px] font-extrabold text-slate-900">{summary.acceptedInvitations}</div>
            <div className="mt-1 text-[13px] font-semibold leading-4 text-slate-500">{language === "bn" ? "গৃহীত আমন্ত্রণ" : <>Accepted<br />Invitations</>}</div>
          </div>
          <div className="px-3 text-center">
            <div className="text-[20px] font-extrabold text-slate-900">{summary.profileVisitors}</div>
            <div className="mt-1 text-[13px] font-semibold leading-4 text-slate-500">{language === "bn" ? "মোট ভিজিটর" : <>Total<br />Visitors</>}</div>
          </div>
        </div>
      </div>

      <div className="border-b border-[#e2e5e8] bg-white px-4 py-4">
        <div className="flex items-center gap-2 text-[15px] font-extrabold text-slate-800">
          <LockKeyhole className="h-4 w-4" />
          <span>{language === "bn" ? "কানেক্ট" : "Connects"}</span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-[10px] border border-slate-200 bg-slate-50 px-4 py-4 text-center">
            <div className="text-[28px] font-extrabold leading-none text-slate-900">{Number(summary.usedConnects || 0)}</div>
            <div className="mt-2 text-[14px] font-bold text-slate-600">{language === "bn" ? "ব্যবহৃত কানেক্ট" : "Used Connect"}</div>
          </div>
          <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-center">
            <div className="text-[28px] font-extrabold leading-none text-slate-900">{Number(summary.availableConnects || 0)}</div>
            <div className="mt-2 flex items-center justify-center gap-1 text-[14px] font-bold text-slate-600">
              {language === "bn" ? "অব্যবহৃত কানেক্ট" : "Unused Connect"}
              <LockKeyhole className="h-4 w-4 text-[#ef294b]" />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-slate-500">{language === "bn" ? "প্যাকেজ" : "Package"}</span>
            <span className="truncate font-bold text-slate-800">{summary.packageName || "Free"}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-slate-500">{language === "bn" ? "টাইপ" : "Type"}</span>
            <span className="font-bold text-slate-800">{summary.packageType || "—"}</span>
          </div>
          <div className="col-span-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
            <span className="font-semibold text-slate-500">{language === "bn" ? "মেয়াদ শেষ" : "Valid to"}</span>
            <span className="font-bold text-slate-800">{validTo || "—"}</span>
          </div>
        </div>
      </div>

      <div className="bg-white px-4 py-4">
        <div className="border-b border-[#e5e7eb] pb-2 text-[15px] font-extrabold text-slate-800">
          {language === "bn" ? "অ্যাকাউন্ট সেটিংস" : "Account Settings"}
        </div>

        <div className="divide-y divide-[#eef0f2]">
          <button type="button" onClick={() => dispatchAccount("Settings")} className="flex w-full items-center gap-3 py-3 text-left text-[14px] font-semibold text-slate-600">
            <BellRing className="h-4 w-4 text-slate-600" />
            {language === "bn" ? "নোটিফিকেশন" : "Notifications"}
          </button>
          <button type="button" onClick={() => dispatchAccount("Settings")} className="flex w-full items-center gap-3 py-3 text-left text-[14px] font-semibold text-slate-600">
            <Settings className="h-4 w-4 text-slate-600" />
            {language === "bn" ? "অ্যাকাউন্ট সেটিংস" : "Account Settings"}
          </button>
          <button
            type="button"
            onClick={() => {
              Cookies.remove("token");
              window.location.href = "/dashboard";
            }}
            className="flex w-full items-center gap-3 py-3 text-left text-[14px] font-semibold text-slate-600"
          >
            <LogOut className="h-4 w-4 text-slate-600" />
            {language === "bn" ? "লগ আউট" : "Log out"}
          </button>
        </div>
      </div>

      {summary.pendingVerification > 0 || summary.pendingProposals > 0 || summary.acceptedProposals > 0 ? (
        <div className="hidden" aria-hidden="true">
          <FileText /><Check /><Eye />
        </div>
      ) : null}
    </section>
  );
}