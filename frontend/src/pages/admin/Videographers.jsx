import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Video, User, Mail, Phone, Copy, CheckCircle, X } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';

const statusStyles = {
    available: 'bg-green-500/10 text-green-400 border-green-500/30',
    assigned: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    on_leave: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
};

const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${statusStyles[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/30'}`}>
        {String(status || 'unknown').replace('_', ' ')}
    </span>
);

const Videographers = () => {
    const { toast } = useToast();
    const [videographers, setVideographers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    
    const [newCredentials, setNewCredentials] = useState(null);

    const fetchVideographers = async () => {
        try {
            const res = await api.get('/admin/videographers');
            setVideographers(res.data.videographers || []);
        } catch (error) {
            toast('Failed to load videographers', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideographers();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddVideographer = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await api.post('/admin/videographers', formData);
            toast('Videographer added successfully', 'success');
            setNewCredentials(res.data.videographer);
            fetchVideographers();
            setFormData({ name: '', email: '', phone: '' });
            // Do NOT close modal immediately, so admin can see the password
        } catch (error) {
            toast(error.response?.data?.message || 'Failed to add videographer', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setIsAddModalOpen(false);
        setNewCredentials(null);
        setFormData({ name: '', email: '', phone: '' });
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast('Copied to clipboard', 'success');
    };

    const filteredVideographers = videographers.filter(v => 
        v.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        v.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-color)]">Videographers</h1>
                    <p className="text-gray-400 mt-1">Manage your team of cinematic videographers</p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2 bg-[var(--accent)] text-black rounded-lg font-semibold hover:bg-opacity-90 transition-all flex items-center gap-2"
                >
                    <PlusCircle size={18} />
                    Add Videographer
                </button>
            </div>

            {/* List Section */}
            <div className="glass rounded-2xl border border-[var(--glass-border)] overflow-hidden">
                <div className="p-5 border-b border-[var(--glass-border)] flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[var(--accent)] transition-colors"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--glass-border)] text-gray-400 text-sm uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Videographer</th>
                                <th className="px-6 py-4 font-semibold">Contact Info</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--glass-border)]">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-400">Loading videographers...</td>
                                </tr>
                            ) : filteredVideographers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                        <Video size={48} className="mx-auto mb-3 opacity-50" />
                                        <p>No videographers found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredVideographers.map((v) => (
                                    <tr key={v.id} className="hover:bg-[var(--glass-bg)] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] shrink-0">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-[var(--text-color)]">{v.name}</p>
                                                    <p className="text-xs text-gray-500">Joined {new Date(v.joined).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-300 flex items-center gap-2">
                                                <Mail size={14} className="text-gray-500" />
                                                {v.email}
                                            </p>
                                            <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                                                <Phone size={14} className="text-gray-500" />
                                                {v.phone || 'N/A'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={v.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-sm text-[var(--accent)] hover:underline">Edit</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="glass rounded-2xl border border-[var(--glass-border)] max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <button 
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                        
                        <h2 className="text-2xl font-bold text-[var(--text-color)] mb-6">Add Videographer</h2>

                        {!newCredentials ? (
                            <form onSubmit={handleAddVideographer} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                                    <input 
                                        type="text"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-[var(--bg-color)] border border-[var(--glass-border)] rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                                    <input 
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-[var(--bg-color)] border border-[var(--glass-border)] rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                                    <input 
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-[var(--bg-color)] border border-[var(--glass-border)] rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
                                        placeholder="+1234567890"
                                    />
                                </div>

                                <div className="pt-4">
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="w-full bg-[var(--accent)] text-black font-semibold py-2 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Adding...' : 'Create Videographer'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6 text-center">
                                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Account Created!</h3>
                                    <p className="text-gray-400 text-sm">
                                        Please share these credentials with the videographer securely. They will need this password to log in.
                                    </p>
                                </div>

                                <div className="bg-[var(--bg-color)] border border-[var(--glass-border)] rounded-lg p-4 text-left space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm">Email:</span>
                                        <span className="text-white font-medium">{newCredentials.email}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm">Password:</span>
                                        <div className="flex items-center gap-2">
                                            <code className="bg-black/50 px-2 py-1 rounded text-[var(--accent)] tracking-wider">
                                                {newCredentials.generatedPassword}
                                            </code>
                                            <button 
                                                onClick={() => copyToClipboard(newCredentials.generatedPassword)}
                                                className="text-gray-400 hover:text-white transition-colors p-1"
                                                title="Copy Password"
                                            >
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={closeModal}
                                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-white font-semibold py-2 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Videographers;
