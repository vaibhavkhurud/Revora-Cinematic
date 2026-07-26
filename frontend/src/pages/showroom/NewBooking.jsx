import React, { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, CheckCircle, ImagePlus, Package, UploadCloud, X } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { loadRazorpayScript } from '../../utils/razorpayLoader';

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
    const [paying, setPaying] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

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
            setPaymentSuccess(false);
            setForm(initialForm);
            setPhotos([]);
            toast('Booking created successfully!', 'success');
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to create booking', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePayment = async () => {
        if (!confirmation) return;
        setPaying(true);
        try {
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                toast('Razorpay SDK failed to load. Are you online?', 'error');
                setPaying(false);
                return;
            }

            const orderRes = await api.post('/payments/create-order', {
                booking_id: confirmation.id
            });

            const { order_id, amount, currency, key_id, is_mock } = orderRes.data;

            if (is_mock) {
                const proceed = window.confirm("Razorpay keys are missing from your backend .env file. Would you like to simulate a successful mock payment for testing?");
                if (proceed) {
                    try {
                        const verifyRes = await api.post('/payments/verify', {
                            razorpay_order_id: order_id,
                            razorpay_payment_id: `mock_pay_${Date.now()}`,
                            razorpay_signature: 'mock_signature',
                            booking_id: confirmation.id
                        });
                        if (verifyRes.data.success) {
                            toast('Mock payment completed and booking verified!', 'success');
                            setPaymentSuccess(true);
                        } else {
                            toast('Mock payment verification failed.', 'error');
                        }
                    } catch (verifyErr) {
                        toast(verifyErr.response?.data?.message || 'Mock verification failed.', 'error');
                    }
                }
                setPaying(false);
                return;
            }

            const options = {
                key: key_id,
                amount: amount,
                currency: currency,
                name: 'Revora Cinematic',
                description: `Payment for booking ${confirmation.booking_id}`,
                order_id: order_id,
                handler: async function (response) {
                    try {
                        const verifyRes = await api.post('/payments/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            booking_id: confirmation.id
                        });

                        if (verifyRes.data.success) {
                            toast('Payment successful and booking verified!', 'success');
                            setPaymentSuccess(true);
                        } else {
                            toast('Payment verification failed.', 'error');
                        }
                    } catch (verifyErr) {
                        toast(verifyErr.response?.data?.message || 'Payment verification failed.', 'error');
                    }
                },
                prefill: {
                    name: confirmation.showroom?.name || confirmation.customer_name,
                    contact: confirmation.showroom?.contact_number || confirmation.customer_mobile,
                },
                theme: {
                    color: '#3b82f6',
                },
                modal: {
                    ondismiss: function() {
                        toast('Payment cancelled by user.', 'error');
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                toast(`Payment failed: ${response.error.description}`, 'error');
            });
            rzp.open();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to initiate payment.', 'error');
        } finally {
            setPaying(false);
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
                <div className="glass border border-green-500/30 rounded-2xl p-5 mt-4 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-green-300">Booking Saved Successfully!</h2>
                            <p className="text-sm text-gray-400 mt-1">
                                Booking reference: <span className="font-mono text-white">{confirmation.booking_id}</span> for {confirmation.customer_name}.
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                Package: <span className="text-white">{confirmation.package?.name}</span> - <span className="text-[var(--accent)] font-semibold">{formatCurrency(confirmation.package?.price)}</span>
                            </p>
                        </div>
                        <button onClick={() => setConfirmation(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
                    </div>

                    <div className="pt-2 border-t border-[var(--glass-border)] flex items-center justify-between">
                        <div>
                            <span className="text-xs text-gray-500 block uppercase tracking-wider">Payment Status</span>
                            <span className={`text-sm font-semibold ${paymentSuccess ? 'text-green-400' : 'text-amber-400'}`}>
                                {paymentSuccess ? '● Paid (INR)' : '● Pending Payment'}
                            </span>
                        </div>
                        {!paymentSuccess && (
                            <button
                                onClick={handlePayment}
                                disabled={paying}
                                className="px-6 py-2.5 rounded-xl bg-[var(--accent)] text-black font-bold text-sm hover:bg-opacity-90 transition-all disabled:opacity-50"
                            >
                                {paying ? 'Processing...' : `Pay Now ${formatCurrency(confirmation.package?.price)}`}
                            </button>
                        )}
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
