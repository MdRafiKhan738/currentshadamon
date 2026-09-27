"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  ArrowLeft,
  ChevronRight,
  Loader2,
  Search,
  Check,
} from "lucide-react";
import Select, { type SingleValue } from "react-select";
import { useLanguage } from "../app/context/LanguageContext";
import { API_BASE_URL } from "../utils/apiConfig";
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters: FilterState;
  categories: CategoryItem[];
  locations: LocationItem[];
  mode?: "modal" | "inline";
  containerClassName?: string;
}

export interface FilterState {
  category: string;
  subCategory: string;
  location: string;
  subLocation: string;
  promoteTag: string;
  sort: string;
  search?: string;
}

interface SubLocationOption {
  value: string;
  label: string;
}

interface SubLocationItem {
  _id: string;
  name: string;
  subLocationNameBn?: string;
  order?: number;
  priority?: number;
}

interface LocationItem {
  _id: string;
  name: string;
  locationNameBn?: string;
  subLocations?: SubLocationItem[];
}

interface SubCategoryItem {
  _id: string;
  name: string;
  subCategoryNameBn?: string;
}

interface CategoryItem {
  _id: string;
  name: string;
  categoryNameBn?: string;
  subcategories?: SubCategoryItem[];
}

interface AdItem {
  location?: string;
  subLocation?: string;
  category?: string;
  subCategory?: string;
}

interface PremierData {
  labels?: Array<{
    _id: string;
    name: string;
  }>;
}

