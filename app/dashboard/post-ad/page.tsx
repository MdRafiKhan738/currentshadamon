"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ImagePlus, MapPin, X, ShieldCheck, UserRound, SlidersHorizontal } from "lucide-react";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/utils/apiConfig";

interface PriceBoxField {
  key: string;
  label?: string;
  labelBn?: string;
  placeholder?: string;
  placeholderBn?: string;
  required?: boolean;
  order?: number;
}

interface SubCategory {
  _id: string;
  name: string;
  subCategoryNameBn?: string;
  category?: { _id?: string; name?: string } | string;
  priceBoxShow?: boolean;
  priceBoxName?: string;
  priceBoxFields?: PriceBoxField[];
}

interface Category {
  _id: string;
  name: string;
  categoryNameBn?: string;
}

interface Location {
  _id: string;
  name: string;
  locationNameBn?: string;
}

interface SubLocation {
  _id: string;
  name: string;
  subLocationNameBn?: string;
  location?: { _id?: string; name?: string } | string;
}

type Role = "investor" | "business_owner";
type BusinessStatus = "active" | "inactive";

const INVESTMENT_HOME =
  process.env.NEXT_PUBLIC_INVESTMENT_HOME_URL || "https://shadamoninvest.vercel.app";

const normalize = (value: unknown) =>
  String(value || "").trim().toLowerCase().replace(/[_-]+/g, " ");

const roleLabel = (role: Role, bn = false) =>
  bn ? (role === "investor" ? "বিনিয়োগকারী" : "ব্যবসা মালিক") : role === "investor" ? "Investor" : "Business Owner";

const matchesRole = (name: string, role: Role) => {
  const n = normalize(name);
  return role === "investor"
    ? n === "investor" || n.includes("investor")
    : n === "business owner" || n.includes("business owner");
};

const looksNumeric = (field: PriceBoxField) =>
  /(invest|amount|profit|return|price|percent|percentage|লাভ|বিনিয়োগ|বিনিয়োগ|টাকা|শতাংশ)/i.test(
    `${field.key} ${field.label || ""} ${field.placeholder || ""} ${field.labelBn || ""} ${field.placeholderBn || ""}`,
  );

