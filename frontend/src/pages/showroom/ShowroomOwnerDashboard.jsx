import React, { useEffect, useState } from 'react';
import {
    CalendarCheck,
    Clock,
    CreditCard,
    Film,
    History,
    MapPin,
    Package,
    ShieldCheck,
    Sparkles
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../../services/api';
import { useToast } from '../../components/Toast';

const chartColors = ['#FACC15', '#22C55E', '#38BDF8', '#A78BFA', '#F97316'];

const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

const formatTime = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const statusStyles = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    confirmed: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    in_progress: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    completed: 'bg-green-500/10 text-green-400 border-green-500/30',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
};

const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${statusStyles[status] || statusStyles.pending}`}>
        {String(status || 'pending').replace('_', ' ')}
    </span>
);

const StatCard = ({ title, value, icon: Icon, helper }) => (
    <div className="glass rounded-2xl border border-[var(--glass-border)] p-5 overflow-hidden relative">
        <div className="flex items-start justify-between gap-4">
            <div>
                <p className="text-sm text-gray-400">{title}</p>
                <p className="text-3xl font-bold text-[var(--text-h)] mt-2">{value}</p>
                <p className="text-xs text-gray-500 mt-3">{helper}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--accent)] shrink-0">
                <Icon size={22} />
            </div>
        </div>
    </div>
);

const EmptyState = ({ title, text }) => (
    <div className="py-12 text-center text-gray-500">
        <p className="text-base font-medium text-gray-400">{title}</p>
        <p className="text-sm mt-1">{text}</p>
    </div>
);

const ShowroomOwnerDashboard = () => {
    const { toast } = useToast();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await api.get('/showroom-owner/dashboard');
                setDashboard(res.data);
            } catch (error) {
                toast(error.response?.data?.message || 'Failed to load showroom dashboard', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [toast]);

    const stats = dashboard?.stats || {};
    const showroom = dashboard?.showroom;
    const chartData = dashboard?.bookingStatusChart || [];
    const chartTotal = chartData.reduce((sum, item) => sum + item.value, 0);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-24 glass rounded-2xl border border-[var(--glass-border)] animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                    {[...Array(4)].map((_, index) => <div key={index} className="h-36 glass rounded-2xl border border-[var(--glass-border)] animate-pulse" />)}
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 h-96 glass rounded-2xl border border-[var(--glass-border)] animate-pulse" />
                    <div className="h-96 glass rounded-2xl border border-[var(--glass-border)] animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section className="glass rounded-2xl border border-[var(--glass-border)] p-5 sm:p-6 overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-semibold mb-4">
                            <Sparkles size={14} />
                            Revora Cinematic Showroom Console
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-h)]">{showroom?.name || 'Showroom Dashboard'}</h1>
                        <p className="text-sm text-gray-400 mt-2 max-w-2xl">
                            Track bookings, upcoming shoots, completed work, and payment health from one premium workspace.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="px-4 py-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] min-w-[180px]">
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Showroom Status</p>
                            <div className="mt-2"><StatusBadge status={showroom?.status || 'pending'} /></div>
                        </div>
                        <div className="px-4 py-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] min-w-[220px]">
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Location</p>
                            <p className="text-sm text-[var(--text-h)] mt-2 flex items-center gap-2">
                                <MapPin size={15} className="text-[var(--accent)] shrink-0" />
                                <span className="truncate">{showroom?.address || 'Not added'}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {showroom?.status !== 'approved' && (
                <div className="glass rounded-2xl border border-yellow-500/30 p-5 text-yellow-300 bg-yellow-500/5">
                    <div className="flex items-start gap-3">
                        <ShieldCheck size={20} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">Your showroom is awaiting approval.</p>
                            <p className="text-sm text-yellow-200/70 mt-1">Bookings and payments will appear here once the super admin approves your showroom profile.</p>
                        </div>
                    </div>
                </div>
            )}

            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard title="Total Bookings" value={stats.totalBookings || 0} icon={CalendarCheck} helper="All-time booking requests" />
                <StatCard title="Upcoming Shoots" value={stats.upcomingShoots || 0} icon={Clock} helper="Pending or confirmed shoots" />
                <StatCard title="Completed Shoots" value={stats.completedShoots || 0} icon={Film} helper="Delivered showroom shoots" />
                <StatCard title="Pending Payments" value={stats.pendingPayments || 0} icon={CreditCard} helper="Bookings needing settlement" />
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 glass rounded-2xl border border-[var(--glass-border)] overflow-hidden">
                    <div className="px-5 py-4 border-b border-[var(--glass-border)] flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--text-h)]">Recent Bookings</h2>
                            <p className="text-sm text-gray-500 mt-1">Latest booking activity from your showroom</p>
                        </div>
                        <History size={20} className="text-[var(--accent)]" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--glass-border)]">
                                    {['Package', 'Shoot Date', 'Payment', 'Status'].map(header => (
                                        <th key={header} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {dashboard?.recentBookings?.length ? dashboard.recentBookings.map(booking => (
                                    <tr key={booking.id} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--accent)] shrink-0">
                                                    <Package size={17} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-[var(--text-h)]">{booking.package_name}</p>
                                                    <p className="text-xs text-gray-500">{Number(booking.price || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-sm text-[var(--text-h)]">{formatDate(booking.booking_date)}</p>
                                            <p className="text-xs text-gray-500">{formatTime(booking.booking_date)}</p>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-400 capitalize">{booking.payment_status || 'pending'}</td>
                                        <td className="px-5 py-4"><StatusBadge status={booking.status} /></td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4}><EmptyState title="No recent bookings" text="New bookings will appear here as soon as they are created." /></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="glass rounded-2xl border border-[var(--glass-border)] p-5">
                    <div className="flex items-center justify-between gap-3 mb-5">
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--text-h)]">Booking Status</h2>
                            <p className="text-sm text-gray-500 mt-1">{chartTotal} tracked bookings</p>
                        </div>
                        <CalendarCheck size={20} className="text-[var(--accent)]" />
                    </div>
                    {chartData.length ? (
                        <>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={chartData} innerRadius={58} outerRadius={86} paddingAngle={4} dataKey="value">
                                            {chartData.map((entry, index) => (
                                                <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.12)', borderRadius: '8px' }}
                                            itemStyle={{ color: '#FACC15' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-3">
                                {chartData.map((item, index) => (
                                    <div key={item.name} className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-gray-300 capitalize">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                                            {item.name.replace('_', ' ')}
                                        </span>
                                        <span className="text-[var(--text-h)] font-semibold">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <EmptyState title="No chart data" text="Booking status insights will appear after your first booking." />
                    )}
                </div>
            </section>

            <section className="glass rounded-2xl border border-[var(--glass-border)] overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--glass-border)] flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--text-h)]">Upcoming Shoots</h2>
                        <p className="text-sm text-gray-500 mt-1">Confirmed and pending shoots lined up next</p>
                    </div>
                    <Clock size={20} className="text-[var(--accent)]" />
                </div>
                <div className="divide-y divide-[var(--glass-border)]">
                    {dashboard?.upcomingShoots?.length ? dashboard.upcomingShoots.map(shoot => (
                        <div key={shoot.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[var(--glass-bg)] transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/25 text-[var(--accent)] flex items-center justify-center shrink-0">
                                    <Film size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-[var(--text-h)]">{shoot.package_name}</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        {formatDate(shoot.booking_date)} at {formatTime(shoot.booking_date)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Videographer: {shoot.videographer_name || 'Pending assignment'}</p>
                                </div>
                            </div>
                            <StatusBadge status={shoot.status} />
                        </div>
                    )) : (
                        <EmptyState title="No upcoming shoots" text="Your next scheduled shoots will be listed here." />
                    )}
                </div>
            </section>
        </div>
    );
};

export default ShowroomOwnerDashboard;
