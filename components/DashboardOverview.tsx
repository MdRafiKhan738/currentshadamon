"use client";

import {
  BellRing,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  FileCheck2,
  Inbox,
  Package,
  Send,
  UserPlus,
} from "lucide-react";

type DashboardSummary = {
  pendingProposals: number;
  acceptedProposals: number;
  pendingInvitations: number;
  profileVisitors: number;
  packageName: string;
  usedConnects: number;
  availableConnects: number;
  pendingVerification: number;
};

type Props = {
  summary: DashboardSummary;
};

export default function DashboardOverview({ summary }: Props) {
  const open = (eventName: string, detail?: any) => {
    window.dispatchEvent(
      detail
        ? new CustomEvent(eventName, { detail })
        : new Event(eventName),
    );
  };

  const cards = [
    {
      label: "Pending verification",
      value: summary.pendingVerification,
      icon: FileCheck2,
      description: "Posts waiting for admin review",
      action: undefined,
    },
    {
      label: "Pending proposals",
      value: summary.pendingProposals,
      icon: Clock3,
      description: "Proposals waiting for a response",
      action: () => open("open-proposal-modal"),
    },
    {
      label: "Accepted proposals",
      value: summary.acceptedProposals,
      icon: CheckCircle2,
      description: "Accepted proposal activity",
      action: () => open("open-proposal-modal"),
    },
    {
      label: "Pending invitations",
      value: summary.pendingInvitations,
      icon: UserPlus,
      description: "Invitations waiting for action",
      action: () => open("open-invite-modal"),
    },
    {
      label: "Profile visitors",
      value: summary.profileVisitors,
      icon: Eye,
      description: "People who viewed your profile",
      action: () =>
        open("open-account-modal", { activeTab: "Profile" }),
    },
    {
      label: "Package",
      value: summary.packageName || "Free",
      icon: Package,
      description: "Current account package",
      action: () => open("open-package-modal"),
    },
    {
      label: "Used connects",
      value: summary.usedConnects,
      icon: Send,
      description: "Connects already used",
      action: () => open("open-package-modal"),
    },
    {
      label: "Available connects",
      value: summary.availableConnects,
      icon: CreditCard,
      description: "Connects currently available",
      action: () => open("open-package-modal"),
    },
  ];

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Inbox className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Dashboard</h1>
            <p className="text-xs text-slate-500">
              Your proposals, verification, package and connects in one place.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, description, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            disabled={!action}
            className={`min-h-[132px] bg-white p-4 text-left transition ${action ? "cursor-pointer hover:bg-slate-50" : "cursor-default"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <span className="text-xl font-bold text-slate-900">
                {value}
              </span>
            </div>
            <div className="mt-4 text-sm font-bold text-slate-800">
              {label}
            </div>
            <div className="mt-1 text-[11px] leading-4 text-slate-500">
              {description}
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2 sm:p-5">
        <button
          type="button"
          onClick={() => open("open-account-modal", { activeTab: "Activity" })}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100"
        >
          <BellRing className="h-5 w-5 text-slate-700" />
          <div>
            <div className="text-sm font-bold text-slate-900">
              Account activity
            </div>
            <div className="text-[11px] text-slate-500">
              View proposals, invitations and post activity.
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => open("open-account-modal", { activeTab: "Post" })}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100"
        >
          <FileCheck2 className="h-5 w-5 text-slate-700" />
          <div>
            <div className="text-sm font-bold text-slate-900">
              My posts
            </div>
            <div className="text-[11px] text-slate-500">
              Check your submitted and approved investment posts.
            </div>
          </div>
        </button>
      </div>
    </section>
  );
}
