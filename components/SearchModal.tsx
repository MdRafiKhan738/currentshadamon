"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { X, ArrowLeft, Search, Loader2, ChevronRight } from 'lucide-react';
import { useLanguage } from '../app/context/LanguageContext';
import { API_BASE_URL } from '../utils/apiConfig';
import { getImageUrl } from '../utils/imageUrl';
import FilterModal, { FilterState } from './FilterModal';

interface SubItem {
    _id: string;
    name: string;
    subCategoryNameBn?: string;
    subLocationNameBn?: string;
    order?: number;
    priority?: number;
}

interface CategoryItem {
    _id: string;
    name: string;
    categoryNameBn?: string;
    subcategories: SubItem[];
}

interface LocationItem {
    _id: string;
    name: string;
    locationNameBn?: string;
    subLocations: SubItem[];
}

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSearch: (query: string) => void;
    onSelectAd: (ad: any) => void;
    categories: CategoryItem[];
    locations: LocationItem[];
}

export default function SearchModal({
    isOpen,
    onClose,
    onSearch,
    onSelectAd,
    categories,
    locations
}: SearchModalProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { language } = useLanguage();
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const showInlineFilters = searchQuery.trim().length === 0;

    const getFilterQueryValue = (longKey: string, shortKey: string) => {
        return searchParams.get(longKey) || searchParams.get(shortKey);
    };

    const getFiltersFromSearchParams = (): FilterState => {
        const urlCategory = getFilterQueryValue('category', 'c');
        const urlSubCategory = getFilterQueryValue('subCategory', 'sc');
        const urlLocation = getFilterQueryValue('location', 'l');
        const urlSubLocation = getFilterQueryValue('subLocation', 'sl');
        const urlSearch = searchParams.get('search');

        return {
            category: urlCategory || "",
            subCategory: urlSubCategory || "",
            location: urlLocation || "",
            subLocation: urlSubLocation || "",
            search: urlSearch || "",
            promoteTag: searchParams.get('promoteTag') || "All",
            sort: searchParams.get('sort') || "newest"
        };
    };

    const [filters, setFilters] = useState<FilterState>(() => getFiltersFromSearchParams());

    const translate = (en: string, bn: string) => language === 'bn' ? bn : en;

    const syncFiltersToUrl = (nextFilters: FilterState, nextSearch?: string) => {
        const params = new URLSearchParams(searchParams.toString());
        const finalSearch = (nextSearch ?? nextFilters.search ?? "").trim();

        if (nextFilters.category) params.set('category', nextFilters.category); else params.delete('category');
        if (nextFilters.subCategory) params.set('subCategory', nextFilters.subCategory); else params.delete('subCategory');
        if (nextFilters.location) params.set('location', nextFilters.location); else params.delete('location');
        if (nextFilters.subLocation) params.set('subLocation', nextFilters.subLocation); else params.delete('subLocation');
        if (nextFilters.promoteTag && nextFilters.promoteTag !== 'All') params.set('promoteTag', nextFilters.promoteTag); else params.delete('promoteTag');
        if (nextFilters.sort && nextFilters.sort !== 'newest') params.set('sort', nextFilters.sort); else params.delete('sort');
        if (finalSearch) params.set('search', finalSearch); else params.delete('search');

        const queryString = params.toString();
        router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    };

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            const currentFilters = getFiltersFromSearchParams();
            setFilters(currentFilters);
            setSearchQuery(currentFilters.search || "");
        } else {
            setSearchQuery("");
            setSuggestions([]);
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (searchQuery.trim().length >= 2) {
                setLoading(true);
                try {
                    const params = new URLSearchParams();
                    params.set('search', searchQuery.trim());
                    params.set('limit', '10');
                    if (filters.category) params.set('category', filters.category);
                    if (filters.subCategory) params.set('subCategory', filters.subCategory);
                    if (filters.location) params.set('location', filters.location);
                    if (filters.subLocation) params.set('subLocation', filters.subLocation);
                    if (filters.promoteTag && filters.promoteTag !== 'All') params.set('promoteTag', filters.promoteTag);
                    if (filters.sort) params.set('sort', filters.sort);

                    const res = await fetch(`${API_BASE_URL}/api/ads/public/all?${params.toString()}`);
                    const data = await res.json();
                    if (data.success) {
                        setSuggestions(data.data);
                    }
                } catch (err) {
                    console.error("Suggestion fetch error:", err);
                } finally {
                    setLoading(false);
                }
            } else {
                setSuggestions([]);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, filters]);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            const nextFilters = { ...filters, search: searchQuery.trim() };
            setFilters(nextFilters);
            syncFiltersToUrl(nextFilters, searchQuery.trim());
            onSearch(searchQuery);
            onClose();
        }
    };

    const handleApplyInlineFilters = (newFilters: FilterState) => {
        const currentSearch = searchQuery.trim();
        const nextFilters: FilterState = {
            ...newFilters,
            search: currentSearch
        };

        setFilters(nextFilters);
        syncFiltersToUrl(nextFilters, currentSearch);

        if (currentSearch) {
            onSearch(currentSearch);
        }

        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-20">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-[565px] rounded-t-lg rounded-b-none overflow-hidden flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-2xl h-[calc(100vh-80px)] font-sans">

                {/* Header */}
                <div className="flex items-center justify-between p-3 px-4 border-b border-slate-100 bg-white shrink-0">
                    <div className="flex items-center gap-0">
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center text-black hover:bg-slate-50 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
                        </button>
                        <h2 className="text-[17px] text-black font-medium">{translate("Search", "সার্চ")}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-50 rounded-full">
                        <X className="w-6 h-6 text-black" />
                    </button>
                </div>

                {/* Search Input Area */}
                <div className="p-2 border-b border-slate-50 bg-white">
                    <div className="flex bg-[#EDF2F7] rounded overflow-hidden">
                        <div className="flex-1 relative flex items-center">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder={translate("What are you looking for?", "আপনি কি খুঁজছেন?")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="flex-1 bg-transparent px-4 py-2.5 pr-10 outline-none text-sm text-black placeholder-slate-400"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2 p-1 text-slate-400 hover:text-black"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={handleSearch}
                            className="bg-[#1A202C] text-white px-3.5 py-3 text-xs hover:bg-slate-800 transition-colors tracking-wider flex items-center gap-0 sm:gap-2 shrink-0 whitespace-nowrap"
                        >
                            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="hidden sm:block w-3.5 h-3.5" />}
                            <span>{translate("Search", "সার্চ")}</span>
                        </button>
                    </div>

                    {showInlineFilters && (
                        <div className="mt-2">
                            <FilterModal
                                mode="inline"
                                isOpen={isOpen}
                                onClose={() => { }}
                                onApply={handleApplyInlineFilters}
                                initialFilters={{ ...filters, search: searchQuery.trim() }}
                                categories={categories}
                                locations={locations}
                            />
                        </div>
                    )}

                </div>

                {/* Suggestions / Results Area */}
                <div className="flex-1 overflow-y-auto bg-slate-50">
                    {suggestions.length > 0 ? (
                        <div className="divide-y divide-slate-100 bg-white">
                            {suggestions.map((ad) => (
                                <div
                                    key={ad._id}
                                    className="p-4 hover:bg-slate-50 cursor-pointer flex items-center gap-4 group transition-colors"
                                    onClick={async () => {
                                        // Fetch full ad details as in header search
                                        try {
                                            const res = await fetch(`${API_BASE_URL}/api/ads/public/${ad._id}`);
                                            const data = await res.json();
                                            if (data.success) {
                                                const fullAd = data.data;
                                                if (fullAd.promoteType === 'traffic' && fullAd.trafficLink) {
                                                    const directLink = fullAd.trafficLink.startsWith('http') ? fullAd.trafficLink : `https://${fullAd.trafficLink}`;
                                                    window.open(directLink, '_blank');
                                                }
                                                onSelectAd(fullAd);
                                                onClose();
                                                return;
                                            }
                                        } catch (err) {
                                            console.error("Error fetching ad detail in search modal:", err);
                                        }
                                        onSelectAd(ad);
                                        onClose();
                                    }}
                                >
                                    {ad.images && ad.images[0] ? (
                                        <div className="w-16 h-16 rounded bg-white overflow-hidden shrink-0 border border-slate-200">
                                            <img
                                                src={getImageUrl(ad.images[0])}
                                                alt=""
                                                className="w-full h-full object-contain"
                                                onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 rounded bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                            <Search className="w-6 h-6 text-slate-300" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-black truncate group-hover:text-[#0088cc]">{ad.headline}</h4>
                                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                            <span className="text-[11px] text-slate-500 uppercase tracking-wider">{ad.user?.name || ad.user?.storeName}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span className="text-[11px] text-[#0088cc] font-medium">{ad.category}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span className="text-[11px] text-slate-800 font-bold">৳ {ad.price?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0088cc]" />
                                </div>
                            ))}
                        </div>
                    ) : searchQuery.length > 0 && !loading ? (
                        <div className="p-10 text-center text-slate-500">
                            <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">{translate("No matches found", "কোনো ফলাফল পাওয়া যায়নি")}</p>
                        </div>
                    ) : !searchQuery && (
                        <div className="p-10 text-center text-slate-400">
                            <Search className="w-10 h-10 mx-auto mb-3 opacity-10" />
                            <p className="text-sm">{translate("Type to search ads...", "বিজ্ঞাপন খুঁজতে লিখুন...")}</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
