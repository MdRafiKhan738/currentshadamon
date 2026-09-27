"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, ArrowLeft, MessageCircle, Eye } from 'lucide-react';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../utils/apiConfig';
import { getImageUrl } from '../utils/imageUrl';
import { useSettings } from '../app/context/SettingsContext';
import toast from 'react-hot-toast';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    onSwitchToRegister: () => void;
    initialMobile?: string;
}

export default function LoginModal({ isOpen, onClose, onSuccess, onSwitchToRegister, initialMobile }: LoginModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { settings } = useSettings();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    // Forgot Password States
    const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
    const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: Email, 2: OTP + New Password
    const [forgotEmail, setForgotEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [emailNotFound, setEmailNotFound] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            if (initialMobile) {
                setFormData(prev => ({ ...prev, email: initialMobile }));
            }
            // Reset forgot password state when modal opens
            setForgotPasswordMode(false);
            setForgotPasswordStep(1);
            setForgotEmail('');
            setNewPassword('');
            setVerificationCode('');
            setEmailNotFound(false);
        }
    }, [isOpen, initialMobile]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;

        if (e.target.name === 'email') { // 'email' field holds Mobile or Email
            const isNumeric = /^\d+$/.test(value);
            if (isNumeric && value.length > 0 && !value.startsWith('0')) {
                value = '0' + value;
            }
        }
        setFormData(prev => ({ ...prev, [e.target.name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/user/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            if (data.token) {
                Cookies.set('token', data.token, { expires: 7 });
                toast.success("Login Successful!");
                onClose();
                window.dispatchEvent(new Event('auth-change'));
                if (onSuccess) {
                    onSuccess();
                } else {
                    window.location.reload();
                }
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPasswordRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotEmail) return toast.error("Please enter your email");

        setLoading(true);
        setEmailNotFound(false);
        try {
            const res = await fetch(`${API_BASE_URL}/api/user/forgot-password/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Verification code sent!");
                setForgotPasswordStep(2);
            } else if (res.status === 404) {
                setEmailNotFound(true);
            } else {
                toast.error(data.message || "Failed to send code");
            }
        } catch (err) {
            toast.error("Server error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPasswordVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verificationCode || !newPassword) return toast.error("Please fill all fields");

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/user/forgot-password/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: forgotEmail,
                    otp: verificationCode,
                    newPassword
                })
            });
            const data = await res.json();
            if (res.ok && data.token) {
                Cookies.set('token', data.token, { expires: 7 });
                toast.success("Password updated and logged in!");
                onClose();
                window.dispatchEvent(new Event('auth-change'));
                window.location.reload();
            } else {
                toast.error(data.message || "Verification failed");
            }
        } catch (err) {
            toast.error("Server error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider: string) => {
        if (provider === 'facebook') {
            // @ts-ignore
            if (typeof window.FB === 'undefined') {
                toast.error("Facebook SDK loading...");
                return;
            }

            // @ts-ignore
            window.FB.login(function (response) {
                if (response.authResponse) {
                    const accessToken = response.authResponse.accessToken;
                    setLoading(true);
                    fetch(`${API_BASE_URL}/api/user/facebook-login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ accessToken })
                    })
                        .then(res => res.json())
                        .then(data => {
                            if (data.token) {
                                Cookies.set('token', data.token, { expires: 7 });
                                toast.success("Login Successful!");
                                window.dispatchEvent(new Event('auth-change'));
                                window.location.reload();
                            } else {
                                toast.error(data.message || "Facebook login failed");
                            }
                        })
                        .catch(() => toast.error("Failed to communicate with server"))
                        .finally(() => setLoading(false));
                }
            }, { scope: 'public_profile,email' });
        } else if (provider === 'google') {
            // @ts-ignore
            if (typeof window.google === 'undefined') {
                toast.error("Google SDK loading... Try again in a moment.");
                return;
            }

            // @ts-ignore
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
                callback: (response: any) => {
                    if (response.access_token) {
                        setLoading(true);
                        fetch(`${API_BASE_URL}/api/user/google-login`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ token: response.access_token })
                        })
                            .then(res => res.json())
                            .then(data => {
                                if (data.token) {
                                    Cookies.set('token', data.token, { expires: 7 });
                                    toast.success("Login Successful!");
                                    window.location.reload();
                                } else {
                                    toast.error(data.message || "Google login failed");
                                }
                            })
                            .catch(() => toast.error("Failed to communicate with server"))
                            .finally(() => setLoading(false));
                    }
                },
            });
            // @ts-ignore
            client.requestAccessToken();
        }
    };

    return (
        <div className="fixed inset-0 z-[1500] flex items-start justify-center pt-20">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />

            {/* Modal Container - Anchored to bottom, compact height */}
            <div className="relative bg-[#F8F9FA] w-full max-w-[565px] rounded-t-lg rounded-b-none overflow-hidden shadow-2xl flex flex-col animate-in fade-in slide-in-from-bottom-full duration-300 h-[calc(100vh-20px)]">

                {/* Header Controls - Compact */}
                <div className="flex items-center justify-between p-2 px-4 border-b border-slate-200 bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => forgotPasswordMode ? setForgotPasswordMode(false) : onClose()} className="w-8 h-8 flex items-center justify-center text-black hover:bg-slate-50 rounded-full transition-colors">
                            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                        </button>
                        <h2 className="text-[16px] text-black font-medium">{forgotPasswordMode ? 'Forgot Password' : 'Login'}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-50 rounded-full">
                        <X className="w-5 h-5 text-black" />
                    </button>
                </div>

                {/* Main Content Area - No Scroll needed */}
                <div className="flex-1 overflow-y-auto px-6 pb-32">

                    {/* Site Logo */}
                    <div className="mt-4 flex flex-col items-center mb-4">
                        <div className="relative w-[150px] h-[60px] mb-0 flex items-center justify-center">
                            {settings.siteLogo ? (
                                <img
                                    src={getImageUrl(settings.siteLogo)}
                                    alt="Logo"
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="w-[70px] h-[70px] bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                    Logo
                                </div>
                            )}
                        </div>
                        <h2 className="text-[18px] font-medium text-black leading-none">{forgotPasswordMode ? 'Verification' : 'Login'}</h2>
                        <p className="text-[12px] text-black mt-1">
                            {forgotPasswordMode ? 'Reset your password securely' : 'If Allready Registered'}
                        </p>
                    </div>

                    {!forgotPasswordMode ? (
                        <>
                            {/* Login Form - Tight Spacing */}
                            <form onSubmit={handleSubmit} className="space-y-3 mb-2">
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-[1px] h-4 bg-slate-500" />
                                    <input
                                        type="text"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Mobile Number or Email"
                                        className="w-full bg-white border border-slate-500 rounded-md py-2.5 pl-8 pr-4 text-[13px] text-black focus:outline-none focus:ring-1 focus:ring-black placeholder:text-slate-400"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-[1px] h-4 bg-slate-500" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Password"
                                        className="w-full bg-white border border-slate-500 rounded-md py-2.5 pl-8 pr-12 text-[13px] text-black focus:outline-none focus:ring-1 focus:ring-black placeholder:text-slate-400"
                                        required
                                    />
                                    <div
                                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-black select-none"
                                        onMouseDown={() => setShowPassword(true)}
                                        onMouseUp={() => setShowPassword(false)}
                                        onMouseLeave={() => setShowPassword(false)}
                                        onTouchStart={() => setShowPassword(true)}
                                        onTouchEnd={() => setShowPassword(false)}
                                    >
                                        <Eye className="w-5 h-5" />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#1A1A1A] text-white py-3 rounded-lg text-[15px] hover:bg-black transition-all active:scale-[0.98] disabled:opacity-70"
                                >
                                    {loading ? "Logging in..." : "Login"}
                                </button>
                            </form>

                            {/* Secondary Actions */}
                            <div className="flex items-center justify-between text-[11px] text-black px-1 mb-4">
                                <button
                                    className="hover:underline"
                                    onClick={() => window.open('https://m.me/shadamonDotCom', '_blank')}
                                >HelpChat</button>
                                <button
                                    className="hover:underline"
                                    onClick={() => setForgotPasswordMode(true)}
                                >Forgot Password?</button>
                            </div>

                            {/* OR Divider */}
                            <div className="relative flex items-center justify-center mb-4">
                                <div className="absolute inset-x-0 h-[1px] bg-slate-500" />
                                <span className="relative bg-[#F8F9FA] px-3 text-[11px] font-medium text-black">OR</span>
                            </div>

                            {/* Social Buttons - Compact */}
                            <div className="space-y-2.5 mb-6">
                                <button
                                    onClick={() => handleSocialLogin('facebook')}
                                    className="w-full bg-[#3B5998] text-white py-2.5 rounded-lg flex items-center px-4 hover:bg-[#344e86] transition-all"
                                >
                                    <span className="bg-white/20 p-1 rounded-sm mr-6">
                                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                        </svg>
                                    </span>
                                    <span className="text-[13px]">Continue with Facebook</span>
                                </button>
                                <button
                                    onClick={() => handleSocialLogin('google')}
                                    className="w-full bg-white border border-slate-500 text-black py-2.5 rounded-lg flex items-center px-4 hover:bg-slate-50 transition-all font-medium"
                                >
                                    <span className="mr-6">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                    </span>
                                    <span className="text-[13px]">Continue with Google</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="animate-in slide-in-from-right duration-300">
                            {forgotPasswordStep === 1 ? (
                                <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-[1px] h-4 bg-slate-500" />
                                        <input
                                            type="email"
                                            value={forgotEmail}
                                            onChange={(e) => {
                                                setForgotEmail(e.target.value);
                                                setEmailNotFound(false);
                                            }}
                                            placeholder="Enter your registered email"
                                            className={`w-full bg-white border ${emailNotFound ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-500 focus:ring-black'} rounded-md py-2.5 pl-8 pr-4 text-[13px] text-black focus:outline-none focus:ring-1 placeholder:text-slate-400`}
                                            required
                                        />
                                    </div>
                                    {emailNotFound && (
                                        <div
                                            onClick={() => window.open('https://m.me/shadamonDotCom', '_blank')}
                                            className="bg-red-50 border border-red-200 p-3 rounded-lg cursor-pointer hover:bg-red-100 transition-all animate-in fade-in zoom-in-95 duration-200"
                                        >
                                            <p className="text-[12px] text-red-600 font-bold text-center leading-tight">
                                                You do not add any email, please contact help chat
                                            </p>
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-[#1A1A1A] text-white py-3 rounded-lg text-[15px] hover:bg-black transition-all active:scale-[0.98] disabled:opacity-70"
                                    >
                                        {loading ? "Sending..." : "Verify Email"}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleForgotPasswordVerify} className="space-y-3">
                                    <p className="text-[11px] text-slate-600 text-center mb-2 italic">A code has been sent to {forgotEmail}</p>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-[1px] h-4 bg-slate-500" />
                                        <input
                                            type="text"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            placeholder="Enter 6-digit code"
                                            className="w-full bg-white border border-slate-500 rounded-md py-2.5 pl-8 pr-4 text-[13px] text-black focus:outline-none focus:ring-1 focus:ring-black placeholder:text-slate-400"
                                            maxLength={6}
                                            required
                                        />
                                    </div>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-[1px] h-4 bg-slate-500" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Set New Password"
                                            className="w-full bg-white border border-slate-500 rounded-md py-2.5 pl-8 pr-12 text-[13px] text-black focus:outline-none focus:ring-1 focus:ring-black placeholder:text-slate-400"
                                            required
                                        />
                                        <div
                                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-black select-none"
                                            onMouseDown={() => setShowPassword(true)}
                                            onMouseUp={() => setShowPassword(false)}
                                            onMouseLeave={() => setShowPassword(false)}
                                        >
                                            <Eye className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-[#1A1A1A] text-white py-3 rounded-lg text-[15px] hover:bg-black transition-all active:scale-[0.98] disabled:opacity-70"
                                    >
                                        {loading ? "Verifying..." : "Reset & Login"}
                                    </button>
                                    <p
                                        className="text-center text-[11px] text-black hover:underline cursor-pointer pt-2"
                                        onClick={() => setForgotPasswordStep(1)}
                                    >Didn't get code? Re-send</p>
                                </form>
                            )}
                        </div>
                    )}
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

