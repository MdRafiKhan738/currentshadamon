"use client";

import React, { useEffect } from 'react';
import { useSettings } from '../app/context/SettingsContext';
import { getImageUrl } from '../utils/imageUrl';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface AdDisplayProps {
    positionId: number;
    className?: string;
}

const AdDisplay: React.FC<AdDisplayProps> = ({ positionId, className }) => {
    const { settings, fetchAdPositions } = useSettings();
    const adPositions = settings.adPositions || [];
    const [loaded, setLoaded] = React.useState(false);


    useEffect(() => {
        if (adPositions.length === 0) {
            fetchAdPositions().finally(() => setLoaded(true));
        } else {
            setLoaded(true);
        }
    }, [adPositions.length, fetchAdPositions]);

    const ad = adPositions.find(p => p.positionId === positionId);

    if (!loaded) return null;
    if (!ad || ad.status === 'No') return null;

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
        <div 
            className={cn("w-full flex justify-center overflow-hidden", className)}
            onClick={handleAdClick}
            style={{ cursor: ad.link ? 'pointer' : 'default' }}
        >
            {/* Desktop View */}
            <div 
                className="hidden md:block"
                style={{
                    width: ad.deskWidth ? `${ad.deskWidth}px` : 'auto',
                    height: ad.deskHeight ? `${ad.deskHeight}px` : 'auto',
                    maxWidth: '100%'
                }}
            >
                {ad.imageDesk ? (
                    <img 
                        src={getImageUrl(ad.imageDesk)} 
                        alt={ad.placeName}
                        className="w-full h-full object-contain"
                    />
                ) : null}
            </div>

            {/* Mobile View */}
            <div 
                className="block md:hidden "
                style={{
                    width: ad.mobWidth ? `${ad.mobWidth}px` : 'auto',
                    height: ad.mobHeight ? `${ad.mobHeight}px` : 'auto',
                    maxWidth: '100%'
                }}
            >
                {ad.imageMob ? (
                    <img 
                        src={getImageUrl(ad.imageMob)} 
                        alt={ad.placeName}
                        className="w-full h-full object-contain"
                    />
                ) : (
                    // Fallback to desk image if mob image is missing
                    ad.imageDesk ? (
                        <img 
                            src={getImageUrl(ad.imageDesk)} 
                            alt={ad.placeName}
                            className="w-full h-full object-contain"
                        />
                    ) : null
                )}
            </div>
        </div>
    );
};

export default AdDisplay;
