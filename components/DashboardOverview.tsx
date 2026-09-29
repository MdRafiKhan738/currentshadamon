"use client";

import {
  Bell,
  BellRing,
  Check,
  Eye,
  FileText,
  LockKeyhole,
  LogOut,
  Settings,
} from "lucide-react";
import Cookies from "js-cookie";
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

  const profileName = user?.name || user?.storeName || (language === "bn" ? "সদস্য" : "Member");
  const profileLine = user?.email || user?.storeName || "Profile";
  const accountType = user?.merchantType || "Free";
  const mobile = user?.mobile || "01904999111";
  const photo = getImageUrl(user?.photo || undefined) || "";

  const dispatchAccount = (activeTab: "Profile" | "Post" | "Settings" | "Activity") => {
    window.dispatchEvent(new CustomEvent("open-account-modal", { detail: { activeTab } }));
  };

  const verifyLabel = user?.mVerified
    ? (language === "bn" ? "ভেরিফাইড" : "Verified")
    : (language === "bn" ? "ভেরিফাই" : "Verify");

  const validTo = summary.packageValidTill
    ? new Date(summary.packageValidTill).toLocaleDateString(
        "en-GB",
        { day: "2-digit", month: "2-digit", year: "numeric" },
      )
    : "";

  return (
    <section className="w-full overflow-hidden border border-[#dfe3e8] bg-white">
      <div className="border-b border-[#e1e4e8] bg-white px-3 pb-3 pt-2">
        <div className="grid grid-cols-[76px_minmax(0,1fr)_74px] gap-2">
          <div className="relative">
            <div className="h-[68px] w-[68px] overflow-hidden rounded-full bg-[#2f9b86]">
              {photo ? (
                <img
                  src={photo}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-white">
                  {profileName.slice(0, 10)}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => dispatchAccount("Profile")}
              className="absolute -bottom-1 left-[43px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#f51f47] text-[14px] font-bold leading-none text-white"
              aria-label="Add profile"
            >
              +
            </button>
          </div>

          <div className="min-w-0 pt-1">
            <div className="truncate text-[9px] font-medium text-slate-700">
              {profileName}
            </div>
            <div className="truncate text-[8px] text-slate-500">
              {profileLine}
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <div className="flex min-w-0 items-center gap-1 rounded border border-[#dce3ea] bg-white px-2 py-1">
                <span className="truncate text-[8px] font-medium text-slate-700">{mobile}</span>
                <Bell className="h-3 w-3 shrink-0 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="pt-2 text-right">
            <div className="text-[7px] text-slate-400">
              {language === "bn" ? "অ্যাকাউন্ট টাইপ" : "Account Type"}
            </div>
            <div className="text-[8px] font-medium text-slate-600">
              {accountType}
            </div>
            <button
              type="button"
              onClick={() => dispatchAccount("Profile")}
              className={"mt-3 rounded-[2px] px-2.5 py-1 text-[7px] font-semibold text-white " + (user?.mVerified ? "bg-[#2e9c85]" : "bg-[#ef294b]")}
            >
              {verifyLabel}
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-[#e2e5e8] bg-white px-3 py-2">
        <div className="text-[9px] font-medium text-slate-700">
          {language === "bn" ? "অ্যাকাউন্ট অ্যাক্টিভিটি" : "Account Activity"}
        </div>

        <div className="mt-1 grid grid-cols-3 divide-x divide-[#e7eaee]">
          <div className="px-1.5 py-1 text-left">
            <div className="text-[10px] font-medium text-slate-700">{summary.pendingInvitations}</div>
            <div className="text-[7px] leading-3 text-slate-500">
              {language === "bn" ? "অপেক্ষমাণ আমন্ত্রণ" : <>Pending<br />Invitations</>}
            </div>
          </div>
          <div className="px-1.5 py-1 text-left">
            <div className="text-[10px] font-medium text-slate-700">{summary.acceptedInvitations}</div>
            <div className="text-[7px] leading-3 text-slate-500">
              {language === "bn" ? "গৃহীত আমন্ত্রণ" : <>Accepted<br />Invitations</>}
            </div>
          </div>
          <div className="px-1.5 py-1 text-left">
            <div className="text-[10px] font-medium text-slate-700">{summary.profileVisitors}</div>
            <div className="text-[7px] leading-3 text-slate-500">
              {language === "bn" ? "মোট ভিজিটর" : <>Total<br />Visitors</>}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-[#e2e5e8] bg-white px-3 py-2">
        <div className="flex items-center gap-1 text-[7px] font-semibold text-slate-700">
          <LockKeyhole className="h-3 w-3 text-slate-700" />
          <span>{language === "bn" ? "শুধুমাত্র PREMIUM সদস্য" : "Only PREMIUM Members"}</span>
        </div>

        <div className="mt-1 grid grid-cols-2 divide-x divide-[#e7eaee]">
          <div className="px-1.5 py-1">
            <div className="text-[9px] font-medium text-slate-700">
              {summary.usedConnects}
            </div>
            <div className="text-[7px] leading-3 text-slate-500">
              {language === "bn" ? "Used Connect" : <>Used<br />Connect</>}
            </div>
          </div>
          <div className="px-1.5 py-1">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-medium text-slate-700">
                {summary.availableConnects}
              </span>
              <LockKeyhole className="h-3 w-3 text-[#ef294b]" />
            </div>
            <div className="text-[7px] leading-3 text-slate-500">
              {language === "bn" ? "Unused Connect" : <>Unused<br />Connect</>}
            </div>
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between border-t border-[#eef0f2] pt-1 text-[7px] text-slate-500">
          <span className="font-semibold text-slate-700">
            {language === "bn" ? "প্যাকেজ" : "Package"}:
          </span>
          <span className="truncate pl-2 text-right font-medium text-slate-700">
            {summary.packageName || "Free"}{summary.packageType ? " • " + summary.packageType : ""}
          </span>
        </div>

        {validTo ? (
          <div className="flex items-center justify-between text-[7px] text-slate-500">
            <span>{language === "bn" ? "মেয়াদ শেষ" : "Valid to"}</span>
            <span className="font-medium text-slate-700">{validTo}</span>
          </div>
        ) : null}
      </div>

      <div className="bg-white px-3 py-2">
        <div className="border-b border-[#e5e7eb] pb-1 text-[8px] font-medium text-slate-700">
          {language === "bn" ? "অ্যাকাউন্ট সেটিংস" : "Account Settings"}
        </div>

        <div className="divide-y divide-[#eef0f2]">
          <button
            type="button"
            onClick={() => dispatchAccount("Settings")}
            className="flex w-full items-center gap-2 py-2 text-left text-[8px] text-slate-600"
          >
            <BellRing className="h-3 w-3 text-slate-600" />
            {language === "bn" ? "নোটিফিকেশন" : "Notifications"}
          </button>
          <button
            type="button"
            onClick={() => dispatchAccount("Settings")}
            className="flex w-full items-center gap-2 py-2 text-left text-[8px] text-slate-600"
          >
            <Settings className="h-3 w-3 text-slate-600" />
            {language === "bn" ? "অ্যাকাউন্ট সেটিংস" : "Account Settings"}
          </button>
          <button
            type="button"
            onClick={() => {
              Cookies.remove("token");
              window.location.href = "/dashboard";
            }}
            className="flex w-full items-center gap-2 py-2 text-left text-[8px] text-slate-600"
          >
            <LogOut className="h-3 w-3 text-slate-600" />
            {language === "bn" ? "লগ আউট" : "Log out"}
          </button>
        </div>
      </div>

      {summary.pendingVerification > 0 || summary.pendingProposals > 0 || summary.acceptedProposals > 0 ? (
        <div className="hidden" aria-hidden="true">
          <FileText />
          <Check />
          <Eye />
        </div>
      ) : null}
    </section>
  );
}
