import React, { useState, useEffect } from 'react';
import {
    Store,
    CalendarCheck,
    Clock,
    CheckCircle,
    IndianRupee,
    Video,
    TrendingUp,
    TrendingDown,
    Loader,
    ArrowRight,
    Users
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

// ── Stat Card ──────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, prev, prefix = '', suffix = '', colorClass }) => {
    const change = prev > 0 ? Math.round(((value - prev) / prev) * 100) : null;
    const up = change >= 0;

    return (
        <div className="glass p-6 rounded-2xl border border-[var(--glass-border)] relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--accent)] opacity-[0.04] rounded-full group-hover:scale-150 transition-transform duration-500" />
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-[var(--text-h)]">
                        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
                    </h3>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass || 'bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--accent)]'}`}>
                    <Icon size={22} />
                </div>
            </div>
            {change !== null && (
                <div className="mt-4 flex items-center text-sm gap-1">
                    {up
                        ? <TrendingUp size={14} className="text-green-400" />
                        : <TrendingDown size={14} className="text-red-400" />
                    }
                    <span className={up ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                        {up ? '+' : ''}{change}%
                    </span>
                    <span className="text-gray-500 ml-1">vs last month</span>
                </div>
            )}
        </div>
    );
};

// ── Status Badge ───────────────────────────────────────────────────────────────
const statusColors = {
    pending:   'bg-gray-500/10 text-gray-400 border-gray-500/30',
    assigned:  'bg-blue-500/10 text-blue-400 border-blue-500/30',
    arrived:   'bg-purple-500/10 text-purple-400 border-purple-500/30',
    shooting:  'bg-orange-500/10 text-orange-400 border-orange-500/30',
    editing:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    completed: 'bg-green-500/10 text-green-400 border-green-500/30',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/30'
};

const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${statusColors[status] || statusColors.pending}`}>
        {status}
    </span>
);

// ── Time Ago helper ────────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'just now';
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

