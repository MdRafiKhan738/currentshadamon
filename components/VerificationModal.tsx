"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, ArrowLeft, Loader2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../utils/apiConfig';

interface VerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    verificationToken?: string;
}

export default function VerificationModal({ isOpen, onClose, onSuccess, verificationToken }: VerificationModalProps) {
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [verificationLoading, setVerificationLoading] = useState(false);
    const [otpTimer, setOtpTimer] = useState(0);
    const [otpAttempts, setOtpAttempts] = useState(0);
    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (otpTimer > 0) {
            interval = setInterval(() => {
                setOtpTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [otpTimer]);

    useEffect(() => {
        if (isOpen) {
            // Reset state on open
            setShowOtpInput(false);
            setOtp(["", "", "", "", "", ""]);
            setOtpTimer(0);
            setOtpAttempts(0);

            // Auto request OTP
            handleRequestOtp();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleRequestOtp = async () => {
        if (otpAttempts >= 3) {
            toast.error("Maximum attempts reached. Please try again later.");
            return;
        }

        setVerificationLoading(true);
        const token = verificationToken || Cookies.get('token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/user/otp/request`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                if (data.isVerified) {
                    toast.success("Already verified!");
                    onSuccess();
                    onClose();
                } else {
                    setShowOtpInput(true);
                    setOtpTimer(120);
                    setOtpAttempts(prev => prev + 1);
                    toast.success("OTP sent to your email!");
                }
            } else {
                toast.error(data.message || "Failed to send OTP");
            }
        } catch (error) {
            toast.error("Failed to send OTP");
        } finally {
            setVerificationLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        const otpCode = otp.join("");
        if (otpCode.length !== 6) {
            toast.error("Please enter full valid OTP");
            return;
        }

        setVerificationLoading(true);
        const token = verificationToken || Cookies.get('token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/user/otp/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ otp: otpCode })
            });
            const data = await res.json();
            if (data.success) {
                if (verificationToken) {
                    Cookies.set('token', verificationToken, { expires: 7 });
                }
                toast.success("Registration Complete!");
                window.dispatchEvent(new Event('auth-change'));
                onSuccess();
                onClose();
            } else {
                toast.error(data.message || "Verification failed");
            }
        } catch (error) {
            toast.error("Verification failed");
        } finally {
            setVerificationLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto move focus
        if (value && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <div className="fixed inset-0 z-[1500] flex items-start justify-center pt-20">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />

            {/* Modal Container */}
            <div className="relative bg-[#F8F9FA] w-full max-w-[565px] rounded-t-lg rounded-b-none overflow-hidden shadow-2xl flex flex-col animate-in fade-in slide-in-from-bottom-full duration-300 h-[calc(100vh-20px)]">

                {/* Header Controls - Compact */}
                <div className="flex items-center justify-between p-2 px-4 border-b border-slate-200 bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-black hover:bg-slate-50 rounded-full transition-colors">
                            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                        </button>
                        <h2 className="text-[16px] text-black font-medium">Verification</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-50 rounded-full">
                        <X className="w-5 h-5 text-black" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-32">
                    {/* Shield Logo - Shrunken */}
                    <div className="flex flex-col items-center mb-4">
                        <div className="relative w-[70px] h-[70px] mb-1 flex items-center justify-center">
                            <svg viewBox="0 0 100 120" className="absolute inset-0 w-full h-full">
                                <path
                                    d="M50 0 L10 15 V50 C10 80 50 110 50 110 C50 110 90 80 90 50 V15 L50 0Z"
                                    fill="white"
                                    stroke="#64748b"
                                    strokeWidth="1.5"
                                />
                                <path
                                    d="M50 8 L18 20 V50 C18 75 50 102 50 102 C50 102 82 75 82 50 V20 L50 8Z"
                                    fill="transparent"
                                    stroke="#F97316"
                                    strokeWidth="2.5"
                                />
                            </svg>
                            <div className="relative z-10 bg-gradient-to-b from-orange-400 to-orange-600 w-8 h-8 rounded-md flex items-center justify-center shadow-lg translate-y-[-2px]">
                                <div className="relative w-4 h-4">
                                    <div className="absolute inset-0 border-[1.5px] border-white rounded-[1px] mt-0.5" />
                                    <div className="absolute top-[-3px] left-1/2 -translate-x-1/2 w-3 h-2 border-[1.5px] border-white rounded-t-full" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="h-2 w-[1.5px] bg-white rounded-full absolute" />
                                        <div className="w-[1.5px] h-2 bg-white rounded-full absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 rotate-90" />
                                        <div className="w-2.5 h-2.5 bg-white rounded-full flex items-center justify-center text-orange-600 text-[8px] font-bold">+</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <h2 className="text-[18px] font-medium text-black leading-none">Verification</h2>
                        <p className="text-[12px] text-black mt-1">Verify your email address</p>
                    </div>

                    <div className="space-y-6 mb-6">
                        {!showOtpInput ? (
                            <div className="text-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-black mb-4" />
                                <p className="text-[13px] text-black font-medium">Sending OTP Code...</p>
                                <p className="text-[11px] text-black mt-1">Please wait while we send a code to your email.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex justify-center gap-2">
                                    {otp.map((d, i) => (
                                        <input
                                            key={i}
                                            type="text"
                                            maxLength={1}
                                            value={d}
                                            ref={el => { otpInputRefs.current[i] = el; }}
                                            onChange={e => handleOtpChange(i, e.target.value)}
                                            onKeyDown={e => handleOtpKeyDown(i, e)}
                                            className="w-10 h-10 sm:w-12 sm:h-12 border border-slate-500 rounded-lg text-center font-bold text-lg text-black focus:border-black focus:ring-1 focus:ring-black focus:outline-none bg-white transition-all"
                                        />
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleVerifyOtp}
                                    disabled={verificationLoading}
                                    className="w-full py-3 bg-[#1A1A1A] text-white rounded-lg text-[15px] hover:bg-black transition-all active:scale-[0.98] disabled:opacity-70"
                                >
                                    {verificationLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Verify & Proceed"}
                                </button>

                                <div className="text-center">
                                    {otpTimer > 0 ? (
                                        <p className="text-[11px] text-slate-500">Resend code in {otpTimer}s</p>
                                    ) : (
                                        <button
                                            onClick={handleRequestOtp}
                                            className="text-[11px] font-bold text-black hover:underline"
                                        >
                                            Resend Code
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Floating Chat Icon */}
                <div
                    className="absolute right-5 bottom-20 z-[210] cursor-pointer"
                    onClick={() => window.open('https://m.me/shadamonDotCom', '_blank')}
                >
                    <div className="flex flex-col items-center">
                        <button className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all mb-1">
                            <MessageCircle className="w-5 h-5 fill-white" />
                        </button>
                        <button className="text-[11px] text-black font-bold">HelpChat</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
