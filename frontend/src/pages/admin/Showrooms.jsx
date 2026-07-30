import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle, Pencil, Trash2, X, CreditCard, DollarSign, CalendarCheck } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';

// --- Status Badge ---
const StatusBadge = ({ status }) => {
    const styles = {
        pending:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        approved: 'bg-green-500/10  text-green-400  border-green-500/30',
        rejected: 'bg-red-500/10   text-red-400    border-red-500/30',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${styles[status]}`}>
            {status}
        </span>
    );
};

// --- Showroom Payment Details Modal ---
const ShowroomPaymentModal = ({ showroom, onClose }) => {
    const summary = showroom?.payment_summary || {};
    const bookings = summary.bookings || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="glass border border-[var(--glass-border)] rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-5">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-[var(--text-h)]">{showroom?.name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Showroom Payment & Booking Settlement Breakdown</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"><X size={20}/></button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] p-3.5 rounded-xl">
                        <p className="text-xs text-gray-500 font-medium">Total Shoots</p>
                        <p className="text-lg font-bold text-[var(--text-h)] mt-1">{summary.total_bookings || 0}</p>
                    </div>
                    <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] p-3.5 rounded-xl">
                        <p className="text-xs text-gray-500 font-medium">Paid Shoots</p>
                        <p className="text-lg font-bold text-emerald-400 mt-1">{summary.paid_bookings_count || 0}</p>
                    </div>
                    <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] p-3.5 rounded-xl">
                        <p className="text-xs text-gray-500 font-medium">Total Paid</p>
                        <p className="text-lg font-bold text-emerald-400 mt-1">₹{Number(summary.total_paid_amount || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] p-3.5 rounded-xl">
                        <p className="text-xs text-gray-500 font-medium">Pending</p>
                        <p className="text-lg font-bold text-amber-400 mt-1">₹{Number(summary.total_pending_amount || 0).toLocaleString('en-IN')}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-300">Bookings List ({bookings.length})</h4>
                    {bookings.length === 0 ? (
                        <p className="text-sm text-gray-500 py-6 text-center border border-[var(--glass-border)] rounded-xl bg-[var(--glass-bg)]">
                            No bookings recorded for this showroom yet.
                        </p>
                    ) : (
                        <div className="max-h-64 overflow-y-auto rounded-xl border border-[var(--glass-border)] divide-y divide-[var(--glass-border)]">
                            {bookings.map(b => (
                                <div key={b.id} className="p-3.5 flex items-center justify-between gap-3 bg-[var(--glass-bg)] hover:bg-white/5 transition-colors text-xs">
                                    <div>
                                        <p className="font-semibold text-white text-sm">{b.booking_id} • {b.customer_name}</p>
                                        <p className="text-gray-400 mt-0.5">{b.package_name} • {new Date(b.created_at).toLocaleDateString('en-GB')}</p>
                                        {b.transaction_id && (
                                            <p className="text-[11px] font-mono text-gray-400 mt-0.5">Txn ID: {b.transaction_id}</p>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-white text-sm">₹{Number(b.amount || 0).toLocaleString('en-IN')}</p>
                                        {b.payment_status === 'completed' ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 mt-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                <CheckCircle size={12} /> Paid
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 mt-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                                Pending
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-2">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-black font-semibold text-sm hover:opacity-90 transition-opacity">
                        Close Breakdown
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Reject Modal ---
const RejectModal = ({ showroom, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="glass border border-[var(--glass-border)] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-[var(--text-h)]">Reject Showroom</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20}/></button>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                    You are rejecting <strong className="text-white">{showroom?.name}</strong>. Please provide a reason:
                </p>
                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    rows={3}
                    placeholder="Reason for rejection..."
                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-3 text-sm text-[var(--text-h)] focus:outline-none focus:border-red-500 resize-none"
                />
                <div className="flex gap-3 mt-4">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--glass-border)] text-gray-400 hover:text-white text-sm transition-colors">Cancel</button>
                    <button
                        onClick={() => onConfirm(reason)}
                        disabled={!reason.trim()}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-500 disabled:opacity-40 transition-colors"
                    >
                        Confirm Reject
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Edit Modal ---
const EditModal = ({ showroom, onClose, onSave }) => {
    const [form, setForm] = useState({ name: showroom?.name || '', address: showroom?.address || '', contact_number: showroom?.contact_number || '' });
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="glass border border-[var(--glass-border)] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-[var(--text-h)]">Edit Showroom</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="space-y-4">
                    {[['name','Showroom Name','text'],['address','Address','text'],['contact_number','Contact Number','text']].map(([key, label, type]) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
                            <input type={type} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})}
                                className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)]" />
                        </div>
                    ))}
                </div>
                <div className="flex gap-3 mt-5">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--glass-border)] text-gray-400 hover:text-white text-sm">Cancel</button>
                    <button onClick={() => onSave(form)} className="flex-1 py-2.5 rounded-xl bg-[var(--accent)] text-black font-semibold text-sm hover:bg-opacity-90">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

// --- Main Page ---
const Showrooms = () => {
    const { toast } = useToast();
    const [showrooms, setShowrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
    const [rejectTarget, setRejectTarget] = useState(null);
    const [editTarget, setEditTarget] = useState(null);
    const [viewPaymentTarget, setViewPaymentTarget] = useState(null);

    const fetchShowrooms = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 10 };
            if (filter !== 'all') params.status = filter;
            if (paymentFilter !== 'all') params.payment_status = paymentFilter;
            if (search) params.search = search;
            const res = await api.get('/showrooms', { params });
            setShowrooms(res.data.showrooms);
            setPagination(res.data.pagination);
        } catch {
            toast('Failed to load showrooms', 'error');
        } finally {
            setLoading(false);
        }
    }, [filter, paymentFilter, search, toast]);

    useEffect(() => {
        const debounce = setTimeout(() => fetchShowrooms(1), 400);
        return () => clearTimeout(debounce);
    }, [fetchShowrooms]);

    const handleApprove = async (id) => {
        try {
            await api.patch(`/showrooms/${id}/approve`);
            toast('Showroom approved successfully!', 'success');
            fetchShowrooms(pagination.page);
        } catch { toast('Failed to approve', 'error'); }
    };

    const handleReject = async (reason) => {
        try {
            await api.patch(`/showrooms/${rejectTarget.id}/reject`, { reason });
            toast('Showroom rejected.', 'warning');
            setRejectTarget(null);
            fetchShowrooms(pagination.page);
        } catch { toast('Failed to reject', 'error'); }
    };

    const handleEdit = async (form) => {
        try {
            await api.put(`/showrooms/${editTarget.id}`, form);
            toast('Showroom updated!', 'success');
            setEditTarget(null);
            fetchShowrooms(pagination.page);
        } catch { toast('Failed to update', 'error'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this showroom?')) return;
        try {
            await api.delete(`/showrooms/${id}`);
            toast('Showroom deleted.', 'warning');
            fetchShowrooms(pagination.page);
        } catch { toast('Failed to delete', 'error'); }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-h)]">Showrooms</h1>
                    <p className="text-sm text-gray-400 mt-1">Manage, approve, and track showroom registrations & payment status.</p>
                </div>
                <div className="text-sm glass px-4 py-2 rounded-xl border border-[var(--glass-border)] text-[var(--accent)] font-medium">
                    {pagination.total} Total Showrooms
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="glass border border-[var(--glass-border)] rounded-2xl p-4 flex flex-col xl:flex-row gap-4 justify-between">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by showroom or owner name..."
                        className="w-full pl-9 pr-4 py-2.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] placeholder-gray-500"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-gray-400 shrink-0" />
                        {['all','pending','approved','rejected'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                                    filter === s
                                    ? 'bg-[var(--accent)] text-black font-semibold'
                                    : 'text-gray-400 hover:text-white bg-[var(--glass-bg)] border border-[var(--glass-border)]'
                                }`}
                            >{s}</button>
                        ))}
                    </div>

                    <div className="h-6 w-px bg-[var(--glass-border)] hidden xl:block" />

                    {/* Payment Status Filter */}
                    <div className="flex items-center gap-1.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-1 text-xs">
                        <span className="text-gray-400 px-2 flex items-center gap-1">
                            <CreditCard size={13} className="text-indigo-400" /> Payment:
                        </span>
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'paid', label: 'Fully Paid' },
                            { id: 'pending', label: 'Pending Payment' }
                        ].map(pf => (
                            <button
                                key={pf.id}
                                onClick={() => setPaymentFilter(pf.id)}
                                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                                    paymentFilter === pf.id
                                        ? pf.id === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold' : pf.id === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-semibold' : 'bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40 font-semibold'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >{pf.label}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="glass border border-[var(--glass-border)] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--glass-border)]">
                                {['Showroom', 'Owner', 'Contact', 'Status', 'Payment Status', 'Registered', 'Actions'].map(h => (
                                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="border-b border-[var(--glass-border)]">
                                        {[...Array(7)].map((_, j) => (
                                            <td key={j} className="px-5 py-4">
                                                <div className="h-4 bg-[var(--glass-bg)] rounded animate-pulse w-24"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : showrooms.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-16 text-gray-500">
                                        <p className="text-lg font-medium">No showrooms found</p>
                                        <p className="text-sm mt-1">Try adjusting your search or filter</p>
                                    </td>
                                </tr>
                            ) : showrooms.map(s => {
                                const payStats = s.payment_summary || {};
                                return (
                                    <tr key={s.id} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors group">
                                        <td className="px-5 py-4">
                                            <p className="font-medium text-[var(--text-h)] text-sm">{s.name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{s.address || '—'}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-sm text-[var(--text-h)]">{s.owner_name}</p>
                                            <p className="text-xs text-gray-500">{s.owner_email}</p>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-400">{s.contact_number || '—'}</td>
                                        <td className="px-5 py-4">
                                            <StatusBadge status={s.status} />
                                            {s.status === 'rejected' && s.rejection_reason && (
                                                <p className="text-xs text-red-400 mt-1 max-w-[140px] truncate" title={s.rejection_reason}>{s.rejection_reason}</p>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <button
                                                type="button"
                                                onClick={() => setViewPaymentTarget(s)}
                                                className="text-left group/btn"
                                            >
                                                {payStats.payment_status === 'all_paid' ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 group-hover/btn:border-emerald-400">
                                                            <CheckCircle size={12} />
                                                            Fully Paid
                                                        </span>
                                                        <span className="text-[11px] text-gray-400 font-mono pl-1">
                                                            ₹{Number(payStats.total_paid_amount || 0).toLocaleString('en-IN')} collected
                                                        </span>
                                                    </div>
                                                ) : payStats.payment_status === 'pending_payment' ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 group-hover/btn:border-amber-400">
                                                            Pending ({payStats.pending_bookings_count} unpaid)
                                                        </span>
                                                        <span className="text-[11px] text-gray-400 font-mono pl-1">
                                                            ₹{Number(payStats.total_pending_amount || 0).toLocaleString('en-IN')} pending
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                                                        No Bookings
                                                    </span>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 text-xs text-gray-500">
                                            {(new Date(s.created_at)).toLocaleDateString("en-GB")}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1">
                                                {s.status !== 'approved' && (
                                                    <button
                                                        onClick={() => handleApprove(s.id)}
                                                        title="Approve"
                                                        className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                                                    ><CheckCircle size={16}/></button>
                                                )}
                                                {s.status !== 'rejected' && (
                                                    <button
                                                        onClick={() => setRejectTarget(s)}
                                                        title="Reject"
                                                        className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                    ><XCircle size={16}/></button>
                                                )}
                                                <button
                                                    onClick={() => setEditTarget(s)}
                                                    title="Edit"
                                                    className="p-1.5 text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg transition-colors"
                                                ><Pencil size={16}/></button>
                                                <button
                                                    onClick={() => handleDelete(s.id)}
                                                    title="Delete"
                                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                ><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex justify-between items-center px-5 py-4 border-t border-[var(--glass-border)]">
                        <p className="text-sm text-gray-400">
                            Page {pagination.page} of {pagination.totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => fetchShowrooms(pagination.page - 1)}
                                className="px-3 py-1.5 text-sm rounded-lg border border-[var(--glass-border)] text-gray-400 hover:text-white disabled:opacity-30"
                            >Previous</button>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => fetchShowrooms(pagination.page + 1)}
                                className="px-3 py-1.5 text-sm rounded-lg bg-[var(--accent)] text-black font-medium disabled:opacity-30"
                            >Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {viewPaymentTarget && <ShowroomPaymentModal showroom={viewPaymentTarget} onClose={() => setViewPaymentTarget(null)} />}
            {rejectTarget && <RejectModal showroom={rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={handleReject} />}
            {editTarget && <EditModal showroom={editTarget} onClose={() => setEditTarget(null)} onSave={handleEdit} />}
        </div>
    );
};

export default Showrooms;
