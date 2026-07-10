import React, { useState, useEffect, useCallback } from 'react';
import {
    DollarSign,
    TrendingUp,
    Video,
    Package,
    Calendar,
    Car,
    Loader,
    IndianRupee,
    Award,
    ArrowUpRight
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

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

const Earnings = () => {
    const { toast } = useToast();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchEarnings = useCallback(async () => {
        try {
            const res = await api.get('/videographer/earnings');
            setData(res.data);
        } catch (error) {
            toast(error.response?.data?.message || 'Failed to load earnings', 'error');
        } finally {
            setLoading(false);
        }
    }, [toast]);

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

    const { total_earnings, completed_shoots, package_breakdown = [], recent_bookings = [] } = data || {};
    const avgPerShoot = completed_shoots > 0 ? total_earnings / completed_shoots : 0;
    const maxPackageTotal = Math.max(...package_breakdown.map(p => p.total), 1);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-[var(--text-color)]">My Earnings</h1>
                <p className="text-gray-400 mt-2">Track your income from completed shoots</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard
                    title="Total Earnings"
                    value={formatCurrency(total_earnings)}
                    icon={IndianRupee}
                    subtitle="From all completed shoots"
                    accent
                />
                <StatCard
                    title="Completed Shoots"
                    value={completed_shoots || 0}
                    icon={Video}
                    subtitle="Fully delivered"
                />
                <StatCard
                    title="Avg. Per Shoot"
                    value={formatCurrency(avgPerShoot)}
                    icon={TrendingUp}
                    subtitle="Average earnings per booking"
                />
            </div>

            {/* Package Breakdown */}
            <div className="glass rounded-2xl border border-[var(--glass-border)] p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--accent)]">
                        <Package size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[var(--text-color)]">Earnings by Package</h2>
                        <p className="text-sm text-gray-500">Breakdown of income per package type</p>
                    </div>
                </div>

                {package_breakdown.length === 0 ? (
                    <div className="text-center py-12">
                        <Package size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-500">No completed shoots yet. Start accepting assignments to track earnings.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {package_breakdown.map((pkg, idx) => {
                            const barWidth = Math.max((pkg.total / maxPackageTotal) * 100, 2);
                            const colors = [
                                'from-yellow-500 to-orange-500',
                                'from-purple-500 to-pink-500',
                                'from-blue-500 to-cyan-500',
                                'from-green-500 to-emerald-500',
                                'from-rose-500 to-red-500',
                            ];
                            const colorClass = colors[idx % colors.length];

                            return (
                                <div key={pkg.package_id} className="group">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${colorClass}`}></div>
                                            <span className="text-sm font-semibold text-[var(--text-color)]">{pkg.package_name}</span>
                                            <span className="text-xs text-gray-500 bg-[var(--glass-bg)] border border-[var(--glass-border)] px-2 py-0.5 rounded-full">
                                                {pkg.count} shoot{pkg.count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-[var(--text-color)]">{formatCurrency(pkg.total)}</p>
                                            <p className="text-xs text-gray-500">{formatCurrency(pkg.price_per_shoot)}/shoot</p>
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

            {/* Package Summary Table */}
            {package_breakdown.length > 0 && (
                <div className="glass rounded-2xl border border-[var(--glass-border)] overflow-hidden">
                    <div className="p-5 border-b border-[var(--glass-border)]">
                        <h2 className="text-lg font-bold text-[var(--text-color)] flex items-center gap-2">
                            <Award size={20} className="text-[var(--accent)]" />
                            Package Summary
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--glass-border)]">
                                    <th className="text-left px-5 py-3 text-gray-400 font-medium">Package</th>
                                    <th className="text-center px-5 py-3 text-gray-400 font-medium">Shoots</th>
                                    <th className="text-right px-5 py-3 text-gray-400 font-medium">Rate/Shoot</th>
                                    <th className="text-right px-5 py-3 text-gray-400 font-medium">Total Earned</th>
                                </tr>
                            </thead>
                            <tbody>
                                {package_breakdown.map((pkg, idx) => (
                                    <tr key={pkg.package_id} className="border-b border-[var(--glass-border)]/50 hover:bg-[var(--glass-bg)] transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <Package size={16} className="text-[var(--accent)]" />
                                                <span className="font-medium text-[var(--text-color)]">{pkg.package_name}</span>
                                            </div>
                                        </td>
                                        <td className="text-center px-5 py-4">
                                            <span className="font-semibold text-[var(--text-color)]">{pkg.count}</span>
                                        </td>
                                        <td className="text-right px-5 py-4 text-gray-300">{formatCurrency(pkg.price_per_shoot)}</td>
                                        <td className="text-right px-5 py-4">
                                            <span className="font-bold text-yellow-400">{formatCurrency(pkg.total)}</span>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-[var(--glass-bg)]">
                                    <td colSpan={2} className="px-5 py-4 font-bold text-[var(--text-color)]">Total</td>
                                    <td className="text-right px-5 py-4"></td>
                                    <td className="text-right px-5 py-4 font-bold text-yellow-400 text-base">{formatCurrency(total_earnings)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Recent Completed Bookings */}
            <div className="glass rounded-2xl border border-[var(--glass-border)] overflow-hidden">
                <div className="p-5 border-b border-[var(--glass-border)]">
                    <h2 className="text-lg font-bold text-[var(--text-color)] flex items-center gap-2">
                        <Calendar size={20} className="text-[var(--accent)]" />
                        Recent Completed Shoots
                    </h2>
                </div>

                {recent_bookings.length === 0 ? (
                    <div className="text-center py-12">
                        <Video size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-500">No completed bookings yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--glass-border)]/50">
                        {recent_bookings.map((booking) => (
                            <div key={booking.id} className="flex items-center justify-between px-5 py-4 hover:bg-[var(--glass-bg)] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                        <Car size={18} className="text-green-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[var(--text-color)] text-sm">{booking.vehicle}</p>
                                        <p className="text-xs text-gray-500">{booking.customer} · {formatDate(booking.date)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-400 flex items-center gap-1 justify-end">
                                        <ArrowUpRight size={14} />
                                        {formatCurrency(booking.amount)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">{booking.package_name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Earnings;
