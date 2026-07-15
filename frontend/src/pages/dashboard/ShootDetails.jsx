import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    MapPin, 
    Phone, 
    User, 
    Car, 
    Calendar, 
    Clock, 
    FileText, 
    CheckCircle,
    Activity,
    Upload,
    Play,
    Loader,
    Navigation
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';

const statusSequence = ['assigned', 'arrived', 'shooting', 'editing', 'completed'];

const getStatusLabel = (status) => {
    switch (status) {
        case 'assigned': return 'Assigned';
        case 'arrived': return 'Arrived';
        case 'shooting': return 'Shooting Started';
        case 'editing': return 'Editing/Pending Upload';
        case 'completed': return 'Completed';
        default: return status;
    }
};

const ShootDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchDetails = async () => {
        try {
            const res = await api.get(`/videographer/booking/${id}`);
            setData(res.data);
        } catch (error) {
            toast(error.response?.data?.message || 'Failed to load details', 'error');
            navigate('/videographer/dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const handleStatusUpdate = async (newStatus) => {
        setIsUpdating(true);
        try {
            await api.put(`/videographer/booking/${id}/status`, { status: newStatus });
            toast(`Status updated to ${getStatusLabel(newStatus)}`, 'success');
            await fetchDetails();
        } catch (error) {
            toast(error.response?.data?.message || 'Failed to update status', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader size={48} className="animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    const { booking, images, activities } = data;
    const currentStepIndex = statusSequence.indexOf(booking.status);
    
    // Determine the next status in the workflow
    let nextStatus = null;
    let actionLabel = '';
    let ActionIcon = Play;

    if (booking.status === 'assigned') {
        nextStatus = 'arrived';
        actionLabel = 'Mark as Arrived';
        ActionIcon = MapPin;
    } else if (booking.status === 'arrived') {
        nextStatus = 'shooting';
        actionLabel = 'Start Shoot';
        ActionIcon = Play;
    } else if (booking.status === 'shooting') {
        nextStatus = 'editing';
        actionLabel = 'Finish Shoot (Start Editing)';
        ActionIcon = FileText;
    } else if (booking.status === 'editing') {
        nextStatus = 'completed';
        actionLabel = 'Upload Final Video & Complete';
        ActionIcon = Upload;
    }

    const heroImage = images?.length > 0 
        ? (images[0].image_url.startsWith('http') ? images[0].image_url : `http://localhost:5000${images[0].image_url}`) 
        : 'https://images.unsplash.com/photo-1611339555312-e607c04352fd?w=1200&h=400&fit=crop';

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            {/* Header / Back */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate('/videographer/dashboard')}
                    className="p-2 glass rounded-lg hover:bg-[var(--glass-bg)] transition-colors text-gray-400 hover:text-white"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-color)]">Shoot Details</h1>
                    <p className="text-gray-400 text-sm">Booking ID: {booking._id}</p>
                </div>
            </div>

            {/* Hero Image */}
            <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden relative glass border border-[var(--glass-border)]">
                <img 
                    src={heroImage} 
                    alt="Vehicle" 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-bold text-white">{booking.vehicle_brand} {booking.vehicle_model}</h2>
                        <p className="text-[var(--accent)] font-medium mt-1">{booking.registration_number}</p>
                    </div>
                    <div className="hidden sm:flex gap-2">
                        {images?.slice(1, 4).map((img, idx) => (
                            <img 
                                key={idx}
                                src={img.image_url.startsWith('http') ? img.image_url : `http://localhost:5000${img.image_url}`}
                                alt={`Vehicle view ${idx}`}
                                className="w-16 h-16 rounded-lg border border-white/20 object-cover"
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Main Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Customer Details */}
                        <div className="glass rounded-2xl p-6 border border-[var(--glass-border)]">
                            <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4 flex items-center gap-2">
                                <User size={18} className="text-[var(--accent)]" />
                                Customer Details
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Name</p>
                                    <p className="text-white font-medium">{booking.customer_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Mobile</p>
                                    <p className="text-white font-medium flex items-center gap-2">
                                        <Phone size={14} className="text-gray-400" />
                                        {booking.customer_mobile}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Vehicle Details */}
                        <div className="glass rounded-2xl p-6 border border-[var(--glass-border)]">
                            <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4 flex items-center gap-2">
                                <Car size={18} className="text-[var(--accent)]" />
                                Vehicle Details
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Type</p>
                                    <p className="text-white font-medium">{booking.vehicle_type}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Color</p>
                                    <p className="text-white font-medium">{booking.vehicle_color}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Package</p>
                                    <p className="text-[var(--accent)] font-medium">{booking.package_id?.name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Showroom Details */}
                        <div className="glass rounded-2xl p-6 border border-[var(--glass-border)] md:col-span-2">
                            <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4 flex items-center gap-2">
                                <MapPin size={18} className="text-[var(--accent)]" />
                                Showroom / Location
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Showroom Name</p>
                                    <p className="text-white font-medium">{booking.showroom_id?.name || 'Unknown'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Contact</p>
                                    <p className="text-white font-medium flex items-center gap-2">
                                        <Phone size={14} className="text-gray-400" />
                                        {booking.showroom_id?.contact_number || 'N/A'}
                                    </p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Address</p>
                                    <p className="text-white font-medium mb-3">{booking.showroom_id?.address || 'N/A'}</p>
                                    {booking.showroom_id?.map_link ? (
                                        <a
                                            href={booking.showroom_id.map_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all
                                                bg-[var(--accent)] text-black hover:bg-opacity-90
                                                shadow-[0_0_16px_rgba(234,179,8,0.35)] hover:shadow-[0_0_24px_rgba(234,179,8,0.55)]"
                                        >
                                            <Navigation size={16} />
                                            Get Directions on Google Maps
                                        </a>
                                    ) : (
                                        <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                                            bg-[var(--glass-bg)] border border-[var(--glass-border)] text-gray-500 cursor-not-allowed">
                                            <Navigation size={16} />
                                            No map link added yet
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="glass rounded-2xl p-6 border border-[var(--glass-border)]">
                        <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4 flex items-center gap-2">
                            <FileText size={18} className="text-[var(--accent)]" />
                            Special Notes
                        </h3>
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {booking.notes || "No special instructions provided for this shoot."}
                        </p>
                    </div>

                </div>

                {/* Right Column: Workflow & Actions */}
                <div className="space-y-6">
                    
                    {/* Action Card */}
                    <div className="glass rounded-2xl p-6 border border-[var(--glass-border)] text-center relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-[var(--accent)] opacity-[0.05] rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                        
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Current Status</h3>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] font-bold text-lg mb-6 capitalize">
                            {getStatusLabel(booking.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-left mb-6 bg-[var(--bg-color)] rounded-xl p-4 border border-[var(--glass-border)]">
                            <div>
                                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Calendar size={12}/> Date</p>
                                <p className="font-semibold text-white">{(new Date(booking.booking_date)).toLocaleDateString("en-GB")}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Clock size={12}/> Time</p>
                                <p className="font-semibold text-white">{booking.time_slot}</p>
                            </div>
                        </div>

                        {nextStatus ? (
                            <button
                                onClick={() => handleStatusUpdate(nextStatus)}
                                disabled={isUpdating}
                                className="w-full bg-[var(--accent)] text-black py-3 px-4 rounded-xl font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isUpdating ? <Loader size={20} className="animate-spin" /> : <ActionIcon size={20} />}
                                {actionLabel}
                            </button>
                        ) : (
                            <div className="w-full bg-green-500/10 border border-green-500/30 text-green-400 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2">
                                <CheckCircle size={20} />
                                Workflow Completed
                            </div>
                        )}
                    </div>

                    {/* Timeline */}
                    <div className="glass rounded-2xl p-6 border border-[var(--glass-border)]">
                        <h3 className="text-lg font-semibold text-[var(--text-color)] mb-6 flex items-center gap-2">
                            <Activity size={18} className="text-[var(--accent)]" />
                            Workflow Timeline
                        </h3>
                        
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-700 before:to-transparent">
                            {statusSequence.map((status, index) => {
                                const isCompleted = index <= currentStepIndex;
                                const isCurrent = index === currentStepIndex;

                                return (
                                    <div key={status} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                        
                                        {/* Marker */}
                                        <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 bg-[var(--bg-color)] z-10 
                                            ${isCompleted ? 'border-[var(--accent)] shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'border-gray-600'}
                                            ${isCurrent ? 'scale-125' : ''}
                                            transition-all duration-300`}
                                        >
                                            {isCompleted && <div className="w-2 h-2 rounded-full bg-[var(--accent)]"></div>}
                                        </div>
                                        
                                        {/* Content */}
                                        <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] glass p-3 rounded-xl border border-[var(--glass-border)] transition-all hover:border-[var(--accent)]/30">
                                            <p className={`font-semibold capitalize text-sm ${isCompleted ? 'text-white' : 'text-gray-500'}`}>
                                                {getStatusLabel(status)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div className="glass rounded-2xl p-6 border border-[var(--glass-border)]">
                        <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4 flex items-center gap-2">
                            <Clock size={18} className="text-[var(--accent)]" />
                            Activity Log
                        </h3>
                        {activities?.length > 0 ? (
                            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                                {activities.map((act) => (
                                    <div key={act._id} className="border-l-2 border-[var(--glass-border)] pl-4 py-1">
                                        <p className="text-xs text-gray-500 mb-1">
                                            {new Date(act.created_at).toLocaleString()}
                                        </p>
                                        <p className="text-sm font-medium text-white">{act.action}</p>
                                        {act.details && <p className="text-xs text-gray-400 mt-1">{act.details}</p>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No activity recorded yet.</p>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ShootDetails;
