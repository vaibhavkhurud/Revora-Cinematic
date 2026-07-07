import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, Filter, PackagePlus, Pencil, Search, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';

const emptyForm = {
    name: '',
    description: '',
    price: '',
    duration_minutes: '',
    featuresText: '',
    is_active: true,
};

const StatusBadge = ({ active }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        active
            ? 'bg-green-500/10 text-green-400 border-green-500/30'
            : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
    }`}>
        {active ? 'Active' : 'Inactive'}
    </span>
);

const toForm = (pkg) => ({
    name: pkg.name || '',
    description: pkg.description || '',
    price: pkg.price ?? '',
    duration_minutes: pkg.duration_minutes ?? '',
    featuresText: Array.isArray(pkg.features) ? pkg.features.join('\n') : '',
    is_active: Boolean(pkg.is_active),
});

const buildPayload = (form) => ({
    name: form.name.trim(),
    description: form.description.trim(),
    price: Number(form.price),
    duration_minutes: Number(form.duration_minutes),
    features: form.featuresText
        .split('\n')
        .map(feature => feature.trim())
        .filter(Boolean),
    is_active: form.is_active,
});

const validateForm = (form) => {
    if (!form.name.trim()) return 'Package name is required.';
    if (!form.price || Number(form.price) <= 0) return 'Price must be greater than zero.';
    if (!form.duration_minutes || Number(form.duration_minutes) <= 0 || !Number.isInteger(Number(form.duration_minutes))) {
        return 'Duration must be a positive whole number.';
    }
    return '';
};

const PackageModal = ({ packageItem, onClose, onSave }) => {
    const [form, setForm] = useState(packageItem ? toForm(packageItem) : emptyForm);
    const [error, setError] = useState('');

    const title = packageItem ? 'Edit Package' : 'Add Package';

    const handleSave = () => {
        const validationError = validateForm(form);
        if (validationError) {
            setError(validationError);
            return;
        }
        onSave(buildPayload(form));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="glass border border-[var(--glass-border)] rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-[var(--text-h)]">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Package Name</label>
                        <input
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Price</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.price}
                            onChange={e => setForm({ ...form, price: e.target.value })}
                            className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Duration</label>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            value={form.duration_minutes}
                            onChange={e => setForm({ ...form, duration_minutes: e.target.value })}
                            className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)]"
                        />
                        <p className="text-xs text-gray-500 mt-1">Duration is stored in minutes.</p>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            rows={3}
                            className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] resize-none"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Features</label>
                        <textarea
                            value={form.featuresText}
                            onChange={e => setForm({ ...form, featuresText: e.target.value })}
                            rows={4}
                            placeholder="One feature per line"
                            className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] resize-none placeholder-gray-500"
                        />
                    </div>

                    <label className="md:col-span-2 flex items-center gap-3 text-sm text-gray-300">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={e => setForm({ ...form, is_active: e.target.checked })}
                            className="h-4 w-4 accent-[var(--accent)]"
                        />
                        Active Status
                    </label>
                </div>

                {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

                <div className="flex gap-3 mt-5">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--glass-border)] text-gray-400 hover:text-white text-sm">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-[var(--accent)] text-black font-semibold text-sm hover:bg-opacity-90">
                        Save Package
                    </button>
                </div>
            </div>
        </div>
    );
};

const Packages = () => {
    const { toast } = useToast();
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
    const [modalTarget, setModalTarget] = useState(undefined);

    const activeCount = useMemo(() => packages.filter(pkg => pkg.is_active).length, [packages]);

    const fetchPackages = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 10 };
            if (filter !== 'all') params.is_active = filter === 'active';
            if (search.trim()) params.search = search.trim();

            const res = await api.get('/packages', { params });
            setPackages(res.data.packages);
            setPagination(res.data.pagination);
        } catch {
            toast('Failed to load packages', 'error');
        } finally {
            setLoading(false);
        }
    }, [filter, search, toast]);

    useEffect(() => {
        const debounce = setTimeout(() => fetchPackages(1), 400);
        return () => clearTimeout(debounce);
    }, [fetchPackages]);

    const handleSave = async (payload) => {
        try {
            if (modalTarget) {
                await api.put(`/packages/${modalTarget.id}`, payload);
                toast('Package updated successfully!', 'success');
            } else {
                await api.post('/packages', payload);
                toast('Package added successfully!', 'success');
            }
            setModalTarget(undefined);
            fetchPackages(pagination.page);
        } catch (error) {
            toast(error.response?.data?.message || 'Failed to save package', 'error');
        }
    };

    const handleToggle = async (pkg) => {
        try {
            await api.patch(`/packages/${pkg.id}/toggle`);
            toast(`Package ${pkg.is_active ? 'deactivated' : 'activated'} successfully!`, 'success');
            fetchPackages(pagination.page);
        } catch {
            toast('Failed to update package status', 'error');
        }
    };

    const handleDelete = async (pkg) => {
        if (!window.confirm(`Delete "${pkg.name}"?`)) return;
        try {
            await api.delete(`/packages/${pkg.id}`);
            toast('Package deleted.', 'warning');
            fetchPackages(pagination.page);
        } catch (error) {
            toast(error.response?.data?.message || 'Failed to delete package', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-h)]">Packages</h1>
                    <p className="text-sm text-gray-400 mt-1">Manage package pricing, features, duration, and availability</p>
                </div>
                <button
                    onClick={() => setModalTarget(null)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] text-black font-semibold rounded-xl hover:bg-opacity-90 transition-colors"
                >
                    <PackagePlus size={18} />
                    Add Package
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass px-4 py-3 rounded-xl border border-[var(--glass-border)]">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Total Packages</p>
                    <p className="text-xl font-bold text-[var(--text-h)] mt-1">{pagination.total}</p>
                </div>
                <div className="glass px-4 py-3 rounded-xl border border-[var(--glass-border)]">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Active On Page</p>
                    <p className="text-xl font-bold text-green-400 mt-1">{activeCount}</p>
                </div>
                <div className="glass px-4 py-3 rounded-xl border border-[var(--glass-border)]">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Filtered By</p>
                    <p className="text-xl font-bold text-[var(--accent)] mt-1 capitalize">{filter}</p>
                </div>
            </div>

            <div className="glass border border-[var(--glass-border)] rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search packages..."
                        className="w-full pl-9 pr-4 py-2.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] placeholder-gray-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-400 shrink-0" />
                    {['all', 'active', 'inactive'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                                filter === status
                                    ? 'bg-[var(--accent)] text-black'
                                    : 'text-gray-400 hover:text-white bg-[var(--glass-bg)] border border-[var(--glass-border)]'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="glass border border-[var(--glass-border)] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--glass-border)]">
                                {['Package', 'Price', 'Duration', 'Features', 'Status', 'Actions'].map(header => (
                                    <th key={header} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, index) => (
                                    <tr key={index} className="border-b border-[var(--glass-border)]">
                                        {[...Array(6)].map((__, cell) => (
                                            <td key={cell} className="px-5 py-4">
                                                <div className="h-4 bg-[var(--glass-bg)] rounded animate-pulse w-24"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : packages.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-16 text-gray-500">
                                        <p className="text-lg font-medium">No packages found</p>
                                        <p className="text-sm mt-1">Add a package or adjust your search/filter</p>
                                    </td>
                                </tr>
                            ) : packages.map(pkg => (
                                <tr key={pkg.id} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors group">
                                    <td className="px-5 py-4 min-w-[220px]">
                                        <p className="font-medium text-[var(--text-h)] text-sm">{pkg.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5 max-w-[320px] truncate">{pkg.description || '-'}</p>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-[var(--text-h)]">{Number(pkg.price).toLocaleString(undefined, { style: 'currency', currency: 'INR' })}</td>
                                    <td className="px-5 py-4 text-sm text-gray-400">{pkg.duration_minutes} min</td>
                                    <td className="px-5 py-4 min-w-[220px]">
                                        {pkg.features?.length ? (
                                            <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                                                {pkg.features.slice(0, 3).map(feature => (
                                                    <span key={feature} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-gray-300">
                                                        <CheckCircle size={12} className="text-green-400" />
                                                        {feature}
                                                    </span>
                                                ))}
                                                {pkg.features.length > 3 && <span className="text-xs text-gray-500 px-2 py-1">+{pkg.features.length - 3}</span>}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-500">No features</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4"><StatusBadge active={pkg.is_active} /></td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleToggle(pkg)}
                                                title={pkg.is_active ? 'Deactivate' : 'Activate'}
                                                className={`p-1.5 rounded-lg transition-colors ${
                                                    pkg.is_active
                                                        ? 'text-green-400 hover:bg-green-400/10'
                                                        : 'text-gray-400 hover:text-green-400 hover:bg-green-400/10'
                                                }`}
                                            >
                                                {pkg.is_active ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                                            </button>
                                            <button
                                                onClick={() => setModalTarget(pkg)}
                                                title="Edit"
                                                className="p-1.5 text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg transition-colors"
                                            ><Pencil size={16} /></button>
                                            <button
                                                onClick={() => handleDelete(pkg)}
                                                title="Delete"
                                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                            ><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {pagination.totalPages > 1 && (
                    <div className="flex justify-between items-center px-5 py-4 border-t border-[var(--glass-border)]">
                        <p className="text-sm text-gray-400">Page {pagination.page} of {pagination.totalPages}</p>
                        <div className="flex gap-2">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => fetchPackages(pagination.page - 1)}
                                className="px-3 py-1.5 text-sm rounded-lg border border-[var(--glass-border)] text-gray-400 hover:text-white disabled:opacity-30"
                            >Previous</button>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => fetchPackages(pagination.page + 1)}
                                className="px-3 py-1.5 text-sm rounded-lg bg-[var(--accent)] text-black font-medium disabled:opacity-30"
                            >Next</button>
                        </div>
                    </div>
                )}
            </div>

            {modalTarget !== undefined && (
                <PackageModal
                    packageItem={modalTarget}
                    onClose={() => setModalTarget(undefined)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default Packages;
