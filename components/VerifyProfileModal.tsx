"use client";

import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../utils/apiConfig';
import Cookies from 'js-cookie';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import InfoModal from './InfoModal';
import { INFO_CONTENT, getInfoContentForLanguage } from '@/utils/infoContent';
import { useLanguage } from '../app/context/LanguageContext';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface VerifyProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
}

export default function VerifyProfileModal({ isOpen, onClose, user }: VerifyProfileModalProps) {
    const { language } = useLanguage();
    const [isVerifyBadge, setIsVerifyBadge] = useState(true);
    const [showManualPayment, setShowManualPayment] = useState(false);
    const [showHelpline, setShowHelpline] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTnC, setShowTnC] = useState(false);
    const [showRefund, setShowRefund] = useState(false);

    const privacyContent = getInfoContentForLanguage(INFO_CONTENT.privacy, language);
    const termsContent = getInfoContentForLanguage(INFO_CONTENT.terms, language);
    const returnRefundContent = getInfoContentForLanguage(INFO_CONTENT.return, language);

    const [premierSettings, setPremierSettings] = useState<any>({
        verifyBadgePrice: 500,
        verifyBadgeDuration: 365
    });

    const badgePrice = premierSettings.verifyBadgePrice;

    useEffect(() => {
        if (isOpen) {
            setIsVerifyBadge(true);
            setShowManualPayment(false);
            setShowHelpline(false);
            fetchPremierSettings();
        }
    }, [isOpen]);

    const fetchPremierSettings = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/premier-opportunity`);
            const data = await res.json();
            if (data.success && data.data) {
                setPremierSettings(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch premier settings:", error);
        }
    };

    const handlePayNow = async () => {
        if (!isVerifyBadge) {
            toast.error("Please select the verification option");
            return;
        }

        try {
            const token = Cookies.get('token');

            const promotionDetails = {
                isVerifyBadge: true,
                totalAmount: badgePrice
            };

            const response = await fetch(`${API_BASE_URL}/api/payment/init`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    paymentType: 'verification',
                    totalAmount: badgePrice,
                    userName: user?.name || "Customer",
                    userMobile: user?.phone || user?.mobile || "01700000000",
                    description: `Account Verification Badge for User: ${user?.name || "Unknown"}`,
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
            console.error("Payment Error:", error);
            toast.error("Failed to submit payment");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1200] flex items-start justify-center pt-20">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />

            {/* Modal Container */}
            <div className="relative bg-white w-full max-w-[565px] h-[calc(100vh-20px)] rounded-t-lg rounded-b-none overflow-hidden shadow-2xl flex flex-col animate-in fade-in slide-in-from-bottom-full duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                        </button>
                        <h2 className="text-[15px] text-slate-800 font-bold">ভেরিফাই প্রোফাইল</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg">
                        <h3 className="text-[14px] font-bold text-slate-800 mb-3">Premier Opportunity</h3>

                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors shadow-sm", isVerifyBadge ? 'bg-[#4285F4] border-[#4285F4]' : 'border-slate-300 bg-white')}>
                                {isVerifyBadge && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={isVerifyBadge}
                                onChange={() => setIsVerifyBadge(!isVerifyBadge)}
                            />
                            <span className="text-[14px] font-bold text-slate-800 group-hover:text-slate-900 leading-none">
                                প্রোফাইলে ভেরিফাই ব্যাজ যোগ (+ ৳ {premierSettings.verifyBadgePrice}/{premierSettings.verifyBadgeDuration === 365 ? 'বছর' : `${premierSettings.verifyBadgeDuration} দিন`})
                            </span>
                        </label>
                    </div>

                    {/* Payment Action */}
                    <div className="rounded-lg overflow-hidden flex shadow-sm">
                        <div className="bg-[#B8CCF2] w-1/3 flex items-center justify-center p-3">
                            <span className="text-[14px] font-black text-slate-900">Total : ৳ {badgePrice}</span>
                        </div>
                        <button
                            onClick={handlePayNow}
                            className="bg-[#4285F4] flex-1 p-3 text-white font-bold text-[14px] hover:bg-blue-600 transition-colors"
                        >
                            Pay Now
                        </button>
                    </div>

                    <p className="text-[12px] text-slate-600 text-center pt-1">
                        By Proceeding you agree to the{' '}
                        <span className="text-[#0088cc] cursor-pointer hover:underline" onClick={() => setShowPrivacy(true)}>Privacy</span>
                        {', '}
                        <span className="text-[#0088cc] cursor-pointer hover:underline" onClick={() => setShowTnC(true)}>T & C</span>
                        {', '}
                        <span className="text-[#0088cc] cursor-pointer hover:underline" onClick={() => setShowRefund(true)}>Return & Refund</span>
                    </p>

                    {/* Support & Manual Pay */}
                    <div className="pt-3 border-t border-slate-200 mt-4 space-y-4">
                        <div className="flex justify-between px-2 text-[12px] text-slate-700 font-medium">
                            <span
                                className="cursor-pointer hover:text-black"
                                onClick={() => window.open('https://m.me/shadamonDotCom', '_blank')}
                            >
                                HelpChat
                            </span>
                            <span
                                className={cn("cursor-pointer transition-colors", showManualPayment ? "text-[#4285F4] font-bold" : "hover:text-black")}
                                onClick={() => setShowManualPayment(!showManualPayment)}
                            >
                                Pay Manual
                            </span>
                            <span
                                className="cursor-pointer hover:text-black"
                                onClick={() => setShowHelpline(!showHelpline)}
                            >
                                {showHelpline ? "01752842084" : "Helpline"}
                            </span>
                        </div>

                        {showManualPayment && (
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-1 text-center">
                                <h4 className="font-bold text-sm text-slate-800 mb-1">Manual Payment</h4>
                                <p className="text-[12px] text-slate-600 mb-2">
                                    যে প্যাকেজটি কিনতে চান, সমপরিমান টাকা পাঠিয়ে আমাদের ম্যসেজ করুন।
                                </p>
                                <div className="space-y-1 text-[13px] text-slate-800 mb-3 font-medium">
                                    <div>বিকাশ নাম্বার: 01732661224</div>
                                    <div>নগদ নাম্বার: 01732661224</div>
                                    <div>রকেট নাম্বার: 01732661224 3</div>
                                </div>
                                <button
                                    onClick={() => window.open('https://m.me/shadamonDotCom', '_blank')}
                                    className="w-full bg-[#4285F4] text-white font-bold py-2 rounded shadow-sm hover:bg-blue-600 transition-colors text-[13px]"
                                >
                                    Message us
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>

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
