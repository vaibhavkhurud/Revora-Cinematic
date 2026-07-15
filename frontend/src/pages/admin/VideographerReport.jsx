import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    Calendar,
    Video,
    CheckCircle,
    TrendingUp,
    IndianRupee,
    Loader,
    Trophy,
    Activity
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

const statusStyles = {
    available: 'bg-green-500/10 text-green-400 border-green-500/30',
    assigned: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    on_leave: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
};

const shootStatusStyles = {
    completed: 'bg-green-500/10 text-green-400 border-green-500/30',
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    assigned: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    shooting: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    editing: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
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

const VideographerReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchReport = useCallback(async () => {
        try {
            const res = await api.get(`/admin/videographers/${id}/report`);
            setReport(res.data);
        } catch (error) {
            toast(error.response?.data?.message || 'Failed to load report', 'error');
            if (error.response?.status === 404) {
                navigate('/admin/videographers');
            }
        } finally {
            setLoading(false);
        }
    }, [id, toast, navigate]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader size={48} className="animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    if (!report) return null;

    const { profile, stats, recent_shoots } = report;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header / Back Button */}
            <div className="flex items-center gap-4 mb-4">
                <button
                    onClick={() => navigate('/admin/videographers')}
                    className="p-2 hover:bg-[var(--glass-bg)] rounded-xl transition-colors border border-transparent hover:border-[var(--glass-border)] text-gray-400 hover:text-white"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-color)]">Videographer Report</h1>
                    <p className="text-gray-400 mt-1">Detailed performance and earnings metrics</p>
                </div>
            </div>

            {/* Profile Overview */}
            <div className="glass rounded-2xl border border-[var(--glass-border)] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)] opacity-5 rounded-full blur-[80px]"></div>
                
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-20 h-20 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] shrink-0 border border-[var(--accent)]/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                        <User size={40} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--text-color)] flex items-center gap-3">
                            {profile.name}
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${statusStyles[profile.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/30'}`}>
                                {String(profile.status || 'unknown').replace('_', ' ')}
                            </span>
                        </h2>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1.5"><Mail size={16} /> {profile.email}</span>
                            <span className="flex items-center gap-1.5"><Phone size={16} /> {profile.phone}</span>
                            <span className="flex items-center gap-1.5"><Calendar size={16} /> Joined {(new Date(profile.joined)).toLocaleDateString("en-GB")}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Shoots"
                    value={stats.total_shoots}
                    icon={Video}
                    subtitle="All assigned bookings"
                />
                <StatCard
                    title="Completed Shoots"
                    value={stats.completed_shoots}
                    icon={CheckCircle}
                    subtitle="Successfully delivered"
                />
                <StatCard
                    title="Completion Rate"
                    value={`${stats.completion_rate}%`}
                    icon={Activity}
                    subtitle="Of total assigned shoots"
                />
                <StatCard
                    title="Total Generated Revenue"
                    value={formatCurrency(stats.total_earnings)}
                    icon={IndianRupee}
                    accent={true}
                    subtitle="From completed shoots"
                />
            </div>

            {/* Shoots Table */}
            <div className="glass rounded-2xl border border-[var(--glass-border)] overflow-hidden">
                <div className="p-5 border-b border-[var(--glass-border)] flex items-center justify-between">
                    <h3 className="text-xl font-bold text-[var(--text-color)]">Shoot History</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--glass-border)] text-gray-400 text-sm uppercase tracking-wider bg-[var(--glass-bg)]">
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Vehicle & Showroom</th>
                                <th className="px-6 py-4 font-semibold">Package</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--glass-border)]">
                            {recent_shoots.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        <Video size={48} className="mx-auto mb-3 opacity-50" />
                                        <p>No shoots assigned yet</p>
                                    </td>
                                </tr>
                            ) : (
                                recent_shoots.map((shoot) => (
                                    <tr key={shoot.id} className="hover:bg-[var(--glass-bg)] transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {(new Date(shoot.booking_date)).toLocaleDateString("en-GB")}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-[var(--text-color)]">{shoot.vehicle}</p>
                                            <p className="text-xs text-gray-500">{shoot.showroom}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-300">
                                            {shoot.package}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${shootStatusStyles[shoot.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/30'}`}>
                                                {String(shoot.status || 'unknown').replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <span className={`font-semibold ${shoot.status === 'completed' ? 'text-yellow-400' : 'text-gray-500'}`}>
                                                {formatCurrency(shoot.earnings)}
                                            </span>
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

export default VideographerReport;
