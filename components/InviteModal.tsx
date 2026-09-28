"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Check, X, Inbox, Send, UserRound } from "lucide-react";
import { API_BASE_URL } from "../utils/apiConfig";

export default function InviteModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [data, setData] = useState<any>({ received: [], sent: [] });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const token = Cookies.get("token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(API_BASE_URL + "/api/invites", {
        headers: { Authorization: "Bearer " + token },
      });
      const json = await res.json();
      if (json.success) {
        setData({
          received: json.received || [],
          sent: json.sent || [],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen]);

  const update = async (id: string, status: "accepted" | "rejected") => {
    const token = Cookies.get("token");
    if (!token) return;

    const res = await fetch(API_BASE_URL + "/api/invites/" + id, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ status }),
    });

    if (res.ok) load();
  };

  if (!isOpen) return null;

  const rows = data[tab] || [];

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/50 p-3"
      onMouseDown={onClose}
    >
      <section
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <h2 className="font-bold text-slate-900">Invitations</h2>
            <p className="text-xs text-slate-500">
              Invitations you received and sent.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-slate-100"
            aria-label="Close invitations"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setTab("received")}
            className={`flex-1 px-4 py-3 text-sm font-bold ${
              tab === "received"
                ? "border-b-2 border-emerald-600 text-emerald-700"
                : "text-slate-500"
            }`}
          >
            <Inbox className="mr-1 inline h-4 w-4" />
            Received ({data.received.length})
          </button>
          <button
            onClick={() => setTab("sent")}
            className={`flex-1 px-4 py-3 text-sm font-bold ${
              tab === "sent"
                ? "border-b-2 border-emerald-600 text-emerald-700"
                : "text-slate-500"
            }`}
          >
            <Send className="mr-1 inline h-4 w-4" />
            Sent ({data.sent.length})
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-400">
              Loading invitations…
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              No invitations yet.
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((invite: any) => {
                const person =
                  tab === "received"
                    ? invite.senderId
                    : invite.receiverId;

                return (
                  <article
                    key={invite._id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1 font-bold text-slate-900">
                          <UserRound className="h-4 w-4 text-emerald-600" />
                          {person?.name || "Member"}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-400">
                          {invite.adId?.headline || "Investment post"}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                          invite.status === "accepted"
                            ? "bg-emerald-100 text-emerald-700"
                            : invite.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {invite.status}
                      </span>
                    </div>

                    {tab === "received" && invite.status === "pending" && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => update(invite._id, "accepted")}
                          className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white"
                        >
                          <Check className="mr-1 inline h-4 w-4" />
                          Accept
                        </button>
                        <button
                          onClick={() => update(invite._id, "rejected")}
                          className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700"
                        >
                          <X className="mr-1 inline h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
