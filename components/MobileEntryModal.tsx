"use client";

import React, { useState } from 'react';
import { X, ArrowLeft, Smartphone, Loader2, ChevronDown, MessageCircle, Mail } from 'lucide-react';
import { RiMailFill } from 'react-icons/ri';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../utils/apiConfig';
import { getImageUrl } from '../utils/imageUrl';
import { useSettings } from '../app/context/SettingsContext';
import toast from 'react-hot-toast';
import InfoModal from './InfoModal';

interface MobileEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserExists: (mobileOrEmail: string) => void;
    onUserNew: (mobileOrEmail: string) => void;
}

export default function MobileEntryModal({ isOpen, onClose, onUserExists, onUserNew }: MobileEntryModalProps) {
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [loginMethod, setLoginMethod] = useState<'mobile' | 'email'>('mobile');
    const { settings } = useSettings();
    const [loading, setLoading] = useState(false);
    const [infoModalType, setInfoModalType] = useState<'terms' | 'privacy' | null>(null);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;

        if (loginMethod === 'mobile') {
            // Ensure numeric
            if (!/^\d*$/.test(value)) return;

            // Auto prefix 0
            if (value.length > 0 && !value.startsWith('0')) {
                value = '0' + value;
            }

            // Limit to 11 digits
            if (value.length > 11) return;

            setMobile(value);
        } else {
            setEmail(value);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (loginMethod === 'mobile') {
            if (mobile.length !== 11) {
                toast.error("Please enter a valid 11-digit mobile number");
                return;
            }

            setLoading(true);

            try {
                const res = await fetch(`${API_BASE_URL}/api/user/check-mobile`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mobile })
                });

                const data = await res.json();

                if (res.ok) {
                    if (data.exists) {
                        onUserExists(mobile);
                    } else {
                        onUserNew(mobile);
                    }
                    onClose();
                } else {
                    toast.error(data.message || "Something went wrong");
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to connect to server");
            } finally {
                setLoading(false);
            }
        } else {
            // Email flow
            if (!email.includes('@')) {
                toast.error("Please enter a valid email address");
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/api/user/check-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const data = await res.json();

                if (res.ok) {
                    if (data.exists) {
                        onUserExists(email);
                    } else {
                        onUserNew(email);
                    }
                    onClose();
                } else {
                    // Fallback to onUserExists if check-email fails or is not found
                    onUserExists(email);
                    onClose();
                }
            } catch (err) {
                onUserExists(email);
                onClose();
            } finally {
                setLoading(false);
            }
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
                        <button onClick={() => loginMethod === 'email' ? setLoginMethod('mobile') : onClose()} className="w-8 h-8 flex items-center justify-center text-black hover:bg-slate-50 rounded-full transition-colors">
                            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                        </button>
                        <h2 className="text-[16px] text-black font-medium">Welcome</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-50 rounded-full">
                        <X className="w-5 h-5 text-black" />
                    </button>
                </div>

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
                        <h2 className="text-[18px] font-medium text-black leading-none">Welcome</h2>
                        <p className="text-[12px] text-black mt-1">{loginMethod === 'mobile' ? 'Mobile' : 'Email'} for Login/Register</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3 mb-3">
                        {loginMethod === 'mobile' ? (
                            <div className="relative flex items-center bg-white border border-slate-500 rounded-md overflow-hidden">
                                <div className="flex items-center gap-1 px-3 py-2.5 border-r border-slate-500 bg-slate-50/50">
                                    <span className="text-[13px] font-medium text-black">+88</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-black" />
                                </div>
                                <div className="absolute left-[65px] top-1/2 -translate-y-1/2 w-[1px] h-4 bg-slate-500" />
                                <input
                                    type="tel"
                                    value={mobile}
                                    onChange={handleChange}
                                    placeholder="Enter your mobile number"
                                    className="flex-1 py-2.5 pl-6 pr-4 text-[13px] text-black focus:outline-none placeholder:text-slate-400"
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <div className="relative animate-in slide-in-from-top-2 duration-300">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-black" />
                                    <div className="w-[1px] h-4 bg-slate-500" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={handleChange}
                                    placeholder="Enter your email address"
                                    className="w-full bg-white border border-slate-500 rounded-md py-2.5 pl-14 pr-4 text-[13px] text-black focus:outline-none placeholder:text-slate-400"
                                    required
                                    autoFocus
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || (loginMethod === 'mobile' ? mobile.length < 11 : !email)}
                            className="w-full bg-[#1A1A1A] text-white py-3 rounded-lg text-[15px] hover:bg-black transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {loading ? "Checking..." : "Continue"}
                        </button>
                    </form>

                    {/* OR Divider */}
                    <div className="relative flex items-center justify-center my-4">
                        <div className="absolute inset-x-0 h-[1px] bg-slate-500" />
                        <span className="relative bg-[#F8F9FA] px-3 text-[11px] font-medium text-black">OR</span>
                    </div>

                    {/* Social Buttons & Email Option */}
                    <div className="space-y-2.5 mb-4">
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
                            className="w-full bg-white border border-slate-200 text-slate-700 py-2.5 rounded-lg flex items-center px-4 hover:bg-slate-50 transition-all font-medium"
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
                        {loginMethod === 'mobile' && (
                            <button
                                onClick={() => setLoginMethod('email')}
                                className="w-full bg-white border border-slate-500 text-black py-2.5 rounded-lg flex items-center px-4 hover:bg-slate-50 transition-all shadow-sm"
                            >
                                <span className="mr-6">
                                    <RiMailFill className="w-4 h-4 text-black" />
                                </span>
                                <span className="text-[13px]">Continue With Email</span>
                            </button>
                        )}
                    </div>

                    <p className="text-[10px] text-black text-center mb-6 select-none">
                        By continuing you agree to our{' '}
                        <span
                            className="text-black font-medium underline cursor-pointer"
                            onClick={() => setInfoModalType('terms')}
                        >
                            Terms & Condition
                        </span>
                        {' '} & {' '}
                        <span
                            className="text-black font-medium underline cursor-pointer"
                            onClick={() => setInfoModalType('privacy')}
                        >
                            Privacy & Policy
                        </span>
                    </p>
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
                {/* Info Modal for Terms & Privacy */}
                <InfoModal
                    isOpen={infoModalType !== null}
                    onClose={() => setInfoModalType(null)}
                    title={infoModalType === 'terms' ? "Terms & Conditions" : "Privacy & Policy"}
                    content={
                        infoModalType === 'terms' ? (
                            <div className="space-y-4">
                                <section>
                                    <h3 className="font-bold text-black mb-2">1. Agreement to Terms</h3>
                                    <p>By accessing or using Shadamon, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree, please do not use our services.</p>
                                </section>
                                <section>
                                    <h3 className="font-bold text-black mb-2">2. Posting Rules</h3>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Do not post duplicate ads.</li>
                                        <li>Ensure all information provided is accurate and not misleading.</li>
                                        <li>Prohibited items cannot be listed on the platform.</li>
                                        <li>We reserve the right to remove any ad that violates our policies.</li>
                                    </ul>
                                </section>
                                <section>
                                    <h3 className="font-bold text-black mb-2">3. User Responsibilities</h3>
                                    <p>You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account.</p>
                                </section>
                                <section>
                                    <h3 className="font-bold text-black mb-2">4. Privacy</h3>
                                    <p>Your privacy is important to us. Please review our Privacy Policy to understand how we collect and use your data.</p>
                                </section>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <section>
                                    <h3 className="font-bold text-black mb-2">1. Data Collection</h3>
                                    <p>We collect information you provide directly to us, such as when you create an account, post an ad, or communicate with us.</p>
                                    <p className="mt-2">This includes: Name, Email, Mobile Number, and Location.</p>
                                </section>
                                <section>
                                    <h3 className="font-bold text-black mb-2">2. Use of Information</h3>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>To provide and maintain our Service.</li>
                                        <li>To notify you about changes to our Service.</li>
                                        <li>To provide customer support.</li>
                                        <li>To monitor the usage of our Service.</li>
                                    </ul>
                                </section>
                                <section>
                                    <h3 className="font-bold text-black mb-2">3. Security of Data</h3>
                                    <p>The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure.</p>
                                </section>
                                <section>
                                    <h3 className="font-bold text-black mb-2">4. Third-Party Services</h3>
                                    <p>We may employ third party companies and individuals to facilitate our Service, such as Google and Facebook for authentication.</p>
                                </section>
                            </div>
                        )
                    }
                />
            </div>
        </div>
    );
}
