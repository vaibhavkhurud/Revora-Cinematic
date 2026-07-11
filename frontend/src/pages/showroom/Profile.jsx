import React, { useContext, useEffect, useState } from 'react';
import { 
    UserCircle, 
    Mail, 
    Phone, 
    Store, 
    MapPin, 
    Navigation, 
    Sparkles, 
    Pencil, 
    Save, 
    X, 
    ShieldCheck, 
    Loader,
    Lock
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { AuthContext } from '../../context/AuthContext';

const StatusBadge = ({ status }) => {
    const styles = {
        pending:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        approved: 'bg-green-500/10  text-green-400  border-green-500/30',
        rejected: 'bg-red-500/10   text-red-400    border-red-500/30',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${styles[status] || styles.pending}`}>
            {status || 'pending'}
        </span>
    );
};

const ShowroomProfile = () => {
    const { toast } = useToast();
    const { updateUser } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        owner_name: '',
        email: '',
        name: '',
        contact_number: '',
        address: '',
        map_link: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/showroom-owner/profile');
                const showroom = res.data.showroom;
                setProfile(showroom);
                setForm({
                    owner_name: showroom.owner_id?.name || '',
                    email: showroom.owner_id?.email || '',
                    name: showroom.name || '',
                    contact_number: showroom.contact_number || '',
                    address: showroom.address || '',
                    map_link: showroom.map_link || ''
                });
            } catch (error) {
                toast(error.response?.data?.message || 'Failed to fetch showroom profile', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [toast]);

    const handleSave = async () => {
        // Validation
        if (!form.owner_name.trim()) return toast('Owner Name is required', 'error');
        if (!form.email.trim()) return toast('Email is required', 'error');
        if (!form.name.trim()) return toast('Showroom Name is required', 'error');
        if (!form.contact_number.trim()) return toast('Contact Number is required', 'error');
        if (!form.address.trim()) return toast('Showroom Address is required', 'error');

        // Email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            return toast('Please enter a valid email address', 'error');
        }

        // URL validation for map link if provided
        if (form.map_link.trim()) {
            try {
                new URL(form.map_link.trim());
            } catch (_) {
                return toast('Please enter a valid URL for the Google Maps Link (including http:// or https://)', 'error');
            }
        }

        setSaving(true);
        try {
            const res = await api.put('/showroom-owner/profile', form);
            const updatedShowroom = res.data.showroom;
            setProfile(updatedShowroom);
            
            // Update auth context state and local storage with updated user name/email
            updateUser({
                name: res.data.user.name,
                email: res.data.user.email
            });

            toast('Profile updated successfully!', 'success');
            setEditing(false);
        } catch (error) {
            toast(error.response?.data?.message || 'Failed to update profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (profile) {
            setForm({
                owner_name: profile.owner_id?.name || '',
                email: profile.owner_id?.email || '',
                name: profile.name || '',
                contact_number: profile.contact_number || '',
                address: profile.address || '',
                map_link: profile.map_link || ''
            });
        }
        setEditing(false);
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
            <section className="glass rounded-2xl border border-[var(--glass-border)] p-5 sm:p-6 overflow-hidden relative">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--accent)] opacity-[0.05] rounded-full"></div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-semibold mb-3">
                            <Sparkles size={14} />
                            My Profile Settings
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-h)]">{profile?.name || 'Showroom Profile'}</h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Manage showroom registry information, owner contacts, and location coordinates.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 self-start sm:self-center">
                        {editing ? (
                            <>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-black font-semibold text-sm hover:bg-opacity-90 transition-all disabled:opacity-50"
                                >
                                    <Save size={15} />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--glass-border)] text-gray-400 hover:text-white text-sm transition-all"
                                >
                                    <X size={15} />
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--glass-border)] text-gray-400 hover:text-white hover:border-[var(--accent)]/50 transition-all text-sm font-semibold"
                            >
                                <Pencil size={15} />
                                Edit Profile
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* Approval Info Alert */}
            {profile?.status !== 'approved' && (
                <div className="glass rounded-2xl border border-yellow-500/30 p-5 text-yellow-300 bg-yellow-500/5">
                    <div className="flex items-start gap-3">
                        <ShieldCheck size={20} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold capitalize">Showroom Status: {profile?.status || 'Pending'}</p>
                            {profile?.status === 'rejected' && profile?.rejection_reason && (
                                <p className="text-sm text-red-300 mt-1">Reason: {profile.rejection_reason}</p>
                            )}
                            <p className="text-sm text-yellow-200/70 mt-1">
                                Your profile is under review. Changes to your showroom details will take effect immediately, but you still need Super Admin approval to schedule new shoots.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Account Owner Details */}
                <div className="glass rounded-2xl border border-[var(--glass-border)] p-5 sm:p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-[var(--text-h)] flex items-center gap-2 border-b border-[var(--glass-border)] pb-3">
                        <UserCircle size={18} className="text-[var(--accent)]" />
                        Account Owner
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">Owner Full Name</label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={form.owner_name}
                                    onChange={e => setForm({ ...form, owner_name: e.target.value })}
                                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                                />
                            ) : (
                                <p className="text-sm text-[var(--text-h)] font-medium bg-[var(--glass-bg)] border border-transparent px-4 py-2.5 rounded-xl">
                                    {profile?.owner_id?.name || '—'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">Email Address</label>
                            {editing ? (
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                                />
                            ) : (
                                <p className="text-sm text-[var(--text-h)] font-medium bg-[var(--glass-bg)] border border-transparent px-4 py-2.5 rounded-xl flex items-center gap-2">
                                    <Mail size={14} className="text-gray-500" />
                                    {profile?.owner_id?.email || '—'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">Account Role</label>
                            <p className="text-sm text-gray-400 bg-[var(--glass-bg)] border border-[var(--glass-border)] px-4 py-2.5 rounded-xl flex items-center justify-between">
                                <span className="capitalize font-semibold text-[var(--accent)]">Showroom Owner</span>
                                <Lock size={14} className="text-gray-600" />
                            </p>
                        </div>
                    </div>
                </div>

                {/* Showroom Details */}
                <div className="glass rounded-2xl border border-[var(--glass-border)] p-5 sm:p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-[var(--text-h)] flex items-center gap-2 border-b border-[var(--glass-border)] pb-3">
                        <Store size={18} className="text-[var(--accent)]" />
                        Showroom Info
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">Showroom Name</label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                                />
                            ) : (
                                <p className="text-sm text-[var(--text-h)] font-medium bg-[var(--glass-bg)] border border-transparent px-4 py-2.5 rounded-xl">
                                    {profile?.name || '—'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">Contact Number</label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={form.contact_number}
                                    onChange={e => setForm({ ...form, contact_number: e.target.value })}
                                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                                />
                            ) : (
                                <p className="text-sm text-[var(--text-h)] font-medium bg-[var(--glass-bg)] border border-transparent px-4 py-2.5 rounded-xl flex items-center gap-2">
                                    <Phone size={14} className="text-gray-500" />
                                    {profile?.contact_number || '—'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">Registered On</label>
                            <p className="text-sm text-gray-400 bg-[var(--glass-bg)] border border-[var(--glass-border)] px-4 py-2.5 rounded-xl flex items-center justify-between">
                                <span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span>
                                <Lock size={14} className="text-gray-600" />
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* My Showroom Location Section */}
            <section className="glass rounded-2xl border border-[var(--glass-border)] p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-3 border-b border-[var(--glass-border)] pb-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/25 flex items-center justify-center text-[var(--accent)]">
                        <Navigation size={16} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--text-h)]">My Showroom Location</h2>
                        <p className="text-xs text-gray-500">Navigation coordinates for videographer scheduling</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">Address</label>
                        {editing ? (
                            <input
                                type="text"
                                value={form.address}
                                onChange={e => setForm({ ...form, address: e.target.value })}
                                placeholder="e.g. 12 MG Road, Bengaluru, Karnataka 560001"
                                className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] placeholder-gray-600 transition-colors"
                            />
                        ) : (
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                                <MapPin size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-[var(--text-h)] font-medium">
                                        {profile?.address || <span className="text-gray-500 italic">No address added yet</span>}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">Google Maps Share Link</label>
                        {editing ? (
                            <div>
                                <input
                                    type="url"
                                    value={form.map_link}
                                    onChange={e => setForm({ ...form, map_link: e.target.value })}
                                    placeholder="https://maps.app.goo.gl/..."
                                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] placeholder-gray-600 transition-colors"
                                />
                                <p className="text-xs text-gray-600 mt-1.5">
                                    Open Google Maps → search your showroom → tap Share → Copy link → paste here.
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                                <Navigation size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    {profile?.map_link ? (
                                        <a
                                            href={profile.map_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-[var(--accent)] underline underline-offset-2 hover:text-yellow-300 transition-colors truncate block font-medium"
                                        >
                                            {profile.map_link}
                                        </a>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No map link added yet</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ShowroomProfile;
