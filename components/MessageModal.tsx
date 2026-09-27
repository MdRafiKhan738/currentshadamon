"use client";

import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, X, Phone, ExternalLink } from 'lucide-react';
import { RiUser3Fill, RiDeleteBinFill } from 'react-icons/ri';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../utils/apiConfig';
import { getImageUrl } from '../utils/imageUrl';
import { io, Socket } from 'socket.io-client';
import AdDetailsModal from './AdDetailsModal';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface MessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenChat: (ad: any, otherUser: any) => void;
}

const formatMessageDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day} ${month} ${hours}:${minutes} ${ampm}`;
};

export default function MessageModal({ isOpen, onClose, onOpenChat }: MessageModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'All' | 'Message' | 'Notify' | 'Shadamon'>('All');
    const [conversations, setConversations] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [expandedIds, setExpandedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [selectedAdForDetail, setSelectedAdForDetail] = useState<any>(null);
    const [notifyPreferences, setNotifyPreferences] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchUser();
        }
    }, [isOpen]);

    // Initialize Socket
    useEffect(() => {
        if (!isOpen || !currentUser) return;

        const socketUrl = API_BASE_URL.replace('/api', '');
        const activeSocket = io(socketUrl);
        setSocket(activeSocket);

        activeSocket.emit('setup', { id: currentUser._id });

        return () => {
            activeSocket.disconnect();
        };
    }, [isOpen, currentUser?._id]);

    // Socket listeners & Custom Events
    useEffect(() => {
        if (!socket) {
            // Even if socket isn't ready, listen for the custom event from ChatMessageModal
            const handleRefresh = () => fetchConversations(searchQuery);
            window.addEventListener('refresh-unread-count', handleRefresh);
            return () => window.removeEventListener('refresh-unread-count', handleRefresh);
        }

        socket.on('message received', (newMessage) => {
            fetchConversations(searchQuery);
        });

        socket.on('seen updated', () => {
            fetchConversations(searchQuery);
        });

        socket.on('notification received', () => {
            fetchNotifications();
        });

        const handleRefresh = () => fetchConversations(searchQuery);
        window.addEventListener('refresh-unread-count', handleRefresh);

        return () => {
            socket.off('message received');
            socket.off('seen updated');
            window.removeEventListener('refresh-unread-count', handleRefresh);
        };
    }, [socket, searchQuery]);

    // Handle search debounce and initial fetch
    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            fetchConversations(searchQuery);
            if (activeTab === 'All' || activeTab === 'Shadamon') {
                fetchNotifications();
            }
        }, searchQuery ? 500 : 0); // Delay only when typing search

        return () => clearTimeout(timer);
    }, [searchQuery, isOpen, activeTab]);

    const fetchUser = async () => {
        const token = Cookies.get('token');
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/user/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setCurrentUser(data);

            // Also fetch activity to get notifyPreferences
            const activityRes = await fetch(`${API_BASE_URL}/api/user/activity`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const activityData = await activityRes.json();
            if (activityData && activityData.notifyPreferences) {
                setNotifyPreferences(activityData.notifyPreferences);
            }
        } catch (err) {
            console.error("Error fetching user data:", err);
        }
    };

    const fetchConversations = async (search = '') => {
        const token = Cookies.get('token');
        if (!token) return;
        setLoading(true);
        try {
            const url = search
                ? `${API_BASE_URL}/api/messages/conversations?search=${encodeURIComponent(search)}`
                : `${API_BASE_URL}/api/messages/conversations`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setConversations(data.data);
            }
        } catch (err) {
            console.error("Error fetching conversations:", err);
        } finally {
            if (activeTab !== 'Shadamon') setLoading(false);
        }
    };

    const fetchNotifications = async () => {
        const token = Cookies.get('token');
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/user/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setNotifications(data);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        const token = Cookies.get('token');
        if (!token) return;
        try {
            await fetch(`${API_BASE_URL}/api/user/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            // Trigger header unread count refresh
            window.dispatchEvent(new Event('refresh-unread-count'));
        } catch (err) {
            console.error("Error marking as read:", err);
        }
    };

    const handleExpand = (notif: any) => {
        setExpandedIds(prev =>
            prev.includes(notif._id)
                ? prev.filter(id => id !== notif._id)
                : [...prev, notif._id]
        );
        if (!notif.isRead) {
            markAsRead(notif._id);
        }
    };

    const toggleSelection = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBlockSelected = async () => {
        if (selectedItems.length === 0) return;

        // Get unique other user IDs from selected conversations
        const selectedConvs = conversations.filter(conv => selectedItems.includes(conv._id));
        const otherUserIds = Array.from(new Set(selectedConvs.map(conv =>
            conv.participants.find((p: any) => p?._id !== currentUser?._id)?._id
        ).filter(Boolean)));

        if (otherUserIds.length === 0) return;

        if (!confirm(`Are you sure you want to block/unblock these ${otherUserIds.length} users?`)) return;

        const token = Cookies.get('token');
        try {
            for (const userId of otherUserIds) {
                const res = await fetch(`${API_BASE_URL}/api/messages/block/${userId}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                await res.json();
            }
            setSelectedItems([]);
            fetchUser(); // Refresh currentUser to get updated blockedUsers list
            alert("Blocked/Unblocked successfully");
        } catch (err) {
            console.error("Error blocking users:", err);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedItems.length} item(s)?`)) return;

        const token = Cookies.get('token');

        // Split selected items by their source
        const selectedConvIds = conversations.filter(c => selectedItems.includes(c._id)).map(c => c._id);
        const selectedPrefIds = notifyPreferences.filter(p => selectedItems.includes(p._id)).map(p => p._id);

        try {
            // Delete Conversations
            if (selectedConvIds.length > 0) {
                const res = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ conversationIds: selectedConvIds })
                });
                const data = await res.json();
                if (data.success) {
                    setConversations(prev => prev.filter(conv => !selectedConvIds.includes(conv._id)));
                }
            }

            // Delete Notification Preferences
            if (selectedPrefIds.length > 0) {
                for (const prefId of selectedPrefIds) {
                    await fetch(`${API_BASE_URL}/api/user/notify-preference/${prefId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                }
                setNotifyPreferences(prev => prev.filter(p => !selectedPrefIds.includes(p._id)));
            }

            setSelectedItems([]);
            // alert("Deleted successfully");
        } catch (err) {
            console.error("Error deleting items:", err);
            alert("Some items could not be deleted");
        }
    };

    if (!isOpen) return null;

    const filteredConversations = conversations.filter(conv => {
        // When searching, exclude notify/callme messages
        if (searchQuery) {
            if (conv.lastMessage?.messageType === 'notify' || conv.lastMessage?.messageType === 'callme') {
                return false;
            }
        }

        if (activeTab === 'Message') {
            return !conv.lastMessage?.messageType || conv.lastMessage?.messageType === 'text';
        }
        if (activeTab === 'Notify') {
            return conv.lastMessage?.messageType === 'callme' || conv.lastMessage?.messageType === 'notify';
        }
        if (activeTab === 'Shadamon') {
            return false;
        }
        return true;
    });

    // Merge notifications preferences as UI items
    const combinedList = [
        ...filteredConversations.map(c => ({ ...c, uiType: 'conversation' })),
        ...(searchQuery === '' && (activeTab === 'All' || activeTab === 'Notify') ? notifyPreferences.map(p => ({
            _id: p._id,
            uiType: 'preference',
            ad: p.ad,
            updatedAt: p.createdAt || new Date().toISOString(),
            createdAt: p.createdAt,
            lastMessage: { messageType: 'notify' }
        })) : []),
        ...(searchQuery === '' && (activeTab === 'All' || activeTab === 'Shadamon') ? notifications.map(n => ({
            ...n,
            uiType: 'notification'
        })) : [])
    ].sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt).getTime();
        return dateB - dateA;
    });

    const messageUnread = conversations
        .filter(conv => !conv.lastMessage?.messageType || conv.lastMessage?.messageType === 'text')
        .reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);

    const notifyUnread = conversations
        .filter(conv => conv.lastMessage?.messageType === 'callme' || conv.lastMessage?.messageType === 'notify')
        .reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);

    const shadamonUnread = notifications.filter(n => !n.isRead).length;

    const totalUnreadCount = messageUnread + notifyUnread + shadamonUnread;

    const getTabUnreadCount = (tab: string) => {
        switch (tab) {
            case 'All': return totalUnreadCount;
            case 'Message': return messageUnread;
            case 'Notify': return notifyUnread;
            case 'Shadamon': return shadamonUnread;
            default: return 0;
        }
    };

    return (
        <div className="fixed inset-0 z-[1100] flex items-start justify-center pt-20">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />

            {/* Modal Container */}
            <div className="relative bg-white w-full max-w-[565px] rounded-t-lg rounded-b-none overflow-hidden flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-2xl h-[calc(100vh-80px)]">

                {/* Header */}
                <div className="bg-white border-b border-slate-200 shrink-0">
                    <div className="flex items-center justify-between p-2 px-4 bg-white">
                        <div className="flex items-center gap-3">
                            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-black hover:bg-slate-50 rounded-full transition-colors">
                                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                            </button>
                            <h2 className="text-[16px] text-black font-medium">Chat, Send message & Notification</h2>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-slate-50 rounded-full">
                            <X className="w-5 h-5 text-black" />
                        </button>
                    </div>

                    {/* Search & Tabs */}
                    <div className="px-4 pb-3 flex flex-col gap-3">
                        {/* Search Bar */}
                        <div className="relative flex items-center bg-[#EDF2F7] rounded-lg px-4 py-2">
                            <Search className="w-5 h-5 text-slate-400 mr-2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search By ID, Name etc"
                                className="bg-transparent flex-1 outline-none text-sm text-black placeholder-slate-400"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="p-1 hover:bg-slate-200 rounded-full transition-colors shrink-0"
                                >
                                    <X className="w-4 h-4 text-slate-500" />
                                </button>
                            )}
                        </div>

                        {/* Tabs/Filters */}
                        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
                            {(['All', 'Message', 'Notify', 'Shadamon'] as const).map((tab) => {
                                const count = getTabUnreadCount(tab);
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={cn(
                                            "px-3 py-1 rounded text-[13px] font-medium transition-colors border whitespace-nowrap",
                                            activeTab === tab
                                                ? "bg-slate-200 text-black border-slate-300 shadow-sm"
                                                : "bg-white text-black border-slate-200 hover:bg-slate-50"
                                        )}
                                    >
                                        {tab}{count > 0 ? ` (${count > 99 ? '99+' : count})` : ''}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Selection Bar (Only shows when items selected) */}
                {selectedItems.length > 0 && (
                    <div className="bg-slate-50 border-b border-slate-200 h-11 flex items-center justify-between px-4 shrink-0 transition-all">
                        <div className="flex items-center gap-2">
                            <span className="text-[14px] font-normal">{selectedItems.length} Item Selected</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={handleBlockSelected} className="text-slate-500 hover:text-black transition-colors">
                                <RiUser3Fill className="w-5 h-5" />
                            </button>
                            <button onClick={handleDeleteSelected} className="text-slate-500 hover:text-red-600 transition-colors">
                                <RiDeleteBinFill className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-white">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-slate-400 p-8">
                            <p className="text-sm animate-pulse">Loading messages...</p>
                        </div>
                    ) : combinedList.length > 0 ? (
                        <div className="flex flex-col">
                            {combinedList.map((item: any) => {
                                const isSelected = selectedItems.includes(item._id);

                                if (item.uiType === 'preference') {
                                    return (
                                        <div
                                            key={item._id}
                                            onClick={() => item.ad && setSelectedAdForDetail(item.ad)}
                                            className="flex items-start gap-3 px-4 py-1 border-b border-slate-300 cursor-pointer hover:bg-slate-50 transition-colors relative group bg-white"
                                        >
                                            {/* Selection Checkbox (Match Messages) */}
                                            <div
                                                onClick={(e) => toggleSelection(item._id, e)}
                                                className="mt-1 shrink-0"
                                            >
                                                <div className={cn(
                                                    "w-5 h-5 border-2 rounded flex items-center justify-center transition-all",
                                                    isSelected ? "bg-[#0088CC] border-[#0088CC]" : "border-slate-300 bg-white"
                                                )}>
                                                    {isSelected && <div className="w-1.5 h-3 border-r-2 border-b-2 border-white rotate-45 mb-1" />}
                                                </div>
                                            </div>

                                            {/* Avatar (Match Messages) */}
                                            <div className="w-[45px] h-[45px] rounded-full overflow-hidden shrink-0 border border-slate-200 bg-slate-50">
                                                <img
                                                    src={getImageUrl(item.ad?.images?.[0])}
                                                    alt=""
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                                                />
                                            </div>

                                            {/* Content Area - Exact Copy of User Request UI */}
                                            <div className="flex-1 min-w-0 flex items-center justify-between self-center">
                                                <div className="flex-1 min-w-0 flex flex-col">
                                                    <span className="text-[13px] text-slate-500 font-medium whitespace-nowrap">'Notify me' Product</span>
                                                    <h3 className="text-[15px] font-medium text-black truncate leading-tight">{item.ad?.headline || 'Notification Setup'}</h3>
                                                    <span className="text-[11px] text-slate-400 mt-0.5">{formatMessageDate(item.updatedAt)}</span>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedAdForDetail(item.ad);
                                                    }}
                                                    className="p-1.5 ml-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }

                                if (item.uiType === 'notification') {
                                    const isExpanded = expandedIds.includes(item._id);
                                    return (
                                        <div
                                            key={item._id}
                                            onClick={() => handleExpand(item)}
                                            className={cn(
                                                "flex items-start gap-3 px-4 py-1 border-b border-slate-300 cursor-pointer transition-colors relative group",
                                                !item.isRead ? "bg-[#EDF2F7]" : "bg-white",
                                                "hover:bg-slate-50"
                                            )}
                                        >
                                            {/* Selection Checkbox */}
                                            <div
                                                onClick={(e) => toggleSelection(item._id, e)}
                                                className="mt-1 shrink-0"
                                            >
                                                <div className={cn(
                                                    "w-5 h-5 border-2 rounded flex items-center justify-center transition-all",
                                                    isSelected ? "bg-[#0088CC] border-[#0088CC]" : "border-slate-300 bg-white"
                                                )}>
                                                    {isSelected && <div className="w-1.5 h-3 border-r-2 border-b-2 border-white rotate-45 mb-1" />}
                                                </div>
                                            </div>

                                            {/* Shadamon Logo */}
                                            <div className="w-[45px] h-[45px] rounded-full overflow-hidden shrink-0 border border-slate-200 bg-white flex items-center justify-center p-1">
                                                <span className="text-[9px] font-bold text-black text-center leading-tight">shadamon</span>
                                            </div>

                                            <div className="flex-1 min-w-0 flex flex-col gap-0">
                                                <div className="text-[11px] text-slate-400 font-bold">SHADAMON</div>
                                                <p className={cn(
                                                    "text-[14px] text-black leading-snug",
                                                    !isExpanded && "line-clamp-1"
                                                )}>
                                                    {item.message}
                                                </p>

                                                {!isExpanded ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleExpand(item);
                                                        }}
                                                        className="text-[11px] text-slate-400 font-medium hover:text-black transition-colors w-fit"
                                                    >
                                                        See Detail
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleExpand(item);
                                                        }}
                                                        className="text-[11px] text-slate-400 font-medium hover:text-black transition-colors w-fit"
                                                    >
                                                        See Less
                                                    </button>
                                                )}

                                                <div className="text-[10px] text-slate-400">
                                                    {formatMessageDate(item.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                const conv = item;
                                const otherUser = conv.participants.find((p: any) => p._id !== currentUser?._id);
                                const isUnread = conv.unreadCount > 0;

                                return (
                                    <div
                                        key={conv._id}
                                        onClick={() => onOpenChat(conv.ad, otherUser)}
                                        className={cn(
                                            "flex items-start gap-3 px-4 py-1 border-b border-slate-300 cursor-pointer transition-colors relative group",
                                            isUnread ? "bg-[#EDF2F7]" : "bg-white",
                                            "hover:bg-slate-50"
                                        )}
                                    >
                                        {/* Selection Checkbox */}
                                        <div
                                            onClick={(e) => toggleSelection(conv._id, e)}
                                            className="mt-1 shrink-0"
                                        >
                                            <div className={cn(
                                                "w-5 h-5 border-2 rounded flex items-center justify-center transition-all",
                                                isSelected ? "bg-[#0088CC] border-[#0088CC]" : "border-slate-300 bg-white"
                                            )}>
                                                {isSelected && <div className="w-1.5 h-3 border-r-2 border-b-2 border-white rotate-45 mb-1" />}
                                            </div>
                                        </div>

                                        {/* Avatar */}
                                        <div className="w-[45px] h-[45px] rounded-full overflow-hidden shrink-0 border border-slate-200 bg-slate-50">
                                            <img
                                                src={getImageUrl(otherUser?.photo || otherUser?.storeLogo || conv.ad?.images?.[0])}
                                                alt=""
                                                className="w-full h-full object-contain"
                                                onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 flex items-center justify-between">
                                            {conv.lastMessage?.messageType === 'notify' ? (
                                                <div
                                                    className="flex-1 min-w-0 flex flex-col"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedAdForDetail(conv.ad);
                                                    }}
                                                >
                                                    <span className="text-[13px] text-slate-400 font-medium whitespace-nowrap">'Notify me' Product</span>
                                                    <h3 className="text-[15px] font-bold text-black truncate">{conv.ad?.headline || 'Notification'}</h3>
                                                    <span className="text-[11px] text-slate-400">{formatMessageDate(conv.updatedAt)}</span>
                                                </div>
                                            ) : (
                                                <div className="flex-1 min-w-0 flex flex-col gap-0">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-[15px] font-bold text-black truncate flex items-center">
                                                            <span className="truncate">{otherUser?.name || otherUser?.storeName || 'User'}</span>

                                                            {conv.lastMessage?.messageType === 'callme' && (
                                                                <div className="flex items-center shrink-0">
                                                                    <div className="w-[1px] h-3 bg-slate-400 mx-2" />
                                                                    <div className="w-5 h-5 rounded-full bg-[#E2E8F0] flex items-center justify-center border border-slate-300 shadow-sm">
                                                                        <Phone className="w-2.5 h-2.5 text-slate-700 fill-slate-700" />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {currentUser?.blockedUsers?.includes(otherUser?._id) && (
                                                                <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded font-normal ml-2">Blocked</span>
                                                            )}
                                                        </h3>
                                                    </div>

                                                    {/* Last Message Snippet */}
                                                    <p className={cn(
                                                        "text-[14px] line-clamp-1",
                                                        isUnread ? "font-bold text-black" : "text-slate-600"
                                                    )}>
                                                        {conv.lastMessage?.text || (conv.lastMessage?.image ? "📷 Photo" : "No messages")}
                                                    </p>

                                                    {/* Ad Headline (Secondary) */}
                                                    <div className="flex items-center gap-2 mt-0">
                                                        <p className="text-[11px] text-slate-400 truncate flex-1">
                                                            {conv.ad?.headline || 'No Headline'}
                                                        </p>
                                                    </div>

                                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                                        <span>{formatMessageDate(conv.updatedAt)}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {conv.lastMessage?.messageType === 'notify' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedAdForDetail(conv.ad);
                                                    }}
                                                    className="p-1.5 ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                            <p className="text-sm">No messages yet</p>
                        </div>
                    )}
                </div>
            </div>

            {selectedAdForDetail && (
                <AdDetailsModal
                    isOpen={!!selectedAdForDetail}
                    onClose={() => setSelectedAdForDetail(null)}
                    ad={selectedAdForDetail}
                />
            )}
        </div>
    );
}
