"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { X, Check, XCircle, Send, Inbox } from "lucide-react";
import { API_BASE_URL } from "../utils/apiConfig";

export default function ProposalModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [data, setData] = useState<any>({ received: [], sent: [] });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const token = Cookies.get("token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(API_BASE_URL + "/api/proposals", { headers: { Authorization: "Bearer " + token } });
      const json = await res.json();
      if (json.success) setData({ received: json.received || [], sent: json.sent || [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isOpen) load(); }, [isOpen]);

  const update = async (id: string, status: "accepted" | "rejected" | "cancelled") => {
    const token = Cookies.get("token");
    if (!token) return;
    const res = await fetch(API_BASE_URL + "/api/proposals/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  };

  if (!isOpen) return null;
  const rows = data[tab] || [];

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/50 p-3" onMouseDown={onClose}>
      <section className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onMouseDown={e => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-slate-200 p-4">
          <div><h2 className="font-bold text-slate-900">Investment Proposals</h2><p className="text-xs text-slate-500">Proposals you received and sent.</p></div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </header>
        <div className="flex border-b border-slate-200">
          <button onClick={() => setTab("received")} className={`flex-1 px-4 py-3 text-sm font-bold ${tab === "received" ? "border-b-2 border-emerald-600 text-emerald-700" : "text-slate-500"}`}><Inbox className="mr-1 inline h-4 w-4" />Received ({data.received.length})</button>
          <button onClick={() => setTab("sent")} className={`flex-1 px-4 py-3 text-sm font-bold ${tab === "sent" ? "border-b-2 border-emerald-600 text-emerald-700" : "text-slate-500"}`}><Send className="mr-1 inline h-4 w-4" />Sent ({data.sent.length})</button>
        </div>
        <div className="overflow-y-auto p-4">
          {loading ? <div className="py-10 text-center text-sm text-slate-400">Loading proposals…</div> : rows.length === 0 ? <div className="py-10 text-center text-sm text-slate-400">No proposals yet.</div> : (
            <div className="space-y-3">{rows.map((p:any) => {
              const person = tab === "received" ? p.senderId : p.receiverId;
              return <article key={p._id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><div className="font-bold text-slate-900">{person?.name || person?.storeName || "Member"}</div><div className="text-[11px] text-slate-400">{p.adId?.headline || "Investment post"}</div></div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${p.status === "accepted" ? "bg-emerald-100 text-emerald-700" : p.status === "rejected" || p.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{p.status}</span>
                </div>
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Proposal details</div>
                  <div className="rounded-lg border border-white bg-white px-3 py-2.5">
                    <p className="whitespace-pre-wrap leading-5 text-slate-800">{p.message || "No proposal message provided."}</p>
                  </div>
                  {p.adId && (
                    <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-[11px] text-slate-600">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div><span className="font-semibold text-slate-700">Post:</span> {p.adId.headline || "Investment post"}</div>
                        <div><span className="font-semibold text-slate-700">Type:</span> {p.proposalType || "investment"}</div>
                        {p.adId.postRole ? <div><span className="font-semibold text-slate-700">Role:</span> {p.adId.postRole === "business_owner" ? "Business Owner" : "Investor"}</div> : null}
                        {p.adId.category ? <div><span className="font-semibold text-slate-700">Category:</span> {p.adId.category}</div> : null}
                        {p.adId.subCategory ? <div><span className="font-semibold text-slate-700">Subcategory:</span> {p.adId.subCategory}</div> : null}
                        {p.adId.location ? <div><span className="font-semibold text-slate-700">Location:</span> {p.adId.location}{p.adId.subLocation ? " • " + p.adId.subLocation : ""}</div> : null}
                        {p.adId.businessStatus && p.adId.postRole === "business_owner" ? <div><span className="font-semibold text-slate-700">Business status:</span> {p.adId.businessStatus}</div> : null}
                        {p.adId.minInvestment ? <div><span className="font-semibold text-slate-700">Minimum investment:</span> {String(p.adId.minInvestment)}</div> : null}
                        {p.adId.maxInvestment ? <div><span className="font-semibold text-slate-700">Maximum investment:</span> {String(p.adId.maxInvestment)}</div> : null}
                        {p.adId.expectedReturn ? <div><span className="font-semibold text-slate-700">Expected return:</span> {String(p.adId.expectedReturn)}</div> : null}
                        {p.adId.investmentReturn ? <div><span className="font-semibold text-slate-700">Return:</span> {String(p.adId.investmentReturn)}</div> : null}
                        {p.adId.price != null ? <div><span className="font-semibold text-slate-700">Price:</span> {String(p.adId.price)}{p.adId.priceType ? " (" + p.adId.priceType + ")" : ""}</div> : null}
                      </div>

                      {p.adId.description ? (
                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <div className="mb-1 font-semibold text-slate-700">Post description</div>
                          <p className="whitespace-pre-wrap leading-5 text-slate-700">{p.adId.description}</p>
                        </div>
                      ) : null}

                      {(p.adId.priceBoxFields || p.adId.features?.priceBoxFields || []).length > 0 ? (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {(p.adId.priceBoxFields || p.adId.features?.priceBoxFields || []).map((field: any) => {
                            const values = p.adId.priceBoxValues || p.adId.features?.priceBoxValues || {};
                            const value = values[field.key];
                            return value != null && String(value).trim() ? (
                              <div key={field.key} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                                <span className="font-semibold text-slate-700">{field.label || field.labelBn || field.key}:</span>{" "}
                                <span className="text-slate-600">{String(value)}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
                {p.status === "pending" && <div className="mt-3 flex gap-2">
                  {tab === "received" ? (
                    <>
                      <button onClick={() => update(p._id, "accepted")} className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white"><Check className="mr-1 inline h-4 w-4" />Accept</button>
                      <button onClick={() => update(p._id, "rejected")} className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700"><XCircle className="mr-1 inline h-4 w-4" />Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => update(p._id, "cancelled")} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"><XCircle className="mr-1 inline h-4 w-4" />Cancel Proposal</button>
                  )}
                </div>}
              </article>;
            })}</div>
          )}
        </div>
      </section>
    </div>
  );
}
