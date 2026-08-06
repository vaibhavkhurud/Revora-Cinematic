import React, { useState, useEffect } from 'react';
import { Wallet, Search, CheckCircle, XCircle, Clock, ExternalLink, IndianRupee, Loader, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const Withdrawals = () => {
    const { toast } = useToast();
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState(''); // 'approved', 'rejected', 'completed'
    const [adminNote, setAdminNote] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchWithdrawals = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/withdrawals');
            setWithdrawals(res.data.withdrawals);
        } catch (error) {
            toast(error.response?.data?.message || 'Failed to load withdrawals', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const handleAction = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.patch(`/admin/withdrawals/${selectedWithdrawal._id}/status`, {
                status: actionType,
                admin_note: adminNote,
                transaction_id: transactionId
            });
            toast(`Withdrawal ${actionType} successfully`, 'success');
            setIsActionModalOpen(false);
            fetchWithdrawals();
        } catch (error) {
            toast(error.response?.data?.message || `Failed to mark as ${actionType}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredWithdrawals = withdrawals.filter(w => {
        const matchesFilter = filter === 'all' || w.status === filter;
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
            w.videographer_id?.user_id?.name?.toLowerCase().includes(searchLower) ||
            w.videographer_id?.user_id?.email?.toLowerCase().includes(searchLower) ||
            w._id.toLowerCase().includes(searchLower);
        return matchesFilter && matchesSearch;
    });

    if (loading && withdrawals.length === 0) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader size={48} className="animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-color)]">Withdrawals</h1>
                    <p className="text-gray-400 mt-2">Manage videographer payout requests</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl pl-10 pr-4 py-2.5 text-[var(--text-color)] focus:outline-none focus:border-[var(--accent)]"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    {['all', 'pending', 'approved', 'completed', 'rejected'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap capitalize ${
                                filter === f 
                                ? 'bg-[var(--accent)] text-white' 
                                : 'bg-[var(--glass-bg)] border border-[var(--glass-border)] text-gray-300 hover:bg-[var(--glass-bg-hover)]'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="glass rounded-2xl border border-[var(--glass-border)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[var(--glass-bg)] border-b border-[var(--glass-border)] text-gray-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Videographer</th>
                                <th className="px-6 py-4 font-medium">Amount</th>
                                <th className="px-6 py-4 font-medium">Requested On</th>
                                <th className="px-6 py-4 font-medium">Payout Method</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--glass-border)]/50">
                            {filteredWithdrawals.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        <Wallet size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>No withdrawal requests found.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredWithdrawals.map(w => (
                                    <tr key={w._id} className="hover:bg-[var(--glass-bg)] transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-[var(--text-color)]">{w.videographer_id?.user_id?.name || 'Unknown'}</p>
                                            <p className="text-xs text-gray-500">{w.videographer_id?.user_id?.email}</p>
                                            <p className="text-xs text-gray-500">{w.videographer_id?.phone}</p>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-yellow-400">
                                            {formatCurrency(w.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">
                                            {formatDate(w.requested_at)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs space-y-1">
                                                {w.payment_method === 'upi' ? (
                                                    <span className="inline-flex items-center gap-1 text-[var(--accent)] font-semibold bg-[var(--accent)]/10 px-2 py-0.5 rounded">UPI</span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">Bank Transfer</span>
                                                )}
                                                <div className="text-gray-400 mt-1 max-w-[200px] truncate" title={
                                                    w.payment_method === 'upi' ? `UPI: ${w.payout_details?.upi_id}` : `Bank: ${w.payout_details?.bank_name} - ${w.payout_details?.account_number}`
                                                }>
                                                    {w.payment_method === 'upi' ? w.payout_details?.upi_id : w.payout_details?.account_number}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${
                                                w.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                w.status === 'approved' ? 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20' :
                                                w.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                            }`}>
                                                {w.status === 'completed' && <CheckCircle size={12} />}
                                                {w.status === 'approved' && <Clock size={12} />}
                                                {w.status === 'rejected' && <XCircle size={12} />}
                                                {w.status === 'pending' && <AlertCircle size={12} />}
                                                {w.status}
                                            </span>
                                            {w.admin_note && (
                                                <p className="text-[10px] text-gray-500 mt-1 max-w-[150px] truncate" title={w.admin_note}>Note: {w.admin_note}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {w.status === 'pending' && (
                                                <>
                                                    <button 
                                                        onClick={() => { setSelectedWithdrawal(w); setActionType('approved'); setIsActionModalOpen(true); setAdminNote(''); setTransactionId(''); }}
                                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => { setSelectedWithdrawal(w); setActionType('rejected'); setIsActionModalOpen(true); setAdminNote(''); setTransactionId(''); }}
                                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {w.status === 'approved' && (
                                                <button 
                                                    onClick={() => { setSelectedWithdrawal(w); setActionType('completed'); setIsActionModalOpen(true); setAdminNote(''); setTransactionId(''); }}
                                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                                                >
                                                    Mark Paid
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Action Modal */}
            {isActionModalOpen && selectedWithdrawal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass w-full max-w-md rounded-2xl border border-[var(--glass-border)] shadow-2xl p-6">
                        <h2 className="text-xl font-bold text-[var(--text-color)] mb-1 capitalize">{actionType} Withdrawal</h2>
                        <p className="text-sm text-gray-400 mb-6">For {selectedWithdrawal.videographer_id?.user_id?.name} - {formatCurrency(selectedWithdrawal.amount)}</p>

                        <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-4 mb-6">
                            <p className="text-sm text-gray-300 font-semibold mb-2">Payout Details</p>
                            {selectedWithdrawal.payment_method === 'upi' ? (
                                <p className="text-gray-400 text-sm">UPI ID: <span className="text-white">{selectedWithdrawal.payout_details?.upi_id}</span></p>
                            ) : (
                                <div className="space-y-1">
                                    <p className="text-gray-400 text-sm flex justify-between">Bank: <span className="text-white">{selectedWithdrawal.payout_details?.bank_name}</span></p>
                                    <p className="text-gray-400 text-sm flex justify-between">Acc Name: <span className="text-white">{selectedWithdrawal.payout_details?.account_name}</span></p>
                                    <p className="text-gray-400 text-sm flex justify-between">Acc No: <span className="text-white font-mono">{selectedWithdrawal.payout_details?.account_number}</span></p>
                                    <p className="text-gray-400 text-sm flex justify-between">IFSC: <span className="text-white font-mono">{selectedWithdrawal.payout_details?.ifsc_code}</span></p>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleAction}>
                            {actionType === 'completed' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Transaction ID (Optional)</label>
                                    <input
                                        type="text"
                                        value={transactionId}
                                        onChange={(e) => setTransactionId(e.target.value)}
                                        className="w-full bg-[var(--bg-color)] border border-[var(--glass-border)] rounded-xl px-4 py-2 text-[var(--text-color)] focus:outline-none focus:border-[var(--accent)]"
                                        placeholder="e.g. UTR number"
                                    />
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Admin Note {actionType === 'rejected' ? '(Required)' : '(Optional)'}</label>
                                <textarea
                                    required={actionType === 'rejected'}
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    className="w-full bg-[var(--bg-color)] border border-[var(--glass-border)] rounded-xl px-4 py-2 text-[var(--text-color)] focus:outline-none focus:border-[var(--accent)] resize-none h-24"
                                    placeholder={actionType === 'rejected' ? "Reason for rejection..." : "Any notes..."}
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsActionModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-[var(--glass-border)] text-gray-300 hover:bg-[var(--glass-bg)] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || (actionType === 'rejected' && !adminNote.trim())}
                                    className={`px-5 py-2.5 rounded-xl text-white transition-colors disabled:opacity-50 flex items-center gap-2 ${
                                        actionType === 'rejected' ? 'bg-red-500 hover:bg-red-600' : 'bg-[var(--accent)] hover:bg-[var(--accent)]/90'
                                    }`}
                                >
                                    {isSubmitting ? <Loader size={18} className="animate-spin" /> : `Confirm ${actionType}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Withdrawals;
