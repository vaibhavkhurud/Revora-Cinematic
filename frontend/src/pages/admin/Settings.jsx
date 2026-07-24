import React, { useContext, useEffect, useState } from 'react';
import { 
    User, 
    Lock, 
    Settings, 
    Mail, 
    Shield, 
    Globe, 
    Sliders, 
    Sparkles, 
    Save, 
    Loader,
    ShieldAlert,
    DollarSign,
    Clock,
    BookOpen
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { AuthContext } from '../../context/AuthContext';

const AdminSettings = () => {
    const { toast } = useToast();
    const { updateUser } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    
    // Profile settings state
    const [profileForm, setProfileForm] = useState({
        name: '',
        email: ''
    });
    const [profileSaving, setProfileSaving] = useState(false);

    // Password change state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordSaving, setPasswordSaving] = useState(false);

    // System settings state
    const [systemForm, setSystemForm] = useState({
        platform_name: '',
        support_email: '',
        commission_rate: 15,
        maintenance_mode: false,
        booking_advance_hours: 24
    });
    const [systemSaving, setSystemSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Fetch profile
                const profileRes = await api.get('/admin/profile');
                setProfileForm({
                    name: profileRes.data.user.name || '',
                    email: profileRes.data.user.email || ''
                });

                // Fetch system settings
                const systemRes = await api.get('/admin/system-settings');
                if (systemRes.data.settings) {
                    setSystemForm({
                        platform_name: systemRes.data.settings.platform_name || '',
                        support_email: systemRes.data.settings.support_email || '',
                        commission_rate: systemRes.data.settings.commission_rate ?? 15,
                        maintenance_mode: systemRes.data.settings.maintenance_mode ?? false,
                        booking_advance_hours: systemRes.data.settings.booking_advance_hours ?? 24
                    });
                }
            } catch (error) {
                toast(error.response?.data?.message || 'Failed to fetch settings information', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [toast]);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        if (!profileForm.name.trim()) return toast('Name is required', 'error');
        if (!profileForm.email.trim()) return toast('Email is required', 'error');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email.trim())) {
            return toast('Please enter a valid email address', 'error');
        }

        setProfileSaving(true);
        try {
            const res = await api.put('/admin/profile', profileForm);
            updateUser({
                name: res.data.user.name,
                email: res.data.user.email
            });
            toast('Profile updated successfully!', 'success');
        } catch (error) {
            toast(error.response?.data?.message || 'Failed to update profile', 'error');
        } finally {
            setProfileSaving(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!passwordForm.currentPassword) return toast('Current password is required', 'error');
        if (!passwordForm.newPassword) return toast('New password is required', 'error');
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            return toast('New passwords do not match', 'error');
        }
        if (passwordForm.newPassword.length < 6) {
            return toast('Password must be at least 6 characters long', 'error');
        }

        setPasswordSaving(true);
        try {
            await api.put('/admin/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });
            toast('Password changed successfully!', 'success');
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            toast(error.response?.data?.message || 'Failed to change password', 'error');
        } finally {
            setPasswordSaving(false);
        }
    };

    const handleSystemSubmit = async (e) => {
        e.preventDefault();
        if (!systemForm.platform_name.trim()) return toast('Platform name is required', 'error');
        if (!systemForm.support_email.trim()) return toast('Support email is required', 'error');

        setSystemSaving(true);
        try {
            const res = await api.put('/admin/system-settings', systemForm);
            setSystemForm(res.data.settings);
            toast('System settings updated successfully!', 'success');
        } catch (error) {
            toast(error.response?.data?.message || 'Failed to update system settings', 'error');
        } finally {
            setSystemSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
                <Loader size={48} className="animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            {/* Header Section */}
            <section className="glass rounded-2xl border border-[var(--glass-border)] p-6 overflow-hidden relative">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--accent)] opacity-[0.05] rounded-full"></div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-semibold mb-3">
                            <Sparkles size={14} />
                            Super Admin Control Panel
                        </div>
                        <h1 className="text-3xl font-bold text-[var(--text-h)]">System Settings</h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Configure your administrator credentials, system security, and global platform parameters.
                        </p>
                    </div>
                </div>
            </section>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[var(--glass-border)] gap-2">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all ${
                        activeTab === 'profile'
                            ? 'border-[var(--accent)] text-[var(--accent)]'
                            : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                    }`}
                >
                    <User size={16} />
                    Profile Details
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all ${
                        activeTab === 'security'
                            ? 'border-[var(--accent)] text-[var(--accent)]'
                            : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                    }`}
                >
                    <Lock size={16} />
                    Security
                </button>
                <button
                    onClick={() => setActiveTab('system')}
                    className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all ${
                        activeTab === 'system'
                            ? 'border-[var(--accent)] text-[var(--accent)]'
                            : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                    }`}
                >
                    <Settings size={16} />
                    System Configuration
                </button>
            </div>

            {/* Content Area */}
            <div className="space-y-6">
                {activeTab === 'profile' && (
                    <form onSubmit={handleProfileSubmit} className="glass rounded-2xl border border-[var(--glass-border)] p-6 space-y-6">
                        <h2 className="text-xl font-bold text-[var(--text-h)] flex items-center gap-2 border-b border-[var(--glass-border)] pb-3">
                            <User size={20} className="text-[var(--accent)]" />
                            Administrator Profile Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-400">Full Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={profileForm.name}
                                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                        className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 pl-10 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                                        placeholder="Administrator name"
                                    />
                                    <User size={16} className="absolute left-3.5 top-3 text-gray-500" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-400">Email Address</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={profileForm.email}
                                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                        className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 pl-10 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                                        placeholder="admin@rovora.com"
                                    />
                                    <Mail size={16} className="absolute left-3.5 top-3 text-gray-500" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-[var(--glass-border)]">
                            <button
                                type="submit"
                                disabled={profileSaving}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-black font-semibold text-sm hover:bg-opacity-90 transition-all disabled:opacity-50"
                            >
                                {profileSaving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                                Save Profile
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === 'security' && (
                    <form onSubmit={handlePasswordSubmit} className="glass rounded-2xl border border-[var(--glass-border)] p-6 space-y-6">
                        <h2 className="text-xl font-bold text-[var(--text-h)] flex items-center gap-2 border-b border-[var(--glass-border)] pb-3">
                            <Lock size={20} className="text-[var(--accent)]" />
                            Update Security Password
                        </h2>

                        <div className="space-y-4 max-w-md">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-400">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-400">New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-400">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-[var(--glass-border)]">
                            <button
                                type="submit"
                                disabled={passwordSaving}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-black font-semibold text-sm hover:bg-opacity-90 transition-all disabled:opacity-50"
                            >
                                {passwordSaving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                                Change Password
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === 'system' && (
                    <form onSubmit={handleSystemSubmit} className="glass rounded-2xl border border-[var(--glass-border)] p-6 space-y-6">
                        <h2 className="text-xl font-bold text-[var(--text-h)] flex items-center gap-2 border-b border-[var(--glass-border)] pb-3">
                            <Sliders size={20} className="text-[var(--accent)]" />
                            Global Platform Parameter Settings
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-400">Platform Display Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={systemForm.platform_name}
                                        onChange={(e) => setSystemForm({ ...systemForm, platform_name: e.target.value })}
                                        className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 pl-10 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                                    />
                                    <Globe size={16} className="absolute left-3.5 top-3 text-gray-500" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-400">System Support Email</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={systemForm.support_email}
                                        onChange={(e) => setSystemForm({ ...systemForm, support_email: e.target.value })}
                                        className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 pl-10 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                                    />
                                    <Mail size={16} className="absolute left-3.5 top-3 text-gray-500" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-400">Super Admin Commission Rate (%)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={systemForm.commission_rate}
                                        onChange={(e) => setSystemForm({ ...systemForm, commission_rate: Number(e.target.value) })}
                                        className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 pl-10 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                                        min="0"
                                        max="100"
                                    />
                                    <DollarSign size={16} className="absolute left-3.5 top-3 text-gray-500" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-400">Booking Advance Window (Hours)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={systemForm.booking_advance_hours}
                                        onChange={(e) => setSystemForm({ ...systemForm, booking_advance_hours: Number(e.target.value) })}
                                        className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 pl-10 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                                        min="1"
                                    />
                                    <Clock size={16} className="absolute left-3.5 top-3 text-gray-500" />
                                </div>
                            </div>
                        </div>

                        {/* Toggle Maintenance Mode */}
                        <div className="border-t border-[var(--glass-border)] pt-6 space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                    <label className="text-base font-semibold text-[var(--text-h)] flex items-center gap-2">
                                        <ShieldAlert size={18} className="text-yellow-500" />
                                        Platform Maintenance Mode
                                    </label>
                                    <p className="text-sm text-gray-400 max-w-xl">
                                        When enabled, all users except super administrators will be locked out of the application and see a scheduled maintenance screen.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer select-none">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={systemForm.maintenance_mode}
                                        onChange={(e) => setSystemForm({ ...systemForm, maintenance_mode: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:height-5 after:h-5 after:width-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-[var(--glass-border)]">
                            <button
                                type="submit"
                                disabled={systemSaving}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-black font-semibold text-sm hover:bg-opacity-90 transition-all disabled:opacity-50"
                            >
                                {systemSaving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                                Save System Settings
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AdminSettings;
