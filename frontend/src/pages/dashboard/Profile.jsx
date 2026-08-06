import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Building, CreditCard, Save, Loader } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';

const Profile = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        payout_profile: {
            bank_name: '',
            account_name: '',
            account_number: '',
            ifsc_code: '',
            upi_id: ''
        }
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/videographer/profile');
                setProfile({
                    ...res.data,
                    payout_profile: {
                        bank_name: res.data.payout_profile?.bank_name || '',
                        account_name: res.data.payout_profile?.account_name || '',
                        account_number: res.data.payout_profile?.account_number || '',
                        ifsc_code: res.data.payout_profile?.ifsc_code || '',
                        upi_id: res.data.payout_profile?.upi_id || ''
                    }
                });
            } catch (error) {
                toast(error.response?.data?.message || 'Failed to load profile', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [toast]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (['bank_name', 'account_name', 'account_number', 'ifsc_code', 'upi_id'].includes(name)) {
            setProfile(prev => ({
                ...prev,
                payout_profile: {
                    ...prev.payout_profile,
                    [name]: value
                }
            }));
        } else {
            setProfile(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/videographer/profile', {
                phone: profile.phone,
                address: profile.address,
                payout_profile: profile.payout_profile
            });
            toast('Profile updated successfully', 'success');
        } catch (error) {
            toast(error.response?.data?.message || 'Failed to update profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
                <Loader size={48} className="animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-color)]">My Profile</h1>
                    <p className="text-gray-400 mt-2">Manage your personal information and payout details</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="glass rounded-2xl border border-[var(--glass-border)] p-6 md:p-8">
                    <h2 className="text-xl font-bold text-[var(--text-color)] mb-6 flex items-center gap-2">
                        <User className="text-[var(--accent)]" size={24} />
                        Personal Information
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                            <input
                                type="text"
                                value={profile.name}
                                disabled
                                className="w-full bg-[var(--bg-color)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={profile.email}
                                disabled
                                className="w-full bg-[var(--bg-color)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                <Phone size={16} /> Phone Number
                            </label>
                            <input
                                type="text"
                                name="phone"
                                value={profile.phone}
                                onChange={handleChange}
                                placeholder="Enter phone number"
                                className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-[var(--text-color)] focus:outline-none focus:border-[var(--accent)]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                <MapPin size={16} /> Address
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={profile.address}
                                onChange={handleChange}
                                placeholder="Enter your full address"
                                className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-[var(--text-color)] focus:outline-none focus:border-[var(--accent)]"
                            />
                        </div>
                    </div>
                </div>

                {/* Payout Details */}
                <div className="glass rounded-2xl border border-[var(--glass-border)] p-6 md:p-8">
                    <h2 className="text-xl font-bold text-[var(--text-color)] mb-6 flex items-center gap-2">
                        <CreditCard className="text-[var(--accent)]" size={24} />
                        Payout Details
                    </h2>
                    
                    <p className="text-sm text-yellow-500/80 mb-6 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                        Please provide at least your UPI ID or Bank Account details to receive withdrawals.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 border-b border-[var(--glass-border)] pb-4 mb-2">
                            <h3 className="text-lg font-semibold text-gray-300">UPI Method</h3>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-400 mb-2">UPI ID</label>
                            <input
                                type="text"
                                name="upi_id"
                                value={profile.payout_profile.upi_id}
                                onChange={handleChange}
                                placeholder="e.g. username@bank"
                                className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-[var(--text-color)] focus:outline-none focus:border-[var(--accent)]"
                            />
                        </div>

                        <div className="md:col-span-2 border-b border-[var(--glass-border)] pb-4 mt-4 mb-2">
                            <h3 className="text-lg font-semibold text-gray-300">Bank Transfer Method</h3>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                <Building size={16} /> Bank Name
                            </label>
                            <input
                                type="text"
                                name="bank_name"
                                value={profile.payout_profile.bank_name}
                                onChange={handleChange}
                                placeholder="e.g. HDFC Bank"
                                className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-[var(--text-color)] focus:outline-none focus:border-[var(--accent)]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Account Holder Name</label>
                            <input
                                type="text"
                                name="account_name"
                                value={profile.payout_profile.account_name}
                                onChange={handleChange}
                                placeholder="Name as per bank account"
                                className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-[var(--text-color)] focus:outline-none focus:border-[var(--accent)]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Account Number</label>
                            <input
                                type="text"
                                name="account_number"
                                value={profile.payout_profile.account_number}
                                onChange={handleChange}
                                placeholder="Enter account number"
                                className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-[var(--text-color)] focus:outline-none focus:border-[var(--accent)]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">IFSC Code</label>
                            <input
                                type="text"
                                name="ifsc_code"
                                value={profile.payout_profile.ifsc_code}
                                onChange={handleChange}
                                placeholder="e.g. HDFC0001234"
                                className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-[var(--text-color)] uppercase focus:outline-none focus:border-[var(--accent)]"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3 bg-[var(--accent)] text-white rounded-xl font-semibold hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                    >
                        {saving ? <Loader size={20} className="animate-spin" /> : <Save size={20} />}
                        {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Profile;