export default function FilterModal({
  isOpen,
  onClose,
  onApply,
  initialFilters,
  categories,
  locations,
  mode = "modal",
  containerClassName,
}: FilterModalProps) {
  const { language } = useLanguage();
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [adCount, setAdCount] = useState<number>(0);
  const [loadingCount, setLoadingCount] = useState(false);

  const [view, setView] = useState<
    "main" | "location" | "location-sub" | "category" | "category-sub"
  >("main");
  const [searchQuery, setSearchQuery] = useState("");
  const [tempLocation, setTempLocation] = useState<string>("");
  const [tempCategory, setTempCategory] = useState<string>("");
  const [selectedSubLocationOption, setSelectedSubLocationOption] =
    useState<SubLocationOption | null>(null);

  const [allAds, setAllAds] = useState<AdItem[]>([]);
  const [premierData, setPremierData] = useState<PremierData | null>(null);

  useEffect(() => {
    const fetchPremier = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/premier-opportunity`);
        const data = await res.json();
        if (data.success) {
          setPremierData(data.data);
        }
      } catch (err) {
        console.error("Error fetching premier opportunities:", err);
      }
    };
    fetchPremier();
  }, []);

  useEffect(() => {
    const fetchAllAds = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/ads/public/all`);
        const data = await res.json();
        if (data.success) {
          setAllAds(data.data);
        }
      } catch (err) {
        console.error("Error fetching all ads for counts:", err);
      }
    };
    fetchAllAds();
  }, []);

  // Effect to handle direct view opening from external events
  useEffect(() => {
    const handleOpenView = (e: Event) => {
      const customEvent = e as CustomEvent<{
        view?:
          | "main"
          | "location"
          | "location-sub"
          | "category"
          | "category-sub";
      }>;
      if (isOpen && customEvent.detail?.view) {
        setView(customEvent.detail.view);
      }
    };
    window.addEventListener("open-filter-view", handleOpenView);
    return () => window.removeEventListener("open-filter-view", handleOpenView);
  }, [isOpen]);

  // Reset filters when modal opens with initialFilters
  useEffect(() => {
    if (isOpen) {
      setFilters(initialFilters);
      // Don't reset view to main here if we want to support direct opening
    }
  }, [isOpen, initialFilters]);

  const fetchCount = useCallback(async (currentFilters: FilterState) => {
    setLoadingCount(true);
    try {
      const params = new URLSearchParams();
      if (currentFilters.category)
        params.append("category", currentFilters.category);
      if (currentFilters.subCategory)
        params.append("subCategory", currentFilters.subCategory);
      if (currentFilters.location)
        params.append("location", currentFilters.location);
      if (currentFilters.subLocation)
        params.append("subLocation", currentFilters.subLocation);
      if (currentFilters.promoteTag && currentFilters.promoteTag !== "All")
        params.append("promoteTag", currentFilters.promoteTag);

      const res = await fetch(
        `${API_BASE_URL}/api/ads/public/count?${params.toString()}`,
      );
      const data = await res.json();
      if (data.success) {
        setAdCount(data.count);
      }
    } catch (error) {
      console.error("Error fetching count:", error);
    } finally {
      setLoadingCount(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCount(filters);
    }
  }, [filters, isOpen, fetchCount]);

  const handleReset = () => {
    const resetFilters: FilterState = {
      category: "",
      subCategory: "",
      location: "",
      subLocation: "",
      promoteTag: "All",
      sort: "newest",
    };
    setFilters(resetFilters);
  };

  const translate = (en: string, bn: string) => (language === "bn" ? bn : en);

  const hasBanglaChars = useCallback(
    (value: string) => /[\u0980-\u09FF]/.test(value),
    [],
  );

  const getLocalizedAreaName = useCallback(
    (rawName: string, rawNameBn?: string) => {
      const providedBn = String(rawNameBn || "").trim();
      if (language === "bn" && providedBn) {
        return providedBn;
      }

      const name = String(rawName || "").trim();
      if (!name) return "";

      const match = name.match(/^(.+?)\s*\((.+)\)\s*$/);
      if (!match) return name;

      const first = match[1].trim();
      const second = match[2].trim();

      const firstIsBn = hasBanglaChars(first);
      const secondIsBn = hasBanglaChars(second);

      if (language === "bn") {
        if (firstIsBn && !secondIsBn) return first;
        if (secondIsBn && !firstIsBn) return second;
        return firstIsBn ? first : second;
      }

      if (!firstIsBn && secondIsBn) return first;
      if (!secondIsBn && firstIsBn) return second;
      return firstIsBn ? second : first;
    },
    [hasBanglaChars, language],
  );

  const getPriorityValue = (item: SubLocationItem) => {
    const priority = Number(item?.priority);
    return Number.isFinite(priority) ? priority : Number.MAX_SAFE_INTEGER;
  };

  const getOrderValue = (item: SubLocationItem) => {
    const order = Number(item?.order);
    return Number.isFinite(order) ? order : Number.MAX_SAFE_INTEGER;
  };

  const selectedLocationSubLocations = useMemo(() => {
    const subLocations =
      locations.find((l) => l.name === tempLocation)?.subLocations || [];
    return [...subLocations].sort((a, b) => {
      const priorityDiff = getPriorityValue(a) - getPriorityValue(b);
      if (priorityDiff !== 0) return priorityDiff;

      const orderDiff = getOrderValue(a) - getOrderValue(b);
      if (orderDiff !== 0) return orderDiff;

      return String(a?.name || "").localeCompare(String(b?.name || ""));
    });
  }, [locations, tempLocation]);

  const subLocationCountMap = useMemo(() => {
    const countMap = new Map<string, number>();
    allAds.forEach((ad) => {
      if (ad.location === tempLocation && ad.subLocation) {
        const current = countMap.get(ad.subLocation) || 0;
        countMap.set(ad.subLocation, current + 1);
      }
    });
    return countMap;
  }, [allAds, tempLocation]);

  const topPrioritySubLocations = selectedLocationSubLocations.slice(0, 5);

  const subLocationOptions = useMemo(
    () =>
      selectedLocationSubLocations.slice(5).map((sub) => {
        const count = subLocationCountMap.get(sub.name) || 0;
        return {
          value: sub.name,
          label: `${getLocalizedAreaName(sub.name, sub.subLocationNameBn)} (${count.toLocaleString()})`,
        };
      }),
    [selectedLocationSubLocations, subLocationCountMap, getLocalizedAreaName],
  );

  const handleSelectSubLocation = (subLocationName: string) => {
    setFilters((prev) => ({
      ...prev,
      location: tempLocation,
      subLocation: subLocationName,
    }));
    setSelectedSubLocationOption(null);
    setView("main");
  };

  const selectedLocationMeta = useMemo(
    () => locations.find((l) => l.name === filters.location),
    [locations, filters.location],
  );

  const selectedSubLocationMeta = useMemo(
    () =>
      selectedLocationMeta?.subLocations?.find(
        (s) => s.name === filters.subLocation,
      ),
    [selectedLocationMeta, filters.subLocation],
  );

  const tempLocationMeta = useMemo(
    () => locations.find((l) => l.name === tempLocation),
    [locations, tempLocation],
  );

  const selectedCategoryMeta = useMemo(
    () => categories.find((c) => c.name === filters.category),
    [categories, filters.category],
  );

  const selectedSubCategoryMeta = useMemo(
    () =>
      selectedCategoryMeta?.subcategories?.find(
        (s) => s.name === filters.subCategory,
      ),
    [selectedCategoryMeta, filters.subCategory],
  );

  const tempCategoryMeta = useMemo(
    () => categories.find((c) => c.name === tempCategory),
    [categories, tempCategory],
  );

  const selectedLocationLabel = filters.location
    ? getLocalizedAreaName(
        filters.location,
        selectedLocationMeta?.locationNameBn,
      )
    : "";
  const selectedSubLocationLabel = filters.subLocation
    ? getLocalizedAreaName(
        filters.subLocation,
        selectedSubLocationMeta?.subLocationNameBn,
      )
    : "";

  const selectedCategoryLabel = filters.category
    ? getLocalizedAreaName(
        filters.category,
        selectedCategoryMeta?.categoryNameBn,
      )
    : "";
  const selectedSubCategoryLabel = filters.subCategory
    ? getLocalizedAreaName(
        filters.subCategory,
        selectedSubCategoryMeta?.subCategoryNameBn,
      )
    : "";

  const isInline = mode === "inline";

  if (!isOpen) return null;

  const handleBack = () => {
    if (view === "location-sub") setView("location");
    else if (view === "category-sub") setView("category");
    else if (view !== "main") setView("main");
    else if (!isInline) onClose();
  };

  const filterModalContent = (
    <div
      className={cn(
        "relative bg-white w-full overflow-hidden flex flex-col font-sans",
        isInline
          ? "rounded-lg border border-slate-100 shadow-sm max-h-[58vh]"
          : "max-w-[565px] rounded-t-lg rounded-b-none animate-in slide-in-from-bottom-full duration-300 shadow-2xl h-[calc(100vh-80px)]",
        containerClassName,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 px-4 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center gap-0">
          {(!isInline || view !== "main") && (
            <button
              onClick={handleBack}
              className="w-8 h-8 flex items-center justify-center text-black hover:bg-slate-50 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>
          )}
          <h2 className="text-[17px] text-black font-medium">
            {translate("Filter", "ফিল্টার")}
          </h2>
        </div>
        {!isInline && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-50 rounded-full"
          >
            <X className="w-6 h-6 text-black" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {view === "main" && (
          <div className="p-4 space-y-0 pb-0">
            <p className="text-slate-900 text-[13px]">
              {translate(
                "Filter according to preference",
                "পছন্দ অনুযায়ী ফিল্টার করুন",
              )}
            </p>

            {/* Location Selector */}
            <div
              className="flex items-center justify-between py-3 border-b border-slate-400 cursor-pointer group"
              onClick={() => setView("location")}
            >
              <div className="space-y-0.5">
                <span className="text-[15px] text-[#0088cc] font-medium group-hover:underline">
                  {filters.location
                    ? `${selectedLocationLabel}${filters.subLocation ? `, ${selectedSubLocationLabel}` : ""}`
                    : translate("Select Location", "লোকেশন নির্বাচন করুন")}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-black stroke-[3]" />
            </div>

            {/* Category Selector */}
            <div
              className="flex items-center justify-between py-3 border-b border-slate-400 cursor-pointer group"
              onClick={() => setView("category")}
            >
              <div className="space-y-0.5">
                <span className="text-[15px] text-[#0088cc] font-medium group-hover:underline">
                  {filters.category
                    ? `${selectedCategoryLabel}${filters.subCategory ? `, ${selectedSubCategoryLabel}` : ""}`
                    : translate("Select Category", "ক্যাটাগরি নির্বাচন করুন")}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-black stroke-[3]" />
            </div>

            {/* Promoted Listing */}
            {/* <div className="space-y-4 pt-2">
              <h3 className="text-[14px] font-bold text-black">
                {translate("Promoted Listing", "প্রোমোটেড লিস্টিং")}
              </h3>
              <div className="flex flex-wrap gap-x-4 gap-y-3">
                <label
                  key="All"
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                      filters.promoteTag === "All"
                        ? "border-[#0088cc] bg-white"
                        : "border-slate-300 group-hover:border-slate-400",
                    )}
                  >
                    {filters.promoteTag === "All" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#0088cc]" />
                    )}
                  </div>
                  <input
                    type="radio"
                    className="hidden"
                    checked={filters.promoteTag === "All"}
                    onChange={() =>
                      setFilters({ ...filters, promoteTag: "All" })
                    }
                  />
                  <span className="text-sm text-black">
                    {translate("All", "সব")}
                  </span>
                </label>

                {/* Dynamic Labels from Premier Opportunity 
                {premierData?.labels?.map((label) => (
                  <label
                    key={label._id}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        filters.promoteTag === label.name
                          ? "border-[#0088cc] bg-white"
                          : "border-slate-300 group-hover:border-slate-400",
                      )}
                    >
                      {filters.promoteTag === label.name && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0088cc]" />
                      )}
                    </div>
                    <input
                      type="radio"
                      className="hidden"
                      checked={filters.promoteTag === label.name}
                      onChange={() =>
                        setFilters({ ...filters, promoteTag: label.name })
                      }
                    />
                    <span className="text-sm text-black">{label.name}</span>
                  </label>
                ))}
              </div>
            </div> */}

            {/* <div className="mt-2 h-px bg-slate-400 w-full" /> */}

            {/* Sort By */}
            {/* <div className="space-y-3 pt-2">
                            <h3 className="text-[14px] font-bold text-black">{translate("Sort by", "সর্ট বাই")}</h3>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-4">
                                {[
                                    { id: 'newest', en: 'Date: Newest first', bn: 'তারিখ: নতুন আগে' },
                                    { id: 'oldest', en: 'Date: Oldest first', bn: 'তারিখ: পুরাতন আগে' },
                                    { id: 'price-high', en: 'Price: Highest to Lowest', bn: 'দাম: বেশি থেকে কম' },
                                    { id: 'price-low', en: 'Price: Lowest to Highest', bn: 'দাম: কম থেকে বেশি' },
                                ].map((option) => (
                                    <label key={option.id} className="flex items-center gap-2.5 cursor-pointer group">
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                            filters.sort === option.id ? "border-[#0088cc]" : "border-slate-300"
                                        )}>
                                            {filters.sort === option.id && <div className="w-2.5 h-2.5 rounded-full bg-[#0088cc]" />}
                                        </div>
                                        <input
                                            type="radio"
                                            className="hidden"
                                            checked={filters.sort === option.id}
                                            onChange={() => setFilters({ ...filters, sort: option.id })}
                                        />
                                        <span className="text-sm text-black">{translate(option.en, option.bn)}</span>
                                    </label>
                                ))}
                            </div>
                        </div> */}
            {/* <div className="mt-3 h-px bg-slate-400 w-full" /> */}

            {/* Selected Info */}
            {/* {filters.category && (
                                <div className="pt-2 border-t border-slate-100 mt-2">
                                    <div className="flex items-center gap-1.5 text-slate-900 text-[13px] font-bold">
                                        <Plus className="w-3.5 h-3.5" strokeWidth={4} />
                                        <span>{translate("Category choice selected", "ক্যাটাগরি চয়েস করলে")}</span>
                                    </div>
                                </div>
                            )} */}
          </div>
        )}

        {view === "location" && (
          <div className="p-0">
            <div className="p-2.5 bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
              <div className="bg-white rounded-lg border border-slate-200 flex items-center px-3 py-2 gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={translate(
                    "Search for a location",
                    "লোকেশন খুঁজুন",
                  )}
                  className="flex-1 text-sm outline-none placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              <button
                onClick={() => {
                  setFilters({ ...filters, location: "", subLocation: "" });
                  setView("main");
                }}
                className="w-full flex items-center justify-between py-1.5 px-4 hover:bg-slate-50 transition-colors text-left"
              >
                <span className="text-[15px] font-medium text-[#0088cc]">
                  {translate("All Bangladesh", "পুরো বাংলাদেশ")}
                </span>
                {!filters.location && (
                  <Check className="w-5 h-5 text-[#0088cc]" />
                )}
              </button>
              {locations
                .filter((l) => {
                  const query = searchQuery.toLowerCase();
                  if (!query) return true;

                  return (
                    l.name.toLowerCase().includes(query) ||
                    (l.locationNameBn || "").toLowerCase().includes(query) ||
                    getLocalizedAreaName(l.name, l.locationNameBn)
                      .toLowerCase()
                      .includes(query)
                  );
                })
                .map((loc) => {
                  const count = allAds.filter(
                    (ad) => ad.location === loc.name,
                  ).length;
                  return (
                    <button
                      key={loc._id}
                      onClick={() => {
                        setTempLocation(loc.name);
                        setSearchQuery("");
                        setSelectedSubLocationOption(null);
                        setView("location-sub");
                      }}
                      className="w-full flex items-center justify-between py-1.5 px-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-medium text-slate-800">
                          {getLocalizedAreaName(loc.name, loc.locationNameBn)}
                        </span>
                        <span className="text-[12px] text-slate-500 font-normal">
                          ({count.toLocaleString()})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {filters.location === loc.name &&
                          !filters.subLocation && (
                            <Check className="w-4 h-4 text-[#0088cc] mr-1" />
                          )}
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {view === "location-sub" && (
          <div className="p-0">
            <div className="bg-slate-50 p-2.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {getLocalizedAreaName(
                  tempLocation,
                  tempLocationMeta?.locationNameBn,
                )}
              </h3>
              <button
                onClick={() => {
                  setFilters({
                    ...filters,
                    location: tempLocation,
                    subLocation: "",
                  });
                  setView("main");
                }}
                className="text-xs text-[#0088cc] font-bold"
              >
                {translate("Select this city", "পুরো শহর")}
              </button>
            </div>
            <div className="p-3 border-b border-slate-100 bg-white">
              <p className="text-xs font-semibold text-slate-500 mb-2">
                {translate("Top Areas", "শীর্ষ এলাকা")}
              </p>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-100 overflow-hidden">
                {topPrioritySubLocations.map((sub) => {
                  const count = subLocationCountMap.get(sub.name) || 0;
                  return (
                    <button
                      key={sub._id}
                      onClick={() => handleSelectSubLocation(sub.name)}
                      className="w-full flex items-center justify-between py-2 px-3 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] text-slate-700">
                          {getLocalizedAreaName(
                            sub.name,
                            sub.subLocationNameBn,
                          )}
                        </span>
                        <span className="text-[12px] text-slate-500 font-normal">
                          ({count.toLocaleString()})
                        </span>
                      </div>
                      {filters.location === tempLocation &&
                        filters.subLocation === sub.name && (
                          <Check className="w-5 h-5 text-[#0088cc]" />
                        )}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedLocationSubLocations.length > 5 && (
              <div className="p-3 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  {translate("Select filter options", "সিলেক্ট ফিল্টার অপশন")}
                </p>
                <Select
                  options={subLocationOptions}
                  value={selectedSubLocationOption}
                  onChange={(option: SingleValue<SubLocationOption>) => {
                    if (!option) return;
                    setSelectedSubLocationOption(option);
                    handleSelectSubLocation(option.value);
                  }}
                  placeholder={translate(
                    "Search and select area",
                    "এলাকা খুঁজে নির্বাচন করুন",
                  )}
                  isClearable
                  className="text-sm"
                  noOptionsMessage={() =>
                    translate("No area found", "কোন এলাকা পাওয়া যায়নি")
                  }
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      minHeight: "40px",
                      borderColor: state.isFocused ? "#38bdf8" : "#cbd5e1",
                      boxShadow: state.isFocused ? "0 0 0 1px #38bdf8" : "none",
                      "&:hover": { borderColor: "#94a3b8" },
                    }),
                    menu: (base) => ({ ...base, zIndex: 60 }),
                    option: (base, state) => ({
                      ...base,
                      fontSize: "14px",
                      backgroundColor: state.isFocused ? "#f8fafc" : "#fff",
                      color: "#334155",
                    }),
                  }}
                />
              </div>
            )}
          </div>
        )}

        {view === "category" && (
          <div className="p-0">
            <div className="p-2.5 bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
              <div className="bg-white rounded-lg border border-slate-200 flex items-center px-3 py-2 gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={translate(
                    "Search for a category",
                    "ক্যাটাগরি খুঁজুন",
                  )}
                  className="flex-1 text-sm outline-none placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              <button
                onClick={() => {
                  setFilters({ ...filters, category: "", subCategory: "" });
                  setView("main");
                }}
                className="w-full flex items-center justify-between py-1.5 px-4 hover:bg-slate-50 transition-colors text-left"
              >
                <span className="text-[15px] font-medium text-[#0088cc]">
                  {translate("All Categories", "সব ক্যাটাগরি")}
                </span>
                {!filters.category && (
                  <Check className="w-5 h-5 text-[#0088cc]" />
                )}
              </button>
              {categories
                .filter((c) => {
                  const query = searchQuery.toLowerCase();
                  if (!query) return true;

                  return (
                    c.name.toLowerCase().includes(query) ||
                    (c.categoryNameBn || "").toLowerCase().includes(query) ||
                    getLocalizedAreaName(c.name, c.categoryNameBn)
                      .toLowerCase()
                      .includes(query)
                  );
                })
                .map((cat) => {
                  const count = allAds.filter(
                    (ad) => ad.category === cat.name,
                  ).length;
                  return (
                    <button
                      key={cat._id}
                      onClick={() => {
                        setTempCategory(cat.name);
                        setSearchQuery("");
                        setView("category-sub");
                      }}
                      className="w-full flex items-center justify-between py-1.5 px-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-medium text-slate-800">
                          {getLocalizedAreaName(cat.name, cat.categoryNameBn)}
                        </span>
                        <span className="text-[12px] text-slate-500 font-normal">
                          ({count.toLocaleString()})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {filters.category === cat.name &&
                          !filters.subCategory && (
                            <Check className="w-4 h-4 text-[#0088cc] mr-1" />
                          )}
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {view === "category-sub" && (
          <div className="p-0">
            <div className="bg-slate-50 p-2.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {getLocalizedAreaName(
                  tempCategory,
                  tempCategoryMeta?.categoryNameBn,
                )}
              </h3>
              <button
                onClick={() => {
                  setFilters({
                    ...filters,
                    category: tempCategory,
                    subCategory: "",
                  });
                  setView("main");
                }}
                className="text-xs text-[#0088cc] font-bold"
              >
                {translate("Show all in this category", "এই ক্যাটাগরির সব")}
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {tempCategoryMeta?.subcategories?.map((sub) => {
                const count = allAds.filter(
                  (ad) =>
                    ad.category === tempCategory && ad.subCategory === sub.name,
                ).length;
                return (
                  <button
                    key={sub._id}
                    onClick={() => {
                      setFilters({
                        ...filters,
                        category: tempCategory,
                        subCategory: sub.name,
                      });
                      setView("main");
                    }}
                    className="w-full flex items-center justify-between py-1.5 px-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] text-slate-700">
                        {getLocalizedAreaName(sub.name, sub.subCategoryNameBn)}
                      </span>
                      <span className="text-[12px] text-slate-500 font-normal">
                        ({count.toLocaleString()})
                      </span>
                    </div>
                    {filters.category === tempCategory &&
                      filters.subCategory === sub.name && (
                        <Check className="w-5 h-5 text-[#0088cc]" />
                      )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Buttons */}
      {view === "main" && (
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.03)] flex flex-col min-[420px]:flex-row items-stretch min-[420px]:items-center gap-2.5 min-[420px]:justify-between shrink-0">
          <button
            onClick={handleReset}
            className="w-full min-[420px]:w-auto border border-[#00A278] text-[#00A278] px-4 min-[420px]:px-8 py-2.5 rounded-lg text-sm hover:bg-emerald-50 transition-colors"
          >
            {translate("Reset all", "রিসেট করুন")}
          </button>
          <button
            onClick={() => onApply(filters)}
            className="w-full min-[420px]:w-auto bg-[#1A202C] text-white px-4 min-[420px]:px-14 py-2.5 rounded-lg text-sm hover:bg-black transition-colors flex items-center justify-center gap-2 min-w-0 min-[420px]:min-w-[180px]"
          >
            {loadingCount ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>
                {translate(
                  `${adCount} View Posts`,
                  `${adCount.toLocaleString("bn-BD")} টি পোস্ট দেখুন`,
                )}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );

  if (isInline) {
    return filterModalContent;
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      {filterModalContent}
    </div>
  );
}
