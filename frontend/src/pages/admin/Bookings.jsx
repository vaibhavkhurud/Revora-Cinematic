import React, { useCallback, useEffect, useState } from 'react';
import {
    ArrowDownUp,
    CalendarCheck,
    ChevronLeft,
    ChevronRight,
    Search,
    UserCheck,
    X
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';

const statuses = ['all', 'pending', 'assigned', 'arrived', 'shooting', 'editing', 'completed', 'cancelled'];
const workflowStatuses = ['pending', 'assigned', 'arrived', 'shooting', 'editing', 'completed', 'cancelled'];

const statusStyles = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    assigned: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    arrived: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    shooting: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    editing: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    completed: 'bg-green-500/10 text-green-400 border-green-500/30',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/30'
};

const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${statusStyles[status] || statusStyles.pending}`}>
        {String(status || 'pending').replace('_', ' ')}
    </span>
);

const formatDate = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

const formatTime = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const Bookings = () => {
    const { toast } = useToast();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
    const [assignTarget, setAssignTarget] = useState(null);

    const fetchBookings = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const res = await api.get('/bookings/admin', {
                params: {
                    page,
                    limit: 10,
                    search: search.trim() || undefined,
                    status,
                    sortBy,
                    sortOrder
                }
            });
            setBookings(res.data.bookings || []);
            setPagination(res.data.pagination);
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to load bookings', 'error');
        } finally {
            setLoading(false);
        }
    }, [search, status, sortBy, sortOrder, toast]);

    useEffect(() => {
        const debounce = setTimeout(() => fetchBookings(1), 350);
        return () => clearTimeout(debounce);
    }, [fetchBookings]);

    const setSort = (nextSortBy) => {
        if (sortBy === nextSortBy) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(nextSortBy);
            setSortOrder('desc');
        }
    };

    const handleStatusChange = async (booking, nextStatus) => {
        if (nextStatus === booking.status) return;
        try {
            await api.patch(`/bookings/admin/${booking.id}/status`, { status: nextStatus });
            toast('Booking status updated.', 'success');
            fetchBookings(pagination.page);
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to update status', 'error');
        }
    };

    const handleDelete = async (booking) => {
        if (!window.confirm(`Delete booking ${booking.booking_id}?`)) return;
        try {
            await api.delete(`/bookings/admin/${booking.id}`);
            toast('Booking deleted.', 'warning');
            fetchBookings(pagination.page);
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to delete booking', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-h)]">Bookings</h1>
                    <p className="text-sm text-gray-400 mt-1">Manage showroom bookings, assignments, and production workflow.</p>
                </div>
                <div className="glass border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm text-[var(--accent)] font-semibold">
                    {pagination.total} Total Bookings
                </div>
            </div>

            <section className="glass border border-[var(--glass-border)] rounded-2xl p-4 flex flex-col xl:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                        placeholder="Search customer, vehicle, registration..."
                        className="w-full pl-9 pr-4 py-2.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] placeholder-gray-500"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {statuses.map(item => (
                        <button
                            key={item}
                            onClick={() => setStatus(item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all ${
                                status === item
                                    ? 'bg-[var(--accent)] text-black'
                                    : 'text-gray-400 hover:text-white bg-[var(--glass-bg)] border border-[var(--glass-border)]'
                            }`}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </section>

            <section className="glass border border-[var(--glass-border)] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--glass-border)]">
                                <SortableHeader label="Booking" sortKey="created_at" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} />
                                <SortableHeader label="Customer" sortKey="customer" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} />
                                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">Vehicle</th>
                                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">Package</th>
                                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">Showroom</th>
                                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">Videographer</th>
                                <SortableHeader label="Date" sortKey="booking_date" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} />
                                <SortableHeader label="Status" sortKey="status" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} />
                                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(6)].map((_, row) => (
                                    <tr key={row} className="border-b border-[var(--glass-border)]">
                                        {[...Array(9)].map((__, cell) => (
                                            <td key={cell} className="px-5 py-4">
                                                <div className="h-4 w-24 rounded bg-[var(--glass-bg)] animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-16 text-center text-gray-500">
                                        <CalendarCheck size={28} className="mx-auto mb-3 text-gray-600" />
                                        <p className="text-base font-medium text-gray-400">No bookings found</p>
                                        <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                                    </td>
                                </tr>
                            ) : bookings.map(booking => (
                                <tr key={booking.id} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors">
                                    <td className="px-5 py-4">
                                        <p className="text-sm font-semibold text-[var(--accent)]">{booking.booking_id}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{formatDate(booking.created_at)}</p>
                                    </td>
                                    <td className="px-5 py-4 min-w-[180px]">
                                        <p className="text-sm font-medium text-[var(--text-h)]">{booking.customer_name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{booking.customer_mobile}</p>
                                    </td>
                                    <td className="px-5 py-4 min-w-[220px]">
                                        <p className="text-sm text-[var(--text-h)]">{booking.vehicle_brand} {booking.vehicle_model}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{booking.vehicle_type} / {booking.vehicle_color} / {booking.registration_number}</p>
                                    </td>
                                    <td className="px-5 py-4 min-w-[160px]">
                                        <p className="text-sm text-[var(--text-h)]">{booking.package?.name || '-'}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{booking.package?.duration_minutes || 0} min</p>
                                    </td>
                                    <td className="px-5 py-4 min-w-[180px]">
                                        <p className="text-sm text-[var(--text-h)]">{booking.showroom?.name || '-'}</p>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]">{booking.showroom?.address || ''}</p>
                                    </td>
                                    <td className="px-5 py-4 min-w-[180px]">
                                        <p className="text-sm text-[var(--text-h)]">{booking.assigned_videographer?.name || 'Unassigned'}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{booking.assigned_videographer?.phone || booking.assigned_videographer?.email || '-'}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-sm text-[var(--text-h)]">{formatDate(booking.booking_date)}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{formatTime(booking.booking_date)}</p>
                                    </td>
                                    <td className="px-5 py-4 min-w-[180px]">
                                        <div className="space-y-2">
                                            <StatusBadge status={booking.status} />
                                            <select
                                                value={booking.status}
                                                onChange={event => handleStatusChange(booking, event.target.value)}
                                                className="block w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)]"
                                            >
                                                {workflowStatuses.map(item => (
                                                    <option key={item} value={item}>{item.replace('_', ' ')}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setAssignTarget(booking)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-black text-xs font-semibold hover:bg-opacity-90"
                                            >
                                                <UserCheck size={14} />
                                                Assign
                                            </button>
                                            <button
                                                onClick={() => handleDelete(booking)}
                                                className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-t border-[var(--glass-border)]">
                    <p className="text-sm text-gray-400">Page {pagination.page} of {pagination.totalPages}</p>
                    <div className="flex gap-2">
                        <button
                            disabled={pagination.page <= 1}
                            onClick={() => fetchBookings(pagination.page - 1)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-[var(--glass-border)] text-gray-400 hover:text-white disabled:opacity-30"
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>
                        <button
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => fetchBookings(pagination.page + 1)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-[var(--accent)] text-black font-medium disabled:opacity-30"
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </section>

            {assignTarget && (
                <AssignmentModal
                    booking={assignTarget}
                    onClose={() => setAssignTarget(null)}
                    onAssigned={() => {
                        setAssignTarget(null);
                        fetchBookings(pagination.page);
                    }}
                />
            )}
        </div>
    );
};

const AssignmentModal = ({ booking, onClose, onAssigned }) => {
    const { toast } = useToast();
    const [videographers, setVideographers] = useState([]);
    const [selectedId, setSelectedId] = useState(booking.assigned_videographer?.id || '');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchVideographers = async () => {
            try {
                const res = await api.get('/bookings/admin/videographers');
                setVideographers(res.data.videographers || []);
            } catch (err) {
                toast(err.response?.data?.message || 'Failed to load videographers', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchVideographers();
    }, [toast]);

    const handleAssign = async () => {
        if (!selectedId) {
            toast('Select a videographer first.', 'error');
            return;
        }

        setSaving(true);
        try {
            await api.patch(`/bookings/admin/${booking.id}/assign`, { videographer_id: selectedId });
            toast('Videographer assigned successfully.', 'success');
            onAssigned();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to assign videographer', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="glass border border-[var(--glass-border)] rounded-2xl p-6 w-full max-w-xl mx-4 shadow-2xl">
                <div className="flex items-center justify-between gap-4 mb-5">
                    <div>
                        <h3 className="text-lg font-bold text-[var(--text-h)]">Assign Videographer</h3>
                        <p className="text-sm text-gray-400 mt-1">{booking.booking_id} / {booking.customer_name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto">
                    {loading ? (
                        [...Array(4)].map((_, index) => <div key={index} className="h-16 rounded-xl bg-[var(--glass-bg)] animate-pulse" />)
                    ) : videographers.length ? videographers.map(videographer => (
                        <button
                            key={videographer.id}
                            onClick={() => setSelectedId(videographer.id)}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                                selectedId === videographer.id
                                    ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                                    : 'border-[var(--glass-border)] bg-[var(--glass-bg)] hover:border-[var(--accent)]/60'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-[var(--text-h)]">{videographer.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{videographer.phone || videographer.email || 'No contact added'}</p>
                                </div>
                                <span className="text-xs text-[var(--accent)] capitalize">{videographer.status}</span>
                            </div>
                        </button>
                    )) : (
                        <p className="text-sm text-gray-500 text-center py-8">No assignable videographers found.</p>
                    )}
                </div>

                <div className="flex gap-3 mt-5">
                    <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 rounded-xl border border-[var(--glass-border)] text-gray-400 hover:text-white text-sm disabled:opacity-50">
                        Cancel
                    </button>
                    <button onClick={handleAssign} disabled={saving || loading} className="flex-1 py-2.5 rounded-xl bg-[var(--accent)] text-black font-semibold text-sm hover:bg-opacity-90 disabled:opacity-60">
                        {saving ? 'Assigning...' : 'Assign Videographer'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SortableHeader = ({ label, sortKey, sortBy, sortOrder, onSort }) => (
    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">
        <button onClick={() => onSort(sortKey)} className="inline-flex items-center gap-1.5 hover:text-[var(--accent)] transition-colors">
            {label}
            <ArrowDownUp size={13} className={sortBy === sortKey ? 'text-[var(--accent)]' : 'text-gray-600'} />
            {sortBy === sortKey && <span className="lowercase text-[10px]">{sortOrder}</span>}
        </button>
    </th>
);

export default Bookings;
