"use client";

import React, { useEffect, useState } from 'react';
import { ArrowRight, Grid, MapPin, Zap, Clock } from 'lucide-react';
import { RiLockFill } from 'react-icons/ri';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../utils/apiConfig';
import { getImageUrl } from '../utils/imageUrl';
import { useLanguage } from '../app/context/LanguageContext';
import PromoteModal from './PromoteModal';


export default function LatestFreeAdPromo() {
    const { t, language } = useLanguage();
    const [latestAd, setLatestAd] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);


    useEffect(() => {
        const token = Cookies.get('token');
        if (!token) {
            setLoading(false);
            return;
        }

        const fetchInfo = async () => {
            try {
                // Fetch User
                const userRes = await fetch(`${API_BASE_URL}/api/user/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUser(userData);
                }

                // Fetch My Ads
                const adsRes = await fetch(`${API_BASE_URL}/api/ads/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (adsRes.ok) {
                    const adsData = await adsRes.json();
                    if (adsData.success && Array.isArray(adsData.data) && adsData.data.length > 0) {
                        const mostRecentFreeAd = adsData.data.find((ad: any) => ad.adType !== 'Promoted');
                        setLatestAd(mostRecentFreeAd || null);
                    }
                }
            } catch (error) {
                console.error("Failed to load promo ad data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInfo();
    }, []);

    if (loading || !latestAd) return null;

    const handlePromoteClick = () => {
        setIsPromoteModalOpen(true);
    };



    const mainImage = latestAd.images && latestAd.images.length > 0
        ? getImageUrl(latestAd.images[0])
        : null;

    return (
        <>
            <div className="bg-white rounded-lg overflow-hidden group">
                {/* 1. Preview Header */}
                <div className="bg-white px-3 py-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <RiLockFill className="w-4 h-4 text-slate-500" />
                        <span className="text-[14px] text-slate-700 font-medium">
                            {language === 'bn' ? 'শুধু আপনি দেখছেন' : 'Only you are watching'}
                        </span>
                    </div>
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-account-modal', { detail: { userId: user?._id, activeTab: 'Post' } }))}
                        className="text-[14px] text-slate-600 font-medium hover:underline"
                    >
                        {language === 'bn' ? 'সব পোস্ট' : 'All Post'}
                    </button>
                </div>

                {/* 2. Main Image Section */}
                <div className="relative aspect-[16/9] mx-1 rounded-lg overflow-hidden mt-1 group-hover:shadow-md transition-shadow">
                    {mainImage ? (
                        <>
                            <img
                                src={mainImage}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-60"
                            />
                            <img
                                src={mainImage}
                                className="relative z-10 w-full h-full object-contain"
                                alt="Preview"
                                loading="lazy"
                            />
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100 font-bold uppercase italic">
                            No Image
                        </div>
                    )}

                    <div className="absolute bottom-4 left-4 right-4 flex items-end z-20">
                        <div className="w-1 bg-white mr-2 self-stretch shrink-0" />
                        <div className="min-w-0 flex-1 text-white drop-shadow-md">
                            <h2 className="w-full text-[17px] sm:text-[18px] leading-tight font-medium truncate">{latestAd.headline}</h2>
                            <p className="text-[14px] mt-0">৳ {latestAd.price || '0.00'}</p>
                        </div>
                    </div>
                </div>

                {/* 3. Promotion Footer */}
                <div className="px-5 py-2 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[12px] text-slate-600">Want More Customer?</span>
                        <span className="text-[14px] text-slate-900 font-medium">Promote this Post</span>
                    </div>
                    <button
                        onClick={handlePromoteClick}
                        className="bg-[#0088cc] text-white px-3 py-2.5 rounded-lg text-[14px] hover:bg-[#0077b5] transition-colors"
                    >
                        Promote
                    </button>
                </div>
            </div>

            <PromoteModal
                isOpen={isPromoteModalOpen}
                onClose={() => setIsPromoteModalOpen(false)}
                ad={latestAd}
            />


        </>
    );
}
