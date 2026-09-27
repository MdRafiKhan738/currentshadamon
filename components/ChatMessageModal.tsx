"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, ArrowLeft, Send, ChevronDown, Image as ImageIcon, Paperclip, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getImageUrl } from '../utils/imageUrl';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../utils/apiConfig';
import { io, Socket } from 'socket.io-client';
import AdDetailsModal from './AdDetailsModal';
import VerifiedBadge from './VerifiedBadge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}


interface Message {
    _id: string;
    text: string;
    image?: string;
    sender: string | any;
    receiver: string | any;
    ad: string | any;
    status: 'delivered' | 'seen';
    createdAt: string;
    messageType?: 'text' | 'image' | 'callme' | 'notify'; // Matches backend schema
}

interface ChatMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    ad: any;
    otherUser?: any;
}

const formatMessageDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const day = date.getDate();
    const month = months[date.getMonth()];
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day} ${month} AT ${hours}:${minutes} ${ampm}`;
};

export default function ChatMessageModal({ isOpen, onClose, onBack, ad, otherUser: otherUserProp }: ChatMessageModalProps) {
    const [messageText, setMessageText] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sendLoading, setSendLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [showScrollButton, setShowScrollButton] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedAdForDetail, setSelectedAdForDetail] = useState<any>(null);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [fetchedOtherUser, setFetchedOtherUser] = useState<any>(null);


    // Determine who the "other" person is in the chat
    const getOtherUserId = () => {
        if (otherUserProp) return typeof otherUserProp === 'object' ? otherUserProp?._id : otherUserProp;
        if (!ad) return null;

        // If no otherUserProp, fallback to ad.user
        // But if I am ad.user (seller), then I can't determine other person from ad alone
        const adUserId = typeof ad?.user === 'object' ? ad?.user?._id : ad?.user;
        return adUserId;
    };

    const otherUserId = getOtherUserId();
    const isBlockedByMe = currentUser?.blockedUsers?.includes(otherUserId);

    const fetchMessages = async () => {
        const token = Cookies.get('token');
        if (!token || !ad || !currentUser) return;

        try {
            const otherUserId = getOtherUserId();
            if (!otherUserId) return;
            const res = await fetch(`${API_BASE_URL}/api/messages/chat/${ad._id}/${otherUserId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setMessages(data.data);
            }
        } catch (err) {
            console.error("Error fetching messages:", err);
        } finally {
            setLoading(false);
        }
    };

    const markMessagesAsSeen = async () => {
        const token = Cookies.get('token');
        if (!token || !ad || !currentUser || !socket) return;

        const otherUserId = getOtherUserId();
        if (!otherUserId) return;
        try {
            await fetch(`${API_BASE_URL}/api/messages/seen/${ad._id}/${otherUserId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            socket.emit('message seen', { adId: ad._id, senderId: otherUserId, receiverId: currentUser._id });
            window.dispatchEvent(new Event('refresh-unread-count'));
        } catch (err) {
            console.error("Error marking seen:", err);
        }
    };

    // Initialize socket and fetch user
    useEffect(() => {
        const token = Cookies.get('token');
        if (!token) return;

        let activeSocket: Socket | null = null;

        // Fetch User
        fetch(`${API_BASE_URL}/api/user/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setCurrentUser(data);

                // Connect Socket
                const socketUrl = API_BASE_URL.replace('/api', '');
                activeSocket = io(socketUrl);
                setSocket(activeSocket);

                activeSocket.emit('setup', { id: data._id });
            })
            .catch(err => console.error("Error fetching user:", err));

        return () => {
            if (activeSocket) activeSocket.disconnect();
        };
    }, []);

    // Fetch messages when modal opens or ad changes
    useEffect(() => {
        if (isOpen && ad && currentUser) {
            fetchMessages();
            if (socket) {
                const otherUserId = getOtherUserId();
                if (otherUserId && currentUser) {
                    const room = [currentUser._id, otherUserId].sort().join('--');
                    socket.emit('join chat', room);
                    markMessagesAsSeen();
                }
            }
        }
    }, [isOpen, ad, currentUser, socket, otherUserProp]);

    // Fetch other user details for name/badge
    useEffect(() => {
        if (!isOpen) {
            setFetchedOtherUser(null);
            return;
        }

        const loadOtherUser = async () => {
            const id = getOtherUserId();
            if (!id) return;
            
            try {
                const res = await fetch(`${API_BASE_URL}/api/user/profile/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setFetchedOtherUser(data);
                }
            } catch (err) {
                console.error("Error fetching other user profile:", err);
            }
        };

        loadOtherUser();
    }, [isOpen, otherUserId, ad?._id]);

    // Socket listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('message received', (newMessage: Message) => {
            // Always refresh unread count for any new message received
            window.dispatchEvent(new Event('refresh-unread-count'));

            // Check if message belongs to this ad and sender
            const adId = typeof newMessage.ad === 'object' ? newMessage.ad._id : newMessage.ad;
            const senderId = typeof newMessage.sender === 'object' ? newMessage.sender._id : newMessage.sender;
            const otherUserId = getOtherUserId();

            if (adId?.toString() === ad?._id?.toString() && senderId?.toString() === otherUserId?.toString()) {
                setMessages(prev => {
                    // Avoid duplicates
                    if (prev.some(m => m._id === newMessage._id)) return prev;
                    return [...prev, newMessage];
                });
                if (isOpen) {
                    markMessagesAsSeen();
                }
            }
        });

        socket.on('seen updated', ({ adId, receiverId }: any) => {
            const otherUserId = getOtherUserId();
            if (adId?.toString() === ad?._id?.toString() && receiverId?.toString() === otherUserId?.toString()) {
                setMessages(prev => prev.map(msg => ({ ...msg, status: 'seen' })));
            }
        });

        return () => {
            socket.off('message received');
            socket.off('seen updated');
        };
    }, [socket, ad, currentUser, otherUserProp, isOpen]);


    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() && !selectedImage) return;
        setSendLoading(true);

        const token = Cookies.get('token');
        const otherUserId = getOtherUserId();
        if (!otherUserId) return;

        const formData = new FormData();
        formData.append('receiverId', otherUserId);
        formData.append('adId', ad._id);
        formData.append('text', messageText);
        if (selectedImage) {
            formData.append('image', selectedImage);
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/messages`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                const savedMsg = data.data;
                setMessages([...messages, savedMsg]);
                setMessageText('');
                setSelectedImage(null);
                setImagePreview(null);

                if (socket) {
                    socket.emit('new message', savedMsg);
                }
            } else if (res.status === 403) {
                alert(data.message || "Action blocked");
            }
        } catch (err) {
            console.error("Error sending message:", err);
            alert("Failed to send message");
        } finally {
            setSendLoading(false);
        }
    };

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            setShowScrollButton(scrollHeight - (scrollTop + clientHeight) > 100);
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, loading]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isOpen || !ad) return null;

    const getOtherUserName = () => {
        // If we have fetched data, use it as priority
        if (fetchedOtherUser) return fetchedOtherUser.name || fetchedOtherUser.storeName || 'User';

        // If we have otherUserProp (passed from MessageModal list), use it
        if (otherUserProp) return otherUserProp.name || otherUserProp.storeName || 'User';

        // If it's someone else's ad, use the ad owner's name
        const adUserId = typeof ad?.user === 'object' ? ad?.user?._id : ad?.user;
        if (currentUser && adUserId !== currentUser._id) {
            return ad?.user?.name || ad?.user?.storeName || 'User';
        }

        // If it's MY ad, we need to find the other participant (the buyer)
        // This is usually handled by otherUserProp, but as a fallback:
        return 'User';
    };

    const sellerName = getOtherUserName();
    const otherUserPhoto = fetchedOtherUser?.photo || fetchedOtherUser?.storeLogo || otherUserProp?.photo || ad?.user?.photo || otherUserProp?.storeLogo || ad?.user?.storeLogo;
    const isVerified = fetchedOtherUser?.mVerified || otherUserProp?.mVerified || ad?.user?.mVerified;

    return (
        <div className="fixed inset-0 z-[1100] flex items-end sm:items-start justify-center sm:pt-16 font-sans">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />

            {/* Modal Container */}
            <div className="relative bg-white w-full max-w-[565px] rounded-t-2xl sm:rounded-t-lg rounded-b-none overflow-hidden flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-2xl h-[90dvh] sm:h-[calc(100vh-64px)]">

                {/* Header */}
                <div className="bg-white border-b border-slate-300 shrink-0">
                    <div className="flex items-center justify-between p-2 px-4">
                        <div className="flex items-center gap-3">
                            <button onClick={onBack || onClose} className="w-8 h-8 flex items-center justify-center text-black hover:bg-slate-50 rounded-full transition-colors">
                                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                            </button>
                            <h2 className="text-[15px] text-black font-medium text-nowrap">Chat or Send Message</h2>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-slate-50 rounded-full">
                            <X className="w-5 h-5 text-black" />
                        </button>
                    </div>
                </div>

                <div className="bg-white py-2 px-4 border-b border-slate-300 text-left shrink-0">
                    <div className="flex items-center gap-1 pl-[72px]">
                        <p className="text-[13px] text-slate-500">Chat with <span className="font-bold text-black">{sellerName}</span></p>
                        {isVerified && <VerifiedBadge className="ml-1" iconClassName="w-4 h-4" />}
                    </div>
                </div>

                {/* Product Card (Fixed) */}
                <div className="bg-white border-b border-slate-300 p-3 shrink-0">
                    <div className="flex gap-3">
                        <div className="w-16 h-16 bg-slate-100 rounded-full overflow-hidden shrink-0 border border-slate-50">
                            {ad?.images?.[0] ? (
                                <img src={getImageUrl(ad.images[0])} alt="" className="w-full h-full object-contain" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400"></div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h3 className="text-[14px] text-slate-800 font-medium line-clamp-1 leading-tight mb-0.5">{ad?.headline}</h3>
                            <div className="flex items-center gap-0.5 text-[11px] text-slate-500 mb-1">
                                <span>{ad?.location}</span>
                                <span className="">,</span>
                                <span>{ad?.category}</span>
                            </div>
                            <p className="text-[15px] text-black font-bold leading-none">৳ {ad?.price?.toLocaleString() || '0'}</p>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto bg-white px-4 py-2"
                >
                    {/* Safety Warning */}
                    <div className="bg-[#f1f2f4] border border-slate-100 rounded-2xl p-3 flex gap-3 mb-6 relative overflow-hidden mt-2">
                        <div className="w-10 h-10 rounded-full bg-[#0088cc] flex items-center justify-center shrink-0 shadow-sm relative">
                            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm5 10.5V10c0-2.76-2.24-5-5-5S7 7.24 7 10v1.5H6v7h12v-7h-1zm-8-1.5c0-1.65 1.35-3 3-3s3 1.35 3 3v1.5H9V10z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[12px] font-bold text-slate-800">সতর্ক থাকুন :</span>
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('open-info-modal', { detail: { type: 'safety' } }))}
                                    className="text-[10px] text-blue-500 font-bold hover:underline"
                                >
                                    সব সেফটি টিপস
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-[1.3] font-medium">
                                SHADAMON কখনো চ্যাটে মেসেজ পাঠায় না। কোনো লিঙ্কে ক্লিক করবেন না, OTP/কার্ড তথ্য শেয়ার করবেন না। পণ্য যাচাই ছাড়া পেমেন্ট করবেন না। SHADAMON-এর নিজস্ব ডেলিভারি সেবা নেই।
                            </p>
                        </div>
                    </div>

                    {/* Messages */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 opacity-50">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                            <p className="text-xs mt-2 text-slate-400">Loading messages...</p>
                        </div>
                    ) : (
                        <div className="space-y-4 pb-4">
                            {messages.length === 0 && (
                                <p className="text-center text-[11px] text-slate-400 py-4 italic">No messages yet. Say hi!</p>
                            )}
                            {messages.map((msg, index) => {
                                const senderId = typeof msg.sender === 'object' ? msg.sender?._id : msg.sender;
                                const isMe = currentUser && senderId === currentUser._id;

                                // Only show status for the last message sent by me
                                const isLastMeMessage = index === messages.findLastIndex(m => {
                                    const mSenderId = typeof m.sender === 'object' ? m.sender?._id : m.sender;
                                    return mSenderId === currentUser?._id;
                                });

                                return (
                                    <div key={msg._id} className={cn("flex items-start gap-2", isMe ? "justify-end" : "justify-start")}>
                                        {!isMe && (
                                            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 mt-1">
                                                {ad.images?.[0] ? (
                                                    <img src={getImageUrl(ad.images[0])} alt="" className="w-full h-full object-contain" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold"></div>
                                                )}
                                            </div>
                                        )}
                                        <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                            <div
                                                onClick={() => {
                                                    if (msg.messageType === 'notify' && msg.ad) {
                                                        const adData = typeof msg.ad === 'object' ? msg.ad : { _id: msg.ad };
                                                        setSelectedAdForDetail(adData);
                                                    }
                                                }}
                                                className={cn(
                                                    "max-w-[85%] leading-tight font-medium",
                                                    msg.messageType === 'notify' ? "px-4 py-2 cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all" : (msg.text ? "px-4 py-2" : ""),
                                                    msg.text && (isMe ? "bg-[#7db3f2] text-slate-900 rounded-[25px]" : "bg-[#E2E8F0] text-slate-900 rounded-[25px]"),
                                                    !msg.text && msg.image && "rounded-lg overflow-hidden"
                                                )}>
                                                {msg.image && (
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFullScreenImage(getImageUrl(msg.image));
                                                        }}
                                                        className={cn(
                                                            "max-w-[200px] cursor-pointer hover:opacity-95 transition-opacity overflow-hidden",
                                                            msg.text ? "mb-1 rounded-lg border border-black/5" : "rounded-xl border-2 border-slate-100"
                                                        )}
                                                    >
                                                        <img src={getImageUrl(msg.image)} alt="attachment" className="w-full h-auto" />
                                                    </div>
                                                )}
                                                {msg.text && (
                                                    <div className={cn("whitespace-pre-wrap break-words", !isMe && msg.image ? "mt-1" : "")}>
                                                        {msg.text}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1 px-1">
                                                <span className="text-[10px] text-slate-400 font-medium">{formatMessageDate(msg.createdAt)}</span>
                                                {isMe && isLastMeMessage && (
                                                    <div className="flex items-center">
                                                        {msg.status === 'seen' ? (
                                                            <div className="w-3.5 h-3.5 rounded-full overflow-hidden border border-white/50 shadow-sm">
                                                                <img src={getImageUrl(otherUserPhoto || ad.images?.[0])} alt="" className="w-full h-full object-contain" />
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400 font-bold italic">Delivery</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 pt-1 pb-4 sm:pb-6 bg-white border-t border-slate-100 shrink-0 relative">
                    {/* Blocked Status Overlay */}
                    {isBlockedByMe && (
                        <div className="absolute inset-0 bg-white/90 z-20 flex items-center justify-center">
                            <p className="text-sm font-medium text-red-500 bg-red-50 px-4 py-2 rounded-full border border-red-100 shadow-sm">
                                You have blocked this user
                            </p>
                        </div>
                    )}

                    {/* Image Preview */}
                    {imagePreview && (
                        <div className="absolute left-6 -top-24 bg-white p-1 rounded-lg shadow-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="relative w-20 h-20 rounded-md overflow-hidden bg-slate-50">
                                <img src={imagePreview} alt="upload preview" className="w-full h-full object-contain" />
                                <button
                                    onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Scroll to bottom button */}
                    {showScrollButton && (
                        <div className="absolute left-1/2 -translate-x-1/2 -top-12 z-10 transition-all animate-in fade-in zoom-in duration-200">
                            <button
                                onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}
                                className="bg-white w-8 h-8 rounded-full shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 hover:text-black hover:bg-slate-50"
                            >
                                <ChevronDown className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                            disabled={isBlockedByMe}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isBlockedByMe}
                            className={cn(
                                "w-10 h-10 flex items-center justify-center rounded-full transition-colors shrink-0",
                                isBlockedByMe ? "text-slate-200 cursor-not-allowed" : "text-slate-400 hover:text-[#0088cc] hover:bg-slate-50"
                            )}
                        >
                            <ImageIcon className="w-6 h-6" />
                        </button>

                        <div className={cn(
                            "flex-1 flex items-center gap-3 rounded-full px-4 py-1 border transition-all shadow-inner",
                            isBlockedByMe ? "bg-slate-50 border-slate-100" : "bg-[#E2E8F0] border-slate-50"
                        )}>
                            <input
                                type="text"
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={isBlockedByMe ? "Conversation blocked" : "Write a message here"}
                                disabled={isBlockedByMe}
                                className="flex-1 bg-transparent py-2.5 text-[14px] outline-none text-black placeholder-slate-400"
                            />
                        </div>

                        <button
                            onClick={handleSendMessage}
                            disabled={(!messageText.trim() && !selectedImage) || sendLoading || isBlockedByMe}
                            className={cn(
                                "transition-colors shrink-0",
                                isBlockedByMe ? "text-slate-200" : "text-[#faba1a] disabled:text-slate-300"
                            )}
                        >
                            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {selectedAdForDetail && (
                <AdDetailsModal
                    isOpen={!!selectedAdForDetail}
                    onClose={() => setSelectedAdForDetail(null)}
                    ad={selectedAdForDetail}
                />
            )}

            {/* Full Screen Image Viewer */}
            {fullScreenImage && (
                <div className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <button
                        onClick={() => setFullScreenImage(null)}
                        className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="max-w-full max-h-full overflow-auto no-scrollbar flex items-center justify-center">
                        <img
                            src={fullScreenImage}
                            alt="Full Screen"
                            className="max-w-full max-h-screen object-contain rounded-sm shadow-2xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
