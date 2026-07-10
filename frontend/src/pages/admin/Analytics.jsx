import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    TrendingUp,
    CalendarCheck,
    Store,
    Video,
    Users,
    CheckCircle,
    Clock,
    DollarSign,
    Loader
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';

ChartJS.register(
    CategoryScale, LinearScale, PointElement,
    LineElement, BarElement, ArcElement,
    Tooltip, Legend, Filler
);

// ── Shared chart options ───────────────────────────────────────────────────────
const gridColor = 'rgba(255,255,255,0.05)';
const textColor = '#9ca3af';

const baseLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: textColor, font: { size: 12 }, boxWidth: 12 } },
        tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            borderColor: 'rgba(234,179,8,0.3)',
            borderWidth: 1,
            titleColor: '#fff',
            bodyColor: '#9ca3af'
        }
    },
    scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true }
    }
};

const baseBarOptions = { ...baseLineOptions };

const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'right',
            labels: { color: textColor, font: { size: 12 }, boxWidth: 12, padding: 16 }
        },
        tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            borderColor: 'rgba(234,179,8,0.3)',
            borderWidth: 1,
            titleColor: '#fff',
            bodyColor: '#9ca3af'
        }
    }
};

const accent = 'rgba(234,179,8,1)';
const accentFade = 'rgba(234,179,8,0.12)';
const blue = 'rgba(99,102,241,1)';
const blueFade = 'rgba(99,102,241,0.12)';
const green = 'rgba(34,197,94,1)';
const greenFade = 'rgba(34,197,94,0.12)';

