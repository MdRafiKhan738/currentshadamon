"use client";

import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { ArrowLeft, Check, ImagePlus, Loader2, MapPin, Pencil, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../utils/apiConfig";
import LoginModal from "./LoginModal";
import { getImageUrl } from "../utils/imageUrl";

type InvestmentRole = "investor" | "business_owner";

type PriceField = {
  key: string;
  label?: string;
  labelBn?: string;
  placeholder?: string;
  placeholderBn?: string;
  inputType?: "text" | "number";
  required?: boolean;
  order?: number;
};

type SubCategory = {
  _id: string;
  name: string;
  subCategoryNameBn?: string;
  order?: number;
  status?: boolean;
  priceBoxShow?: boolean;
  priceBoxName?: string;
  priceBoxFields?: PriceField[];
};

type Category = {
  _id: string;
  name: string;
  categoryNameBn?: string;
  order?: number;
  status?: boolean;
  subcategories: SubCategory[];
};

type SubLocation = {
  _id: string;
  name: string;
  location?: string | { _id?: string };
  order?: number;
};

type Location = {
  _id: string;
  name: string;
  locationNameBn?: string;
  order?: number;
};

interface InvestmentPostFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (ad?: any) => void;
  onFailure?: () => void;
  initialMobile?: string;
  initialRole?: InvestmentRole;
  initialCategory?: string;
  initialSubCategory?: string;
}

function normalizeRole(value?: string): InvestmentRole {
  return value === "investor" ? "investor" : "business_owner";
}

function categoryRole(category?: Category | null): InvestmentRole | null {
  if (!category) return null;
  const value = String(category.name || "").trim().toLowerCase();
  if (/investor|investment/.test(value)) return "investor";
  if (/business\s*owner|business-owner|business/.test(value)) return "business_owner";
  return null;
}

function categoryMatchesRole(category: Category, role: InvestmentRole) {
  return categoryRole(category) === role;
}

