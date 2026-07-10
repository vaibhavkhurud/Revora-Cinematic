import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const NotificationBell = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await api.get('/notifications/unread-count');
            setUnreadCount(res.data.count);
        } catch (_) {}
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications?limit=6');
            setNotifications(res.data);
        } catch (_) {}
    };

    // Poll every 30 seconds
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOpen = () => {
        setOpen(!open);
        if (!open) fetchNotifications();
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/all/read');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (_) {}
    };

    const handleMarkRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (_) {}
    };

    const timeAgo = (dateStr) => {
        const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={handleOpen}
                className="relative w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                aria-label="Notifications"
            >
                <Bell size={20} className={unreadCount > 0 ? 'text-[var(--accent)]' : ''} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-[var(--bg-color)] animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-full mt-3 w-[340px] z-50 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)]">
                        <div>
                            <h3 className="text-sm font-bold text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <p className="text-xs text-gray-400">{unreadCount} unread</p>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                            >
                                <CheckCheck size={13} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[360px] overflow-y-auto divide-y divide-[var(--glass-border)]">
                        {notifications.length === 0 ? (
                            <div className="py-10 text-center text-gray-500 text-sm">
                                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <button
                                    key={notif._id}
                                    onClick={() => handleMarkRead(notif._id)}
                                    className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex gap-3 ${!notif.is_read ? 'bg-[var(--accent)]/5' : ''}`}
                                >
                                    {/* Unread dot */}
                                    <div className="mt-1.5 flex-shrink-0">
                                        {!notif.is_read ? (
                                            <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-transparent" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold truncate ${notif.is_read ? 'text-gray-400' : 'text-white'}`}>
                                            {notif.title}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                                            {notif.message}
                                        </p>
                                        <p className="text-[10px] text-gray-600 mt-1">{timeAgo(notif.created_at)}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-[var(--glass-border)] px-4 py-2">
                        <button
                            onClick={() => { navigate('/notifications'); setOpen(false); }}
                            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline py-1"
                        >
                            View all notifications
                            <ArrowRight size={13} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