const statusColors = [
    '#64748b', '#6366f1', '#f59e0b', '#f97316', '#a855f7', '#22c55e', '#ef4444'
];

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, iconClass, prefix = '' }) => (
    <div className="glass rounded-2xl p-6 border border-[var(--glass-border)] relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-[var(--accent)] opacity-[0.04] rounded-full group-hover:scale-150 transition-transform duration-500" />
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{label}</p>
                <h3 className="text-3xl font-bold text-[var(--text-color)]">
                    {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
                </h3>
                {sub && <p className="text-xs text-gray-500 mt-2">{sub}</p>}
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconClass}`}>
                <Icon size={22} />
            </div>
        </div>
    </div>
);

// ── Chart Card wrapper ────────────────────────────────────────────────────────
const ChartCard = ({ title, subtitle, children, height = 280 }) => (
    <div className="glass rounded-2xl border border-[var(--glass-border)] p-6">
        <div className="mb-6">
            <h3 className="text-lg font-bold text-[var(--text-color)]">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div style={{ height }}>{children}</div>
    </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const Analytics = () => {
    const { toast } = useToast();
    const [overview, setOverview] = useState(null);
    const [monthly, setMonthly] = useState(null);
    const [packages, setPackages] = useState(null);
    const [videographers, setVideographers] = useState(null);
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [ov, mo, pk, vg, st] = await Promise.all([
                    api.get('/analytics/overview'),
                    api.get('/analytics/monthly'),
                    api.get('/analytics/packages'),
                    api.get('/analytics/videographers'),
                    api.get('/analytics/status')
                ]);
                setOverview(ov.data);
                setMonthly(mo.data);
                setPackages(pk.data);
                setVideographers(vg.data);
                setStatusData(st.data);
            } catch (err) {
                toast('Failed to load analytics data', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader size={48} className="animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    // ── Monthly Bookings & Revenue Chart ────────────────────────────────────
    const monthlyBookingsData = {
        labels: monthly?.labels || [],
        datasets: [
            {
                label: 'Total Bookings',
                data: monthly?.bookings || [],
                borderColor: accent,
                backgroundColor: accentFade,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: accent,
                pointRadius: 4
            },
            {
                label: 'Completed',
                data: monthly?.completed || [],
                borderColor: green,
                backgroundColor: greenFade,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: green,
                pointRadius: 4
            }
        ]
    };

    const monthlyRevenueData = {
        labels: monthly?.labels || [],
        datasets: [
            {
                label: 'Revenue (₹)',
                data: monthly?.revenue || [],
                backgroundColor: monthly?.labels?.map((_, i) =>
                    i === (monthly.labels.length - 1)
                        ? accent
                        : 'rgba(234,179,8,0.4)'
                ) || [],
                borderColor: accent,
                borderWidth: 1.5,
                borderRadius: 8
            }
        ]
    };

    // ── Package Sales Doughnut ───────────────────────────────────────────────
    const packageColors = ['#eab308','#6366f1','#22c55e','#f97316','#a855f7','#ef4444','#14b8a6','#ec4899'];
    const packageData = {
        labels: packages?.map(p => p.name) || [],
        datasets: [{
            data: packages?.map(p => p.bookings) || [],
            backgroundColor: packageColors.slice(0, packages?.length || 0),
            borderColor: 'rgba(0,0,0,0.3)',
            borderWidth: 2
        }]
    };

    // ── Status Doughnut ──────────────────────────────────────────────────────
    const statusChartData = {
        labels: statusData?.labels?.map(s => s.charAt(0).toUpperCase() + s.slice(1)) || [],
        datasets: [{
            data: statusData?.data || [],
            backgroundColor: statusColors,
            borderColor: 'rgba(0,0,0,0.3)',
            borderWidth: 2
        }]
    };

    // ── Videographer Performance Bar ────────────────────────────────────────
    const videographerData = {
        labels: videographers?.map(v => v.name.split(' ')[0]) || [],
        datasets: [
            {
                label: 'Total Assigned',
                data: videographers?.map(v => v.total) || [],
                backgroundColor: 'rgba(99,102,241,0.6)',
                borderColor: blue,
                borderWidth: 1.5,
                borderRadius: 6
            },
            {
                label: 'Completed',
                data: videographers?.map(v => v.completed) || [],
                backgroundColor: 'rgba(34,197,94,0.6)',
                borderColor: green,
                borderWidth: 1.5,
                borderRadius: 6
            }
        ]
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-[var(--text-color)]">Analytics</h1>
                <p className="text-gray-400 mt-1">Business overview and performance insights</p>
            </div>

            {/* ── Stat Cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard
                    label="Total Revenue"
                    value={overview?.totalRevenue || 0}
                    prefix="₹"
                    sub={`₹${(overview?.monthRevenue || 0).toLocaleString()} this month`}
                    icon={DollarSign}
                    iconClass="bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20"
                />
                <StatCard
                    label="Total Bookings"
                    value={overview?.totalBookings || 0}
                    sub={`${overview?.monthBookings || 0} this month`}
                    icon={CalendarCheck}
                    iconClass="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                />
                <StatCard
                    label="Completed Shoots"
                    value={overview?.completedBookings || 0}
                    sub={`${overview?.pendingBookings || 0} pending`}
                    icon={CheckCircle}
                    iconClass="bg-green-500/10 text-green-400 border border-green-500/20"
                />
                <StatCard
                    label="Active Showrooms"
                    value={overview?.totalShowrooms || 0}
                    sub={`${overview?.totalVideographers || 0} videographers`}
                    icon={Store}
                    iconClass="bg-purple-500/10 text-purple-400 border border-purple-500/20"
                />
            </div>

            {/* ── Row 2: Monthly Bookings + Revenue ──────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Monthly Bookings" subtitle="Total vs completed over the last 6 months" height={280}>
                    <Line data={monthlyBookingsData} options={baseLineOptions} />
                </ChartCard>
                <ChartCard title="Monthly Revenue" subtitle="Revenue collected from completed payments" height={280}>
                    <Bar data={monthlyRevenueData} options={baseBarOptions} />
                </ChartCard>
            </div>

            {/* ── Row 3: Package Sales + Status Breakdown ─────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Package Sales Breakdown" subtitle="Bookings per package" height={260}>
                    {packages && packages.length > 0 ? (
                        <Doughnut data={packageData} options={doughnutOptions} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 text-sm">No package data</div>
                    )}
                </ChartCard>
                <ChartCard title="Booking Status Distribution" subtitle="All-time status breakdown" height={260}>
                    {statusData && statusData.data.some(d => d > 0) ? (
                        <Doughnut data={statusChartData} options={doughnutOptions} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 text-sm">No booking data</div>
                    )}
                </ChartCard>
            </div>

            {/* ── Row 4: Videographer Performance ──────────────────────────── */}
            <ChartCard title="Videographer Performance" subtitle="Total assigned vs completed shoots per videographer" height={300}>
                {videographers && videographers.length > 0 ? (
                    <Bar data={videographerData} options={baseBarOptions} />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">No videographer data yet</div>
                )}
            </ChartCard>

            {/* ── Row 5: Videographer Table ─────────────────────────────────── */}
            {videographers && videographers.length > 0 && (
                <div className="glass rounded-2xl border border-[var(--glass-border)] overflow-hidden">
                    <div className="p-6 border-b border-[var(--glass-border)]">
                        <h3 className="text-lg font-bold text-[var(--text-color)]">Videographer Report</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Detailed completion rates</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[var(--glass-bg)] border-b border-[var(--glass-border)] text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4">Videographer</th>
                                    <th className="px-6 py-4 text-center">Total</th>
                                    <th className="px-6 py-4 text-center">Completed</th>
                                    <th className="px-6 py-4 text-center">In Progress</th>
                                    <th className="px-6 py-4">Completion Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--glass-border)]">
                                {videographers.map((v, i) => (
                                    <tr key={i} className="hover:bg-[var(--glass-bg)] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] text-xs font-bold">
                                                    {v.name.charAt(0)}
                                                </div>
                                                <span className="font-medium text-white">{v.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-300">{v.total}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-green-400 font-semibold">{v.completed}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-yellow-400 font-semibold">{v.inProgress}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 bg-[var(--glass-bg)] rounded-full h-2 max-w-[120px]">
                                                    <div
                                                        className="h-2 rounded-full bg-[var(--accent)] transition-all"
                                                        style={{ width: `${v.completionRate}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-semibold text-[var(--accent)] w-10">{v.completionRate}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Row 6: Package Table ──────────────────────────────────── */}
            {packages && packages.length > 0 && (
                <div className="glass rounded-2xl border border-[var(--glass-border)] overflow-hidden">
                    <div className="p-6 border-b border-[var(--glass-border)]">
                        <h3 className="text-lg font-bold text-[var(--text-color)]">Package Sales Report</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Booking counts per package</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[var(--glass-bg)] border-b border-[var(--glass-border)] text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4">Package</th>
                                    <th className="px-6 py-4 text-right">Price</th>
                                    <th className="px-6 py-4 text-center">Bookings</th>
                                    <th className="px-6 py-4 text-center">Completed</th>
                                    <th className="px-6 py-4">Popularity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--glass-border)]">
                                {packages.map((p, i) => {
                                    const maxBookings = Math.max(...packages.map(x => x.bookings), 1);
                                    return (
                                        <tr key={i} className="hover:bg-[var(--glass-bg)] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ background: packageColors[i] }} />
                                                    <span className="font-medium text-white">{p.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-300">₹{p.price.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center text-white font-semibold">{p.bookings}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-green-400 font-semibold">{p.completed}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 bg-[var(--glass-bg)] rounded-full h-2 max-w-[120px]">
                                                        <div
                                                            className="h-2 rounded-full transition-all"
                                                            style={{
                                                                width: `${Math.round((p.bookings / maxBookings) * 100)}%`,
                                                                background: packageColors[i]
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-400 w-8">
                                                        {Math.round((p.bookings / maxBookings) * 100)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Analytics;
