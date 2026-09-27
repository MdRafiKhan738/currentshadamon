"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, MapPin, X } from "lucide-react";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/apiConfig";

type Item = {
  _id: string;
  name: string;
  category?: { _id?: string; name?: string } | string;
  location?: { _id?: string; name?: string } | string;
};

type Role = "investor" | "business_owner";
type BusinessStatus = "new" | "running" | "closed";

export default function PostAdPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Item[]>([]);
  const [subCategories, setSubCategories] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Item[]>([]);
  const [subLocations, setSubLocations] = useState<Item[]>([]);
  const [role, setRole] = useState<Role>("business_owner");
  const [status, setStatus] = useState<BusinessStatus>("new");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [location, setLocation] = useState("");
  const [subLocation, setSubLocation] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
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

  const onImage = (file: File | null) => {
    setImage(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!Cookies.get("token")) {
      window.dispatchEvent(new CustomEvent("open-mobile-entry-modal"));
      return;
    }
    if (!category || !subCategory || !location || !subLocation) {
      setError("Please select category, subcategory, district and area.");
      return;
    }
    if (!phone.trim() || !headline.trim() || !description.trim()) {
      setError("Phone, headline and description are required.");
      return;
    }
    if (!min || !max || !ret) {
      setError("Minimum investment, maximum investment and return % are required.");
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

      router.push("/dashboard");
    } catch (e: any) {
      setError(e?.message || "Unable to publish the post.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-3 py-3 md:px-5 md:py-5">
      <div className="mx-auto max-w-[900px] overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
        <div className="flex h-11 items-center justify-between border-b border-slate-200 px-3 md:px-5">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm font-medium text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Post Ad
          </button>
          <button type="button" onClick={() => router.push("/")} aria-label="Close">
            <X className="h-5 w-5 text-slate-700" />
          </button>
        </div>

        <div className="border-b border-slate-100 px-4 py-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-slate-900">Investment Post</span>
            <span>District → Area</span>
            <span>Investor / Business Owner</span>
          </div>
        </div>

        <form onSubmit={submit} className="p-4 md:p-6">
          {error && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <section className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-700">I am</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setRole("business_owner")} className={`border px-3 py-2 text-sm ${role === "business_owner" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-800"}`}>
                  Business Owner
                </button>
                <button type="button" onClick={() => setRole("investor")} className={`border px-3 py-2 text-sm ${role === "investor" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-800"}`}>
                  Investor
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-700">Your business / investment image</label>
              <label className="flex min-h-[120px] cursor-pointer items-center justify-center overflow-hidden border border-dashed border-slate-300 bg-slate-50">
                {imagePreview ? (
                  <div className="relative h-full w-full">
                    <img src={imagePreview} alt="Preview" className="h-40 w-full object-cover" />
                    <button type="button" onClick={(event) => { event.preventDefault(); onImage(null); }} className="absolute right-2 top-2 rounded-full bg-white p-1 shadow">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-slate-400">
                    <ImagePlus className="mx-auto h-7 w-7" />
                    <span className="mt-1 block text-xs">Add image</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onImage(e.target.files?.[0] || null)} />
              </label>
            </div>

            <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Headline" className="border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-900 md:col-span-2" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Investment / business description" className="min-h-[130px] border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-900 md:col-span-2" />

            <select value={category} onChange={(e) => { setCategory(e.target.value); setSubCategory(""); }} className="border border-slate-300 px-3 py-3 text-sm outline-none">
              <option value="">Select Category</option>
              {categories.map((item) => <option key={item._id} value={item.name}>{item.name}</option>)}
            </select>
            <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} disabled={!category} className="border border-slate-300 px-3 py-3 text-sm outline-none disabled:bg-slate-100">
              <option value="">Select Sub Category</option>
              {visibleSubCategories.map((item) => <option key={item._id} value={item.name}>{item.name}</option>)}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <select value={location} onChange={(e) => { setLocation(e.target.value); setSubLocation(""); }} className="border border-slate-300 px-3 py-3 text-sm outline-none">
                <option value="">District</option>
                {locations.map((item) => <option key={item._id} value={item.name}>{item.name}</option>)}
              </select>
              <select value={subLocation} onChange={(e) => setSubLocation(e.target.value)} disabled={!location} className="border border-slate-300 px-3 py-3 text-sm outline-none disabled:bg-slate-100">
                <option value="">Area</option>
                {visibleSubLocations.map((item) => <option key={item._id} value={item.name}>{item.name}</option>)}
              </select>
            </div>

            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className="w-full border border-slate-300 py-3 pl-9 pr-3 text-sm outline-none focus:border-slate-900" />
            </div>

            <div className="grid grid-cols-3 gap-1 border border-slate-300">
              <input type="number" min="0" value={min} onChange={(e) => setMin(e.target.value)} placeholder="Min investment" className="min-w-0 border-r px-2 py-3 text-sm outline-none" />
              <input type="number" min="0" value={max} onChange={(e) => setMax(e.target.value)} placeholder="Max investment" className="min-w-0 border-r px-2 py-3 text-sm outline-none" />
              <input type="number" min="0" step="0.01" value={ret} onChange={(e) => setRet(e.target.value)} placeholder="Return %" className="min-w-0 px-2 py-3 text-sm outline-none" />
            </div>

            {role === "business_owner" && (
              <select value={status} onChange={(e) => setStatus(e.target.value as BusinessStatus)} className="border border-slate-300 px-3 py-3 text-sm outline-none md:col-span-2">
                <option value="new">New Business</option>
                <option value="running">Running Business</option>
                <option value="closed">Close / Closed Business</option>
              </select>
            )}
          </section>

          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            <button type="button" onClick={() => router.push("/")} className="border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700">
              Cancel
            </button>
            <button disabled={busy} className="bg-[#171717] px-7 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {busy ? "Publishing..." : "Post Ad"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
