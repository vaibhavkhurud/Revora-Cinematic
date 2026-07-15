import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDownUp, CalendarDays, ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';

const statuses = ['all', 'pending', 'assigned', 'arrived', 'shooting', 'editing', 'completed'];

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

const BookingHistory = () => {
    const { toast } = useToast();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

    const fetchBookings = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const res = await api.get('/bookings', {
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
            toast(err.response?.data?.message || 'Failed to load booking history', 'error');
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-h)]">Booking History</h1>
                    <p className="text-sm text-gray-400 mt-1">Search, filter, sort, and review all showroom bookings.</p>
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
                        placeholder="Search customer, mobile, vehicle, registration..."
                        className="w-full pl-9 pr-4 py-2.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] placeholder-gray-500"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <Filter size={16} className="text-gray-400 shrink-0" />
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
                                <SortableHeader label="Booking ID" sortKey="created_at" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} />
                                <SortableHeader label="Customer" sortKey="customer" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} />
                                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">Vehicle</th>
                                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">Package</th>
                                <SortableHeader label="Date" sortKey="booking_date" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} />
                                <SortableHeader label="Status" sortKey="status" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} />
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(6)].map((_, row) => (
                                    <tr key={row} className="border-b border-[var(--glass-border)]">
                                        {[...Array(6)].map((__, cell) => (
                                            <td key={cell} className="px-5 py-4">
                                                <div className="h-4 w-24 rounded bg-[var(--glass-bg)] animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-gray-500">
                                        <CalendarDays size={28} className="mx-auto mb-3 text-gray-600" />
                                        <p className="text-base font-medium text-gray-400">No bookings found</p>
                                        <p className="text-sm mt-1">Create a booking or adjust your search and filters.</p>
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
                                    <td className="px-5 py-4 min-w-[170px]">
                                        <p className="text-sm text-[var(--text-h)]">{booking.package?.name || '-'}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{booking.package?.duration_minutes || 0} min</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-sm text-[var(--text-h)]">{formatDate(booking.booking_date)}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{formatTime(booking.booking_date)}</p>
                                    </td>
                                    <td className="px-5 py-4"><StatusBadge status={booking.status} /></td>
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

export default BookingHistory;
