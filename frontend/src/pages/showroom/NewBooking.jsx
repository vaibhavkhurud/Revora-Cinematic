import React, { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, CheckCircle, ImagePlus, Package, UploadCloud, X } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';

const initialForm = {
    customer_name: '',
    customer_mobile: '',
    vehicle_brand: '',
    vehicle_model: '',
    vehicle_type: '',
    vehicle_color: '',
    registration_number: '',
    package_id: '',
    shoot_date: '',
    time_slot: '',
    notes: ''
};

const fieldLabels = {
    customer_name: 'Customer Name',
    customer_mobile: 'Customer Mobile',
    vehicle_brand: 'Vehicle Brand',
    vehicle_model: 'Vehicle Model',
    vehicle_type: 'Vehicle Type',
    vehicle_color: 'Vehicle Color',
    registration_number: 'Registration Number',
    package_id: 'Package Selection',
    shoot_date: 'Shoot Date',
    time_slot: 'Time Slot'
};

const today = new Date().toISOString().slice(0, 10);

const validateForm = (form, photos) => {
    for (const field of Object.keys(fieldLabels)) {
        if (!String(form[field] || '').trim()) return `${fieldLabels[field]} is required.`;
    }

    if (!/^[0-9+\-\s()]{7,20}$/.test(form.customer_mobile.trim())) {
        return 'Customer mobile number is invalid.';
    }

    if (!/^[a-z0-9 -]{4,30}$/i.test(form.registration_number.trim())) {
        return 'Registration number is invalid.';
    }

    const shootAt = new Date(`${form.shoot_date}T${form.time_slot}:00`);
    if (Number.isNaN(shootAt.getTime()) || shootAt < new Date()) {
        return 'Shoot date and time slot must be in the future.';
    }

    if (!photos.length) return 'Upload at least one vehicle photo.';
    if (photos.length > 8) return 'You can upload up to 8 vehicle photos.';

    const oversized = photos.find(photo => photo.size > 5 * 1024 * 1024);
    if (oversized) return 'Each vehicle photo must be 5MB or smaller.';

    return '';
};

const formatCurrency = (value) => Number(value || 0).toLocaleString(undefined, {
    style: 'currency',
    currency: 'INR'
});

