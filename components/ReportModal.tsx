"use client";

import React, { useState } from 'react';
import { ArrowLeft, X, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../utils/apiConfig';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
    adId: string;
    ownerId: string;
}

const REPORT_OPTIONS = [
    "Wrong Catagorie",
    "Sold",
    "Fraud",
    "Duplicate",
    "Spam",
    "Others"
];

export default function ReportModal({ isOpen, onClose, onBack, adId, ownerId }: ReportModalProps) {
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!selectedReason) {
            toast.error("Please select a reason for reporting");
            return;
        }

        const token = Cookies.get('token');
        if (!token) {
            toast.error("Please login to report");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    adId,
                    ownerId,
                    reason: selectedReason
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Report submitted successfully");
                onClose();
            } else {
                toast.error(data.message || "Failed to submit report");
            }
        } catch (error) {
            console.error("Error submitting report:", error);
            toast.error("An error occurred while submitting the report");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1100] flex items-start justify-center pt-20">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />

            {/* Modal Container */}
            <div className="relative bg-white w-full max-w-[565px] rounded-t-lg rounded-b-none overflow-hidden flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-2xl h-[calc(100vh-80px)] font-sans">
                
                {/* Header */}
                <div className="flex items-center justify-between p-2 px-4 border-b border-slate-200 bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center text-black hover:bg-slate-50 rounded-full transition-colors">
                            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                        </button>
                        <h2 className="text-[16px] text-black font-medium">Report</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-50 rounded-full">
                        <X className="w-5 h-5 text-black" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-[#F8F9FA] p-6">
                    <div className="flex flex-col items-center justify-center mb-8">
                         <div className="grid grid-cols-2 gap-3 w-full max-w-[400px]">

                            {REPORT_OPTIONS.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setSelectedReason(option)}
                                    className={cn(
                                        "px-4 py-2 rounded-full border text-sm font-medium transition-all text-center",
                                        selectedReason === option
                                            ? "bg-black text-white border-black scale-105"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    )}
                                >
                                    {option}
                                </button>
                            ))}
                         </div>
                    </div>
                </div>

                {/* Footer / Submit Button */}
                <div className="p-4 border-t border-slate-100 bg-white">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedReason}
                        className={cn(
                            "w-full py-3 rounded-lg text-sm font-medium transition-all",
                            selectedReason 
                                ? "bg-[#D1D5DB] text-slate-700 hover:bg-[#C1C5CB]" 
                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        )}
                    >
                        {isSubmitting ? "Submitting..." : "Submit"}
                    </button>
                </div>
            </div>
        </div>
    );
}
