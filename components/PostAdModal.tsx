"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, ArrowLeft, Plus, ChevronDown, Check, Trash2, Loader2, Search, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../utils/apiConfig';
import { getImageUrl } from '../utils/imageUrl';
import { useSettings } from '../app/context/SettingsContext';
import { useLanguage } from '../app/context/LanguageContext';
import { compressImage } from '../utils/imageCompression';
import InfoModal from './InfoModal';


function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface PostAdModalProps {
    isOpen: boolean;
    onClose: () => void;
    editAd?: any;
    onSuccess?: (ad?: any) => void;
    initialMobile?: string;
}

interface SubItem {
    _id: string;
    name: string;
    subCategoryNameBn?: string;
    subLocationNameBn?: string;
    slug: string;
    image?: string;
    icon?: string;
    priceBoxShow?: boolean;
    priceBoxName?: string;
    features?: Feature[];
}

interface Feature {
    _id: string;
    name: string;
    inputType: string;
    buttonType: string;
    selectionType?: 'Single' | 'Multi';
    boxFadeName?: string;
    buttonItemNames: string[];
}

interface Category {
    _id: string;
    name: string;
    categoryNameBn?: string;
    image?: string;
    icon?: string;
    subcategories: SubItem[];
}

interface Location {
    _id: string;
    name: string;
    locationNameBn?: string;
    image?: string;
    subLocations: SubItem[];
}

