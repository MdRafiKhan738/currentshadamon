"use client";

import React, { useState, useEffect } from 'react';
import { useSettings } from '../app/context/SettingsContext';
import { getImageUrl } from '../utils/imageUrl';
import { X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const AdPopup: React.FC = () => {
    const { settings, fetchAdPositions } = useSettings();
    const [isOpen, setIsOpen] = useState(false);
    const adPositions = settings.adPositions || [];

    useEffect(() => {
        if (adPositions.length === 0) {
            fetchAdPositions();
        }
    }, [adPositions.length, fetchAdPositions]);

    const ad = adPositions.find(p => p.positionId === 5);

    useEffect(() => {
        if (ad && ad.status === 'Yes') {
            // Show popup after a small delay
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [ad]);

    if (!ad || ad.status === 'No' || !isOpen) return null;

    const handleAdClick = () => {
        if (ad.link) {
            let url = ad.link;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            window.open(url, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="relative animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button 
                    onClick={() => setIsOpen(false)}
                    className="absolute -top-3 -right-3 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:bg-slate-100 transition-all z-10 border border-slate-200"
                >
                    <X className="w-5 h-5" />
                </button>

                <div 
                    className="overflow-hidden rounded-lg shadow-2xl"
                    onClick={handleAdClick}
                    style={{ cursor: ad.link ? 'pointer' : 'default' }}
                >
                    {/* Desktop View */}
                    <div 
                        className="hidden md:block"
                        style={{
                            width: ad.deskWidth ? `${ad.deskWidth}px` : 'auto',
                            height: ad.deskHeight ? `${ad.deskHeight}px` : 'auto',
                            maxWidth: '90vw',
                            maxHeight: '80vh'
                        }}
                    >
                        {ad.imageDesk ? (
                            <img 
                                src={getImageUrl(ad.imageDesk)} 
                                alt={ad.placeName}
                                className="w-full h-full object-contain bg-white"
                            />
                        ) : null}
                    </div>

                    {/* Mobile View */}
                    <div 
                        className="block md:hidden"
                        style={{
                            width: ad.mobWidth ? `${ad.mobWidth}px` : 'auto',
                            height: ad.mobHeight ? `${ad.mobHeight}px` : 'auto',
                            maxWidth: '90vw',
                            maxHeight: '80vh'
                        }}
                    >
                        {ad.imageMob ? (
                            <img 
                                src={getImageUrl(ad.imageMob)} 
                                alt={ad.placeName}
                                className="w-full h-full object-contain bg-white"
                            />
                        ) : (
                            ad.imageDesk ? (
                                <img 
                                    src={getImageUrl(ad.imageDesk)} 
                                    alt={ad.placeName}
                                    className="w-full h-full object-contain bg-white"
                                />
                            ) : null
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdPopup;
