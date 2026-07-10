import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar,
    Clock,
    MapPin,
    Play,
    FileText,
    Upload,
    CheckCircle,
    AlertCircle,
    MoreVertical,
    Search,
    Zap,
    Loader,
    ThumbsUp,
    ThumbsDown,
    X,
    Bell,
    IndianRupee
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../components/Toast';

// Status color styles for badges
const statusStyles = {
    ready: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    scheduled: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    pending_upload: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    completed: 'bg-green-500/10 text-green-400 border-green-500/30',
    in_progress: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    awaiting_response: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
};

// Status badge component
const StatusBadge = ({ status }) => {
    const statusLabels = {
        ready: 'Ready',
        scheduled: 'Scheduled',
        pending_upload: 'Pending Upload',
        completed: 'Completed',
        in_progress: 'In Progress',
        awaiting_response: 'Awaiting Response',
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${statusStyles[status] || statusStyles.pending_upload}`}>
            {statusLabels[status] || status}
        </span>
    );
};

// Reject Modal
const RejectModal = ({ shoot, onConfirm, onCancel }) => {
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleConfirm = async () => {
        setSubmitting(true);
        await onConfirm(shoot.id, 'rejected', note);
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-red-500/10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-[var(--text-color)] flex items-center gap-2">
                        <ThumbsDown size={20} className="text-red-400" />
                        Reject Shoot
                    </h3>
                    <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-2 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                    <p className="text-sm text-gray-300">
                        <span className="text-white font-medium">{shoot.vehicle}</span> — {shoot.customer}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{shoot.date} at {shoot.time}</p>
                </div>

                <div className="mt-4">
                    <label className="text-sm text-gray-400 mb-2 block">Reason for rejection (optional)</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. Unavailable on this date, prior commitment..."
                        maxLength={500}
                        rows={3}
                        className="w-full px-4 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-colors resize-none text-sm"
                    />
                    <p className="text-xs text-gray-600 text-right mt-1">{note.length}/500</p>
                </div>

                <div className="flex gap-3 mt-5">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 border border-[var(--glass-border)] rounded-xl text-gray-300 hover:text-white hover:bg-[var(--glass-bg)] transition-all text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={submitting}
                        className="flex-1 px-4 py-2.5 bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                        {submitting ? <Loader size={16} className="animate-spin" /> : <ThumbsDown size={16} />}
                        Confirm Reject
                    </button>
                </div>
            </div>
        </div>
    );
};

// Awaiting Response Card
const AwaitingResponseCard = ({ shoot, onRespond, onViewDetails }) => {
    const [isAccepting, setIsAccepting] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);

    const handleAccept = async () => {
        setIsAccepting(true);
        await onRespond(shoot.id, 'accepted', '');
        setIsAccepting(false);
    };

    return (
        <>
            {showRejectModal && (
                <RejectModal
                    shoot={shoot}
                    onConfirm={onRespond}
                    onCancel={() => setShowRejectModal(false)}
                />
            )}
            <div className="glass rounded-2xl border border-cyan-500/40 overflow-hidden group hover:border-cyan-500/70 transition-all hover:shadow-lg hover:shadow-cyan-500/20 relative">
                {/* Pulsing indicator */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                    </span>
                    <span className="text-xs text-cyan-400 font-semibold bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full">New Assignment</span>
                </div>

                {/* Image section */}
                <div className="relative h-44 overflow-hidden bg-gradient-to-br from-cyan-500/10 to-transparent">
                    <img
                        src={shoot.image}
                        alt={shoot.vehicle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <p className="text-white font-bold text-lg">{shoot.vehicle}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    <div>
                        <p className="text-gray-400 text-sm">{shoot.customer}</p>
                        <p className="text-xs text-cyan-400 font-semibold mt-1 flex items-center gap-1">
                            <IndianRupee size={12} />
                            {shoot.package_name} — ₹{shoot.package_price?.toLocaleString()}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-start gap-2">
                            <MapPin size={15} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-300 truncate text-xs" title={shoot.location}>{shoot.location}</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <Calendar size={15} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-300 text-xs">{shoot.date}</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <Clock size={15} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-300 text-xs">{shoot.time}</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <Zap size={15} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-300 text-xs truncate">{shoot.notes || 'No notes'}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={handleAccept}
                            disabled={isAccepting}
                            className="flex-1 bg-green-500/20 text-green-400 px-4 py-2.5 rounded-xl font-semibold hover:bg-green-500/30 transition-all border border-green-500/40 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                        >
                            {isAccepting ? <Loader size={15} className="animate-spin" /> : <ThumbsUp size={15} />}
                            Accept
                        </button>
                        <button
                            onClick={() => setShowRejectModal(true)}
                            className="flex-1 bg-red-500/10 text-red-400 px-4 py-2.5 rounded-xl font-semibold hover:bg-red-500/20 transition-all border border-red-500/30 flex items-center justify-center gap-2 text-sm"
                        >
                            <ThumbsDown size={15} />
                            Reject
                        </button>
                    </div>

                    <button
                        onClick={() => onViewDetails(shoot)}
                        className="w-full px-4 py-2 border border-[var(--glass-border)] rounded-xl text-gray-300 hover:text-white hover:bg-[var(--glass-bg)] transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <FileText size={15} />
                        View Details
                    </button>
                </div>
            </div>
        </>
    );
};

// Shoot card component
const ShootCard = ({ shoot, onUpdateStatus, onViewDetails }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleAction = async (newStatus) => {
        setIsUpdating(true);
        await onUpdateStatus(shoot.id, newStatus);
        setIsUpdating(false);
    };

    const getActionButton = () => {
        if (shoot.status === 'ready' || shoot.status === 'scheduled') {
            return (
                <button
                    onClick={() => handleAction('shooting')}
                    disabled={isUpdating}
                    className="flex-1 bg-[var(--accent)] text-black px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                    {isUpdating ? <Loader size={16} className="animate-spin" /> : <Play size={16} className="group-hover:scale-110 transition-transform" />}
                    Start Shoot
                </button>
            );
        } else if (shoot.status === 'in_progress') {
             return (
                <button
                    onClick={() => handleAction('editing')}
                    disabled={isUpdating}
                    className="flex-1 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500/30 transition-all border border-yellow-500/50 flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                    {isUpdating ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} className="group-hover:scale-110 transition-transform" />}
                    Finish Shoot
                </button>
            );
        } else if (shoot.status === 'pending_upload') {
            return (
                <button
                    onClick={() => handleAction('completed')}
                    disabled={isUpdating}
                    className="flex-1 bg-green-500/20 text-green-400 px-4 py-2 rounded-lg font-semibold hover:bg-green-500/30 transition-all border border-green-500/50 flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                    {isUpdating ? <Loader size={16} className="animate-spin" /> : <Upload size={16} className="group-hover:scale-110 transition-transform" />}
                    Upload & Complete
                </button>
            );
        } else {
            return (
                <button
                    disabled
                    className="flex-1 bg-gray-500/10 text-gray-400 px-4 py-2 rounded-lg font-semibold border border-gray-500/30 flex items-center justify-center gap-2"
                >
                    <CheckCircle size={16} />
                    Completed
                </button>
            );
        }
    };

    return (
        <div className="glass rounded-2xl border border-[var(--glass-border)] overflow-hidden group hover:border-[var(--accent)]/50 transition-all hover:shadow-lg hover:shadow-[var(--accent)]/20">
            {/* Image section */}
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[var(--accent)]/10 to-transparent">
                <img
                    src={shoot.image}
                    alt={shoot.vehicle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                    <StatusBadge status={shoot.status} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white font-bold text-lg">{shoot.vehicle}</p>
                </div>
            </div>

            {/* Content section */}
            <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <p className="text-gray-400 text-sm font-medium">{shoot.customer}</p>
                        <p className="text-[var(--text-color)] font-semibold text-lg">{shoot.vehicle}</p>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-1 rounded-lg hover:bg-[var(--glass-bg)] transition-colors"
                        >
                            <MoreVertical size={18} className="text-gray-400" />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 bg-[var(--bg-color)] border border-[var(--glass-border)] rounded-lg shadow-lg z-10 min-w-[150px]">
                                <button
                                    onClick={() => {
                                        onViewDetails(shoot);
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[var(--glass-bg)] transition-colors"
                                >
                                    View Full Details
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                        <MapPin size={16} className="text-[var(--accent)] mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 truncate" title={shoot.location}>{shoot.location}</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <Calendar size={16} className="text-[var(--accent)] mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{shoot.date}</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <Clock size={16} className="text-[var(--accent)] mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{shoot.time}</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <Zap size={16} className="text-[var(--accent)] mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 truncate" title={shoot.notes}>{shoot.notes || 'No notes'}</span>
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    {getActionButton()}
                    <button
                        onClick={() => onViewDetails(shoot)}
                        className="px-4 py-2 border border-[var(--glass-border)] rounded-lg text-gray-300 hover:text-white hover:bg-[var(--glass-bg)] transition-all flex items-center justify-center gap-2"
                    >
                        <FileText size={16} />
                        Details
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatsCard = ({ title, value, icon: Icon, subtitle, highlight }) => (
    <div className={`glass p-6 rounded-2xl border ${highlight ? 'border-cyan-500/40' : 'border-[var(--glass-border)]'} relative overflow-hidden group`}>
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-[var(--accent)] opacity-[0.05] rounded-full group-hover:scale-150 transition-transform duration-500"></div>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
                <h3 className={`text-3xl font-bold ${highlight ? 'text-cyan-400' : 'text-[var(--text-color)]'}`}>{value}</h3>
                {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
            </div>
            <div className={`w-12 h-12 rounded-xl ${highlight ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-[var(--glass-bg)] border-[var(--glass-border)]'} border flex items-center justify-center ${highlight ? 'text-cyan-400' : 'text-[var(--accent)]'}`}>
                <Icon size={24} />
            </div>
        </div>
    </div>
);

const SectionHeader = ({ title, color, count }) => (
    <div className="flex items-center gap-3 mb-6">
        <div className={`w-1 h-8 ${color} rounded-full`}></div>
        <h2 className="text-2xl font-bold text-[var(--text-color)]">{title}</h2>
        {count !== undefined && (
            <span className="text-xs font-semibold text-gray-400 bg-[var(--glass-bg)] border border-[var(--glass-border)] px-2.5 py-1 rounded-full">
                {count}
            </span>
        )}
    </div>
);

const VideographerDashboard = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        try {
            const res = await api.get('/videographer/dashboard');
            setDashboardData(res.data);
        } catch (error) {
            toast(error.response?.data?.message || 'Failed to load dashboard', 'error');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await api.put(`/videographer/booking/${id}/status`, { status: newStatus });
            toast('Status updated successfully', 'success');
            fetchDashboardData();
        } catch (error) {
            toast(error.response?.data?.message || 'Failed to update status', 'error');
        }
    };

    const handleRespond = async (id, response, note) => {
        try {
            await api.patch(`/videographer/booking/${id}/respond`, { response, note });
            toast(
                response === 'accepted' ? '✅ Shoot accepted successfully!' : '❌ Shoot rejected.',
                response === 'accepted' ? 'success' : 'info'
            );
            fetchDashboardData();
        } catch (error) {
            toast(error.response?.data?.message || 'Failed to respond to shoot', 'error');
        }
    };

    const handleViewDetails = (shoot) => {
        navigate(`/videographer/shoots/${shoot.id}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader size={48} className="animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    const { stats, awaitingResponse, today, upcoming, pending, completed } = dashboardData || {};

    const filteredShoots = (shoots) =>
        shoots?.filter(s => s.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.customer.toLowerCase().includes(searchQuery.toLowerCase())) || [];

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-color)]">Studio Dashboard</h1>
                    <p className="text-gray-400 mt-2">Manage your shoots, uploads, and deliverables</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="flex-1 md:flex-none relative">
                        <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search shoots..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[var(--accent)] transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatsCard
                    title="New Assignments"
                    value={stats?.awaitingResponse || 0}
                    icon={Bell}
                    subtitle="Awaiting your response"
                    highlight={stats?.awaitingResponse > 0}
                />
                <StatsCard
                    title="Today's Shoots"
                    value={stats?.todayShots || 0}
                    icon={Calendar}
                    subtitle="Ready or In Progress"
                />
                <StatsCard
                    title="Upcoming"
                    value={stats?.upcoming || 0}
                    icon={Clock}
                    subtitle="Scheduled"
                />
                <StatsCard
                    title="Pending Uploads"
                    value={stats?.pending || 0}
                    icon={Upload}
                    subtitle="Waiting for edits"
                />
                <StatsCard
                    title="Completed"
                    value={stats?.completed || 0}
                    icon={CheckCircle}
                    subtitle="Delivered"
                />
            </div>

            {/* Cards Section */}
            <div className="space-y-12">
                {/* New Assignments - Awaiting Response */}
                {filteredShoots(awaitingResponse).length > 0 && (
                    <section>
                        <SectionHeader title="New Assignments" color="bg-cyan-500" count={filteredShoots(awaitingResponse).length} />
                        <div className="mb-3 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl flex items-start gap-3">
                            <Bell size={16} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-cyan-300">
                                You have been assigned new shoots. Please accept or reject them so the admin is notified.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredShoots(awaitingResponse).map((shoot) => (
                                <AwaitingResponseCard
                                    key={shoot.id}
                                    shoot={shoot}
                                    onRespond={handleRespond}
                                    onViewDetails={handleViewDetails}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Today's Shoots */}
                <section>
                    <SectionHeader title="Today's Shoots" color="bg-[var(--accent)]" count={filteredShoots(today).length} />
                    {filteredShoots(today).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredShoots(today).map((shoot) => (
                                <ShootCard
                                    key={shoot.id}
                                    shoot={shoot}
                                    onUpdateStatus={handleUpdateStatus}
                                    onViewDetails={handleViewDetails}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="glass rounded-2xl border border-[var(--glass-border)] p-12 text-center">
                            <Calendar size={48} className="mx-auto text-gray-500 mb-4" />
                            <p className="text-gray-400">No shoots scheduled for today</p>
                        </div>
                    )}
                </section>

                {/* Upcoming Shoots */}
                <section>
                    <SectionHeader title="Upcoming Shoots" color="bg-purple-500" count={filteredShoots(upcoming).length} />
                    {filteredShoots(upcoming).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredShoots(upcoming).map((shoot) => (
                                <ShootCard
                                    key={shoot.id}
                                    shoot={shoot}
                                    onUpdateStatus={handleUpdateStatus}
                                    onViewDetails={handleViewDetails}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="glass rounded-2xl border border-[var(--glass-border)] p-12 text-center">
                            <AlertCircle size={48} className="mx-auto text-gray-500 mb-4" />
                            <p className="text-gray-400">No upcoming shoots scheduled</p>
                        </div>
                    )}
                </section>

                {/* Pending Uploads */}
                <section>
                    <SectionHeader title="Pending Uploads" color="bg-yellow-500" count={filteredShoots(pending).length} />
                    {filteredShoots(pending).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredShoots(pending).map((shoot) => (
                                <ShootCard
                                    key={shoot.id}
                                    shoot={shoot}
                                    onUpdateStatus={handleUpdateStatus}
                                    onViewDetails={handleViewDetails}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="glass rounded-2xl border border-[var(--glass-border)] p-12 text-center">
                            <Upload size={48} className="mx-auto text-gray-500 mb-4" />
                            <p className="text-gray-400">All uploads are current</p>
                        </div>
                    )}
                </section>

                {/* Completed Shoots */}
                <section>
                    <SectionHeader title="Completed Shoots" color="bg-green-500" count={filteredShoots(completed).length} />
                    {filteredShoots(completed).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredShoots(completed).map((shoot) => (
                                <ShootCard
                                    key={shoot.id}
                                    shoot={shoot}
                                    onUpdateStatus={handleUpdateStatus}
                                    onViewDetails={handleViewDetails}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="glass rounded-2xl border border-[var(--glass-border)] p-12 text-center">
                            <CheckCircle size={48} className="mx-auto text-gray-500 mb-4" />
                            <p className="text-gray-400">No completed shoots yet</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default VideographerDashboard;