export default function InvestmentPostFormModal({
  isOpen,
  onClose,
  onSuccess,
  onFailure,
  initialMobile = "",
  initialRole,
  initialCategory = "",
  initialSubCategory = "",
}: InvestmentPostFormModalProps) {
  const [postRole, setPostRole] = useState<InvestmentRole>(normalizeRole(initialRole));
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [subLocations, setSubLocations] = useState<SubLocation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedSubLocation, setSelectedSubLocation] = useState("");
  const [businessStatus, setBusinessStatus] = useState<"active" | "new" | "closed">("active");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState(initialMobile);
  const [images, setImages] = useState<File[]>([]);
  const [priceValues, setPriceValues] = useState<Record<string, string>>({});
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showExistingAccountLogin, setShowExistingAccountLogin] = useState(false);

  const priceFields = useMemo(
    () =>
      [...(selectedSubCategory?.priceBoxFields || [])].sort(
        (a, b) => (a.order || 0) - (b.order || 0),
      ),
    [selectedSubCategory],
  );

  const hasPriceBox = Boolean(
    selectedSubCategory?.priceBoxShow && priceFields.length > 0,
  );

  const roleLabel = postRole === "investor" ? "Investor" : "Business Owner";

  const isInvestHomeEntry =
    typeof window !== "undefined" &&
    (() => {
      const params = new URLSearchParams(window.location.search);
      return params.get("source") === "invest-home" || params.has("role") || params.has("cat");
    })();

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const load = async () => {
      setLoadingData(true);
      try {
        const token = Cookies.get("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const [catRes, subRes, locRes, subLocRes, meRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/categories`).then((r) => r.json()),
          fetch(`${API_BASE_URL}/api/categories/sub`).then((r) => r.json()),
          fetch(`${API_BASE_URL}/api/locations`).then((r) => r.json()),
          fetch(`${API_BASE_URL}/api/locations/sub`).then((r) => r.json()),
          token
            ? fetch(`${API_BASE_URL}/api/user/me`, { headers }).then((r) => r.json())
            : Promise.resolve({ success: false }),
        ]);

        if (cancelled) return;

        const rawCategories = Array.isArray(catRes.data) ? catRes.data : [];
        const rawSubs = Array.isArray(subRes.data) ? subRes.data : [];

        const nextCategories: Category[] = rawCategories
          .map((category: any) => ({
            ...category,
            subcategories: rawSubs
              .filter(
                (sub: any) =>
                  (sub.category?._id || sub.category) === category._id &&
                  sub.status !== false,
              )
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0)),
          }))
          .filter((category: Category) => category.status !== false)
          .sort((a: Category, b: Category) => (a.order || 0) - (b.order || 0));

        const nextLocations: Location[] = (Array.isArray(locRes.data) ? locRes.data : [])
          .filter((location: any) => location.status !== false)
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

        const nextSubLocations: SubLocation[] = (Array.isArray(subLocRes.data) ? subLocRes.data : [])
          .filter((subLocation: any) => subLocation.status !== false)
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

        setCategories(nextCategories);
        setLocations(nextLocations);
        setSubLocations(nextSubLocations);

        if (meRes?.success && meRes.data) {
          setIsAuthenticated(true);
          setUserName(meRes.data.name || "");
          if (!initialMobile && meRes.data.mobile) setPhone(meRes.data.mobile);
        } else {
          setIsAuthenticated(false);
          setUserName("");
        }

        const requestedCategory =
          initialCategory &&
          nextCategories.find(
            (item) => item._id === initialCategory || item.name === initialCategory,
          );

        const roleCategory =
          requestedCategory ||
          nextCategories.find((item) => categoryMatchesRole(item, normalizeRole(initialRole)));

        if (!roleCategory) {
          toast.error(`The ${roleLabel} category is not configured in admin yet.`);
          setSelectedCategory(null);
          setSelectedSubCategory(null);
          return;
        }

        const requestedSub =
          initialSubCategory &&
          roleCategory.subcategories.find(
            (item) => item._id === initialSubCategory || item.name === initialSubCategory,
          );

        const nextSub = requestedSub || roleCategory.subcategories[0] || null;

        setSelectedCategory(roleCategory);
        setSelectedSubCategory(nextSub);
        const detectedRole = categoryRole(roleCategory);
        if (detectedRole) setPostRole(detectedRole);
        if (!selectedLocation && meRes?.success && meRes.data?.lastPostLocation) {
          setSelectedLocation(meRes.data.lastPostLocation);
        }
        if (!selectedSubLocation && meRes?.success && meRes.data?.lastPostSubLocation) {
          setSelectedSubLocation(meRes.data.lastPostSubLocation);
        }
      } catch (error) {
        console.error("Failed to load investment post data:", error);
        toast.error("Could not load categories and locations.");
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [isOpen, initialCategory, initialSubCategory, initialMobile, initialRole]);

  useEffect(() => {
    if (!selectedSubCategory) {
      setPriceValues({});
      return;
    }

    const next: Record<string, string> = {};
    for (const field of selectedSubCategory.priceBoxFields || []) {
      next[field.key] = "";
    }
    setPriceValues(next);
  }, [selectedSubCategory?._id]);

  useEffect(() => {
    if (!isOpen) {
      setShowCategoryPicker(false);
      setHeadline("");
      setDescription("");
      setImages([]);
      setPriceValues({});
      setSelectedSubLocation("");
      setBusinessStatus("active");
      setPassword("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectSubCategory = (category: Category, subCategory: SubCategory) => {
    setSelectedCategory(category);
    setSelectedSubCategory(subCategory);
    const detectedRole = categoryRole(category);
    if (detectedRole) setPostRole(detectedRole);
    setShowCategoryPicker(false);
    setPriceValues({});
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setImages((previous) => [...previous, ...files].slice(0, 5));
    event.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async () => {
    const cleanPhone = phone.replace(/\s+/g, "").trim();

    if (!selectedCategory || !selectedSubCategory) {
      toast.error(`Please configure the ${roleLabel} category in admin first.`);
      return;
    }
    if (!selectedLocation) {
      toast.error("Please select your location.");
      return;
    }
    if (!selectedSubLocation) {
      toast.error("Please select your sublocation.");
      return;
    }
    if (!headline.trim()) {
      toast.error("Please enter a headline.");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a description.");
      return;
    }
    if (!/^01\d{9}$/.test(cleanPhone)) {
      toast.error("Please enter a valid 11-digit Bangladesh mobile number.");
      return;
    }

    for (const field of priceFields) {
      if (field.required && !String(priceValues[field.key] || "").trim()) {
        toast.error(`Please fill ${field.label || field.key}.`);
        return;
      }
    }

    setSubmitting(true);

    try {
      let token = Cookies.get("token") || "";

      if (!isAuthenticated) {
        const checkResponse = await fetch(API_BASE_URL + "/api/user/check-mobile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: cleanPhone }),
        });
        const checkData = await checkResponse.json().catch(() => ({}));

        if (!userName.trim()) throw new Error("Please enter your name.");
        if (!password.trim()) throw new Error("Please enter a password for your account.");

        const authPayload = {
          mobile: cleanPhone,
          password,
          name: userName.trim(),
          storeName: userName.trim(),
          category: selectedCategory.name,
          subCategory: selectedSubCategory.name,
          actionType: "call",
        };

        const authResponse = await fetch(
          API_BASE_URL + (checkData?.exists ? "/api/user/login" : "/api/user/register"),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(authPayload),
          },
        );
        const authData = await authResponse.json().catch(() => ({}));

        if (!authResponse.ok || !authData.token) {
          throw new Error(authData.message || "Authentication failed");
        }

        token = authData.token;
        Cookies.set("token", token, { expires: 7, sameSite: "lax" });
        setIsAuthenticated(true);
        window.dispatchEvent(new Event("auth-change"));
      }

      if (token && userName.trim()) {
        const profile = new FormData();
        profile.append("name", userName.trim());
        profile.append("storeName", userName.trim());
        await fetch(API_BASE_URL + "/api/user/update", {
          method: "PUT",
          headers: { Authorization: "Bearer " + token },
          body: profile,
        });
      }

      const formData = new FormData();
      formData.append("headline", headline.trim());
      formData.append("description", description.trim());
      formData.append("category", selectedCategory.name);
      formData.append("subCategory", selectedSubCategory.name);
      formData.append("location", selectedLocation);
      formData.append("subLocation", selectedSubLocation);
      formData.append("phone", cleanPhone);
      formData.append("name", userName.trim());
      formData.append("hidePhone", "false");
      formData.append("phoneTypes", JSON.stringify(["call"]));
      formData.append("additionalPhones", JSON.stringify([]));
      formData.append("postRole", postRole);
      if (postRole === "business_owner") formData.append("businessStatus", businessStatus);
      formData.append(
        "investmentReturnType",
        postRole === "investor" ? "expected" : "return",
      );
      formData.append("priceBoxValues", JSON.stringify(priceValues));
      formData.append("priceBoxFields", JSON.stringify(priceFields));
      formData.append(
        "features",
        JSON.stringify({
          priceBoxValues: priceValues,
          priceBoxFields: priceFields,
          priceBoxEnabled: hasPriceBox,
          priceBoxName: hasPriceBox
            ? selectedSubCategory.priceBoxName || "Investment Details"
            : "",
        }),
      );

      for (const image of images) {
        formData.append("images", image);
      }

      const response = await fetch(`${API_BASE_URL}/api/ads`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Could not submit your post.");
        onFailure?.();
        return;
      }

      if (data.token) {
        Cookies.set("token", data.token, { expires: 7, sameSite: "lax" });
      }

      window.dispatchEvent(new Event("auth-change"));
      window.dispatchEvent(new Event("refresh-ads"));

      toast.success(
        "Post submitted. It will appear publicly after admin approval.",
      );

      onSuccess?.(data.data);
    } catch (error) {
      console.error("Investment post submission failed:", error);
      toast.error("Could not submit your post. Please try again.");
      onFailure?.();
    } finally {
      setSubmitting(false);
    }
  };

  const previewImage = images[0] ? URL.createObjectURL(images[0]) : "";

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm">
      <div className="relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Post
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-black"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loadingData ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Post as
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-base font-bold text-slate-900">
                    <span>{roleLabel}</span>
                    {postRole === "business_owner" ? (
                      <select
                        value={businessStatus}
                        onChange={(event) => setBusinessStatus(event.target.value as "active" | "new" | "closed")}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 outline-none"
                      >
                        <option value="active">Active Business</option>
                        <option value="new">New Business</option>
                        <option value="closed">Close Business</option>
                      </select>
                    ) : (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                        Looking to Invest
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <input
                      value={userName}
                      onChange={(event) => setUserName(event.target.value)}
                      placeholder="Your name"
                      className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-slate-400"
                      required
                    />
                  </div>
                  {!isAuthenticated ? (
                    <div className="mt-2">
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Password (used to log in again)"
                        className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-slate-400"
                        required
                      />
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <select
                      value={selectedLocation}
                      onChange={(event) => {
                        setSelectedLocation(event.target.value);
                        setSelectedSubLocation("");
                      }}
                      className="max-w-[150px] bg-transparent font-semibold outline-none"
                      required
                    >
                      <option value="">Select location *</option>
                      {locations.map((location) => (
                        <option key={location._id} value={location.name}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <select
                    value={selectedSubLocation}
                    onChange={(event) => setSelectedSubLocation(event.target.value)}
                    className="max-w-[150px] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 outline-none"
                    required
                    disabled={!selectedLocation}
                  >
                    <option value="">Select sublocation *</option>
                    {subLocations
                      .filter((item) => {
                        const parent = typeof item.location === "object" ? item.location?._id : item.location;
                        const selected = locations.find((location) => location.name === selectedLocation);
                        return !parent || parent === selected?._id;
                      })
                      .map((item) => (
                        <option key={item._id} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Category
                    </div>
                    <div className="truncate text-sm font-bold text-slate-900">
                      {selectedCategory?.name || "Not configured"}
                      {selectedSubCategory ? (
                        <span className="font-normal text-slate-500">
                          {" / "}
                          {selectedSubCategory.name}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCategoryPicker((value) => !value)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Change
                  </button>
                </div>

                {showCategoryPicker && (
                  <div className="grid gap-2 border-b border-slate-100 bg-slate-50 p-3 sm:grid-cols-2">
                    {categories.map((category) => (
                      <div
                        key={category._id}
                        className="rounded-lg border border-slate-200 bg-white p-2.5"
                      >
                        <div className="mb-2 text-xs font-bold text-slate-800">
                          {category.name}
                        </div>
                        <div className="space-y-1">
                          {category.subcategories.length === 0 ? (
                            <div className="text-[11px] text-slate-400">
                              No subcategory configured
                            </div>
                          ) : (
                            category.subcategories.map((sub) => {
                              const active =
                                selectedSubCategory?._id === sub._id;
                              return (
                                <button
                                  key={sub._id}
                                  type="button"
                                  onClick={() =>
                                    handleSelectSubCategory(category, sub)
                                  }
                                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[11px] font-semibold transition ${active ? "bg-slate-900 text-white" : "hover:bg-slate-100 text-slate-700"}`}
                                >
                                  <span>{sub.name}</span>
                                  {active ? <Check className="h-3.5 w-3.5" /> : null}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-[1.05fr_1.4fr]">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <div className="relative aspect-[4/3] bg-slate-100">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Post preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
                        <ImagePlus className="h-8 w-8" />
                        <span className="text-xs font-semibold">Add photos</span>
                      </div>
                    )}
                    <label className="absolute bottom-2 right-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-md">
                      <Plus className="h-3.5 w-3.5" />
                      Add photos
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>

                  {images.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto p-2">
                      {images.map((image, index) => {
                        const src = URL.createObjectURL(image);
                        return (
                          <div key={`${image.name}-${index}`} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border">
                            <img src={src} alt="" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <input
                    value={headline}
                    onChange={(event) => setHeadline(event.target.value)}
                    placeholder={
                      postRole === "investor"
                        ? "Want to invest BDT 50 Lacs"
                        : "Want investment for my business"
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold outline-none placeholder:text-slate-300 focus:border-slate-400"
                  />
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Write a clear description about your opportunity..."
                    rows={7}
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none placeholder:text-slate-300 focus:border-slate-400"
                  />
                </div>
              </div>

              {hasPriceBox && (
                <section className="rounded-xl border border-violet-100 bg-violet-50/50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">
                        {selectedSubCategory?.priceBoxName || "Investment Details"}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        These fields come directly from the admin subcategory settings.
                      </div>
                    </div>
                    <div className="text-[10px] font-semibold text-violet-600">
                      {priceFields.length} fields
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    {priceFields.map((field) => (
                      <label key={field.key} className="rounded-lg border border-violet-100 bg-white p-2">
                        <span className="block truncate text-[10px] font-semibold text-slate-500">
                          {field.label || field.key}
                          {field.required ? <span className="text-red-500"> *</span> : null}
                        </span>
                        <input
                          type={field.inputType === "text" ? "text" : "number"}
                          value={priceValues[field.key] || ""}
                          onChange={(event) =>
                            setPriceValues((previous) => ({
                              ...previous,
                              [field.key]: event.target.value,
                            }))
                          }
                          placeholder={field.placeholder || field.label || field.key}
                          className="mt-1 w-full border-0 p-0 text-sm font-bold outline-none placeholder:font-normal placeholder:text-slate-300"
                        />
                      </label>
                    ))}
                  </div>
                </section>
              )}

              {!hasPriceBox && selectedSubCategory && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                  No investment price box is configured for <strong>{selectedSubCategory.name}</strong>. No price fields are shown.
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-2 text-xs font-bold text-slate-800">Contact number</div>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 11))}
                  inputMode="numeric"
                  placeholder="01XXXXXXXXX"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-slate-400"
                />
                <p className="mt-1.5 text-[10px] text-slate-400">
                  This number is used to create or attach your account automatically. No separate signup or OTP is required.
                </p>
              </div>
            </div>
          )}
        </div>

        {isInvestHomeEntry && !isAuthenticated ? (
          <div className="border-t border-slate-100 bg-white px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setShowExistingAccountLogin(true)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Already have an account — Login?
            </button>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="text-[11px] text-slate-500">
            Your post will go to admin review first.
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || loadingData}
            className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Posting..." : "Post"}
          </button>
        </div>
      <LoginModal
        isOpen={showExistingAccountLogin}
        onClose={() => setShowExistingAccountLogin(false)}
        initialMobile={phone}
        onSwitchToRegister={() => setShowExistingAccountLogin(false)}
        onSuccess={async () => {
          setShowExistingAccountLogin(false);
          const token = Cookies.get("token") || "";
          if (!token) return;
          try {
            const response = await fetch(API_BASE_URL + "/api/user/me", {
              headers: { Authorization: "Bearer " + token },
              cache: "no-store",
            });
            const me = await response.json().catch(() => ({}));
            if (response.ok && me?._id) {
              setIsAuthenticated(true);
              setUserName(me.name || me.storeName || userName);
              setPhone(me.mobile || phone);
            }
          } finally {
            window.dispatchEvent(new Event("auth-change"));
          }
        }}
      />
      </div>
    </div>
  );
}
