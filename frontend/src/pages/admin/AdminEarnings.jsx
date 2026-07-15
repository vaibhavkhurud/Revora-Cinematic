import React, { useState, useEffect, useCallback } from 'react';
import {
    DollarSign,
    TrendingUp,
    Video,
    Package,
    Users,
    Calendar,
    Loader,
    IndianRupee,
    BarChart3,
    Trophy,
    ArrowUpRight,
    CheckCircle,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

const StatCard = ({ title, value, icon: Icon, subtitle, accent = false }) => (
    <div className={`glass p-6 rounded-2xl border ${accent ? 'border-yellow-500/40' : 'border-[var(--glass-border)]'} relative overflow-hidden group`}>
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--accent)] opacity-[0.04] rounded-full group-hover:scale-150 transition-transform duration-500"></div>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
                <h3 className={`text-3xl font-bold ${accent ? 'text-yellow-400' : 'text-[var(--text-color)]'}`}>{value}</h3>
                {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
            </div>
            <div className={`w-12 h-12 rounded-xl ${accent ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-[var(--glass-bg)] border-[var(--glass-border)]'} border flex items-center justify-center ${accent ? 'text-yellow-400' : 'text-[var(--accent)]'}`}>
                <Icon size={24} />
            </div>
        </div>
    </div>
);

