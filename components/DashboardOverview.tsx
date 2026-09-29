"use client";

import {
  BellRing,
  CheckCircle2,
  CreditCard,
  Eye,
  FileCheck2,
  Package,
  Send,
  UserPlus,
} from "lucide-react";
import { useLanguage } from "../app/context/LanguageContext";

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

export default function DashboardOverview({ summary }: { summary: DashboardSummary }) {
  const { language } = useLanguage();

  const open = (eventName: string, detail?: any) => {
    window.dispatchEvent(
      detail ? new CustomEvent(eventName, { detail }) : new Event(eventName),
    );
  };

  const cards = [
    {
      label: language === "bn" ? "অপেক্ষমাণ যাচাই" : "Pending verification",
      value: summary.pendingVerification,
      icon: FileCheck2,
      action: undefined,
    },
    {
      label: language === "bn" ? "অপেক্ষমাণ প্রস্তাব" : "Pending proposals",
      value: summary.pendingProposals,
      icon: FileCheck2,
      action: () => open("open-proposal-modal"),
    },
    {
      label: language === "bn" ? "গৃহীত প্রস্তাব" : "Accepted proposals",
      value: summary.acceptedProposals,
      icon: CheckCircle2,
      action: () => open("open-proposal-modal"),
    },
    {
      label: language === "bn" ? "অপেক্ষমাণ আমন্ত্রণ" : "Pending invitations",
      value: summary.pendingInvitations,
      icon: UserPlus,
      action: () => open("open-invite-modal"),
    },
    {
      label: language === "bn" ? "গৃহীত আমন্ত্রণ" : "Accepted invitations",
      value: summary.acceptedInvitations,
      icon: CheckCircle2,
      action: () => open("open-invite-modal"),
    },
    {
      label: language === "bn" ? "প্রোফাইল ভিজিটর" : "Profile visitors",
      value: summary.profileVisitors,
      icon: Eye,
      action: () => open("open-account-modal", { activeTab: "Profile" }),
    },
  ];

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[15px] font-bold text-slate-900">
              {language === "bn" ? "ড্যাশবোর্ড" : "Dashboard"}
            </h1>
            <p className="mt-0.5 text-[9px] text-slate-400">
              {language === "bn"
                ? "প্রস্তাব, আমন্ত্রণ, প্যাকেজ এবং কানেক্ট একসাথে"
                : "Proposals, invitations, package and connects in one place"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => open("open-account-modal", { activeTab: "Profile" })}
            className="rounded-full border border-slate-200 px-2.5 py-1 text-[9px] font-semibold text-slate-600"
          >
            {language === "bn" ? "প্রোফাইল" : "Profile"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 border-b border-slate-100 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            disabled={!action}
            className={"min-h-[86px] border-r border-b border-slate-100 bg-white px-3 py-2.5 text-left " + (action ? "cursor-pointer hover:bg-slate-50" : "cursor-default")}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-medium leading-3 text-slate-400">{label}</span>
              <Icon className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <div className="mt-2 text-[18px] font-bold leading-none text-slate-900">{value}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-3">
        <button
          onClick={() => open("open-package-modal")}
          className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:bg-white"
        >
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-emerald-700" />
            <span className="text-[9px] font-semibold text-slate-500">{language === "bn" ? "প্যাকেজ" : "Package"}</span>
          </div>
          <div className="mt-1 truncate text-[12px] font-bold text-slate-900">
            {summary.packageName || "Free"}{summary.packageType ? " • " + summary.packageType : ""}
          </div>
          <div className="mt-0.5 text-[8px] text-slate-400">
            {summary.packageValidTill
              ? (language === "bn" ? "মেয়াদ " : "Valid to ") + new Date(summary.packageValidTill).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
              : language === "bn" ? "কোনো সক্রিয় প্যাকেজ নেই" : "No active package"}
          </div>
        </button>

        <button
          onClick={() => open("open-package-modal")}
          className="rounded border border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-50"
        >
          <div className="flex items-center gap-2"><Send className="h-4 w-4 text-slate-500" /><span className="text-[9px] text-slate-400">{language === "bn" ? "ব্যবহৃত কানেক্ট" : "Used Connect"}</span></div>
          <div className="mt-1 text-[16px] font-bold text-slate-900">{summary.usedConnects}</div>
        </button>

        <button
          onClick={() => open("open-package-modal")}
          className="rounded border border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-50"
        >
          <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-emerald-700" /><span className="text-[9px] text-slate-400">{language === "bn" ? "উপলব্ধ কানেক্ট" : "Available Connect"}</span></div>
          <div className="mt-1 text-[16px] font-bold text-slate-900">{summary.availableConnects}</div>
        </button>
      </div>

      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={() => open("open-account-modal", { activeTab: "Activity" })}
          className="flex w-full items-center gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-50"
        >
          <BellRing className="h-4 w-4 text-slate-500" />
          <span className="text-[10px] font-semibold text-slate-700">
            {language === "bn" ? "অ্যাকাউন্ট অ্যাক্টিভিটি দেখুন" : "View account activity"}
          </span>
        </button>
      </div>
    </section>
  );
}