const NewBooking = () => {
    const { toast } = useToast();
    const [form, setForm] = useState(initialForm);
    const [packages, setPackages] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [loadingPackages, setLoadingPackages] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [confirmation, setConfirmation] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const res = await api.get('/bookings/packages');
                setPackages(res.data.packages || []);
            } catch (err) {
                toast(err.response?.data?.message || 'Failed to load packages', 'error');
            } finally {
                setLoadingPackages(false);
            }
        };

        fetchPackages();
    }, [toast]);

    const selectedPackage = useMemo(
        () => packages.find(item => item.id === form.package_id),
        [packages, form.package_id]
    );

    const previews = useMemo(() => photos.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file)
    })), [photos]);

    useEffect(() => () => previews.forEach(preview => URL.revokeObjectURL(preview.url)), [previews]);

    const updateField = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handlePhotos = (event) => {
        const files = Array.from(event.target.files || []);
        setPhotos(files);
        setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const validationError = validateForm(form, photos);
        if (validationError) {
            setError(validationError);
            return;
        }

        const payload = new FormData();
        Object.entries(form).forEach(([key, value]) => payload.append(key, value));
        photos.forEach(photo => payload.append('vehicle_photos', photo));

        setSubmitting(true);
        try {
            const res = await api.post('/bookings', payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setConfirmation(res.data.booking);
            setForm(initialForm);
            setPhotos([]);
            toast('Booking created successfully!', 'success');
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to create booking', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-h)]">New Booking</h1>
                    <p className="text-sm text-gray-400 mt-1">Create a vehicle shoot request with photos, package, date, and slot.</p>
                </div>
                {confirmation && (
                    <div className="glass border border-green-500/30 rounded-xl px-4 py-3 text-green-300 flex items-center gap-2">
                        <CheckCircle size={18} />
                        <span className="text-sm font-medium">Confirmed: {confirmation.booking_id}</span>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <section className="glass border border-[var(--glass-border)] rounded-2xl p-5">
                        <h2 className="text-lg font-semibold text-[var(--text-h)] mb-4">Customer</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Customer Name" value={form.customer_name} onChange={value => updateField('customer_name', value)} maxLength={120} />
                            <Input label="Customer Mobile" value={form.customer_mobile} onChange={value => updateField('customer_mobile', value)} maxLength={20} />
                        </div>
                    </section>

                    <section className="glass border border-[var(--glass-border)] rounded-2xl p-5">
                        <h2 className="text-lg font-semibold text-[var(--text-h)] mb-4">Vehicle</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Vehicle Brand" value={form.vehicle_brand} onChange={value => updateField('vehicle_brand', value)} maxLength={80} />
                            <Input label="Vehicle Model" value={form.vehicle_model} onChange={value => updateField('vehicle_model', value)} maxLength={80} />
                            <Input label="Vehicle Type" value={form.vehicle_type} onChange={value => updateField('vehicle_type', value)} maxLength={60} placeholder="SUV, Sedan, Bike..." />
                            <Input label="Vehicle Color" value={form.vehicle_color} onChange={value => updateField('vehicle_color', value)} maxLength={60} />
                            <Input label="Registration Number" value={form.registration_number} onChange={value => updateField('registration_number', value.toUpperCase())} maxLength={30} />
                        </div>
                    </section>

                    <section className="glass border border-[var(--glass-border)] rounded-2xl p-5">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <h2 className="text-lg font-semibold text-[var(--text-h)]">Vehicle Photos</h2>
                            <span className="text-xs text-gray-500">Up to 8 images, 5MB each</span>
                        </div>
                        <label className="flex flex-col items-center justify-center gap-3 min-h-40 rounded-2xl border border-dashed border-[var(--glass-border)] bg-[var(--glass-bg)] cursor-pointer hover:border-[var(--accent)] transition-colors">
                            <UploadCloud size={28} className="text-[var(--accent)]" />
                            <span className="text-sm text-[var(--text-h)] font-medium">Upload vehicle photos</span>
                            <span className="text-xs text-gray-500">PNG, JPG, WEBP images accepted</span>
                            <input type="file" multiple accept="image/*" onChange={handlePhotos} className="hidden" />
                        </label>
                        {previews.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                                {previews.map(preview => (
                                    <div key={preview.url} className="aspect-square rounded-xl overflow-hidden border border-[var(--glass-border)] bg-[var(--glass-bg)] relative">
                                        <img src={preview.url} alt={preview.name} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <aside className="space-y-6">
                    <section className="glass border border-[var(--glass-border)] rounded-2xl p-5">
                        <h2 className="text-lg font-semibold text-[var(--text-h)] mb-4">Package Selection</h2>
                        <div className="space-y-3">
                            {loadingPackages ? (
                                [...Array(3)].map((_, index) => <div key={index} className="h-20 rounded-xl bg-[var(--glass-bg)] animate-pulse" />)
                            ) : packages.length ? packages.map(item => (
                                <button
                                    type="button"
                                    key={item.id}
                                    onClick={() => updateField('package_id', item.id)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                                        form.package_id === item.id
                                            ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                                            : 'border-[var(--glass-border)] bg-[var(--glass-bg)] hover:border-[var(--accent)]/60'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-[var(--text-h)]">{item.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">{item.duration_minutes} min</p>
                                        </div>
                                        <p className="text-sm font-bold text-[var(--accent)]">{formatCurrency(item.price)}</p>
                                    </div>
                                </button>
                            )) : (
                                <p className="text-sm text-gray-500">No active packages available.</p>
                            )}
                        </div>
                    </section>

                    <section className="glass border border-[var(--glass-border)] rounded-2xl p-5">
                        <h2 className="text-lg font-semibold text-[var(--text-h)] mb-4">Schedule</h2>
                        <div className="space-y-4">
                            <Input type="date" label="Shoot Date" value={form.shoot_date} min={today} onChange={value => updateField('shoot_date', value)} />
                            <Input type="time" label="Time Slot" value={form.time_slot} onChange={value => updateField('time_slot', value)} />
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Notes</label>
                                <textarea
                                    value={form.notes}
                                    onChange={event => updateField('notes', event.target.value)}
                                    rows={4}
                                    maxLength={1000}
                                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] resize-none"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="glass border border-[var(--glass-border)] rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/25 flex items-center justify-center text-[var(--accent)]">
                                {selectedPackage ? <Package size={18} /> : <ImagePlus size={18} />}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-[var(--text-h)]">{selectedPackage?.name || 'Booking Summary'}</p>
                                <p className="text-xs text-gray-500">{photos.length} photo{photos.length === 1 ? '' : 's'} selected</p>
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
                        <button
                            type="submit"
                            disabled={submitting || loadingPackages}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--accent)] text-black font-semibold hover:bg-opacity-90 disabled:opacity-60"
                        >
                            <CalendarPlus size={18} />
                            {submitting ? 'Saving Booking...' : 'Save Booking'}
                        </button>
                    </section>
                </aside>
            </form>

            {confirmation && (
                <div className="glass border border-green-500/30 rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-green-300">Booking Confirmation</h2>
                            <p className="text-sm text-gray-400 mt-1">
                                {confirmation.booking_id} for {confirmation.customer_name} has been saved with status pending.
                            </p>
                        </div>
                        <button onClick={() => setConfirmation(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
                    </div>
                </div>
            )}
        </div>
    );
};

const Input = ({ label, value, onChange, type = 'text', ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={event => onChange(event.target.value)}
            className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] placeholder-gray-500"
            {...props}
        />
    </div>
);

export default NewBooking;