// ── Main Dashboard ─────────────────────────────────────────────────────────────
const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const [overview, setOverview] = useState(null);
    const [monthly, setMonthly] = useState(null);
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const [ov, mo, bk] = await Promise.all([
                    api.get('/analytics/overview'),
                    api.get('/analytics/monthly'),
                    api.get('/bookings/admin?limit=5&sortBy=created_at&sortOrder=desc')
                ]);
                setOverview(ov.data);
                setMonthly(mo.data);
                setRecentBookings(bk.data?.bookings || []);
            } catch (err) {
                console.error('Dashboard data error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader size={48} className="animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    // Chart data using real monthly figures
    const revenueChartData = {
        labels: monthly?.labels || [],
        datasets: [
            {
                label: 'Revenue',
                data: monthly?.revenue || [],
                borderColor: 'rgba(234,179,8,1)',
                backgroundColor: 'rgba(234,179,8,0.08)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: 'rgba(234,179,8,1)'
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.85)',
                borderColor: 'rgba(234,179,8,0.3)',
                borderWidth: 1,
                titleColor: '#fff',
                bodyColor: '#9ca3af',
                callbacks: {
                    label: (ctx) => ` ₹${ctx.parsed.y.toLocaleString()}`
                }
            }
        },
        scales: {
            x: { ticks: { color: '#6b7280', font: { size: 11 } }, grid: { display: false } },
            y: {
                ticks: {
                    color: '#6b7280',
                    font: { size: 11 },
                    callback: v => `₹${(v / 1000).toFixed(0)}k`
                },
                grid: { color: 'rgba(255,255,255,0.04)' }
            }
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-h)]">Overview</h1>
                    <p className="text-gray-400 text-sm mt-1">Here's what's happening with Revora Cinematic today.</p>
                </div>
                <button
                    onClick={() => navigate('/admin/analytics')}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-black font-semibold rounded-lg hover:bg-opacity-90 transition-colors text-sm"
                >
                    <TrendingUp size={16} />
                    Full Analytics
                </button>
            </div>

            {/* ── Stat Cards ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                <StatCard
                    title="Total Bookings"
                    value={overview?.totalBookings || 0}
                    prev={overview?.lastMonthBookings || 0}
                    icon={CalendarCheck}
                    colorClass="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                />
                <StatCard
                    title="This Month"
                    value={overview?.monthBookings || 0}
                    icon={Clock}
                    colorClass="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                />
                <StatCard
                    title="Completed"
                    value={overview?.completedBookings || 0}
                    icon={CheckCircle}
                    colorClass="bg-green-500/10 text-green-400 border border-green-500/20"
                />
                <StatCard
                    title="Active Showrooms"
                    value={overview?.totalShowrooms || 0}
                    icon={Store}
                    colorClass="bg-purple-500/10 text-purple-400 border border-purple-500/20"
                />
                <StatCard
                    title="Total Revenue"
                    value={overview?.totalRevenue || 0}
                    prefix="₹"
                    icon={IndianRupee}
                    colorClass="bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20"
                />
            </div>

            {/* ── Second Row ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Area Chart */}
                <div className="lg:col-span-2 glass p-6 rounded-2xl border border-[var(--glass-border)]">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-[var(--text-h)]">Revenue Overview</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Last 6 months from completed payments</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500">This month</p>
                            <p className="text-lg font-bold text-[var(--accent)]">₹{(overview?.monthRevenue || 0).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="h-[280px]">
                        <Line data={revenueChartData} options={chartOptions} />
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="glass p-6 rounded-2xl border border-[var(--glass-border)] space-y-5">
                    <h3 className="text-lg font-semibold text-[var(--text-h)]">Quick Stats</h3>

                    <div className="space-y-4">
                        {[
                            { label: 'Pending Shoots', value: overview?.pendingBookings || 0, color: 'bg-yellow-400', max: overview?.totalBookings || 1 },
                            { label: 'Videographers', value: overview?.totalVideographers || 0, color: 'bg-indigo-400', max: 20 },
                            { label: 'Total Users', value: overview?.totalUsers || 0, color: 'bg-purple-400', max: 100 }
                        ].map((item) => (
                            <div key={item.label}>
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-sm text-gray-400">{item.label}</span>
                                    <span className="text-sm font-bold text-white">{item.value}</span>
                                </div>
                                <div className="w-full bg-[var(--glass-bg)] rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full ${item.color} transition-all duration-700`}
                                        style={{ width: `${Math.min(100, Math.round((item.value / item.max) * 100))}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-[var(--glass-border)] pt-4 grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[var(--accent)]">{overview?.completedBookings || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Completed</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-purple-400">{overview?.totalVideographers || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Videographers</p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/admin/analytics')}
                        className="w-full flex items-center justify-center gap-2 py-2.5 border border-[var(--accent)]/30 rounded-xl text-sm text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors font-semibold"
                    >
                        View Full Analytics
                        <ArrowRight size={14} />
                    </button>
                </div>
            </div>

            {/* ── Recent Bookings Table ──────────────────────────────────── */}
            <div className="glass rounded-2xl border border-[var(--glass-border)] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-[var(--glass-border)]">
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--text-h)]">Recent Bookings</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Latest 5 bookings across all showrooms</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/bookings')}
                        className="flex items-center gap-1.5 text-sm text-[var(--accent)] hover:underline font-semibold"
                    >
                        View all
                        <ArrowRight size={14} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--glass-bg)] border-b border-[var(--glass-border)] text-gray-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">Vehicle</th>
                                <th className="px-6 py-3 hidden sm:table-cell">Showroom</th>
                                <th className="px-6 py-3 hidden md:table-cell">Date</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 hidden lg:table-cell">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--glass-border)]">
                            {recentBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500 text-sm">
                                        No bookings yet
                                    </td>
                                </tr>
                            ) : (
                                recentBookings.map((b) => (
                                    <tr key={b.id || b._id} className="hover:bg-[var(--glass-bg)] transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-white text-sm">{b.customer_name}</p>
                                            <p className="text-xs text-gray-500">{b.customer_mobile}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-300">{b.vehicle_brand} {b.vehicle_model}</p>
                                            <p className="text-xs text-gray-500">{b.registration_number}</p>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <p className="text-sm text-gray-300">{b.showroom?.name || '—'}</p>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <p className="text-sm text-gray-300">
                                                {b.booking_date ? new Date(b.booking_date).toLocaleDateString() : '—'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={b.status} />
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell text-xs text-gray-500">
                                            {timeAgo(b.created_at)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