const AdminEarnings = () => {
    const { toast } = useToast();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [expandedVid, setExpandedVid] = useState(null);

    const fetchEarnings = useCallback(async () => {
        try {
            setLoading(true);
            const params = {};
            if (startDate) params.startDate = startDate.toISOString();
            if (endDate) params.endDate = endDate.toISOString();
            const res = await api.get('/bookings/admin/earnings', { params });
            setData(res.data);
        } catch (error) {
            toast(error.response?.data?.message || 'Failed to load earnings', 'error');
        } finally {
            setLoading(false);
        }
    }, [toast, startDate, endDate]);

    useEffect(() => {
        fetchEarnings();
    }, [fetchEarnings]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader size={48} className="animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    const {
        total_revenue = 0,
        total_completed_shoots = 0,
        package_breakdown = [],
        videographer_breakdown = [],
        monthly_revenue = {}
    } = data || {};

    const avgPerShoot = total_completed_shoots > 0 ? total_revenue / total_completed_shoots : 0;
    const maxPackageTotal = Math.max(...package_breakdown.map(p => p.total), 1);
    const maxVidTotal = Math.max(...videographer_breakdown.map(v => v.total_earnings), 1);

    // Sort months chronologically (newest last for display)
    const monthlyEntries = Object.entries(monthly_revenue).sort((a, b) => {
        return new Date(a[0]) - new Date(b[0]);
    });
    const maxMonthly = Math.max(...monthlyEntries.map(([, v]) => v), 1);

    const packageColors = [
        'from-yellow-500 to-orange-500',
        'from-purple-500 to-pink-500',
        'from-blue-500 to-cyan-500',
        'from-green-500 to-emerald-500',
        'from-rose-500 to-red-500',
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-color)]">Revenue & Earnings</h1>
                    <p className="text-gray-400 mt-2">Platform-wide earnings overview and videographer performance</p>
                </div>
                <div className="flex items-center gap-3 bg-[var(--glass-bg)] p-2 rounded-xl border border-[var(--glass-border)] z-50">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 px-2">From:</span>
                        <div className="relative">
                            <Calendar size={16} className="absolute left-2.5 top-2.5 text-gray-400 pointer-events-none" />
                            <DatePicker
                                selected={startDate}
                                onChange={(date) => setStartDate(date)}
                                selectsStart
                                startDate={startDate}
                                endDate={endDate}
                                placeholderText="Select Date"
                                dateFormat="dd/MM/yyyy"
                                className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg pl-9 pr-3 py-1.5 text-sm text-[var(--text-color)] focus:outline-none focus:border-[var(--accent)] w-32 md:w-36"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 px-2">To:</span>
                        <div className="relative">
                            <Calendar size={16} className="absolute left-2.5 top-2.5 text-gray-400 pointer-events-none" />
                            <DatePicker
                                selected={endDate}
                                onChange={(date) => setEndDate(date)}
                                selectsEnd
                                startDate={startDate}
                                endDate={endDate}
                                minDate={startDate}
                                placeholderText="Select Date"
                                dateFormat="dd/MM/yyyy"
                                className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg pl-9 pr-3 py-1.5 text-sm text-[var(--text-color)] focus:outline-none focus:border-[var(--accent)] w-32 md:w-36"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard
                    title="Total Platform Revenue"
                    value={formatCurrency(total_revenue)}
                    icon={IndianRupee}
                    subtitle="From all completed bookings"
                    accent
                />
                <StatCard
                    title="Completed Bookings"
                    value={total_completed_shoots}
                    icon={CheckCircle}
                    subtitle="All time"
                />
                <StatCard
                    title="Avg. Revenue / Shoot"
                    value={formatCurrency(avgPerShoot)}
                    icon={TrendingUp}
                    subtitle="Average per completed booking"
                />
            </div>

            {/* Two Column: Package + Monthly */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Package Breakdown */}
                <div className="glass rounded-2xl border border-[var(--glass-border)] p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--accent)]">
                            <Package size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[var(--text-color)]">Revenue by Package</h2>
                            <p className="text-xs text-gray-500">Income split per package tier</p>
                        </div>
                    </div>

                    {package_breakdown.length === 0 ? (
                        <div className="text-center py-8">
                            <Package size={40} className="mx-auto text-gray-600 mb-3" />
                            <p className="text-gray-500 text-sm">No completed shoots yet</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {package_breakdown.map((pkg, idx) => {
                                const barWidth = Math.max((pkg.total / maxPackageTotal) * 100, 2);
                                const colorClass = packageColors[idx % packageColors.length];
                                const pct = ((pkg.total / total_revenue) * 100).toFixed(1);
                                return (
                                    <div key={pkg.package_id}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colorClass}`}></div>
                                                <span className="text-sm font-medium text-[var(--text-color)]">{pkg.package_name}</span>
                                                <span className="text-xs text-gray-500 px-1.5 py-0.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-full">
                                                    {pkg.count} shoots
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-[var(--text-color)]">{formatCurrency(pkg.total)}</span>
                                                <span className="text-xs text-gray-500 ml-2">({pct}%)</span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-[var(--glass-bg)] rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-700`}
                                                style={{ width: `${barWidth}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Monthly Revenue */}
                <div className="glass rounded-2xl border border-[var(--glass-border)] p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--accent)]">
                            <BarChart3 size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[var(--text-color)]">Monthly Revenue</h2>
                            <p className="text-xs text-gray-500">Revenue trend over time</p>
                        </div>
                    </div>

                    {monthlyEntries.length === 0 ? (
                        <div className="text-center py-8">
                            <Calendar size={40} className="mx-auto text-gray-600 mb-3" />
                            <p className="text-gray-500 text-sm">No data yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {monthlyEntries.slice(-8).reverse().map(([month, amount]) => {
                                const barWidth = Math.max((amount / maxMonthly) * 100, 2);
                                return (
                                    <div key={month}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-gray-400">{month}</span>
                                            <span className="text-sm font-bold text-[var(--text-color)]">{formatCurrency(amount)}</span>
                                        </div>
                                        <div className="h-2 bg-[var(--glass-bg)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-[var(--accent)] to-yellow-300 rounded-full transition-all duration-700"
                                                style={{ width: `${barWidth}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Package Summary Table */}
            {package_breakdown.length > 0 && (
                <div className="glass rounded-2xl border border-[var(--glass-border)] overflow-hidden">
                    <div className="p-5 border-b border-[var(--glass-border)]">
                        <h2 className="text-lg font-bold text-[var(--text-color)] flex items-center gap-2">
                            <Package size={20} className="text-[var(--accent)]" />
                            Package Revenue Breakdown
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--glass-border)]">
                                    <th className="text-left px-5 py-3 text-gray-400 font-medium">Package</th>
                                    <th className="text-center px-5 py-3 text-gray-400 font-medium">Shoots</th>
                                    <th className="text-right px-5 py-3 text-gray-400 font-medium">Price/Shoot</th>
                                    <th className="text-right px-5 py-3 text-gray-400 font-medium">Revenue</th>
                                    <th className="text-right px-5 py-3 text-gray-400 font-medium">Share</th>
                                </tr>
                            </thead>
                            <tbody>
                                {package_breakdown.map((pkg) => {
                                    const pct = total_revenue > 0 ? ((pkg.total / total_revenue) * 100).toFixed(1) : '0.0';
                                    return (
                                        <tr key={pkg.package_id} className="border-b border-[var(--glass-border)]/50 hover:bg-[var(--glass-bg)] transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Package size={15} className="text-[var(--accent)]" />
                                                    <span className="font-medium text-[var(--text-color)]">{pkg.package_name}</span>
                                                </div>
                                            </td>
                                            <td className="text-center px-5 py-4 text-[var(--text-color)] font-semibold">{pkg.count}</td>
                                            <td className="text-right px-5 py-4 text-gray-300">{formatCurrency(pkg.price_per_shoot)}</td>
                                            <td className="text-right px-5 py-4 font-bold text-yellow-400">{formatCurrency(pkg.total)}</td>
                                            <td className="text-right px-5 py-4 text-gray-400">{pct}%</td>
                                        </tr>
                                    );
                                })}
                                <tr className="bg-[var(--glass-bg)]">
                                    <td colSpan={3} className="px-5 py-4 font-bold text-[var(--text-color)]">Total Platform Revenue</td>
                                    <td className="text-right px-5 py-4 font-bold text-yellow-400 text-base">{formatCurrency(total_revenue)}</td>
                                    <td className="text-right px-5 py-4 text-gray-400">100%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Videographer Earnings Leaderboard */}
            <div className="glass rounded-2xl border border-[var(--glass-border)] overflow-hidden">
                <div className="p-5 border-b border-[var(--glass-border)]">
                    <h2 className="text-lg font-bold text-[var(--text-color)] flex items-center gap-2">
                        <Trophy size={20} className="text-yellow-400" />
                        Videographer Earnings
                    </h2>
                </div>

                {videographer_breakdown.length === 0 ? (
                    <div className="text-center py-12">
                        <Users size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-500">No videographer earnings yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--glass-border)]/50">
                        {videographer_breakdown.map((vid, idx) => {
                            const barWidth = Math.max((vid.total_earnings / maxVidTotal) * 100, 2);
                            const rankColors = ['text-yellow-400', 'text-gray-300', 'text-orange-400'];
                            const rankColor = rankColors[idx] || 'text-gray-500';
                            return (
                                <div key={vid.videographer_id} className="px-5 py-4 hover:bg-[var(--glass-bg)] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center font-bold text-sm ${rankColor}`}>
                                            {idx < 3 ? ['🥇','🥈','🥉'][idx] : idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div>
                                                    <p className="font-semibold text-[var(--text-color)] text-sm">{vid.name}</p>
                                                    <p className="text-xs text-gray-500">{vid.completed_shoots} completed shoot{vid.completed_shoots !== 1 ? 's' : ''}</p>
                                                </div>
                                                <p className="font-bold text-green-400 flex items-center gap-1 text-sm">
                                                    <ArrowUpRight size={14} />
                                                    {formatCurrency(vid.total_earnings)}
                                                </p>
                                            </div>
                                            <div className="h-1.5 bg-[var(--glass-bg)] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700"
                                                    style={{ width: `${barWidth}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Videographer Table */}
            {videographer_breakdown.length > 0 && (
                <div className="glass rounded-2xl border border-[var(--glass-border)] overflow-hidden">
                    <div className="p-5 border-b border-[var(--glass-border)]">
                        <h2 className="text-lg font-bold text-[var(--text-color)] flex items-center gap-2">
                            <Users size={20} className="text-[var(--accent)]" />
                            Videographer Pay Table
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--glass-border)]">
                                    <th className="text-left px-5 py-3 text-gray-400 font-medium">Rank</th>
                                    <th className="text-left px-5 py-3 text-gray-400 font-medium">Videographer</th>
                                    <th className="text-center px-5 py-3 text-gray-400 font-medium">Completed</th>
                                    <th className="text-right px-5 py-3 text-gray-400 font-medium">Total Earnings</th>
                                    <th className="text-right px-5 py-3 text-gray-400 font-medium">Avg/Shoot</th>
                                </tr>
                            </thead>
                            <tbody>
                                {videographer_breakdown.map((vid, idx) => {
                                    const avg = vid.completed_shoots > 0 ? vid.total_earnings / vid.completed_shoots : 0;
                                    const isExpanded = expandedVid === vid.videographer_id;
                                    const hasDailyEarnings = vid.daily_earnings && Object.keys(vid.daily_earnings).length > 0;
                                    return (
                                        <React.Fragment key={vid.videographer_id}>
                                        <tr 
                                            className={`border-b border-[var(--glass-border)]/50 hover:bg-[var(--glass-bg)] transition-colors ${hasDailyEarnings ? 'cursor-pointer' : ''}`}
                                            onClick={() => hasDailyEarnings && setExpandedVid(isExpanded ? null : vid.videographer_id)}
                                        >
                                            <td className="px-5 py-4 text-gray-400 font-semibold">#{idx + 1}</td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] font-bold text-xs">
                                                        {vid.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-[var(--text-color)]">{vid.name}</p>
                                                        <p className="text-xs text-gray-500">{vid.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center px-5 py-4">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                                                    <Video size={12} />
                                                    {vid.completed_shoots}
                                                </span>
                                            </td>
                                            <td className="text-right px-5 py-4 font-bold text-green-400">{formatCurrency(vid.total_earnings)}</td>
                                            <td className="text-right px-5 py-4 text-gray-300 flex items-center justify-end gap-2">
                                                {formatCurrency(avg)}
                                                {hasDailyEarnings && (
                                                    isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />
                                                )}
                                            </td>
                                        </tr>
                                        {isExpanded && hasDailyEarnings && (
                                            <tr className="bg-[var(--glass-bg)]/50 border-b border-[var(--glass-border)]">
                                                <td colSpan="5" className="px-5 py-4">
                                                    <div className="pl-12 space-y-2">
                                                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Daily Earnings</h4>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                            {Object.entries(vid.daily_earnings)
                                                                .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                                                                .map(([date, amount]) => (
                                                                <div key={date} className="bg-[var(--bg-color)] p-3 rounded-lg border border-[var(--glass-border)]">
                                                                    <div className="text-xs text-gray-500 mb-1">{(new Date(date)).toLocaleDateString("en-GB")}</div>
                                                                    <div className="text-sm font-bold text-green-400">{formatCurrency(amount)}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        </React.Fragment>
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

export default AdminEarnings;
