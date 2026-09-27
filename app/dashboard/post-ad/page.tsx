"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ImagePlus, MapPin, X, ShieldCheck } from "lucide-react";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/apiConfig";

type Item = {
  _id: string;
  name: string;
  category?: { _id?: string; name?: string } | string;
  location?: { _id?: string; name?: string } | string;
  minInvestment?: number;
  maxInvestment?: number;
  returnType?: "return" | "refund";
  returnProfit?: number;
};

type Role = "investor" | "business_owner";
type BusinessStatus = "new" | "running" | "closed";

const INVESTMENT_HOME =
  process.env.NEXT_PUBLIC_INVESTMENT_HOME_URL || "https://shadamoninvest.vercel.app";

const normalize = (value: unknown) =>
  String(value || "").trim().toLowerCase().replace(/[_-]+/g, " ");

const isRoleCategory = (name: string, role: Role) => {
  const n = normalize(name);
  return role === "investor"
    ? n === "investor" || n.includes("investor")
    : n === "business owner" || n.includes("business owner");
};

export default function PostAdPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Item[]>([]);
  const [subCategories, setSubCategories] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Item[]>([]);
  const [subLocations, setSubLocations] = useState<Item[]>([]);

  const initialRole =
    searchParams.get("role") === "investor" ? "investor" : "business_owner";
  const [role, setRole] = useState<Role>(initialRole);
  const [status, setStatus] = useState<BusinessStatus>("new");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [location, setLocation] = useState("");
  const [subLocation, setSubLocation] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [ret, setRet] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch(API_BASE_URL + "/api/categories").then((r) => r.json()),
      fetch(API_BASE_URL + "/api/categories/sub").then((r) => r.json()),
      fetch(API_BASE_URL + "/api/locations").then((r) => r.json()),
      fetch(API_BASE_URL + "/api/locations/sub").then((r) => r.json()),
    ])
      .then(([c, sc, l, sl]) => {
        if (!mounted) return;
        setCategories(c.data || []);
        setSubCategories(sc.data || []);
        setLocations(l.data || []);
        setSubLocations(sl.data || []);
      })
      .catch(() => setError("Unable to load categories and locations."));
    return () => {
      mounted = false;
    };
  }, []);

  const visibleSubCategories = useMemo(() => {
    if (!category) return [];
    return subCategories.filter((item) => {
      const parent = item.category;
      return typeof parent === "object"
        ? parent?._id === category || parent?.name === category
        : parent === category;
    });
  }, [category, subCategories]);

  const visibleSubLocations = useMemo(() => {
    if (!location) return [];
    return subLocations.filter((item) => {
      const parent = item.location;
      return typeof parent === "object"
        ? parent?._id === location || parent?.name === location
        : parent === location;
    });
  }, [location, subLocations]);

  const businessOwnerCategory = category
    ? isRoleCategory(category, "business_owner")
    : role === "business_owner";
  const returnLabel = businessOwnerCategory
    ? "Return Profit %"
    : "Expected Profit %";
  const roleLabel = role === "investor" ? "Investor" : "Business Owner";

  const applyRoleDefaults = (nextRole: Role, list = categories, subs = subCategories) => {
    const nextCategory = list.find((item) => isRoleCategory(item.name, nextRole));
    if (!nextCategory) return;

    setCategory(nextCategory.name);

    const nextSub = subs.find((item) => {
      const parent = item.category;
      const belongs =
        typeof parent === "object"
          ? parent?._id === nextCategory._id || parent?.name === nextCategory.name
          : parent === nextCategory._id || parent === nextCategory.name;
      return belongs;
    });

    if (nextSub) {
      setSubCategory(nextSub.name);
      if (Number(nextSub.minInvestment) > 0) setMin(String(nextSub.minInvestment));
      if (Number(nextSub.maxInvestment) > 0) setMax(String(nextSub.maxInvestment));
      if (Number(nextSub.returnProfit) > 0) setRet(String(nextSub.returnProfit));
    } else {
      setSubCategory("");
    }
  };

  useEffect(() => {
    if (categories.length) applyRoleDefaults(role, categories, subCategories);
    // Defaults are intentionally applied only when the API metadata becomes available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length, subCategories.length]);

  const onRoleChange = (nextRole: Role) => {
    setRole(nextRole);
    setError("");
    applyRoleDefaults(nextRole);
  };

  const onSubCategoryChange = (value: string) => {
    setSubCategory(value);
    const selected = visibleSubCategories.find((item) => item.name === value);
    if (!selected) return;
    if (Number(selected.minInvestment) > 0) setMin(String(selected.minInvestment));
    if (Number(selected.maxInvestment) > 0) setMax(String(selected.maxInvestment));
    if (Number(selected.returnProfit) > 0) setRet(String(selected.returnProfit));
  };

  const onImage = (file: File | null) => {
    setImage(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  };

  const cancelPost = () => {
    window.location.href = INVESTMENT_HOME;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!category || !subCategory || !location || !subLocation) {
      setError("Please select category, subcategory, district and area.");
      return;
    }
    if (!phone.trim() || !headline.trim() || !description.trim()) {
      setError("Phone, headline and description are required.");
      return;
    }
    if (!min || !max || !ret) {
      setError(`Minimum investment, maximum investment and ${returnLabel} are required.`);
      return;
    }

    const minValue = Number(min);
    const maxValue = Number(max);
    const returnValue = Number(ret);
    if (
      !Number.isFinite(minValue) ||
      !Number.isFinite(maxValue) ||
      !Number.isFinite(returnValue) ||
      minValue < 0 ||
      maxValue < minValue ||
      returnValue < 0
    ) {
      setError("Please enter valid investment values.");
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      form.append("headline", headline.trim());
      form.append("description", description.trim());
      form.append("phone", phone.trim());
      if (altPhone.trim()) form.append("altPhone", altPhone.trim());
      form.append("category", category);
      form.append("subCategory", subCategory);
      form.append("location", location);
      form.append("subLocation", subLocation);
      form.append("postRole", role);
      form.append("minInvestment", String(minValue));
      form.append("maxInvestment", String(maxValue));
      form.append("expectedReturn", String(returnValue));
      if (role === "business_owner") form.append("businessStatus", status);
      if (image) form.append("images", image);

      const token = Cookies.get("token");
      const response = await fetch(API_BASE_URL + "/api/ads", {
        method: "POST",
        headers: token ? { Authorization: "Bearer " + token } : undefined,
        credentials: "include",
        body: form,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Post failed.");

      if (data.token) Cookies.set("token", data.token, { expires: 7 });
      if (data.user) {
        window.dispatchEvent(
          new CustomEvent("investment-account-created", { detail: data.user }),
        );
      }

      // The existing admin approval workflow remains responsible for changing
      // the investment post from review/pending to active.
      router.replace("/dashboard?post=success");
    } catch (e: any) {
      setError(e?.message || "Unable to publish the post.");
      window.setTimeout(() => {
        window.location.href = INVESTMENT_HOME;
      }, 1200);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-60px)] overflow-hidden bg-slate-100 px-3 py-3 md:px-5 md:py-5">
      <div className="fixed inset-0 z-[70] bg-white/35 backdrop-blur-md" aria-hidden="true" />

      <div className="relative z-[80] mx-auto max-w-[860px] overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-2xl">
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4 md:px-6">
          <button
            type="button"
            onClick={cancelPost}
            className="flex items-center gap-2 text-sm font-bold text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Investment Post
          </button>
          <button type="button" onClick={cancelPost} aria-label="Close">
            <X className="h-5 w-5 text-slate-700" />
          </button>
        </div>

        <div className="border-b border-emerald-100 bg-emerald-50/80 px-4 py-3 text-xs text-emerald-800 md:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-4 w-4" />
            Your post will be submitted for admin approval before it appears publicly.
          </div>
        </div>

        <form onSubmit={submit} className="max-h-[calc(100vh-150px)] overflow-y-auto p-4 md:p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <section className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                I want to
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onRoleChange("investor")}
                  className={`rounded-lg border px-3 py-3 text-sm font-bold transition ${role === "investor" ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 bg-white text-slate-800"}`}
                >
                  I Want To Invest
                </button>
                <button
                  type="button"
                  onClick={() => onRoleChange("business_owner")}
                  className={`rounded-lg border px-3 py-3 text-sm font-bold transition ${role === "business_owner" ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-slate-800"}`}
                >
                  I Need Money
                </button>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                This automatically selects the matching investment category and subcategory. You can change them below.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-700">Post image</label>
              <label className="flex min-h-[115px] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
                {imagePreview ? (
                  <div className="relative h-40 w-full">
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        onImage(null);
                      }}
                      className="absolute right-2 top-2 rounded-full bg-white p-1.5 shadow"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-slate-400">
                    <ImagePlus className="mx-auto h-7 w-7" />
                    <span className="mt-1 block text-xs">Add business / investment image</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onImage(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder={role === "investor" ? "Investment headline" : "Business funding headline"}
              className="rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-600 md:col-span-2"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the investment or business opportunity"
              className="min-h-[120px] rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-600 md:col-span-2"
            />

            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSubCategory("");
              }}
              className="rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none"
            >
              <option value="">Select Category</option>
              {categories.map((item) => (
                <option key={item._id} value={item.name}>{item.name}</option>
              ))}
            </select>

            <select
              value={subCategory}
              onChange={(e) => onSubCategoryChange(e.target.value)}
              disabled={!category}
              className="rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none disabled:bg-slate-100"
            >
              <option value="">Select Sub Category</option>
              {visibleSubCategories.map((item) => (
                <option key={item._id} value={item.name}>{item.name}</option>
              ))}
            </select>

            <select
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setSubLocation("");
              }}
              className="rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none"
            >
              <option value="">District</option>
              {locations.map((item) => (
                <option key={item._id} value={item.name}>{item.name}</option>
              ))}
            </select>

            <select
              value={subLocation}
              onChange={(e) => setSubLocation(e.target.value)}
              disabled={!location}
              className="rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none disabled:bg-slate-100"
            >
              <option value="">Area</option>
              {visibleSubLocations.map((item) => (
                <option key={item._id} value={item.name}>{item.name}</option>
              ))}
            </select>

            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Primary phone number"
                className="w-full rounded-lg border border-slate-300 py-3 pl-9 pr-3 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            <input
              value={altPhone}
              onChange={(e) => setAltPhone(e.target.value)}
              placeholder="Alternative phone number"
              className="rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-600"
            />

            <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-300 bg-white">
              <input
                type="number"
                min="0"
                value={min}
                onChange={(e) => setMin(e.target.value)}
                placeholder="Min invest"
                className="min-w-0 border-r px-2 py-3 text-sm outline-none"
              />
              <input
                type="number"
                min="0"
                value={max}
                onChange={(e) => setMax(e.target.value)}
                placeholder="Max invest"
                className="min-w-0 border-r px-2 py-3 text-sm outline-none"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={ret}
                onChange={(e) => setRet(e.target.value)}
                placeholder={returnLabel}
                className="min-w-0 px-2 py-3 text-sm outline-none"
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs">
              <div className="font-bold text-slate-700">{returnLabel}</div>
              <div className="mt-0.5 text-slate-500">
                {role === "investor"
                  ? "The percentage you expect from an investment."
                  : "The percentage return you offer to an investor."}
              </div>
            </div>

            {role === "business_owner" && (
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BusinessStatus)}
                className="rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none md:col-span-2"
              >
                <option value="new">New Business</option>
                <option value="running">Running Business</option>
                <option value="closed">Close / Closed Business</option>
              </select>
            )}
          </section>

          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={cancelPost}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              disabled={busy}
              className="rounded-lg bg-slate-950 px-7 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? "Submitting for approval..." : "Submit Post"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
