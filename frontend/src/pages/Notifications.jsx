import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Filter, Loader } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const typeIcon = (title = '') => {
    if (title.includes('Booking')) return '📋';
    if (title.includes('Assigned')) return '👤';
    if (title.includes('Arrived')) return '📍';
    if (title.includes('Started')) return '🎬';
    if (title.includes('Completed')) return '✅';
    if (title.includes('Video') || title.includes('Uploaded')) return '🎥';
    return '🔔';
};

const Notifications = () => {
    const { toast } = useToast();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all | unread | read

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications?limit=100');
            setNotifications(res.data);
        } catch (error) {
            toast('Failed to load notifications', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            toast('Failed to mark as read', 'error');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/all/read');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            toast('All notifications marked as read', 'success');
        } catch (error) {
            toast('Failed to mark all as read', 'error');
        }
    };

    const timeAgo = (dateStr) => {
        const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        const days = Math.floor(hours / 24);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    };

    const filtered = notifications.filter(n => {
        if (filter === 'unread') return !n.is_read;
        if (filter === 'read') return n.is_read;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-color)]">Notifications</h1>
                    <p className="text-gray-400 mt-1">
                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-2 px-4 py-2 glass border border-[var(--glass-border)] rounded-lg text-[var(--accent)] font-semibold hover:bg-[var(--glass-bg)] transition-colors text-sm"
                    >
                        <CheckCheck size={16} />
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 glass p-1.5 rounded-xl border border-[var(--glass-border)] w-fit">
                {['all', 'unread', 'read'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                            filter === tab
                                ? 'bg-[var(--accent)] text-black shadow'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        {tab}
                        {tab === 'unread' && unreadCount > 0 && (
                            <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="glass rounded-2xl border border-[var(--glass-border)] overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader size={36} className="animate-spin text-[var(--accent)]" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center text-gray-500">
                        <Bell size={48} className="mx-auto mb-3 opacity-30" />
                        <p className="text-lg font-medium">No notifications here</p>
                        <p className="text-sm mt-1">
                            {filter === 'unread' ? 'All caught up — nothing unread.' : 'Nothing to show.'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--glass-border)]">
                        {filtered.map((notif) => (
                            <div
                                key={notif._id}
                                className={`flex gap-4 px-6 py-5 transition-colors group ${!notif.is_read ? 'bg-[var(--accent)]/5' : 'hover:bg-[var(--glass-bg)]'}`}
                            >
                                {/* Icon */}
                                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center text-xl">
                                    {typeIcon(notif.title)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <p className={`font-semibold text-sm ${notif.is_read ? 'text-gray-400' : 'text-white'}`}>
                                            {notif.title}
                                        </p>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-[11px] text-gray-600">{timeAgo(notif.created_at)}</span>
                                            {!notif.is_read && (
                                                <div className="w-2 h-2 rounded-full bg-[var(--accent)] flex-shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">{notif.message}</p>
                                    {!notif.is_read && (
                                        <button
                                            onClick={() => handleMarkRead(notif._id)}
                                            className="mt-2 text-xs text-[var(--accent)] hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Mark as read
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