export default function PostAdModal({ isOpen, onClose, editAd, onSuccess, initialMobile }: PostAdModalProps) {
    const [images, setImages] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [compressing, setCompressing] = useState(false);
    const { settings, fetchPostAdSettings } = useSettings();
    const { t, language } = useLanguage();

    // Form State
    const [headline, setHeadline] = useState("");
    const [description, setDescription] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [hidePhone, setHidePhone] = useState(false);
    const [price, setPrice] = useState("");
    const [priceType, setPriceType] = useState("Negotiable");
    const [email, setEmail] = useState("");
    const [hasReadRules, setHasReadRules] = useState(true);
    const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [mobileCheckResult, setMobileCheckResult] = useState<{ exists: boolean; verifiedBy: string | null; matchesEmail?: boolean } | null>(null);

    // Categories & Locations
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState("");
    const [selectedSubLocation, setSelectedSubLocation] = useState("");

    // Wizard State
    const [view, setView] = useState<'form' | 'category' | 'category-sub' | 'location' | 'location-sub' | 'features' | 'loading' | 'status'>('loading');
    const [submissionStatus, setSubmissionStatus] = useState<{ status: 'review' | 'active' | 'limit-reached', limit?: number, ad?: any } | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [tempCategory, setTempCategory] = useState<string>("");
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [tempSubCategory, setTempSubCategory] = useState<string>("");
    const [tempLocation, setTempLocation] = useState<string>("");
    const [tempSubLocations, setTempSubLocations] = useState<string[]>([]);

    const [newAdditionalNumber, setNewAdditionalNumber] = useState("");
    const [newAdditionalType, setNewAdditionalType] = useState("whatsapp");
    const [additionalPhones, setAdditionalPhones] = useState<{ number: string, types: string[] }[]>([]);
    const [featureValues, setFeatureValues] = useState<Record<string, any>>({});
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);
    const [showDescriptionHelp, setShowDescriptionHelp] = useState(true);

    // OTP State
    const [showOtpVerification, setShowOtpVerification] = useState(false);
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [otpTimer, setOtpTimer] = useState(60);
    const [showOtpConfirmation, setShowOtpConfirmation] = useState(false);
    const [isEditingOtpPhone, setIsEditingOtpPhone] = useState(false);
    const [editedOtpPhone, setEditedOtpPhone] = useState("");

    const [showTnC, setShowTnC] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const categoryListRef = useRef<HTMLDivElement | null>(null);
    const categoryRowRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const hasBanglaChars = (value: string) => /[\u0980-\u09FF]/.test(value);

    const getLocalizedAreaName = React.useCallback((rawName: string, rawNameBn?: string) => {
        const providedBn = String(rawNameBn || '').trim();
        if (language === 'bn' && providedBn) {
            return providedBn;
        }

        const name = String(rawName || '').trim();
        if (!name) return '';

        const match = name.match(/^(.+?)\s*\((.+)\)\s*$/);
        if (!match) return name;

        const first = match[1].trim();
        const second = match[2].trim();
        const firstIsBn = hasBanglaChars(first);
        const secondIsBn = hasBanglaChars(second);

        if (language === 'bn') {
            if (firstIsBn && !secondIsBn) return first;
            if (secondIsBn && !firstIsBn) return second;
            return firstIsBn ? first : second;
        }

        if (!firstIsBn && secondIsBn) return first;
        if (!secondIsBn && firstIsBn) return second;
        return firstIsBn ? second : first;
    }, [language]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const headlineInputRef = useRef<HTMLInputElement>(null);

    const otpConfirmTitle = language === 'bn' ? 'ওটিপি (OTP) কোড পাঠানো হচ্ছে' : 'Otp Code are sending';
    const otpConfirmSubtitle = language === 'bn'
        ? 'এই নম্বরে একটি ওটিপি (OTP) কোড পাঠানো হবে। আপনার নম্বর কি সঠিক?'
        : 'A otp code will be send to this number. Is you number is correct?';
    const otpNoLabel = language === 'bn' ? 'না' : 'No';
    const otpYesLabel = language === 'bn' ? 'হ্যাঁ' : 'Yes';
    const otpEditLabel = language === 'bn' ? 'এডিট' : 'Edit';
    const otpSaveLabel = language === 'bn' ? 'সেভ' : 'Save';
    const otpVerificationTitle = language === 'bn' ? 'ওটিপি (OTP) ভেরিফিকেশন কোড' : 'Otp verification code';
    const otpVerificationSubtitle = language === 'bn' ? 'এখানে আপনার ওটিপি (OTP) কোড লিখুন' : 'write your otp code here';
    const otpNumberLabel = language === 'bn' ? 'নম্বর:' : 'Number:';
    const otpVerifyLabel = language === 'bn' ? 'ওটিপি যাচাই করুন' : 'Verify OTP';
    const otpResendLabel = language === 'bn' ? 'ওটিপি পুনরায় পাঠান' : 'Resend OTP';
    const otpTimerPrefixLabel = language === 'bn' ? 'ওটিপি পুনরায় পাঠান:' : 'resend otp:';
    const otpMinutesLabel = language === 'bn' ? 'মিনিট' : 'minutes';
    const otpAfterTimerMessage = language === 'bn'
        ? 'ফোন নম্বর পরিবর্তনের পর আপনি নতুন ওটিপি কোড অনুরোধ করতে পারবেন'
        : 'After changing phone number you can request for new otp code';
    const otpDontGetTitle = language === 'bn' ? 'ওটিপি পাচ্ছেন না?' : "Don't get otp?";
    const otpLoadingLabel = language === 'bn' ? 'প্রসেস হচ্ছে...' : 'Processing...';
    const formattedOtpTimer = `${String(Math.floor(otpTimer / 60)).padStart(2, '0')}:${String(otpTimer % 60).padStart(2, '0')}`;

    const fillFormData = (ad: any) => {
        setHeadline(ad.headline || "");
        setDescription(ad.description || "");
        setPhone(ad.phone || "");
        setAdditionalPhones(ad.additionalPhones || []);
        setHidePhone(ad.hidePhone === true);
        setSelectedCategory(ad.category || "");
        setSelectedSubCategory(ad.subCategory || "");
        setSelectedLocation(ad.location || "");
        setSelectedSubLocation(ad.subLocation || "");
        setPrice(ad.price ? String(ad.price) : "");
        setPriceType(ad.priceType || "Negotiable");
        setExistingImages(ad.images || []);
        setFeatureValues(ad.features || {});
    };

    const fetchAdData = async (id: string) => {
        setLoadingData(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/ads/public/${id}`);
            const data = await res.json();
            if (data.success && data.data) {
                fillFormData(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch ad details:", error);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (isOpen && view === 'form' && !loadingData && !showOtpVerification && headlineInputRef.current) {
            const timer = setTimeout(() => {
                headlineInputRef.current?.focus();
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [isOpen, view, loadingData, showOtpVerification]);

    useEffect(() => {
        if (isOpen) {
            fetchPostAdSettings();
            fetchData();
            checkUser();
            setShowDescriptionHelp(true);
            if (editAd) {
                fillFormData(editAd);
                fetchAdData(editAd._id);
                setHasReadRules(true);
                setView('form');
            } else {
                setHeadline("");
                setDescription("");
                setPassword("");
                setName("");
                setAdditionalPhones([]);
                setHidePhone(false);
                setSelectedCategory("");
                setSelectedSubCategory("");
                setSelectedLocation("");
                setSelectedSubLocation("");
                setTempCategory("");
                setTempSubCategory("");
                setTempLocation("");
                setTempSubLocations([]);
                setExpandedCategory(null);
                setPrice("");
                setPriceType("Negotiable");
                setFeatureValues({});
                setImages([]);
                setExistingImages([]);
                setShowOtpVerification(false);
                setOtp(["", "", "", "", "", ""]);
                setOtpTimer(60);
                setShowOtpConfirmation(false);
                setIsEditingOtpPhone(false);
                setEditedOtpPhone("");
                setMobileCheckResult(null);

                if (initialMobile) {
                    if (initialMobile.includes('@')) {
                        setEmail(initialMobile);
                        setPhone("");
                    } else {
                        setPhone(initialMobile);
                        setEmail("");
                    }
                } else {
                    setPhone("");
                    setEmail("");
                }
                setSubmissionStatus(null);
                // View reset handled in checkUser
            }
        }
    }, [isOpen, editAd, initialMobile]);

    // OTP Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showOtpVerification && otpTimer > 0) {
            interval = setInterval(() => {
                setOtpTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [showOtpVerification, otpTimer]);

    useEffect(() => {
        if (!isOpen) return;

        const trimmedPhone = phone.trim();
        if (/^\d{11}$/.test(trimmedPhone)) {
            // If logged in, only check if it's DIFFERENT from their own mobile
            if (isUserLoggedIn && trimmedPhone === userData?.mobile) {
                setMobileCheckResult({ exists: true, verifiedBy: userData?.verifiedBy || null });
                return;
            }
            checkMobileStatus(trimmedPhone);
            return;
        }

        setMobileCheckResult(null);
    }, [isOpen, isUserLoggedIn, phone, userData]);

    const fetchData = async () => {
        setLoadingData(true);
        try {
            const [catRes, subCatRes, locRes, subLocRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/categories`).then(res => res.json()),
                fetch(`${API_BASE_URL}/api/categories/sub`).then(res => res.json()),
                fetch(`${API_BASE_URL}/api/locations`).then(res => res.json()),
                fetch(`${API_BASE_URL}/api/locations/sub`).then(res => res.json())
            ]);

            if (catRes.success && subCatRes.success) {
                const cats = catRes.data
                    .map((c: any) => ({
                        ...c,
                        subcategories: subCatRes.data
                            .filter((sc: any) => (sc.category?._id || sc.category) === c._id)
                            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                    }))
                    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
                setCategories(cats);
            }

            if (locRes.success && subLocRes.success) {
                const locs = locRes.data
                    .map((l: any) => ({
                        ...l,
                        subLocations: subLocRes.data
                            .filter((sl: any) => (sl.location?._id || sl.location) === l._id)
                            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                    }))
                    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
                setLocations(locs);
            }
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoadingData(false);
        }
    };

    const checkUser = async () => {
        const token = Cookies.get('token');

        let foundUser = false;

        if (token) {
            try {
                const res = await fetch(`${API_BASE_URL}/api/user/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const userData = await res.json();
                if (userData) {
                    setIsUserLoggedIn(true);
                    setUserData(userData);
                    if (userData.email) setEmail(userData.email);
                    if (userData.mobile) setPhone(userData.mobile);
                    if (userData.name) setName(userData.name);

                    if (!editAd) {
                        // Pre-fill preferences if available
                        if (userData.lastPostCategory && userData.lastPostLocation) {
                            setSelectedCategory(userData.lastPostCategory);
                            setSelectedSubCategory(userData.lastPostSubCategory || "");
                            setSelectedLocation(userData.lastPostLocation);
                            setSelectedSubLocation(userData.lastPostSubLocation || "");
                        } else if (userData.category && userData.location) {
                            setSelectedCategory(userData.category);
                            setSelectedLocation(userData.location);
                        }
                    }
                    setView('form');
                    return;
                }
            } catch (error) { }
        }

        setIsUserLoggedIn(false);
        // If we have an initial mobile (from MobileEntryModal), we go straigth to form
        // If we are editing, we go to form
        // Otherwise, previous logic might have asked for mobile, but now we assume MobileEntryModal handles entry.
        // So we default to form, but let the form handle "Unauth + No Phone" if that case ever happens (it shouldn't with correct parent logic)
        setView('form');
    };

    const handleCategorySelect = (cat: string, sub: string) => {
        setTempCategory(cat);
        setTempSubCategory(sub);

        // Update main state too just in case we skip
        setSelectedCategory(cat);
        setSelectedSubCategory(sub);

        setView('location');
    };

    const handleCategoryAccordionToggle = (categoryId: string) => {
        const willExpand = expandedCategory !== categoryId;
        setExpandedCategory(willExpand ? categoryId : null);

        if (!willExpand) return;

        requestAnimationFrame(() => {
            const listEl = categoryListRef.current;
            const rowEl = categoryRowRefs.current[categoryId];
            if (!listEl || !rowEl) return;

            const listRect = listEl.getBoundingClientRect();
            const rowRect = rowEl.getBoundingClientRect();
            const desiredTopOffset = 44;
            const targetScrollTop = listEl.scrollTop + (rowRect.top - listRect.top) - desiredTopOffset;

            listEl.scrollTo({
                top: Math.max(targetScrollTop, 0),
                behavior: 'smooth'
            });
        });
    };

    const handleLocationSelect = (sub?: string) => {
        if (!tempLocation) {
            toast.error("Please select a location");
            return;
        }
        setSelectedLocation(tempLocation);

        // Single selection logic
        const subLoc = typeof sub === 'string' ? sub : tempSubLocations[0] || "";
        setSelectedSubLocation(subLoc);

        // Check if current subcategory has features
        const currentCat = categories.find(c => c.name === selectedCategory);
        const currentSub = currentCat?.subcategories.find(s => s.name === selectedSubCategory);

        if (currentSub?.features && currentSub.features.length > 0) {
            setView('features');
        } else {
            setView('form');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const limit = settings.productPhotoLimit || 10;

            if (images.length + existingImages.length + newFiles.length > limit) {
                toast.error(`Maximum ${limit} images allowed`);
                return;
            }

            setCompressing(true);
            try {
                const compressedPromises = newFiles.map(file => compressImage(file));
                const compressedFiles = await Promise.all(compressedPromises);
                setImages([...images, ...compressedFiles]);
            } catch (error) {
                console.error("Compression failed:", error);
                toast.error("Failed to process some images");
                // Fallback to original files if compression fails
                setImages([...images, ...newFiles]);
            } finally {
                setCompressing(false);
                e.target.value = '';
            }
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const removeExistingImage = (imgUrl: string) => {
        setExistingImages(existingImages.filter(img => img !== imgUrl));
    };

    const normalizeVerifiedBy = (value?: string | null) => String(value || "").trim().toLowerCase();

    const checkMobileStatus = async (mobileNumber: string) => {
        const trimmedMobile = mobileNumber.trim();

        if (!/^\d{11}$/.test(trimmedMobile)) {
            setMobileCheckResult(null);
            return null;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/user/check-mobile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile: trimmedMobile, email: email || "" })
            });
            const data = await res.json();

            if (res.ok) {
                const result = {
                    exists: !!data.exists,
                    verifiedBy: data.verifiedBy || null,
                    matchesEmail: data.matchesEmail !== false
                };
                setMobileCheckResult(result);
                return result;
            }
        } catch (error) {
            console.error("Failed to check mobile status:", error);
        }

        return null;
    };

    const addAdditionalPhone = () => {
        if (!newAdditionalNumber) {
            toast.error("Enter a number first");
            return;
        }
        setAdditionalPhones([...additionalPhones, { number: newAdditionalNumber, types: [newAdditionalType] }]);
        setNewAdditionalNumber("");
    };

    // OTP Handlers
    const handleOtpChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto move to next input
        if (value && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    const requestOtpConfirmation = () => {
        const trimmedPhone = phone.trim();
        if (!/^\d{11}$/.test(trimmedPhone)) {
            toast.error("Please enter a valid 11-digit mobile number");
            return;
        }
        setEditedOtpPhone(trimmedPhone);
        setIsEditingOtpPhone(false);
        setShowOtpConfirmation(true);
    };

    const handleConfirmOtpSend = async () => {
        const targetPhone = (isEditingOtpPhone ? editedOtpPhone : phone).trim();
        if (!/^\d{11}$/.test(targetPhone)) {
            toast.error("Please enter a valid 11-digit mobile number");
            return;
        }
        setPhone(targetPhone);
        setShowOtpConfirmation(false);
        await sendMobileOtp(targetPhone);
    };

    const handleSaveEditedOtpPhone = async () => {
        const nextPhone = editedOtpPhone.trim();
        if (!/^\d{11}$/.test(nextPhone)) {
            toast.error("Please enter a valid 11-digit mobile number");
            return;
        }

        await sendMobileOtp(nextPhone);
    };


    // Actual submission logic moved here
    const submitAd = async (otpValue?: string, wasOtpVerified: boolean = false) => {
        let token = Cookies.get('token');
        let finalPhone = phone.trim();

        // Register or Login if not logged in OR if phone changed
        if (!isUserLoggedIn || (finalPhone !== userData?.mobile)) {
            try {
                const trimmedPhone = phone.trim();
                const currentMobileCheck = mobileCheckResult || await checkMobileStatus(trimmedPhone);

                const authPayload: any = {
                    mobile: trimmedPhone,
                    password,
                    otp: otpValue,
                    name: name || trimmedPhone.split('').slice(0, 5).join(''),
                    storeName: name || trimmedPhone.split('').slice(0, 5).join(''),
                };

                if (email) {
                    authPayload.email = email;
                }

                let authUrl = `${API_BASE_URL}/api/user/register`;
                let authMethod = 'POST';
                const headers: any = { 'Content-Type': 'application/json' };

                if (isUserLoggedIn) {
                    // If already logged in (e.g. via Social), just update the profile with phone/password
                    authUrl = `${API_BASE_URL}/api/user/update`;
                    authMethod = 'PUT';
                    headers['Authorization'] = `Bearer ${Cookies.get('token')}`;
                } else if (currentMobileCheck?.exists) {
                    authUrl = `${API_BASE_URL}/api/user/login`;
                }

                const authRes = await fetch(authUrl, {
                    method: authMethod,
                    headers: headers,
                    body: JSON.stringify(authPayload)
                });

                const authData = await authRes.json();

                if (!authRes.ok) {
                    throw new Error(authData.message || "Authentication failed");
                }

                token = authData.token || Cookies.get('token');
                if (authData.token) {
                    Cookies.set('token', token as string, { expires: 7 });
                }
                setIsUserLoggedIn(true);
                setUserData(authData.user);

                if (authData.user?.mobile) {
                    finalPhone = authData.user.mobile;
                    setPhone(authData.user.mobile);
                }

                // If existing user and OTP entered, ensure verified status is synced
                if (currentMobileCheck?.exists && otpValue) {
                    await fetch(`${API_BASE_URL}/api/user/otp/mobile/verify`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ phone: finalPhone, otp: otpValue })
                    });
                }
            } catch (err: any) {
                toast.error(err.message || "Authentication Error");
                setLoading(false);
                return;
            }
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('headline', headline);
            formData.append('description', description);
            formData.append('category', selectedCategory);
            formData.append('subCategory', selectedSubCategory);
            formData.append('location', selectedLocation);
            formData.append('subLocation', selectedSubLocation);
            formData.append('phone', finalPhone);
            formData.append('name', name);
            formData.append('hidePhone', String(hidePhone));
            formData.append('additionalPhones', JSON.stringify(additionalPhones));
            formData.append('remainingImages', JSON.stringify(existingImages));
            formData.append('features', JSON.stringify(featureValues));
            formData.append('price', price);
            formData.append('priceType', priceType);

            if (wasOtpVerified) {
                formData.append('verificationInfo', JSON.stringify({
                    number: phone,
                    at: new Date().toISOString()
                }));
            }

            images.forEach((file) => {
                formData.append('images', file);
            });

            const method = editAd ? 'PUT' : 'POST';
            const endpoint = editAd ? `${API_BASE_URL}/api/ads/${editAd._id}` : `${API_BASE_URL}/api/ads`;

            const response = await fetch(endpoint, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.success) {
                if (data.limitReached) {
                    toast.success("Ad posted! It's currently paused as you've reached the free limit for this category.");
                } else {
                    toast.success(editAd ? "Ad updated!" : "Ad posted successfully!");
                }
                if (onSuccess) onSuccess(data.data || data.ad);
                onClose();
            } else {
                toast.error(data.message || "Failed to process ad");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const sendMobileOtp = async (phoneNumber?: string) => {
        const targetPhone = (phoneNumber ?? phone).trim();
        if (!/^\d{11}$/.test(targetPhone)) {
            toast.error("Please enter a valid 11-digit mobile number");
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/user/otp/mobile/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: targetPhone })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("OTP sent to your mobile");
                setPhone(targetPhone);
                setShowOtpVerification(true);
                setOtp(["", "", "", "", "", ""]);
                setOtpTimer(60);
                setIsEditingOtpPhone(false);
                setEditedOtpPhone("");
            } else {
                toast.error(data.message || "Failed to send OTP");
            }
        } catch (error) {
            toast.error("Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        const fullOtp = otp.join("");
        if (fullOtp.length !== 6) {
            toast.error("Please enter 6-digit OTP");
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/user/otp/mobile/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp: fullOtp })
            });
            const data = await res.json();
            if (data.success) {
                // Success! Pass fullOtp to submitAd
                submitAd(fullOtp, true);
            } else {
                toast.error(data.message || "Invalid OTP");
            }
        } catch (error) {
            toast.error("Verification failed");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpPrimaryAction = async () => {
        if (otpTimer > 0) {
            await handleVerifyOtp();
            return;
        }

        const targetPhone = (isEditingOtpPhone ? editedOtpPhone : phone).trim();
        if (!/^\d{11}$/.test(targetPhone)) {
            toast.error("Please enter a valid 11-digit mobile number");
            return;
        }

        await sendMobileOtp(targetPhone);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAttemptedSubmit(true);

        if (!hasReadRules) {
            toast.error("Please accept the Terms and Conditions");
            return;
        }

        const trimmedPhone = phone.trim();
        const isNewPhone = isUserLoggedIn ? (trimmedPhone !== userData?.mobile) : true;

        // Basic validation before OTP
        if (
            !headline ||
            !phone ||
            (isNewPhone && !password) ||
            (images.length === 0 && existingImages.length === 0) ||
            !selectedCategory ||
            !selectedLocation ||
            (subCat?.priceBoxShow && !price) ||
            !name
        ) {
            toast.error("Please fill in required fields");
            return;
        }

        // Check blocked words
        const headlineLower = headline.toLowerCase();
        const descLower = description.toLowerCase();

        const blockedHeadlineFound = (settings.blockCheckInHeadline || []).find(word => headlineLower.includes(word.toLowerCase()));
        if (blockedHeadlineFound) {
            toast.error(`Headline contains restricted word: ${blockedHeadlineFound}`);
            return;
        }

        const blockedDescFound = (settings.blockCheckInDescription || []).find(word => descLower.includes(word.toLowerCase()));
        if (blockedDescFound) {
            toast.error(`Description contains restricted word: ${blockedDescFound}`);
            return;
        }

        if (editAd) {
            submitAd();
            return;
        }

        setLoading(true);

        try {
            const currentMobileCheck: any = mobileCheckResult || await checkMobileStatus(trimmedPhone);

            // CASE 1: USER EXISTS (either phone exists OR email already has another phone)
            if (currentMobileCheck?.exists) {
                // If it exists but doesn't match the current email/phone pairing
                if (currentMobileCheck.matchesEmail === false) {
                    toast.error("Account mismatch! This email is already registered with a different mobile number, or this mobile belongs to another account.");
                    setLoading(false);
                    return;
                }

                // If logged in and entering their own phone, check verification directly
                if (isUserLoggedIn && trimmedPhone === userData?.mobile) {
                    if (normalizeVerifiedBy(userData?.verifiedBy) === 'mobile') {
                        submitAd();
                    } else {
                        requestOtpConfirmation();
                    }
                    return;
                }

                // Otherwise, it belongs to this email account but phone/pass login needed
                // We MUST verify password first for any existing account (by email or mobile)
                const loginPayload: any = { mobile: trimmedPhone, password };
                if (email) {
                    loginPayload.email = email;
                }
                const loginRes = await fetch(`${API_BASE_URL}/api/user/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(loginPayload)
                });
                const loginData = await loginRes.json();

                if (!loginRes.ok || !loginData.token) {
                    toast.error(loginData.message || "Invalid password for this account");
                    setLoading(false);
                    return;
                }

                // Login success
                const token = loginData.token;
                const user = loginData.user;
                Cookies.set('token', token, { expires: 7 });
                setIsUserLoggedIn(true);
                setUserData(user);

                // Check verification
                if (normalizeVerifiedBy(user.verifiedBy) === 'mobile') {
                    submitAd(undefined, true);
                } else {
                    requestOtpConfirmation();
                }
            } else if (currentMobileCheck?.emailExists) {
                // CASE 2: EMAIL EXISTS BUT HAS NO MOBILE
                // We MUST verify password first to prove ownership of the email account
                const loginPayload: any = { email, password };
                const loginRes = await fetch(`${API_BASE_URL}/api/user/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(loginPayload)
                });
                const loginData = await loginRes.json();

                if (!loginRes.ok || !loginData.token) {
                    toast.error(loginData.message || "Invalid password for your account");
                    setLoading(false);
                    return;
                }

                // Ownership verified, now proceed to OTP for the NEW number
                const token = loginData.token;
                Cookies.set('token', token, { expires: 7 });
                setIsUserLoggedIn(true);
                setUserData(loginData.user);

                requestOtpConfirmation();
            } else {
                // CASE 3: NEW USER / NEW MOBILE / NEW EMAIL
                // Send OTP, then register and post in handleVerifyOtp -> submitAd
                requestOtpConfirmation();
            }
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const subCat = categories
        .find(c => c.name === selectedCategory)
        ?.subcategories.find(s => s.name === selectedSubCategory);

    const selectedCategoryMeta = categories.find((c) => c.name === selectedCategory);
    const selectedSubCategoryMeta = selectedCategoryMeta?.subcategories.find((s) => s.name === selectedSubCategory);

    const selectedLocationMeta = locations.find((l) => l.name === selectedLocation);
    const selectedSubLocationMeta = selectedLocationMeta?.subLocations.find((s) => s.name === selectedSubLocation);
    const tempLocationMeta = locations.find((l) => l.name === tempLocation);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1500] flex items-start justify-center pt-20">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />

            <div className="relative bg-[#F4F6F8] w-full max-w-[565px] rounded-t-lg rounded-b-none overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-full duration-300 shadow-2xl h-[calc(100vh-80px)]">

                {view === 'loading' && (
                    <div className="flex-1 flex items-center justify-center min-h-[400px]">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                )}

                {view === 'category' && (
                    <div className="flex flex-col h-full bg-white">
                        <div className="p-2.5 border-b border-slate-100 flex items-center gap-3">
                            <button onClick={() => setView('form')}><ArrowLeft className="w-5 h-5 text-slate-600" /></button>
                            <h2 className="text-[16px] text-slate-800">{t('pick_a_category')}</h2>
                        </div>
                        <div className="p-2.5 bg-slate-50">
                            <div className="bg-white rounded-lg border border-slate-200 flex items-center px-3 py-2 gap-2">
                                <Search className="w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder={t('search_category')}
                                    className="flex-1 text-sm outline-none placeholder:text-slate-400"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div ref={categoryListRef} className="flex-1 overflow-y-auto">
                            <div className="divide-y divide-slate-100">
                                {categories.filter((c) => {
                                    const query = searchQuery.toLowerCase();
                                    if (!query) return true;

                                    return (
                                        c.name.toLowerCase().includes(query) ||
                                        (c.categoryNameBn || '').toLowerCase().includes(query) ||
                                        getLocalizedAreaName(c.name, c.categoryNameBn).toLowerCase().includes(query)
                                    );
                                }).map(cat => (
                                    <div
                                        key={cat._id}
                                        ref={(el) => {
                                            categoryRowRefs.current[cat._id] = el;
                                        }}
                                        className="flex flex-col bg-white"
                                    >
                                        <button
                                            onClick={() => handleCategoryAccordionToggle(cat._id)}
                                            className={cn(
                                                "w-full flex items-center justify-between py-1.5 px-4 hover:bg-slate-50 transition-colors",
                                                expandedCategory === cat._id && "bg-slate-50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center p-0.5">
                                                    {(cat.icon || cat.image) ? (
                                                        <img src={getImageUrl(cat.icon || cat.image || "") || ''} alt="" className="w-full h-full object-contain" loading="lazy" />
                                                    ) : (
                                                        <div className="w-full h-full bg-slate-100 rounded flex items-center justify-center text-slate-400 text-xs font-bold">
                                                            {getLocalizedAreaName(cat.name, cat.categoryNameBn)[0] || cat.name[0]}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">{getLocalizedAreaName(cat.name, cat.categoryNameBn)}</span>
                                            </div>
                                            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", expandedCategory === cat._id && "rotate-180")} />
                                        </button>

                                        {/* Subcategories Accordion */}
                                        {expandedCategory === cat._id && (
                                            <div className="bg-slate-50 border-t border-slate-100">

                                                {cat.subcategories.map(sub => (
                                                    <button
                                                        key={sub._id}
                                                        onClick={() => {
                                                            setSelectedCategory(cat.name);
                                                            setSelectedSubCategory(sub.name);
                                                            setView('location');
                                                        }}
                                                        className="w-full flex items-center gap-3 py-1 pl-14 pr-4 hover:bg-slate-100 transition-colors text-left"
                                                    >
                                                        <div className="w-6 h-6 rounded shrink-0 flex items-center justify-center overflow-hidden">
                                                            {(sub.image || sub.icon) ? (
                                                                <img src={getImageUrl(sub.image || sub.icon || "") || ''} className="w-full h-full object-contain" loading="lazy" />
                                                            ) : (
                                                                <div className="w-full h-full bg-slate-100 rounded flex items-center justify-center text-slate-400 text-[10px] font-bold">
                                                                    {getLocalizedAreaName(sub.name, sub.subCategoryNameBn)[0] || sub.name[0]}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-sm text-slate-600">{getLocalizedAreaName(sub.name, sub.subCategoryNameBn)}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {view === 'location' && (
                    <div className="flex flex-col h-full bg-white">
                        <div className="p-2.5 border-b border-slate-100 flex items-center gap-3">
                            <button onClick={() => setView('category')}><ArrowLeft className="w-5 h-5 text-slate-600" /></button>
                            <h2 className="text-[16px] text-slate-800">{t('pick_a_location')}</h2>
                        </div>
                        <div className="p-2.5 bg-slate-50">
                            <div className="bg-white rounded-lg border border-slate-200 flex items-center px-3 py-2 gap-2">
                                <Search className="w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder={t('search_location')}
                                    className="flex-1 text-sm outline-none placeholder:text-slate-400"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <div className="divide-y divide-slate-100">
                                {locations.filter((l) => {
                                    const query = searchQuery.toLowerCase();
                                    if (!query) return true;

                                    return (
                                        l.name.toLowerCase().includes(query) ||
                                        (l.locationNameBn || '').toLowerCase().includes(query) ||
                                        getLocalizedAreaName(l.name, l.locationNameBn).toLowerCase().includes(query)
                                    );
                                }).map(loc => (
                                    <button
                                        key={loc._id}
                                        onClick={() => {
                                            setTempLocation(loc.name);
                                            setSearchQuery("");
                                            setView('location-sub');
                                        }}
                                        className="w-full flex items-center justify-between py-1.5 px-4 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded shrink-0 flex items-center justify-center overflow-hidden">
                                                {loc.image ? (
                                                    <img src={getImageUrl(loc.image) || ''} alt="" className="w-full h-full object-contain" loading="lazy" />
                                                ) : (
                                                    <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                                )}
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">{getLocalizedAreaName(loc.name, loc.locationNameBn)}</span>
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-slate-400 -rotate-90" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {view === 'location-sub' && (
                    <div className="flex flex-col h-full bg-white">
                        <div className="p-2.5 border-b border-slate-100 flex items-center gap-3">
                            <button onClick={() => setView('location')}><ArrowLeft className="w-5 h-5 text-slate-600" /></button>
                            <h2 className="text-[16px] text-slate-800">{getLocalizedAreaName(tempLocation, tempLocationMeta?.locationNameBn)}</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-4">
                                <h3 className="text-sm mb-4 font-bold text-slate-800">{t('select_area')}</h3>
                                <div className="divide-y divide-slate-100">
                                    {locations.find(l => l.name === tempLocation)?.subLocations.map(sub => (
                                        <button
                                            key={sub._id}
                                            onClick={() => handleLocationSelect(sub.name)}
                                            className="w-full flex items-center justify-between py-3 px-2 hover:bg-slate-50 transition-colors group text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                {sub.image && (
                                                    <div className="w-6 h-6 shrink-0 rounded overflow-hidden">
                                                        <img src={getImageUrl(sub.image) || ''} alt="" className="w-full h-full object-contain" loading="lazy" />
                                                    </div>
                                                )}
                                                <span className="text-sm text-slate-700 font-medium group-hover:text-black transition-colors">{getLocalizedAreaName(sub.name, sub.subLocationNameBn)}</span>
                                            </div>
                                            <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90 group-hover:text-black transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}



                {view === 'features' && (
                    <div className="flex flex-col h-full bg-white">
                        <div className="p-2.5 border-b border-slate-100 flex items-center gap-3">
                            <button onClick={() => setView('location')}><ArrowLeft className="w-5 h-5 text-slate-600" /></button>
                            <h2 className="text-[16px] text-slate-800">{t('add_details')}</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {categories.find(c => c.name === selectedCategory)?.subcategories.find(s => s.name === selectedSubCategory)?.features?.map((feature) => (
                                <div key={feature._id} className="space-y-2">
                                    <label className="text-sm font-bold text-slate-800 block">{feature.name}</label>

                                    {feature.buttonType === 'Radio' && (
                                        <div className="flex flex-wrap gap-3">
                                            {feature.buttonItemNames.map((item) => (
                                                <label key={item} className="flex items-center gap-2 cursor-pointer">
                                                    {feature.selectionType === 'Multi' ? (
                                                        <>
                                                            <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors shadow-sm", (featureValues[feature.name] || []).includes(item) ? 'bg-black border-black text-white' : 'border-slate-300 bg-white')}>
                                                                {(featureValues[feature.name] || []).includes(item) && <Check className="w-3 h-3 stroke-[4]" />}
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={(featureValues[feature.name] || []).includes(item)}
                                                                onChange={() => {
                                                                    const currentVal = featureValues[feature.name] || [];
                                                                    if (currentVal.includes(item)) {
                                                                        setFeatureValues(prev => ({ ...prev, [feature.name]: currentVal.filter((i: string) => i !== item) }));
                                                                    } else {
                                                                        setFeatureValues(prev => ({ ...prev, [feature.name]: [...currentVal, item] }));
                                                                    }
                                                                }}
                                                            />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center transition-colors", featureValues[feature.name] === item ? 'border-black' : 'border-slate-300')}>
                                                                {featureValues[feature.name] === item && <div className="w-2 h-2 rounded-full bg-black" />}
                                                            </div>
                                                            <input
                                                                type="radio"
                                                                name={feature.name}
                                                                className="hidden"
                                                                checked={featureValues[feature.name] === item}
                                                                onChange={() => setFeatureValues(prev => ({ ...prev, [feature.name]: item }))}
                                                            />
                                                        </>
                                                    )}
                                                    <span className="text-sm text-slate-700 font-medium">{item}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {feature.buttonType === 'Box' && feature.buttonItemNames.length === 1 && (
                                        <input
                                            type={feature.inputType === 'Number' ? 'number' : 'text'}
                                            placeholder={feature.boxFadeName || feature.buttonItemNames[0]}
                                            value={featureValues[feature.name] || ''}
                                            onChange={(e) => setFeatureValues(prev => ({ ...prev, [feature.name]: e.target.value }))}
                                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-black transition-colors"
                                        />
                                    )}

                                    {feature.buttonType === 'Box' && feature.buttonItemNames.length > 1 && (
                                        feature.selectionType === 'Multi' ? (
                                            <div className="grid grid-cols-2 gap-2">
                                                {feature.buttonItemNames.map(item => (
                                                    <label key={item} className="flex items-center gap-2 p-2 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer transition-colors">
                                                        <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors shadow-sm", (featureValues[feature.name] || []).includes(item) ? 'bg-black border-black text-white' : 'border-slate-300 bg-white')}>
                                                            {(featureValues[feature.name] || []).includes(item) && <Check className="w-3 h-3 stroke-[4]" />}
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={(featureValues[feature.name] || []).includes(item)}
                                                            onChange={() => {
                                                                const currentVal = featureValues[feature.name] || [];
                                                                if (currentVal.includes(item)) {
                                                                    setFeatureValues(prev => ({ ...prev, [feature.name]: currentVal.filter((i: string) => i !== item) }));
                                                                } else {
                                                                    setFeatureValues(prev => ({ ...prev, [feature.name]: [...currentVal, item] }));
                                                                }
                                                            }}
                                                        />
                                                        <span className="text-xs text-slate-700 truncate font-medium">{item}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <select
                                                    value={featureValues[feature.name] || ''}
                                                    onChange={(e) => setFeatureValues(prev => ({ ...prev, [feature.name]: e.target.value }))}
                                                    className="w-full appearance-none border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-black bg-white transition-colors"
                                                >
                                                    <option value="" disabled>Select {feature.name}</option>
                                                    {feature.buttonItemNames.map(item => (
                                                        <option key={item} value={item}>{item}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        )
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-200 bg-slate-50">
                            <button
                                onClick={() => setView('form')}
                                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors mb-4"
                            >
                                {t('continue_btn')}
                            </button>
                        </div>
                    </div>
                )}

                {view === 'form' && (
                    <>
                        <div className="flex items-center justify-between p-2 px-4 border-b border-slate-200 bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-black hover:bg-slate-50 rounded-full transition-colors">
                                    <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                                </button>
                                <h2 className="text-[16px] text-black font-medium">{editAd ? t('edit_your_ad') : t('post_your_ad')}</h2>
                            </div>
                            <button onClick={onClose} className="p-1 hover:bg-slate-50 rounded-full">
                                <X className="w-5 h-5 text-black" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 pt-2 space-y-2 pb-40">
                            {/* Summary Card REMOVED */}

                            {loadingData ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                                </div>
                            ) : showOtpVerification ? (
                                <div className="bg-white rounded-xl p-6 border border-slate-200 min-h-[320px] flex flex-col items-center justify-center font-sans animate-in fade-in slide-in-from-right duration-300 shadow-sm">
                                    <div className="w-full max-w-xs space-y-2.5 text-center">
                                        <h3 className="text-[17px] font-bold text-slate-800 leading-tight">
                                            {otpTimer > 0 ? otpVerificationTitle : otpDontGetTitle}
                                        </h3>
                                        {otpTimer > 0 ? (
                                            <>
                                                <p className="text-[14px] text-slate-500 leading-tight">{otpVerificationSubtitle}</p>
                                                <p className="text-[14px] text-slate-700 leading-tight">
                                                    <span className="font-semibold">{otpNumberLabel}</span> <span className="font-bold text-slate-900">{phone}</span>
                                                </p>
                                            </>
                                        ) : (
                                            <div className="pt-1">
                                                {!isEditingOtpPhone ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <p className="text-[14px] text-slate-700 font-semibold">{phone}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditedOtpPhone(phone.trim());
                                                                setIsEditingOtpPhone(true);
                                                            }}
                                                            className="px-2 py-1 text-xs rounded-md border border-slate-300 text-slate-700 hover:bg-white"
                                                        >
                                                            {otpEditLabel}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="tel"
                                                            value={editedOtpPhone}
                                                            onChange={(e) => setEditedOtpPhone(e.target.value)}
                                                            className="flex-1 h-9 px-3 border border-[#0088cc] rounded-md text-sm text-slate-800 text-center focus:outline-none"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleSaveEditedOtpPhone}
                                                            disabled={loading || !editedOtpPhone.trim()}
                                                            className="px-2.5 h-9 text-xs rounded-md border border-slate-300 text-slate-700 hover:bg-white disabled:opacity-50"
                                                        >
                                                            {otpSaveLabel}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex gap-2 justify-center pt-2">
                                            {otp.map((digit, index) => (
                                                <input
                                                    key={index}
                                                    ref={(el) => { otpInputRefs.current[index] = el; }}
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={1}
                                                    value={digit}
                                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                    className="w-10 h-10 border border-slate-300 rounded text-center text-lg font-bold focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-slate-700"
                                                />
                                            ))}
                                        </div>

                                        <div className="pt-1">
                                            {otpTimer > 0 ? (
                                                <div className="text-[13px] text-slate-500 font-medium text-center">
                                                    <span className="font-semibold">{otpTimerPrefixLabel}:</span>
                                                    <span className="text-slate-900 font-bold ml-1">{formattedOtpTimer}</span>
                                                    <span className="ml-1">{otpMinutesLabel}</span>
                                                </div>
                                            ) : (
                                                <p className="text-[12px] text-slate-500 leading-relaxed">{otpAfterTimerMessage}</p>
                                            )}
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                onClick={handleOtpPrimaryAction}
                                                disabled={loading}
                                                className="w-full py-3 rounded-lg text-sm font-bold tracking-wider transition-colors bg-[#1A1A1A] text-white hover:bg-black disabled:opacity-50"
                                            >
                                                {loading ? otpLoadingLabel : (otpTimer > 0 ? otpVerifyLabel : otpResendLabel)}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className={cn(
                                        "bg-white rounded-lg p-3 border",
                                        attemptedSubmit && images.length === 0 && existingImages.length === 0 ? "border-red-500" : "border-slate-100"
                                    )}>
                                        {(() => {
                                            const imageLimit = settings.productPhotoLimit || 10;
                                            const reachedLimit = images.length + existingImages.length >= imageLimit;

                                            return (
                                                <>
                                                    <div className="mb-2">
                                                        <span className="text-[11px] font-bold uppercase text-slate-600 tracking-tight">
                                                            {t('add_photos_btn2')}
                                                        </span>
                                                    </div>

                                                    {attemptedSubmit && images.length === 0 && existingImages.length === 0 && (
                                                        <p className="text-[10px] text-red-500 font-bold mb-1 uppercase tracking-tight">{t('field_required')}</p>
                                                    )}
                                                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
                                                        {existingImages.map((imgUrl, i) => (
                                                            <div key={imgUrl} className="relative min-w-[80px] h-[80px] rounded-xl overflow-hidden bg-slate-50 border border-slate-100 group">
                                                                <img src={getImageUrl(imgUrl) || ''} alt="" className="w-full h-full object-contain" loading="lazy" />
                                                                <button onClick={() => removeExistingImage(imgUrl)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100">
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {images.map((file, i) => (
                                                            <div key={i} className="relative min-w-[80px] h-[80px] rounded-xl overflow-hidden bg-slate-50 border border-slate-100 group">
                                                                <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-contain" loading="lazy" />
                                                                <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100">
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {images.length + existingImages.length < imageLimit && (
                                                            <>
                                                                <button
                                                                    onClick={() => !compressing && fileInputRef.current?.click()}
                                                                    disabled={compressing}
                                                                    className={cn(
                                                                        "min-w-[80px] h-[80px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all",
                                                                        compressing
                                                                            ? "border-slate-200 bg-slate-50 cursor-not-allowed text-slate-300"
                                                                            : "border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-400 bg-slate-50/50 hover:bg-slate-100/80 active:scale-95"
                                                                    )}
                                                                >
                                                                    {compressing ? (
                                                                        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                                                                    ) : (
                                                                        <img src="/gallery.png" alt="Gallery" className="w-8 h-8 object-contain" />
                                                                    )}
                                                                    <span
                                                                        className={cn(
                                                                            "mt-1 leading-none text-slate-500",
                                                                            language === 'bn' ? 'text-[11px] font-bold' : 'text-[8px] font-semibold'
                                                                        )}
                                                                    >
                                                                        {/* {compressing ? "..." : (language === 'bn' ? 'গ্যালারি' : 'Gallery')} */}
                                                                        {compressing ? "..." : (language === 'bn' ? 'গ্যালারি' : 'From')}
                                                                    </span>
                                                                    <span
                                                                        className={cn(
                                                                            "text-center text-slate-700 leading-none",
                                                                            language === 'bn' ? 'text-[8px] font-semibold' : 'text-[11px] font-bold'
                                                                        )}
                                                                    >
                                                                        {/* {compressing ? t('processing') : t('add_photos_btn')} */}
                                                                        {compressing ? t('processing') : (language === 'bn' ? 'থেকে' : 'Gallery')}
                                                                    </span>


                                                                </button>

                                                                <button
                                                                    onClick={() => !compressing && !reachedLimit && cameraInputRef.current?.click()}
                                                                    disabled={compressing || reachedLimit}
                                                                    className={cn(
                                                                        "min-w-[80px] h-[80px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all md:hidden",
                                                                        compressing || reachedLimit
                                                                            ? "border-slate-200 bg-slate-50 cursor-not-allowed text-slate-300"
                                                                            : "border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-400 bg-slate-50/50 hover:bg-slate-100/80 active:scale-95"
                                                                    )}
                                                                    aria-label="Capture from camera"
                                                                    title="Capture from camera"
                                                                >
                                                                    {compressing ? (
                                                                        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                                                                    ) : (
                                                                        <img src="/camera.png" alt="Camera" className="w-8 h-8 object-contain" />
                                                                    )}
                                                                    <span
                                                                        className={cn(
                                                                            "mt-1 text-center text-slate-500 leading-none",
                                                                            language === 'bn' ? 'text-[11px] font-bold' : 'text-[8px] font-semibold'
                                                                        )}
                                                                    >
                                                                        {/* {compressing ? t('processing') : t('add_cameras_btn')} */}
                                                                        {compressing ? "..." : (language === 'bn' ? 'ক্যামেরা' : 'by')}

                                                                    </span>
                                                                    <span
                                                                        className={cn(
                                                                            "leading-none text-slate-700",
                                                                            language === 'bn' ? 'text-[8px] font-semibold' : 'text-[11px] font-bold'
                                                                        )}
                                                                    >
                                                                        {/* {compressing ? "..." : (language === 'bn' ? 'ক্যামেরা' : 'Camera')} */}
                                                                        {compressing ? t('processing') : (language === 'bn' ? 'দিয়ে' : 'Camera')}
                                                                    </span>

                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                                        <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />
                                    </div>

                                    <div className="space-y-2 font-sans bg-slate-100">
                                        <div className={cn(
                                            "bg-white rounded-lg border px-3 py-2 relative",
                                            attemptedSubmit && !headline.trim() ? "border-red-500" : "border-slate-500"
                                        )}>
                                            {attemptedSubmit && !headline.trim() && <p className="text-[9px] text-red-500 font-bold uppercase">{t('field_required')}</p>}
                                            <input
                                                ref={headlineInputRef}
                                                type="text"
                                                placeholder={t('headline_placeholder')}
                                                value={headline}
                                                onChange={(e) => setHeadline(e.target.value)}
                                                onBlur={(e) => {
                                                    const val = e.target.value.toLowerCase();
                                                    const blocked = settings.blockCheckInHeadline || [];
                                                    const found = blocked.find(word => val.includes(word.toLowerCase()));
                                                    if (found) {
                                                        toast.error(`Headline contains restricted word: ${found}`);
                                                    }
                                                }}
                                                className="w-full pl-4 py-1 text-sm text-black placeholder:text-slate-400 focus:outline-none bg-white"
                                            />
                                        </div>

                                        <div className={cn(
                                            "bg-white rounded-lg border px-3 py-3",
                                            attemptedSubmit && !description.trim() ? "border-red-500" : "border-slate-500"
                                        )}>
                                            {attemptedSubmit && !description.trim() && <p className="text-[9px] text-red-500 font-bold uppercase">{t('field_required')}</p>}
                                            <textarea
                                                placeholder={t('description_placeholder')}
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                onBlur={(e) => {
                                                    const val = e.target.value.toLowerCase();
                                                    const blocked = settings.blockCheckInDescription || [];
                                                    const found = blocked.find(word => val.includes(word.toLowerCase()));
                                                    if (found) {
                                                        toast.error(`Description contains restricted word: ${found}`);
                                                    }
                                                }}
                                                onFocus={() => setShowDescriptionHelp(false)}
                                                onClick={() => setShowDescriptionHelp(false)}
                                                className="w-full text-sm text-black placeholder:text-slate-400 focus:outline-none px-1 bg-white resize-y min-h-[100px] block"
                                            />
                                            {showDescriptionHelp && (
                                                <p className="text-[10px] text-black mt-2 px-1 leading-tight">{t('description_help_text')}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Category & Location Selection Section */}
                                    <div className={cn(
                                        "bg-white rounded-lg border p-3 shadow-sm font-sans space-y-2",
                                        attemptedSubmit && (!selectedCategory || !selectedLocation) ? "border-red-500" : "border-slate-500"
                                    )}>
                                        {attemptedSubmit && (!selectedCategory || !selectedLocation) && <p className="text-[9px] text-red-500 font-bold uppercase">{t('field_required')}</p>}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-[13px] text-slate-600 font-medium">
                                                <div
                                                    className={cn(
                                                        "flex items-center gap-1 transition-colors",
                                                        !editAd ? "cursor-pointer hover:text-black" : "cursor-default"
                                                    )}
                                                    onClick={() => !editAd && setView('category')}
                                                >
                                                    <span className={selectedCategory ? "text-black font-bold" : "text-slate-400"}>
                                                        {selectedCategory
                                                            ? `${getLocalizedAreaName(selectedCategory, selectedCategoryMeta?.categoryNameBn)}${selectedSubCategory ? `, ${getLocalizedAreaName(selectedSubCategory, selectedSubCategoryMeta?.subCategoryNameBn)}` : ''}`
                                                            : t('category')}
                                                    </span>
                                                    {!editAd && <ChevronDown className="w-3 h-3 text-slate-400" />}
                                                </div>
                                                <div
                                                    className={cn(
                                                        "flex items-center gap-1 transition-colors",
                                                        !editAd ? "cursor-pointer hover:text-black" : "cursor-default"
                                                    )}
                                                    onClick={() => !editAd && setView('category')}
                                                >
                                                    <span className={selectedLocation ? "text-black font-bold" : "text-slate-400"}>
                                                        {selectedLocation
                                                            ? `${getLocalizedAreaName(selectedLocation, selectedLocationMeta?.locationNameBn)}${selectedSubLocation ? `, ${getLocalizedAreaName(selectedSubLocation, selectedSubLocationMeta?.subLocationNameBn)}` : ''}`
                                                            : t('location')}
                                                    </span>
                                                    {!editAd && <ChevronDown className="w-3 h-3 text-slate-400" />}
                                                </div>
                                            </div>
                                            {!editAd && (
                                                <button
                                                    onClick={() => setView('category')}
                                                    className="text-[12px] text-[#0088cc] font-bold hover:underline"
                                                >
                                                    {(selectedCategory || selectedLocation) ? t('change_btn') : t('select_btn')}
                                                </button>
                                            )}
                                        </div>

                                        {Object.keys(featureValues).length > 0 && (
                                            <div className="flex flex-col gap-1 border-t border-slate-100 pt-2">
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {Object.entries(featureValues).map(([key, value]) => (
                                                        <div key={key} className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[10px] text-slate-600 flex items-center gap-1">
                                                            <span className="font-bold">{key}:</span>
                                                            <span>{String(value)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {subCat?.priceBoxShow && (
                                        <div className={cn(
                                            "bg-slate-100 rounded-lg border flex items-center overflow-hidden h-10 px-3",
                                            attemptedSubmit && !price.trim() ? "border-red-500" : "border-slate-500"
                                        )}>
                                            <div className="flex-1 flex items-center pr-2">
                                                <span className={cn(
                                                    "text-[13px] pr-2 border-r whitespace-nowrap",
                                                    attemptedSubmit && !price.trim() ? "text-red-500 border-red-500" : "text-slate-800 border-slate-300"
                                                )}>
                                                    {subCat.priceBoxName || "দাম"}
                                                </span>
                                                <input
                                                    type="number"
                                                    placeholder=""
                                                    value={price}
                                                    onChange={(e) => setPrice(e.target.value)}
                                                    className="w-full bg-transparent pl-2 text-[13px] text-black placeholder:text-slate-400 focus:outline-none"
                                                />
                                            </div>
                                            <div className="relative h-full flex items-center pl-2 border-l border-slate-300">
                                                <select
                                                    value={priceType}
                                                    onChange={(e) => setPriceType(e.target.value)}
                                                    className="bg-transparent text-[12px] text-slate-700 font-medium pr-6 focus:outline-none appearance-none cursor-pointer"
                                                >
                                                    <option value="Negotiable">{t('price_negotiable')}</option>
                                                    <option value="Fixed">{t('price_fixed')}</option>
                                                </select>
                                                <ChevronDown className="absolute right-0 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    )}

                                    <div className={cn(
                                        "bg-white rounded-lg border p-3.5 space-y-2 shadow-sm font-sans",
                                        attemptedSubmit && (!name.trim() || !phone.trim() || (!isUserLoggedIn && !password.trim())) ? "border-red-500" : "border-slate-500"
                                    )}>
                                        {attemptedSubmit && (!name.trim() || !phone.trim() || (!isUserLoggedIn && !password.trim())) && <p className="text-[9px] text-red-500 font-bold uppercase">{t('field_required')}</p>}
                                        <div className="space-y-1">
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder={t('name_placeholder')}
                                                className={cn(
                                                    "w-full text-[13px] text-black focus:outline-none placeholder:text-black px-1 border-b pb-1",
                                                    attemptedSubmit && !name.trim() ? "border-red-300" : "border-slate-500"
                                                )}
                                            />
                                        </div>

                                        <div className={cn(
                                            "flex items-center gap-2 border-b pb-1",
                                            attemptedSubmit && !phone.trim() ? "border-red-300" : "border-slate-500"
                                        )}>
                                            <div className="flex items-center justify-center w-4 h-4 rounded-full bg-cyan-400 text-white shrink-0">
                                                <Check className="w-2.5 h-2.5 stroke-[4]" />
                                            </div>
                                            <input
                                                type="tel"
                                                value={phone}
                                                readOnly={!!(userData?.mobile || (initialMobile && !initialMobile.includes('@')) || editAd?.phone)}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder={t('phone_number_placeholder')}
                                                className={cn(
                                                    "flex-1 text-[14px] text-black tracking-wide focus:outline-none bg-transparent",
                                                    (userData?.mobile || (initialMobile && !initialMobile.includes('@')) || editAd?.phone) ? "cursor-not-allowed" : "cursor-text"
                                                )}
                                            />
                                            {!(userData?.mobile || (initialMobile && !initialMobile.includes('@')) || editAd?.phone) && (
                                                <button
                                                    onClick={() => {
                                                        if (additionalPhones.length > 0) {
                                                            setPhone(additionalPhones[0].number);
                                                            setAdditionalPhones(prev => prev.slice(1));
                                                        } else {
                                                            setPhone("");
                                                        }
                                                    }}
                                                    className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors shrink-0"
                                                >
                                                    <X className="w-3 h-3 stroke-[3]" />
                                                </button>
                                            )}
                                        </div>

                                        {(!isUserLoggedIn || (phone.trim() !== userData?.mobile)) && (
                                            <div className="space-y-1 pt-2">
                                                <input
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder={t('password_placeholder')}
                                                    className={cn(
                                                        "w-full text-[13px] text-black focus:outline-none placeholder:text-black px-1 border-b pb-1",
                                                        attemptedSubmit && (phone.trim() !== userData?.mobile) && !password.trim() ? "border-red-300" : "border-slate-500"
                                                    )}
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-2 pt-1">
                                            <div className="space-y-2">
                                                {additionalPhones.map((ap, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-500 group">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[13px] font-medium text-black">{ap.number}</span>
                                                            <span className="text-[10px] px-1.5 py-0.5 bg-black text-white rounded uppercase">{ap.types[0]}</span>
                                                        </div>
                                                        <button onClick={() => setAdditionalPhones(prev => prev.filter((_, i) => i !== idx))}>
                                                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex items-center gap-2 pt-2 pb-0">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="tel"
                                                        id="additional_phone"
                                                        className="block px-3 pb-2 pt-3 w-full text-[13px] text-black bg-transparent rounded-lg border border-slate-500 appearance-none focus:outline-none focus:ring-0 focus:border-black peer"
                                                        placeholder=" "
                                                        value={newAdditionalNumber}
                                                        onChange={(e) => setNewAdditionalNumber(e.target.value)}
                                                        disabled={additionalPhones.length >= 5}
                                                    />
                                                    <label
                                                        htmlFor="additional_phone"
                                                        className="absolute text-[12px] text-slate-400 duration-300 transform -translate-y-3 scale-90 top-1 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-90 peer-focus:-translate-y-3 left-2"
                                                    >
                                                        {additionalPhones.length >= 5 ? t('limit_reached_max_5') : t('add_another_number')}
                                                    </label>
                                                </div>

                                                <div className="relative h-[42px] w-[90px] border border-slate-500 rounded-lg flex items-center bg-white overflow-hidden shrink-0">
                                                    <select
                                                        value={newAdditionalType}
                                                        onChange={(e) => setNewAdditionalType(e.target.value)}
                                                        className="w-full h-full bg-transparent text-[11px] text-black font-medium pl-2 focus:outline-none appearance-none cursor-pointer"
                                                        disabled={additionalPhones.length >= 5}
                                                    >
                                                        <option value="whatsapp">WhatsApp</option>
                                                        <option value="telegram">Telegram</option>
                                                        <option value="imo">Imo</option>
                                                        <option value="mobile">Mobile</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-1 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={addAdditionalPhone}
                                                    disabled={additionalPhones.length >= 5}
                                                    className={cn(
                                                        "w-8 h-8 rounded-full text-white flex items-center justify-center active:scale-90 transition-transform shrink-0 shadow-sm",
                                                        additionalPhones.length >= 5 ? "bg-slate-300 cursor-not-allowed" : "bg-black"
                                                    )}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <label className="flex items-center gap-2 cursor-pointer pt-0">
                                                <input
                                                    type="checkbox"
                                                    className="w-3.5 h-3.5 rounded border-slate-300 text-slate-800 focus:ring-0"
                                                    checked={hidePhone}
                                                    onChange={(e) => setHidePhone(e.target.checked)}
                                                />
                                                <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">{t('hide_number_only_message')}</span>
                                            </label>
                                        </div>

                                    </div>

                                    {/* Submission Section */}
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className={cn(
                                                "w-full py-3.5 rounded-lg text-[13px] font-bold tracking-widest active:scale-[0.98] transition-all",
                                                loading
                                                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                                                    : "bg-[#1A1A1A] text-white hover:bg-black"
                                            )}
                                        >
                                            {loading ? (editAd ? t('updating') : t('posting')) : (editAd ? t('edit_ad_btn') : t('post_ad_btn_1'))}
                                        </button>
                                        <label className="flex items-center gap-2 mt-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="w-3.5 h-3.5 rounded-sm border-slate-300 text-slate-800 focus:ring-0"
                                                checked={hasReadRules}
                                                onChange={(e) => setHasReadRules(e.target.checked)}
                                            />
                                            <span className="text-[10px] text-slate-500 font-medium leading-none">
                                                {t('i_have_read_accept')} <span className="text-cyan-500 underline cursor-pointer" onClick={() => setShowTnC(true)}>{t('terms_and_con')}</span> & <span className="text-cyan-500 underline cursor-pointer" onClick={() => setShowPrivacy(true)}>{t('privacy_policy')}</span>
                                            </span>

                                        </label>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}

                {showOtpConfirmation && (
                    <div className="absolute inset-0 z-[2200] bg-black/40 flex items-center justify-center p-4">
                        <div className="w-full max-w-sm bg-white rounded-xl p-5 shadow-2xl border border-slate-200">
                            <h3 className="text-[17px] font-bold text-slate-900 mb-4 text-center">{otpConfirmTitle}</h3>

                            <div className="flex items-center gap-2">
                                <input
                                    type="tel"
                                    value={isEditingOtpPhone ? editedOtpPhone : phone}
                                    onChange={(e) => setEditedOtpPhone(e.target.value)}
                                    disabled={!isEditingOtpPhone}
                                    className={cn(
                                        "flex-1 h-11 px-3 border rounded-lg text-sm text-slate-800 focus:outline-none text-center",
                                        isEditingOtpPhone ? "border-[#0088cc]" : "border-slate-300 bg-slate-100"
                                    )}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isEditingOtpPhone) {
                                            setEditedOtpPhone(phone.trim());
                                            setIsEditingOtpPhone(true);
                                            return;
                                        }

                                        const trimmed = editedOtpPhone.trim();
                                        if (!/^\d{11}$/.test(trimmed)) {
                                            toast.error("Please enter a valid 11-digit mobile number");
                                            return;
                                        }

                                        setPhone(trimmed);
                                        setEditedOtpPhone(trimmed);
                                        setIsEditingOtpPhone(false);
                                    }}
                                    className="h-11 px-4 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                                >
                                    {isEditingOtpPhone ? otpSaveLabel : otpEditLabel}
                                </button>
                            </div>

                            <p className="mt-4 text-sm text-slate-700 leading-relaxed text-center">
                                {otpConfirmSubtitle}
                            </p>

                            <div className="mt-5 grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowOtpConfirmation(false);
                                        setIsEditingOtpPhone(false);
                                    }}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                                >
                                    {otpNoLabel}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmOtpSend}
                                    disabled={loading}
                                    autoFocus
                                    className="w-full px-4 py-2.5 rounded-lg bg-[#D9EDFF] text-[#08609E] border border-[#9FCBEE] hover:bg-[#CCE7FF] focus:outline-none focus:ring-2 focus:ring-[#7AB8E8] disabled:opacity-50"
                                >
                                    {otpYesLabel}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Floating Chat Icon */}
                <div
                    className="absolute right-5 bottom-20 z-[210] cursor-pointer"
                    onClick={() => window.open('https://m.me/shadamonDotCom', '_blank')}
                >
                    <div className="flex flex-col items-center">
                        <button className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all mb-1">
                            <MessageCircle className="w-5 h-5 fill-white" />
                        </button>
                        <button className="text-[11px] text-black font-bold">{t('help_chat')}</button>
                    </div>
                </div>
                {view === 'status' && submissionStatus && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white text-center font-sans">
                        {submissionStatus.status === 'review' ? (
                            <>
                                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                                    <Loader2 className="w-10 h-10 text-amber-500 animate-[spin_3s_linear_infinite]" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-3">{t('ad_under_review')}</h2>
                                <p className="text-slate-600 mb-8 leading-relaxed max-w-sm mx-auto">
                                    {t('ad_under_review_desc')}
                                </p>
                                <div className="w-full space-y-3">
                                    <button
                                        onClick={() => {
                                            if (onSuccess) onSuccess(submissionStatus.ad);
                                            onClose();
                                        }}
                                        className="w-full py-4 bg-black text-white rounded-xl font-bold text-sm tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                                    >
                                        {t('promote_your_ad')}
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                                    >
                                        {t('do_it_later')}
                                    </button>
                                </div>
                            </>
                        ) : submissionStatus.status === 'limit-reached' ? (
                            <>
                                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                                    <X className="w-10 h-10 text-red-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-3">{t('free_ad_limit_reached')}</h2>
                                <p className="text-slate-600 mb-8 leading-relaxed max-w-sm mx-auto">
                                    {t('free_ad_limit_reached_desc')}
                                </p>
                                <div className="w-full space-y-3">
                                    <button
                                        onClick={() => {
                                            if (onSuccess) onSuccess(submissionStatus.ad);
                                            onClose();
                                        }}
                                        className="w-full py-4 bg-[#FF4F01] text-white rounded-xl font-bold text-sm tracking-widest hover:bg-[#e64600] transition-all flex items-center justify-center gap-2"
                                    >
                                        {t('promote_your_ad')}
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                                    >
                                        {t('go_back_btn')}
                                    </button>
                                </div>
                            </>
                        ) : null}
                    </div>
                )}
            </div>
            <InfoModal
                isOpen={showTnC}
                onClose={() => setShowTnC(false)}
                title="Shadamon.com এর টার্ম ও কণ্ডিশন"
                content={`Shadamon.com ব্যবহার করার মাধ্যমে আপনি আমাদের নীতিমালা ও শর্তাবলী মেনে চলতে সম্মত হচ্ছেন। দয়া করে এটি মনোযোগ দিয়ে পড়ুন।

১. সাধারণ
ব্যবহারকারী এবং বিজ্ঞাপনদাতারা নিশ্চিত করবেন যে তাদের আপলোড করা সকল কনটেন্ট (লেখা, ছবি, ভিডিও বা গ্রাফিক্স) প্রযোজ্য সকল আইন অনুযায়ী সঠিক। Shadamon.com কোনো আইনি বা তথ্যগত অসঙ্গতির জন্য দায়ভার বহন করে না।
ব্যবহারকারীরা নিশ্চয়তা দেন যে তাদের কনটেন্ট কপিরাইট বা অন্যান্য আইনি অধিকার লঙ্ঘন করে না এবং Shadamon.com কে কোনো দাবী, ক্ষতি বা দায় থেকে মুক্ত রাখবেন।

২. কপিরাইট
ব্যবহারকারীরা Shadamon.com-কে তাদের কনটেন্ট ব্যবহার, প্রকাশ, সম্পাদনা, অনুবাদ, ডেরিভেটিভ তৈরি এবং বিতরণের জন্য আজীবন, রায়াল্টি-ফ্রি, অ-বিশেষ অধিকার প্রদান করছেন।
Shadamon.com-এর সকল কনটেন্ট, সফটওয়্যার এবং সেবাসমূহ আমাদের এবং আমাদের পার্টনারদের সম্পত্তি। লিখিত অনুমতি ছাড়া এগুলো অনুলিপি বা বিতরণ করা যাবে না।

৩. Watermarks ও ছবি
Shadamon.com-এ থাকা ছবিতে ওয়াটারমার্ক থাকতে পারে যাতে অন্যত্র ব্যবহার না হয়। প্রয়োজন হলে Shadamon.com কনটেন্ট সম্পাদনা বা বাতিল করার অধিকার রাখে।

৪. নিরাপত্তা ও আইনি বিষয়
যদি কোনো কনটেন্ট আইন লঙ্ঘন করে, Shadamon.com প্রয়োজন হলে কর্তৃপক্ষের সাথে সহযোগিতা করবে। ব্যবহারকারীর পরিচয় যাচাই করা যেতে পারে।

৫. প্রাইভেসি
Shadamon.com ব্যবহারকারীর তথ্য সংগ্রহ করে সেবা প্রদানের ও উন্নয়নের জন্য। এই তথ্য ব্যবহার, গবেষণা, মার্কেটিং ও প্রোডাক্ট উন্নয়নে ব্যবহারের জন্য আপনি সম্মত হবেন। প্রয়োজনে তথ্য শেয়ার করা হতে পারে।

৬. কুকিজ
Shadamon.com সঠিকভাবে কাজ করার জন্য কুকিজ ব্যবহার করে। কুকিজ ব্যক্তিগত তথ্য সংগ্রহ করে না।

৭. ইমেল, মোবাইল নং ও ব্যাক্তিগত তথ্যাবলি 
বিজ্ঞাপন পোস্ট করার জন্য মোবাইল নাম্বার বা ইমেল ঠিকানা আবশ্যক। ইমেল ঠিকানা গোপন রাখা হবে, তবে ব্যবহারকারীরা Shadamon.com-এর মাধ্যমে বার্তা পাঠাতে পারবেন।

৮. সাইট অ্যাভেলিবিলিটি
Shadamon.com “যেমন আছে” ভিত্তিতে সরবরাহ করা হচ্ছে এবং অনবরত বা নিরাপদ অ্যাক্সেসের নিশ্চয়তা নেই।

৯. তৃতীয় পক্ষের লিঙ্ক
Shadamon.com-এ তৃতীয় পক্ষের ওয়েবসাইটের লিঙ্ক থাকতে পারে। সেগুলোর জন্য Shadamon.com দায়ী নয়। ব্যবহারকারী নিজ দায়িত্বে এগুলো ব্যবহার করবেন।

১০. পেইড কনটেন্ট ও সার্ভিস
কিছু সেবা যেমন প্রিমিয়াম মেম্বারশিপ, বিজ্ঞাপন প্রচারণা এবং ডোরস্টেপ ডেলিভারি পেইড হতে পারে। Shadamon.com এইসব কনটেন্ট নিয়ন্ত্রণ করতে পারে এবং শর্ত লঙ্ঘনের ক্ষেত্রে তা বাতিল করার অধিকার রাখে।

১১. দায়মুক্তি
Shadamon.com কোনো ভুল, ডাউনটাইম, তৃতীয় পক্ষের কনটেন্ট বা ব্যবহার থেকে উদ্ভূত ক্ষতির জন্য দায়ী নয়।

১২. ক্ষতিপূরণ
ব্যবহারকারীরা Shadamon.com এবং তার স্টাফকে শর্তাবলী লঙ্ঘনের কারণে সৃষ্ট যেকোনো ক্ষতি বা দাবী থেকে মুক্ত রাখবেন।

১৩. সংশোধনী
Shadamon.com যে কোনো সময় শর্তাবলী পরিবর্তন করতে পারে। প্ল্যাটফর্ম ব্যবহার চালিয়ে যাওয়া মানে সংশোধিত শর্তাবলী মেনে নেওয়া।

১৪. প্রযোজ্য আইন
Shadamon.com বাংলাদেশের আইন ও নিয়ম অনুযায়ী পরিচালিত হয়।`}
            />
            <InfoModal
                isOpen={showPrivacy}
                onClose={() => setShowPrivacy(false)}
                title="Shadamon.com প্রাইভেসি পলিসি"
                content={`Shadamon.com-এ আপনার গোপনীয়তা এবং নিরাপত্তা আমাদের জন্য গুরুত্বপূর্ণ। নিরাপদ এবং কার্যকর সেবা প্রদানের জন্য আমরা কিছু ব্যক্তিগত তথ্য সংগ্রহ, ব্যবহার এবং পরিচালনা করি।

১. তথ্য সংগ্রহ
আমরা নিম্নলিখিত তথ্য সংগ্রহ করতে পারি:
• ইমেল, ফোন নম্বর এবং ব্যাক্তিগত ও প্রয়োজন অনুযায়ী আর্থিক তথ্য।
• ডিভাইস ও ব্রাউজার ডেটা, পেজ ভিউ ও ট্রাফিক স্ট্যাটিস্টিক।
• অন্যান্য প্রযুক্তিগত তথ্য, যেমন IP ঠিকানা ও স্ট্যান্ডার্ড ওয়েব লগ।
তথ্য সরবরাহ করলে আপনি Shadamon.com সার্ভারে এর সংরক্ষণ ও ব্যবহারে সম্মত হবেন।

২. তথ্য ব্যবহার
আমরা তথ্য ব্যবহার করি:
• সেবা প্রদানে ও উন্নতিতে।
• সমস্যার সমাধান, ফি সংগ্রহ এবং টেকনিকাল সহায়তায়।
• নিরাপদ লেনদেন নিশ্চিত করতে এবং নীতি বাস্তবায়নে।
• ব্যবহারকারীর অভিজ্ঞতা কাস্টমাইজ করতে ও সেবায় আগ্রহ মাপতে।
• আপডেট, অফার ও প্রচারণা জানাতে।

৩. কুকিজ
কুকিজ কী?
কুকিজ হলো ছোট তথ্য ফাইল যা আপনার ডিভাইসে সংরক্ষিত হয়। এগুলো Shadamon.com-কে আপনার ডিভাইস চিনতে এবং ব্যবহারকারীর অভিজ্ঞতা উন্নত করতে সাহায্য করে।

ব্যব্যবহৃত কুকিজের ধরন:
• সেশন কুকিজ: সেবা চলমান রাখতে।
• প্রেফারেন্স কুকিজ: সেটিংস মনে রাখার জন্য।
• সিকিউরিটি কুকিজ: নিরাপত্তা রক্ষা করতে।
আপনি আপনার ব্রাউজার সেটিংস থেকে কুকিজ নিয়ন্ত্রণ করতে বা প্রত্যাখ্যান করতে পারেন। তবে কিছু ফিচার কাজ নাও করতে পারে।

৪. তথ্য শেয়ারিং ও প্রকাশ
Shadamon.com ব্যবহারকারীর অনুমতি ছাড়া তথ্য বিক্রি বা ভাড়া দেয় না। তথ্য শেয়ার করা হতে পারে:
• সেই বিক্রেতাদের সঙ্গে যাদের সাথে আপনি যোগাযোগ করেছেন বা আগ্রহ দেখিয়েছেন।
• আইনি প্রয়োজন অনুযায়ী Authorities-এর সাথে।
• পার্টনারদের সঙ্গে সেবা পরিচালনা, বিশ্লেষণ, মার্কেটিং ও উন্নয়নের জন্য।

৫. যোগাযোগ ও ইমেল
আপনি Shadamon.com ব্যবহার করলে বিজ্ঞাপন বা অফার সম্পর্কিত মেসেজ পেতে পারেন। 
ব্যবহারকারীরা আমাদের টুল ব্যবহার করে স্প্যাম পাঠাতে পারবেন না। Shadamon.com মেসেজ মনিটর করে যেকোনো ক্ষতিকর কনটেন্ট প্রতিরোধ করে।

৬. নিরাপত্তা
• আমরা এনক্রিপশন, পাসওয়ার্ড ও অন্যান্য পদ্ধতি ব্যবহার করে ব্যক্তিগত তথ্য রক্ষা করি।
• ব্যক্তিগত তথ্য গোপন রাখা হয় যতক্ষণ না আপনি নিজে শেয়ার করেন। অন্যদের যোগাযোগ তথ্য প্রকাশ করা নিষিদ্ধ।

৭. আনসাবস্ক্রাইব ও তথ্য অপসারণ
আপনি যেকোনো সময় আপনার ব্যক্তিগত তথ্য পর্যালোচনা বা মুছে ফেলার জন্য আমাদের সাথে যোগাযোগ করতে পারেন।

৮. বিজ্ঞাপন ও রিমার্কেটিং
Shadamon.com প্রদর্শনী বিজ্ঞাপন এবং রিমার্কেটিং ব্যবহার করে।`}
            />
        </div>
    );
}