export default function PostAdPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole: Role = searchParams.get("role") === "investor" ? "investor" : "business_owner";

  const [role, setRole] = useState<Role>(initialRole);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [subLocations, setSubLocations] = useState<SubLocation[]>([]);
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [location, setLocation] = useState("");
  const [subLocation, setSubLocation] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [priceValues, setPriceValues] = useState<Record<string, string>>({});
  const [businessStatus, setBusinessStatus] = useState<BusinessStatus>("active");
  const [busy, setBusy] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [authorized, setAuthorized] = useState(Boolean(Cookies.get("token")));
  const [error, setError] = useState("");

  useEffect(() => {
    const syncAuth = () => setAuthorized(Boolean(Cookies.get("token")));
    window.addEventListener("auth-change", syncAuth);
    return () => window.removeEventListener("auth-change", syncAuth);
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoadingMeta(true);
    Promise.all([
      fetch(`${API_BASE_URL}/api/categories`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/api/categories/sub`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/api/locations`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/api/locations/sub`).then((r) => r.json()),
    ])
      .then(([c, sc, l, sl]) => {
        if (!mounted) return;
        setCategories(Array.isArray(c?.data) ? c.data : []);
        setSubCategories(Array.isArray(sc?.data) ? sc.data : []);
        setLocations(Array.isArray(l?.data) ? l.data : []);
        setSubLocations(Array.isArray(sl?.data) ? sl.data : []);
      })
      .catch(() => setError("Unable to load categories and locations. / ক্যাটাগরি ও লোকেশন লোড করা যায়নি।"))
      .finally(() => mounted && setLoadingMeta(false));
    return () => { mounted = false; };
  }, []);

  const roleCategory = useMemo(
    () => categories.find((item) => matchesRole(item.name, role)),
    [categories, role],
  );

  const roleSubCategory = useMemo(() => {
    if (!roleCategory) return undefined;
    return subCategories.find((item) => {
      const parent = item.category;
      const belongs = typeof parent === "object"
        ? parent?._id === roleCategory._id || parent?.name === roleCategory.name
        : parent === roleCategory._id || parent === roleCategory.name;
      return belongs && matchesRole(item.name, role);
    });
  }, [roleCategory, role, subCategories]);

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

  const selectedSub = useMemo(
    () => subCategories.find((item) => item.name === subCategory),
    [subCategories, subCategory],
  );

  const priceBoxEnabled = Boolean(selectedSub?.priceBoxShow);
  const priceFields = useMemo(
    () => [...(selectedSub?.priceBoxFields || [])].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [selectedSub],
  );

  const applyRoleDefaults = (nextRole: Role) => {
    const cat = categories.find((item) => matchesRole(item.name, nextRole));
    if (!cat) return;
    setCategory(cat.name);

    const sub = subCategories.find((item) => {
      const parent = item.category;
      const belongs = typeof parent === "object"
        ? parent?._id === cat._id || parent?.name === cat.name
        : parent === cat._id || parent === cat.name;
      return belongs && matchesRole(item.name, nextRole);
    });
    setSubCategory(sub?.name || "");
    setPriceValues({});
  };

  useEffect(() => {
    if (categories.length && subCategories.length) applyRoleDefaults(initialRole);
    // Initial role is intentionally applied only after metadata is loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length, subCategories.length]);

  const changeRole = (nextRole: Role) => {
    setRole(nextRole);
    setError("");
    applyRoleDefaults(nextRole);
  };

  const changeSubCategory = (value: string) => {
    setSubCategory(value);
    setPriceValues({});
  };

  const changePriceValue = (key: string, value: string) => {
    setPriceValues((current) => ({ ...current, [key]: value }));
  };

  const onImage = (file: File | null) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  };

  const cancelPost = () => {
    window.location.href = INVESTMENT_HOME;
  };

  const validatePriceBox = () => {
    if (!priceBoxEnabled) return true;
    for (const field of priceFields) {
      if (field.required && !String(priceValues[field.key] || "").trim()) {
        const label = field.label || field.labelBn || field.placeholder || field.key;
        setError(`Please fill: ${label} / অনুগ্রহ করে পূরণ করুন: ${label}`);
        return false;
      }
      if (looksNumeric(field) && String(priceValues[field.key] || "").trim()) {
        const number = Number(priceValues[field.key]);
        if (!Number.isFinite(number) || number < 0) {
          setError(`Please enter a valid value for ${field.label || field.key}.`);
          return false;
        }
      }
    }
    return true;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!authorized) return;
    if (!category || !subCategory || !location || !subLocation) {
      setError("Please select category, subcategory, district and area. / ক্যাটাগরি, সাবক্যাটাগরি, জেলা ও এলাকা নির্বাচন করুন।");
      return;
    }
    if (!phone.trim() || !headline.trim() || !description.trim()) {
      setError("Phone, headline and description are required. / ফোন, শিরোনাম ও বিবরণ আবশ্যক।");
      return;
    }
    if (!image) {
      setError("Please add a post image. / পোস্টের ছবি যোগ করুন।");
      return;
    }
    if (!validatePriceBox()) return;

    const values = Object.fromEntries(
      Object.entries(priceValues).filter(([, value]) => String(value).trim() !== ""),
    );

    const findKnown = (patterns: RegExp[]) => {
      const field = priceFields.find((item) => patterns.some((pattern) => pattern.test(`${item.key} ${item.label || ""} ${item.labelBn || ""}`)));
      return field ? values[field.key] : undefined;
    };
    const minInvestment = findKnown([/min.*invest/i, /lowest.*invest/i, /সর্বনিম্ন.*বিনিয়োগ/i, /সর্বনিম্ন.*বিনিয়োগ/i]);
    const maxInvestment = findKnown([/max.*invest/i, /highest.*invest/i, /সর্বোচ্চ.*বিনিয়োগ/i, /সর্বোচ্চ.*বিনিয়োগ/i]);
    const expectedProfit = findKnown([/profit/i, /return/i, /expected/i, /লাভ/i, /রিটার্ন/i]);

    setBusy(true);
    try {
      const form = new FormData();
      form.append("headline", headline.trim());
      form.append("description", description.trim());
      form.append("phone", phone.trim());
      if (altPhone.trim()) form.append("additionalPhones", JSON.stringify([{ number: altPhone.trim(), types: ["call"] }]));
      form.append("category", category);
      form.append("subCategory", subCategory);
      form.append("location", location);
      form.append("subLocation", subLocation);
      form.append("postRole", role);
      form.append("priceBoxValues", JSON.stringify(values));
      form.append("features", JSON.stringify({
        priceBoxEnabled,
        priceBoxName: selectedSub?.priceBoxName || "",
        priceBoxValues: values,
        priceBoxFields: priceFields,
      }));
      if (minInvestment !== undefined) form.append("minInvestment", minInvestment);
      if (maxInvestment !== undefined) form.append("maxInvestment", maxInvestment);
      if (expectedProfit !== undefined) form.append("expectedProfit", expectedProfit);
      if (role === "business_owner") form.append("businessStatus", businessStatus);
      form.append("investmentReturnType", role === "investor" ? "expected" : "return");
      form.append("images", image);

      const token = Cookies.get("token");
      const response = await fetch(`${API_BASE_URL}/api/ads`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
        body: form,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Post failed.");

      window.dispatchEvent(new Event("refresh-ads"));
      window.location.href = "/dashboard?post=success";
    } catch (submissionError: any) {
      setError(submissionError?.message || "Unable to publish the post.");
    } finally {
      setBusy(false);
    }
  };

  // The existing DashboardLayout owns the login/mobile-entry mechanism. Keep this
  // route transparent until authentication is completed so that mechanism remains untouched.
  if (!authorized) {
    return <main className="pointer-events-none fixed inset-0 z-[10000]" aria-hidden="true" />;
  }

  return (
    <main className="fixed inset-0 z-[10000] overflow-y-auto bg-slate-100/95 px-3 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-4 md:px-7">
          <div className="flex items-center gap-3">
            <button type="button" onClick={cancelPost} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold text-slate-950 md:text-xl">Create Investment Post</h1>
              <p className="text-xs text-slate-500">Investor & Business Owner marketplace</p>
            </div>
          </div>
          <button type="button" onClick={cancelPost} className="rounded-full border border-slate-200 p-2 hover:bg-slate-50" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 md:px-7">
          <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> Free investment posts are sent to admin review before publication.</div>
        </div>

        <form onSubmit={submit} className="p-4 md:p-7">
          {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>}

          <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 md:p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-800"><UserRound className="h-4 w-4" /> What are you looking for?</div>
            <div className="grid gap-3 md:grid-cols-2">
              <button type="button" onClick={() => changeRole("investor")} className={`rounded-xl border p-4 text-left transition ${role === "investor" ? "border-violet-600 bg-violet-600 text-white shadow-lg" : "border-slate-200 bg-white text-slate-800 hover:border-violet-300"}`}>
                <div className="text-sm font-extrabold">I Want To Invest</div>
                <div className={`mt-1 text-xs ${role === "investor" ? "text-violet-100" : "text-slate-500"}`}>Investor category will be selected automatically.</div>
              </button>
              <button type="button" onClick={() => changeRole("business_owner")} className={`rounded-xl border p-4 text-left transition ${role === "business_owner" ? "border-emerald-700 bg-emerald-700 text-white shadow-lg" : "border-slate-200 bg-white text-slate-800 hover:border-emerald-300"}`}>
                <div className="text-sm font-extrabold">I Need Money</div>
                <div className={`mt-1 text-xs ${role === "business_owner" ? "text-emerald-100" : "text-slate-500"}`}>Business Owner category will be selected automatically.</div>
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Category</div>
                <div className="mt-1 text-sm font-extrabold text-slate-900">{roleCategory?.name || roleLabel(role)}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Subcategory</div>
                <div className="mt-1 text-sm font-extrabold text-slate-900">{roleSubCategory?.name || roleLabel(role)}</div>
              </div>
            </div>
          </section>

          <section className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">Location / জেলা</label>
              <select value={location} onChange={(e) => { setLocation(e.target.value); setSubLocation(""); }} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-600">
                <option value="">Select district / জেলা নির্বাচন করুন</option>
                {locations.map((item) => <option key={item._id} value={item.name}>{item.name}{item.locationNameBn ? ` — ${item.locationNameBn}` : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">Area / এলাকা</label>
              <select value={subLocation} onChange={(e) => setSubLocation(e.target.value)} disabled={!location} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none disabled:bg-slate-100 focus:border-emerald-600">
                <option value="">Select area / এলাকা নির্বাচন করুন</option>
                {visibleSubLocations.map((item) => <option key={item._id} value={item.name}>{item.name}{item.subLocationNameBn ? ` — ${item.subLocationNameBn}` : ""}</option>)}
              </select>
            </div>
          </section>

          <section className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-bold text-slate-700">Post image / পোস্টের ছবি</label>
              <label className="flex min-h-44 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                {imagePreview ? <div className="relative h-56 w-full"><img src={imagePreview} alt="Post preview" className="h-full w-full object-cover" /><button type="button" onClick={(event) => { event.preventDefault(); onImage(null); }} className="absolute right-3 top-3 rounded-full bg-white p-2 shadow"><X className="h-4 w-4" /></button></div> : <div className="text-center text-slate-400"><ImagePlus className="mx-auto h-8 w-8" /><p className="mt-2 text-xs font-semibold">Add your business / investment image</p></div>}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onImage(e.target.files?.[0] || null)} />
              </label>
            </div>

            <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder={role === "investor" ? "Investment headline / বিনিয়োগের শিরোনাম" : "Business funding headline / ব্যবসার অর্থায়নের শিরোনাম"} className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600 md:col-span-2" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the investment or business opportunity / বিস্তারিত লিখুন" className="min-h-32 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600 md:col-span-2" />

            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Primary phone / প্রধান ফোন নম্বর" className="w-full rounded-xl border border-slate-300 py-3 pl-9 pr-3 text-sm outline-none focus:border-emerald-600" />
            </div>
            <input value={altPhone} onChange={(e) => setAltPhone(e.target.value)} placeholder="Alternative phone / বিকল্প নম্বর" className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600" />
          </section>

          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><SlidersHorizontal className="h-4 w-4" /> {selectedSub?.priceBoxName || "Post Details"}</div>
                <p className="mt-1 text-xs text-slate-500">These fields are controlled by the admin category/subcategory settings.</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${priceBoxEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{priceBoxEnabled ? "Price box enabled" : "No price box"}</span>
            </div>

            {priceBoxEnabled && priceFields.length > 0 ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {priceFields.map((field) => {
                  const label = field.label || field.labelBn || field.key;
                  const placeholder = field.label && field.placeholder ? field.placeholder : field.placeholder || field.placeholderBn || label;
                  return <label key={field.key} className="block"><span className="mb-1 block text-[11px] font-bold text-slate-600">{label}{field.required ? " *" : ""}</span><input type={looksNumeric(field) ? "number" : "text"} min={looksNumeric(field) ? 0 : undefined} value={priceValues[field.key] || ""} onChange={(e) => changePriceValue(field.key, e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-600" /></label>;
                })}
              </div>
            ) : priceBoxEnabled ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">Price box is enabled, but no fields have been configured yet. / প্রাইস বক্স চালু আছে, কিন্তু কোনো ফিল্ড কনফিগার করা হয়নি।</div>
            ) : (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">No investment amount fields are required for this subcategory. / এই সাবক্যাটাগরির জন্য কোনো বিনিয়োগের মূল্য ফিল্ড লাগবে না।</div>
            )}
          </section>

          {role === "business_owner" && (
            <section className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5">
              <label className="mb-1.5 block text-xs font-bold text-slate-700">Business status / ব্যবসার অবস্থা</label>
              <select value={businessStatus} onChange={(e) => setBusinessStatus(e.target.value as BusinessStatus)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm md:max-w-md">
                <option value="active">Running / Active</option>
                <option value="inactive">Closed / Inactive</option>
              </select>
            </section>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
            <button type="button" onClick={cancelPost} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={busy || loadingMeta} className="rounded-xl bg-slate-950 px-7 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-50">{busy ? "Submitting…" : "Submit Post"}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
