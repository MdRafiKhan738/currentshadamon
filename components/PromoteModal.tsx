"use client";

import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Target, MessageCircle, Phone, ArrowRight, Minus, Plus, TrendingUp, AlertCircle, Camera, Gift, Edit2, ChevronDown, HelpCircle, PhoneCall, Check, ArrowLeft, Triangle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../app/context/LanguageContext';
import { API_BASE_URL } from '../utils/apiConfig';
import { getImageUrl } from '../utils/imageUrl';
import Cookies from 'js-cookie';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import AdDetailsModal from './AdDetailsModal';
import InfoModal from './InfoModal';
import { INFO_CONTENT, getInfoContentForLanguage } from '@/utils/infoContent';

// Helper for class merging
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface PromoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    ad: any;
    user?: any;
}

const DIVISIONS = [
    "Dhaka", "Chattogram", "Rajshahi", "Khulna", "Barishal", "Sylhet", "Rangpur", "Mymensingh"
];

export default function PromoteModal({ isOpen, onClose, ad, user }: PromoteModalProps) {
    const { language } = useLanguage();

    // Form States
    const [promoteType, setPromoteType] = useState<'call_msg' | 'traffic'>('call_msg');
    const [isAllBangladesh, setIsAllBangladesh] = useState(true);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [durationDays, setDurationDays] = useState(1);
    const [endDate, setEndDate] = useState<string>("");
    const [amount, setAmount] = useState(500);
    const [isVerifyBadge, setIsVerifyBadge] = useState(false);
    const [isHighlight, setIsHighlight] = useState(false);
    const [highlightType, setHighlightType] = useState<'Hot Sale' | 'Discount' | 'Urgent'>('Hot Sale');
    const [trafficLink, setTrafficLink] = useState('');
    const [trafficButtonType, setTrafficButtonType] = useState('Learn More');
    const [isPostLevel, setIsPostLevel] = useState(false);
    const [showPremier, setShowPremier] = useState(false);
    const [premierSettings, setPremierSettings] = useState<any>({
        verifyBadgePrice: 500,
        verifyBadgeDuration: 365,
        highlightPostPrice: 600,
        labels: [],
        freeAdCredits: []
    });
    const [selectedLabels, setSelectedLabels] = useState<any[]>([]);
    const [currentPlan, setCurrentPlan] = useState<any>(null);
    const [minAmount, setMinAmount] = useState(100);
    const [maxAmount, setMaxAmount] = useState(5000);
    const [sliderStep, setSliderStep] = useState(50); // Step for slider
    const [showManualPayment, setShowManualPayment] = useState(false);
    const [showHelpline, setShowHelpline] = useState(false);
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [activeSection, setActiveSection] = useState<'promoteType' | 'location' | null>(null);
    const [selectedDetailAd, setSelectedDetailAd] = useState<any>(null);
    const [userAdCount, setUserAdCount] = useState<number | null>(null);
    const [appliedOfferId, setAppliedOfferId] = useState<string | null>(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [trafficLinkError, setTrafficLinkError] = useState(false);

    // Info Modal States
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTnC, setShowTnC] = useState(false);
    const [showRefund, setShowRefund] = useState(false);

    // Initialize/Reset & Fetch Configs
    useEffect(() => {
        if (isOpen) {
            setPromoteType('call_msg');
            setTrafficLink('');
            setTrafficButtonType('Learn More');
            setIsAllBangladesh(true);
            setSelectedLocations([]);
            setDurationDays(1);
            updateEndDate(1);
            setAmount(500);
            setShowManualPayment(false);
            setShowHelpline(false);
            setIsEditingBudget(false);
            setActiveSection(null);
            setAppliedOfferId(null);
            setDiscountAmount(0);
            fetchConfigs();
            fetchUserAdCount();
        }
    }, [isOpen]);

    const fetchUserAdCount = async () => {
        const token = Cookies.get('token');
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/ads/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && data.data) {
                setUserAdsCountFromApi(data.data.length);
            }
        } catch (error) {
            console.error("Error fetching user ads count:", error);
        }
    };

    const [userAdsCountFromApi, setUserAdsCountFromApi] = useState<number | null>(null);

    // Update minAmount based on promoteType and currentPlan
    useEffect(() => {
        if (currentPlan) {
            const min = promoteType === 'traffic'
                ? (Number(currentPlan.minTraffic) || 300)
                : (Number(currentPlan.minReach) || 100);
            setMinAmount(min);

            // Ensure amount is not below minimum
            if (amount < min) {
                setAmount(min);
            }
        }
    }, [currentPlan, promoteType]);

    const fetchConfigs = async () => {
        try {
            const [premierRes, plansRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/premier-opportunity`).then(res => res.json()),
                fetch(`${API_BASE_URL}/api/ads/public/promotion-plans`).then(res => res.json())
            ]);

            if (premierRes.success && premierRes.data) {
                setPremierSettings(premierRes.data);
            }

            if (plansRes.success && plansRes.data && plansRes.data.length > 0) {
                // Find plan for current ad's category
                const plan = plansRes.data.find((p: any) =>
                    p.categories && p.categories.includes(ad.category)
                );

                if (plan) {
                    setCurrentPlan(plan);
                    setMaxAmount(5000);
                    setAmount(500);
                } else {
                    // Fallback or use details from all plans if generic?
                    // For now, keep defaults or log
                    console.log("No specific plan found for subcategory:", ad.subCategory);
                }
            }
        } catch (error) {
            console.error("Failed to fetch configs:", error);
        }
    };

    // Duration Logic
    const updateEndDate = (days: number) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        setEndDate(date.toISOString().split('T')[0]);
    };

    const handleDurationChange = (type: 'inc' | 'dec') => {
        let newDays = durationDays;
        if (type === 'inc') newDays++;
        if (type === 'dec' && newDays > 1) newDays--;
        setDurationDays(newDays);
        updateEndDate(newDays);
    };

    const toggleLabel = (label: any) => {
        setSelectedLabels(prev =>
            prev.some(l => l._id === label._id)
                ? prev.filter(l => l._id !== label._id)
                : [...prev, label]
        );
    };

    const handleApplyOffer = (offer: any) => {
        if (appliedOfferId === offer._id) {
            setAppliedOfferId(null);
            setDiscountAmount(0);
            toast.success("Offer removed");
            return;
        }

        // Logic check
        if (offer.forType === 'product' && offer.forValue === 'FirstProduct') {
            // If user has more than 1 ad, it's not their first product
            if (userAdsCountFromApi !== null && userAdsCountFromApi > 1) {
                toast.error("This offer is only for your first product.");
                return;
            }
        } else if (offer.forType === 'category') {
            if (ad.category !== offer.forValue) {
                toast.error(`This offer is only for ${offer.forValue} category.`);
                return;
            }
        } else if (offer.forType === 'product' && offer.forValue !== 'FirstProduct') {
            if (ad._id !== offer.forValue) {
                toast.error("This offer is for a different product.");
                return;
            }
        }

        setAppliedOfferId(offer._id);
        setDiscountAmount(Number(offer.amount));
        toast.success(`৳${offer.amount} discount applied!`);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = new Date(e.target.value);
        const today = new Date();
        const diffTime = Math.abs(selected.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 1) {
            toast.error("Duration must be at least 1 day");
            return;
        }
        setEndDate(e.target.value);
        setDurationDays(diffDays);
    };

    // ESTIMATION LOGIC
    // If plan exists: (amount / planMax) * planValue
    // We assume plan.minReach is the reach at plan.amount (Max Amount)? 
    // Wait, usually minReach in DB means "Minimum guaranteed reach". 
    // Let's use the logic: At Max Amount -> Reach = Plan.reach, MinReach = Plan.minReach
    // Scale linearly.

    let estimatedMinViews = 0;
    let estimatedMaxViews = 0;

    if (currentPlan) {
        const planBaseAmount = Number(currentPlan.amount) || 100;
        const ratio = amount / planBaseAmount;

        const basePerformance = promoteType === 'traffic'
            ? (Number(currentPlan.traffic) || 0)
            : (Number(currentPlan.reach) || 0);

        const gapPercent = parseFloat(currentPlan.gapAmount) || 0;

        estimatedMinViews = Math.floor(basePerformance * ratio * durationDays);
        estimatedMaxViews = Math.floor((basePerformance * ratio * (1 + gapPercent / 100)) * durationDays);
    } else {
        estimatedMinViews = Math.floor(amount * 0.2 * durationDays);
        estimatedMaxViews = Math.floor(amount * 0.4 * durationDays);
    }

    const viewLabel = promoteType === 'traffic' ? 'Visitors' : 'Views';

    const baseTotal = (amount * durationDays) +
        (isVerifyBadge ? Number(premierSettings.verifyBadgePrice || 0) : 0) +
        (isHighlight ? Number(premierSettings.highlightPostPrice || 0) : 0) +
        (isPostLevel ? selectedLabels.reduce((sum, l) => sum + Number(l.price || 0), 0) : 0);

    const totalAmount = Math.max(0, baseTotal - discountAmount);

    const handlePromote = async () => {
        if (promoteType === 'traffic' && !trafficLink.trim()) {
            setTrafficLinkError(true);
            setActiveSection('promoteType');
            toast.error("Please provide a traffic link URL");
            return;
        }

        try {
            const token = Cookies.get('token');

            // Collect all promotion settings
            const promotionDetails = {
                promoteType,
                trafficLink: promoteType === 'traffic' ? trafficLink : undefined,
                trafficButtonType: promoteType === 'traffic' ? trafficButtonType : undefined,
                targetLocations: isAllBangladesh ? ['All Bangladesh'] : selectedLocations,
                promoteDuration: durationDays,
                promoteEndDate: endDate,
                promoteBudget: amount * durationDays,
                dailyBudget: amount,
                estimatedReach: `${estimatedMinViews}-${estimatedMaxViews}`,
                isVerifyBadge,
                isHighlight,
                highlightType: isHighlight ? highlightType : null,
                isPostLevel,
                selectedLabels: isPostLevel ? selectedLabels.map(l => l.name) : [],
                totalAmount
            };

            const response = await fetch(`${API_BASE_URL}/api/payment/init`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    adId: ad._id,
                    totalAmount,
                    userName: user?.name || ad?.userName || "Customer",
                    userMobile: ad.phone || "01700000000",
                    description: `Promotion for Ad: ${ad.headline}`,
                    promotionDetails
                })
            });

            const data = await response.json();

            if (response.ok && data.success && data.url) {
                // Redirect to SSL Commerz Gateway
                window.location.href = data.url;
            } else {
                toast.error(data.message || "Failed to initialize payment");
            }

        } catch (error) {
            console.error("Promotion Error:", error);
            toast.error("Failed to submit promotion");
        }
    };

    if (!isOpen || !ad) return null;

    const mainImage = (ad.images && ad.images.length > 0 ? getImageUrl(ad.images[0]) : null) || "https://via.placeholder.com/150";
    const privacyContent = getInfoContentForLanguage(INFO_CONTENT.privacy, language);
    const termsContent = getInfoContentForLanguage(INFO_CONTENT.terms, language);
    const returnRefundContent = getInfoContentForLanguage(INFO_CONTENT.return, language);

    return (
        <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-20">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />

            {/* Modal Container */}
            <div className="relative bg-[#F4F6F8] w-full max-w-[565px] rounded-t-lg rounded-b-none overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-full duration-300 shadow-2xl h-[calc(100vh-80px)] font-sans">

                {/* Header */}
                <div className="flex items-center justify-between p-2 px-4 border-b border-slate-400 bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-black hover:bg-slate-50 rounded-full transition-colors">
                            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                        </button>
                        <h2 className="text-[16px] text-black font-medium">Promote Ad</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-50 rounded-full">
                        <X className="w-5 h-5 text-black" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-24 bg-white">

                    {/* 1. Notifications Stack */}
                    {/* <div className="space-y-2">
                        <div className="bg-[#F0FDF4] rounded-lg p-2 flex gap-2 items-start">
                            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                <Minus className="w-3 h-3 text-white" />
                            </div>
                            <p className="text-[11px] text-slate-700 leading-tight">
                                This Post run is off for <span className="font-bold text-red-500">Policy Violation</span>. You Can Edit & submit it early as possible. Or, For help <span className="text-blue-500 font-bold cursor-pointer">Contact us</span>
                            </p>
                        </div>

                        <div className="bg-[#F0FDF4] rounded-lg p-2 flex gap-2 items-start">
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                <Camera className="w-3 h-3 text-white" />
                            </div>
                            <p className="text-[11px] text-slate-700 leading-tight">
                                This post is Creat but not Publish. Because, Your <span className="font-bold text-blue-500">FREE POST ACCESS</span> is over. If You Promote, it will Publish & Promot.
                            </p>
                        </div>

                        <div className="bg-[#F0FDF4] rounded-lg p-2 flex gap-2 items-start">
                            <div className="w-5 h-5 bg-[#0088cc] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                <TrendingUp className="w-3 h-3 text-white" />
                            </div>
                            <p className="text-[11px] text-slate-700 leading-tight">
                                How many Potential customer you need? We can serve, Just Promote.
                            </p>
                        </div>

                        <div className="bg-[#F0FDF4] border border-green-100 rounded-lg p-2 flex gap-2 items-start">
                            <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                <Gift className="w-3 h-3 text-white" />
                            </div>
                            <p className="text-[11px] text-slate-700 leading-tight">
                                You Get ৳100 Ad Free boucher. Promote this Post. <span className="font-bold">Valid Till Today</span>
                            </p>
                        </div>
                    </div> */}

                    {/* 2. Ad Preview Card (Stats) */}
                    {/* <div className="bg-white rounded-lg p-2 shadow-sm border border-slate-400">
                        <div className="flex gap-3 mb-2">
                            <div className="w-20 h-16 rounded overflow-hidden shrink-0 relative">
                                <img src={mainImage} className="w-full h-full object-contain" alt="ad" />
                                <div className="absolute top-1 left-1 bg-white px-1 py-0.5 rounded text-[8px] text-black shadow-sm">See Live</div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-xs text-black truncate mb-1">{ad.headline}</h4>
                                <div className="text-[10px] text-black leading-tight space-y-0.5 border-b border-slate-300 pb-1 mb-1">
                                    <div className="flex justify-between">
                                        <span>Publish {ad.createdAt ? format(new Date(ad.createdAt), 'dd.MM.yyyy') : format(new Date(), 'dd.MM.yyyy')}</span>
                                    </div>
                                    <div>Promote Performance</div>
                                    <div>Budget : {amount} From : {format(new Date(), 'dd.MM.yyyy')} to {endDate ? format(new Date(endDate), 'dd.MM.yyyy') : '...'}</div>
                                    <div className="flex gap-2">
                                        <span>View: 452</span>
                                        <span>Delivery: 897</span>
                                        <span>Rate 50%</span>
                                    </div>
                                    <div>Lifetime View : 10256</div>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="bg-[#0088cc] text-white px-1.5 py-0.5 rounded text-[9px] font-bold">AD On</span>
                                    <button className="border border-slate-400 px-2 py-0.5 rounded text-[9px] font-bold hover:bg-slate-50">Edit</button>
                                </div>
                            </div>
                        </div>
                        <button className="w-full bg-[#4285F4] text-white text-xs py-1.5 rounded font-medium shadow-sm hover:bg-blue-600 transition-colors">
                            Promote / Learning / Promoting
                        </button>
                    </div> */}

                    {/* 3. Ad Config Card */}
                    <div className="bg-white rounded-lg p-0">
                        <div className="flex gap-3 mb-3 items-stretch">
                            <div className="w-[110px] aspect-square rounded overflow-hidden shrink-0 relative">
                                <img src={mainImage} className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-70" alt="ad" loading="lazy" />
                                <img src={mainImage} className="relative z-10 w-full h-full object-contain" alt="ad" loading="lazy" />
                                <button
                                    onClick={() => setSelectedDetailAd(ad)}
                                    className="absolute top-1 left-1 bg-white/90 text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm text-slate-700 hover:bg-white z-10"
                                >
                                    See Live <ExternalLink className="w-2 h-2" />
                                </button>
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                <div>
                                    <h4 className="text-xs text-black leading-tight font-bold mb-0.5 line-clamp-2">{ad.headline}</h4>
                                    <div className="text-[12px] text-slate-600 truncate leading-tight">
                                        {ad.category || 'Category'}, {ad.location || 'Location'}
                                    </div>
                                </div>
                                <div className="text-[12px] text-black leading-tight space-y-0.5 mt-2">
                                    <div>Publish {ad.createdAt ? format(new Date(ad.createdAt), 'dd.MM.yyyy') : format(new Date(), 'dd.MM.yyyy')}</div>
                                    <div>Duration {format(new Date(), 'dd.MM.yyyy')} to {endDate ? format(new Date(endDate), 'dd.MM.yyyy') : '...'}</div>
                                    <div className="text-slate-800 font-bold pt-0.5">Promote Amount ৳{amount}</div>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="space-y-3">
                            {/* Inputs Row */}
                            {/* Inputs Row */}
                            <div className="grid grid-cols-2 gap-2">
                                {/* Promote Type */}
                                <div
                                    className={cn("bg-slate-50 border rounded px-2 py-1.5 flex items-center justify-between cursor-pointer transition-colors", activeSection === 'promoteType' ? 'border-[#0088cc] bg-blue-50/10' : 'border-slate-400')}
                                    onClick={() => setActiveSection(activeSection === 'promoteType' ? null : 'promoteType')}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-[12px] text-slate-500">Promote Type</span>
                                        <span className="text-[12px] text-slate-700 font-bold">{promoteType === 'call_msg' ? 'Call & Message' : 'Visit Traffic'}</span>
                                    </div>
                                    <Edit2 className={cn("w-3 h-3 transition-colors", activeSection === 'promoteType' ? 'text-[#0088cc]' : 'text-slate-400')} />
                                </div>
                                {/* Location */}
                                <div
                                    className={cn("bg-slate-50 border rounded px-2 py-1.5 flex items-center justify-between cursor-pointer transition-colors", activeSection === 'location' ? 'border-[#0088cc] bg-blue-50/10' : 'border-slate-400')}
                                    onClick={() => setActiveSection(activeSection === 'location' ? null : 'location')}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-slate-500">Location Priority</span>
                                        <span className="text-[11px] text-slate-700 truncate max-w-[80px]">
                                            {isAllBangladesh ? 'All Bangladesh' : selectedLocations.join(', ') || 'Select'}
                                        </span>
                                    </div>
                                    <Edit2 className={cn("w-3 h-3 transition-colors", activeSection === 'location' ? 'text-[#0088cc]' : 'text-slate-400')} />
                                </div>
                            </div>

                            {/* Expanded Section Content */}
                            {activeSection && (
                                <div className="bg-white border border-slate-300 rounded p-3 animate-in slide-in-from-top-2 fade-in duration-200">
                                    {activeSection === 'promoteType' && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-slate-500 mb-2">Promote Type</p>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <div className={cn("w-3 h-3 rounded-full border flex items-center justify-center", promoteType === 'call_msg' ? 'border-[#0088cc]' : 'border-slate-300')}>
                                                        {promoteType === 'call_msg' && <div className="w-1.5 h-1.5 rounded-full bg-[#0088cc]" />}
                                                    </div>
                                                    <input
                                                        type="radio"
                                                        name="promoteType"
                                                        className="hidden"
                                                        checked={promoteType === 'call_msg'}
                                                        onChange={() => setPromoteType('call_msg')}
                                                    />
                                                    <span className="text-[11px] text-slate-700">Call & Message</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <div className={cn("w-3 h-3 rounded-full border flex items-center justify-center", promoteType === 'traffic' ? 'border-[#0088cc]' : 'border-slate-300')}>
                                                        {promoteType === 'traffic' && <div className="w-1.5 h-1.5 rounded-full bg-[#0088cc]" />}
                                                    </div>
                                                    <input
                                                        type="radio"
                                                        name="promoteType"
                                                        className="hidden"
                                                        checked={promoteType === 'traffic'}
                                                        onChange={() => setPromoteType('traffic')}
                                                    />
                                                    <span className="text-[11px] text-slate-700">Traffic</span>
                                                </label>
                                            </div>

                                            {promoteType === 'traffic' && (
                                                <div className="mt-3 flex items-center gap-2 bg-[#F4F6F8] p-2 rounded-md border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                                                    <span className="text-[11px] font-bold text-slate-600 shrink-0">URL</span>
                                                    <input
                                                        type="url"
                                                        value={trafficLink}
                                                        onChange={(e) => {
                                                            setTrafficLink(e.target.value);
                                                            if (trafficLinkError) setTrafficLinkError(false);
                                                        }}
                                                        placeholder="www.example.com"
                                                        className={cn(
                                                            "flex-1 min-w-0 text-[11px] px-2 py-1.5 border rounded focus:border-[#0088cc] outline-none transition-colors",
                                                            trafficLinkError ? "border-red-500 bg-red-50" : "border-slate-300"
                                                        )}
                                                    />
                                                    <span className="text-[11px] font-bold text-slate-600 shrink-0 pl-1">Hit Button</span>
                                                    <select
                                                        value={trafficButtonType}
                                                        onChange={(e) => setTrafficButtonType(e.target.value)}
                                                        className="w-[90px] shrink-0 text-[11px] px-2 py-1.5 border border-slate-300 rounded focus:border-[#0088cc] outline-none bg-white transition-colors cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201l4%204%204-4%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_6px_center]"
                                                    >
                                                        <option value="Detail">Detail</option>
                                                        <option value="Learn More">Learn More</option>
                                                        <option value="Shop Now">Shop Now</option>
                                                        <option value="Book Now">Book Now</option>
                                                        <option value="Contact Us">Contact Us</option>
                                                        <option value="Sign Up">Sign Up</option>
                                                        <option value="Visit Store">Visit Store</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeSection === 'location' && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-slate-500 mb-2">Location Priority</p>

                                            {/* All Bangladesh Option */}
                                            <label className="flex items-center gap-2 cursor-pointer mb-2">
                                                <div className={cn("w-3 h-3 rounded-full border flex items-center justify-center", isAllBangladesh ? 'border-[#0088cc]' : 'border-slate-300')}>
                                                    {isAllBangladesh && <div className="w-1.5 h-1.5 rounded-full bg-[#0088cc]" />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={isAllBangladesh}
                                                    onChange={() => {
                                                        setIsAllBangladesh(true);
                                                        setSelectedLocations([]);
                                                    }}
                                                />
                                                <span className="text-[11px] font-medium text-slate-800">All Bangladesh</span>
                                            </label>

                                            {/* Divisions Grid */}
                                            <div className="grid grid-cols-3 gap-2">
                                                {DIVISIONS.map((division) => {
                                                    const isSelected = selectedLocations.includes(division);
                                                    return (
                                                        <label key={division} className="flex items-center gap-2 cursor-pointer">
                                                            <div className={cn("w-3 h-3 rounded-full border flex items-center justify-center", isSelected ? 'border-[#0088cc]' : 'border-slate-300')}>
                                                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#0088cc]" />}
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={isSelected}
                                                                onChange={() => {
                                                                    const newLocs = isSelected
                                                                        ? selectedLocations.filter(l => l !== division)
                                                                        : [...selectedLocations, division];

                                                                    setSelectedLocations(newLocs);
                                                                    if (newLocs.length > 0) {
                                                                        setIsAllBangladesh(false);
                                                                    } else {
                                                                        // Optional: Revert to All BD if empty? Or just let it be empty?
                                                                        // User said "first option All BD... these can be multiple select"
                                                                        // Usually clear selections fallback to All BD or error. Let's keep it consistent.
                                                                        setIsAllBangladesh(newLocs.length === 0);
                                                                    }
                                                                }}
                                                            />
                                                            <span className="text-[10px] text-slate-600">{division}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Duration & Date Row */}
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-white border border-slate-400 rounded px-2 py-1 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] text-slate-400">Duration</span>
                                        <span className="text-[12px] font-bold text-slate-800">{durationDays} Days</span>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-1">
                                        <button onClick={() => handleDurationChange('dec')} className="w-7 h-7 sm:w-5 sm:h-5 rounded-full border border-slate-500 flex items-center justify-center hover:bg-slate-50">
                                            <Minus className="w-5 h-5 sm:w-4 sm:h-4 text-slate-500" />
                                        </button>
                                        <button onClick={() => handleDurationChange('inc')} className="w-7 h-7 sm:w-5 sm:h-5 rounded-full border border-slate-500 flex items-center justify-center hover:bg-slate-50">
                                            <Plus className="w-5 h-5 sm:w-4 sm:h-4 text-slate-500" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white border border-slate-400 rounded px-2 py-1 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <div className="flex flex-col flex-1 relative">
                                        <span className="text-[8px] text-slate-400">End date</span>
                                        <div className="text-[11px] text-slate-800">
                                            {endDate ? format(new Date(endDate), 'MMM d, yyyy') : 'Select Date'}
                                        </div>
                                        <input
                                            type="date"
                                            value={endDate}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={handleDateChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Estimated Views */}
                            <div className="bg-white border border-slate-400 rounded px-2 py-2">
                                <p className="text-[10px] text-slate-500">Promotional Performance Estimated</p>
                                <p className="text-sm font-bold text-slate-800">{estimatedMinViews}-{estimatedMaxViews} {viewLabel}</p>
                            </div>

                            {/* Budget Slider */}
                            <div className="p-2 pt-0 pl-2 pr-3">
                                <div className="flex items-center gap-1 mb-2">
                                    <span className="text-sm text-slate-800">Daily Budget</span>
                                </div>
                                <div className="flex flex-col items-center mb-1">
                                    <div className="flex items-center justify-center gap-1 text-2xl font-black text-[#0088cc] mb-2">
                                        <span className="text-sm pt-1">৳</span>
                                        {isEditingBudget ? (
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setAmount(val);
                                                }}
                                                onBlur={() => {
                                                    if (amount < minAmount) {
                                                        setAmount(minAmount);
                                                        toast.error(`Minimum amount is ৳${minAmount}`);
                                                    }
                                                    setIsEditingBudget(false);
                                                }}
                                                autoFocus
                                                className="w-[140px] bg-transparent border-none outline-none text-2xl font-black text-[#0088cc] p-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center"
                                            />
                                        ) : (
                                            <span>{amount}</span>
                                        )}
                                        <Edit2
                                            className="w-3 h-3 text-slate-400 ml-1 cursor-pointer"
                                            onClick={() => setIsEditingBudget(true)}
                                        />
                                    </div>

                                    <div className="w-full relative h-1 bg-slate-200 rounded-full mb-6">
                                        <input
                                            type="range"
                                            min={minAmount}
                                            max={maxAmount}
                                            step={sliderStep}
                                            value={amount}
                                            onChange={(e) => setAmount(Number(e.target.value))}
                                            className="absolute w-full h-full opacity-0 z-10 cursor-pointer"
                                        />
                                        <div
                                            className="absolute left-0 top-0 h-full bg-[#0088cc] rounded-full"
                                            style={{ width: `${Math.min(100, ((amount - minAmount) / (maxAmount - minAmount)) * 100)}%` }}
                                        ></div>
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#0088cc] rounded-full border-2 border-white shadow-sm pointer-events-none"
                                            style={{ left: `${Math.min(100, ((amount - minAmount) / (maxAmount - minAmount)) * 100)}%` }}
                                        ></div>
                                    </div>

                                    <div className="w-full flex justify-between text-[10px] text-slate-400 -mt-4">
                                        <span>৳{minAmount.toFixed(2)}</span>
                                        <span>৳{maxAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Premier Opportunity Dropdown */}
                            <div
                                className="px-3 py-2 flex items-center border-t border-slate-400 cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => setShowPremier(!showPremier)}
                            >
                                <span className="text-xs font-bold text-slate-700 pr-2">Premier Opportunity</span>
                                <Triangle className={cn("w-3 h-3 text-black fill-black transition-transform duration-200 rotate-180", showPremier && "rotate-0")} />
                            </div>

                            {/* Premier Options - Collapsible Content */}
                            {showPremier && (
                                <div className="space-y-3 pt-2 bg-slate-50 -mt-[1px] rounded-b px-3 py-3 animate-in fade-in zoom-in-95 duration-200">
                                    {/* Verify Badge */}
                                    <label className="flex items-start gap-2 cursor-pointer group">
                                        <div className={cn("w-5 h-5 rounded border flex items-center justify-center mt-0.5 transition-colors", isVerifyBadge ? 'bg-[#0088cc] border-[#0088cc]' : 'border-slate-400 bg-white')}>
                                            {isVerifyBadge && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={isVerifyBadge} onChange={() => setIsVerifyBadge(!isVerifyBadge)} />
                                        <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 mt-0.5">
                                            প্রোফাইলে ভেরিফাই ব্যাজ যোগ (+ ৳{premierSettings.verifyBadgePrice}/{premierSettings.verifyBadgeDuration === 365 ? 'বছর' : `${premierSettings.verifyBadgeDuration} দিন`})
                                        </span>
                                    </label>

                                    {/* Highlight Post */}
                                    {/* <label className="flex items-start gap-2 cursor-pointer group">
                                        <div className={cn("w-5 h-5 rounded border flex items-center justify-center mt-0.5 transition-colors", isHighlight ? 'bg-[#0088cc] border-[#0088cc]' : 'border-slate-400 bg-white')}>
                                            {isHighlight && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={isHighlight} onChange={() => setIsHighlight(!isHighlight)} />
                                        <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 mt-0.5">
                                            পোস্টটি হাইলাইট করুন (+ ৳{premierSettings.highlightPostPrice})
                                        </span>
                                    </label> */}

                                    {/* Post Level / Labels */}
                                    <div>
                                        <label className="flex items-start gap-2 cursor-pointer group mb-2">
                                            <div className={cn("w-5 h-5 rounded border flex items-center justify-center mt-0.5 transition-colors", isPostLevel ? 'bg-[#0088cc] border-[#0088cc]' : 'border-slate-400 bg-white')}>
                                                {isPostLevel && <Check className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <input type="checkbox" className="hidden" checked={isPostLevel} onChange={() => setIsPostLevel(!isPostLevel)} />
                                            <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 flex items-center gap-2 mt-0.5">
                                                পোস্ট লেভেল যোগ করুন
                                                <Triangle className={cn("w-3.5 h-3.5 text-black fill-black transition-transform duration-200 rotate-180", isPostLevel && "rotate-0")} />
                                            </span>
                                        </label>

                                        {isPostLevel && premierSettings.labels && premierSettings.labels.length > 0 && (
                                            <div className="pl-6 space-y-1.5 mb-2 animate-in slide-in-from-top-2 fade-in">
                                                {premierSettings.labels.map((label: any) => {
                                                    const isSelected = selectedLabels.some(l => l._id === label._id);
                                                    return (
                                                        <label key={label._id} className="flex items-center gap-2 cursor-pointer">
                                                            <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors", isSelected ? 'bg-[#0088cc] border-[#0088cc]' : 'border-slate-400')}>
                                                                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={isSelected}
                                                                onChange={() => toggleLabel(label)}
                                                            />
                                                            <span className="text-xs text-slate-600">{label.name} (+ ৳{label.price})</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Free Ad Credits Offers */}
                                    {premierSettings.freeAdCredits && premierSettings.freeAdCredits.some((c: any) => c.status) && (
                                        <div className="space-y-2 mt-4 pt-2 border-t border-slate-200">
                                            <h4 className="text-xs font-bold text-slate-700 uppercase">Available Offers</h4>
                                            {premierSettings.freeAdCredits
                                                .filter((c: any) => c.status)
                                                .map((offer: any, idx: number) => {
                                                    const isApplied = appliedOfferId === offer._id;
                                                    return (
                                                        <div key={offer._id || idx} className={cn("flex items-center justify-between border p-2 rounded transition-colors", isApplied ? "border-emerald-500 bg-emerald-50" : "bg-white border-slate-200")}>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-slate-800">
                                                                    ৳{offer.amount} Free Ad Credit ({offer.forType === 'all' ? 'All' : offer.forValue})
                                                                </span>
                                                                {offer.endDate && (
                                                                    <span className="text-[10px] text-slate-500">Valid till: {format(new Date(offer.endDate), 'dd MMM, yyyy')}</span>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => handleApplyOffer(offer)}
                                                                className={cn(
                                                                    "text-[11px] font-bold px-3 py-1.5 rounded shadow-sm transition-colors",
                                                                    isApplied
                                                                        ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                                                        : "bg-[#FF3B30] text-white hover:bg-red-600"
                                                                )}
                                                            >
                                                                {isApplied ? 'Remove' : 'Apply'}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 4. Payment Action */}
                    <div className="mt-2 rounded-lg overflow-hidden flex">
                        <div className="bg-[#B8CCF2] w-1/3 flex items-center justify-center p-3">
                            <span className="text-sm font-bold text-slate-800">Total : ৳{totalAmount}</span>
                        </div>
                        <button
                            onClick={handlePromote}
                            className="bg-[#4285F4] flex-1 p-3 text-white font-bold text-sm hover:bg-blue-600 transition-colors"
                        >
                            Pay Now
                        </button>
                    </div>
                    <p className="text-[12px] text-slate-400 text-center mt-1">
                        By Proceeding you agree to the{' '}
                        <span className="text-[#0088cc] cursor-pointer hover:underline" onClick={() => setShowPrivacy(true)}>Privacy</span>
                        {', '}
                        <span className="text-[#0088cc] cursor-pointer hover:underline" onClick={() => setShowTnC(true)}>T & C</span>
                        {', '}
                        <span className="text-[#0088cc] cursor-pointer hover:underline" onClick={() => setShowRefund(true)}>Return & Refund</span>
                    </p>

                    {/* 5. Support & Manual Pay */}
                    <div className="mt-6 pt-4 border-t border-slate-400 space-y-4">
                        <div className="flex justify-between px-4 text-[11px] text-slate-500 font-medium">
                            <span
                                className="cursor-pointer hover:text-slate-800"
                                onClick={() => window.open('https://m.me/shadamonDotCom', '_blank')}
                            >
                                HelpChat
                            </span>
                            <span
                                className={cn("cursor-pointer transition-colors", showManualPayment ? "text-blue-600 font-bold" : "hover:text-slate-800")}
                                onClick={() => setShowManualPayment(!showManualPayment)}
                            >
                                Pay Manual
                            </span>
                            <span
                                className="cursor-pointer hover:text-slate-800"
                                onClick={() => setShowHelpline(!showHelpline)}
                            >
                                {showHelpline ? "01752842084" : "Helpline"}
                            </span>
                        </div>

                        {showManualPayment && (
                            <div className="bg-white p-3 rounded-lg border border-slate-300 shadow-sm animate-in fade-in slide-in-from-top-1">
                                <h4 className="font-bold text-sm text-slate-800 mb-1">Manual Payment</h4>
                                <p className="text-[11px] text-slate-600 mb-2">
                                    যে প্যাকেজটি কিনতে চান, সমপরিমান টাকা পাঠিয়ে Shadamon কে মেসেজ করুন।
                                </p>
                                <div className="space-y-0.5 text-xs text-slate-700 mb-4">
                                    <div><span className="font-bold">বিকাশ নাম্বার: </span>01732661224</div>
                                    <div><span className="font-bold">নগদ নাম্বার: </span>01732661224</div>
                                    <div><span className="font-bold">রকেট নাম্বার: </span>01732661224 3</div>
                                </div>

                                <button
                                    onClick={() => window.open('https://m.me/shadamonDotCom', '_blank')}
                                    className="w-full bg-[#0088cc] text-white font-bold py-3 rounded-lg shadow-sm hover:bg-[#0077b5] transition-colors"
                                >
                                    Message us
                                </button>
                            </div>
                        )}


                    </div>

                </div>
            </div>
            {selectedDetailAd && (
                <AdDetailsModal
                    isOpen={!!selectedDetailAd}
                    onClose={() => setSelectedDetailAd(null)}
                    ad={selectedDetailAd}
                />
            )}

            {/* Info Modals */}
            <InfoModal
                isOpen={showPrivacy}
                onClose={() => setShowPrivacy(false)}
                title={privacyContent.title}
                content={privacyContent.content}
            />
            <InfoModal
                isOpen={showTnC}
                onClose={() => setShowTnC(false)}
                title={termsContent.title}
                content={termsContent.content}
            />
            <InfoModal
                isOpen={showRefund}
                onClose={() => setShowRefund(false)}
                title={returnRefundContent.title}
                content={returnRefundContent.content}
            />
        </div>
    );
}
