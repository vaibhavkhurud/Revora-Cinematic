import React, { useState, useEffect } from 'react';
import { Clock, Calendar as CalendarIcon, CheckCircle, XCircle, AlertCircle, TrendingUp, Loader } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';

const Attendance = () => {
    const { toast } = useToast();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchAttendance = async () => {
        try {
            const now = new Date();
            const month = now.getMonth() + 1; // 1-12
            const year = now.getFullYear();
            
            const res = await api.get(`/attendance?month=${month}&year=${year}`);
            setData(res.data);
        } catch (error) {
            toast('Failed to load attendance data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    const handleCheckIn = async () => {
        setIsUpdating(true);
        try {
            await api.post('/attendance/check-in');
            toast('Successfully checked in!', 'success');
            await fetchAttendance();
        } catch (error) {
            toast(error.response?.data?.message || 'Failed to check in', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCheckOut = async () => {
        setIsUpdating(true);
        try {
            await api.put('/attendance/check-out');
            toast('Successfully checked out!', 'success');
            await fetchAttendance();
        } catch (error) {
            toast(error.response?.data?.message || 'Failed to check out', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader size={48} className="animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    const { todayRecord, stats, history } = data || {};

    const hasCheckedIn = !!todayRecord;
    const hasCheckedOut = !!todayRecord?.check_out_time;

    const StatsCard = ({ title, value, icon: Icon, colorClass }) => (
        <div className="glass p-6 rounded-2xl border border-[var(--glass-border)] flex items-center justify-between">
            <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-[var(--text-color)]">{value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                <Icon size={24} />
            </div>
        </div>
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-[var(--text-color)]">Attendance</h1>
                <p className="text-gray-400 mt-2">Manage your daily check-ins and view monthly reports</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Check In / Out Action Card */}
                <div className="glass rounded-2xl p-8 border border-[var(--glass-border)] text-center relative overflow-hidden group lg:col-span-1 flex flex-col justify-center">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-[var(--accent)] opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                    
                    <h2 className="text-gray-400 font-medium mb-2">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
                    <div className="text-5xl font-bold text-[var(--text-color)] tracking-tight mb-8 font-mono">
                        {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>

                    <div className="space-y-4">
                        {!hasCheckedIn ? (
                            <button
                                onClick={handleCheckIn}
                                disabled={isUpdating}
                                className="w-full bg-[var(--accent)] text-black font-bold py-4 rounded-xl hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-50"
                            >
                                {isUpdating ? <Loader size={24} className="animate-spin" /> : <Clock size={24} />}
                                Check In
                            </button>
                        ) : !hasCheckedOut ? (
                            <button
                                onClick={handleCheckOut}
                                disabled={isUpdating}
                                className="w-full bg-red-500/20 text-red-400 border border-red-500/50 font-bold py-4 rounded-xl hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-50"
                            >
                                {isUpdating ? <Loader size={24} className="animate-spin" /> : <Clock size={24} />}
                                Check Out
                            </button>
                        ) : (
                            <div className="w-full bg-green-500/10 border border-green-500/30 text-green-400 font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-lg">
                                <CheckCircle size={24} />
                                Shift Completed
                            </div>
                        )}
                    </div>

                    {hasCheckedIn && (
                        <div className="mt-6 flex justify-between text-sm border-t border-[var(--glass-border)] pt-4">
                            <div className="text-left">
                                <p className="text-gray-500">Check In</p>
                                <p className="text-white font-medium">{todayRecord.check_in_time}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-500">Check Out</p>
                                <p className="text-white font-medium">{todayRecord.check_out_time || '--:--'}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Statistics Grid */}
                <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                    <StatsCard 
                        title="Days Present" 
                        value={stats?.present || 0} 
                        icon={CheckCircle} 
                        colorClass="bg-green-500/10 text-green-400 border border-green-500/30" 
                    />
                    <StatsCard 
                        title="Late Arrivals" 
                        value={stats?.late || 0} 
                        icon={AlertCircle} 
                        colorClass="bg-yellow-500/10 text-yellow-400 border border-yellow-500/30" 
                    />
                    <StatsCard 
                        title="Total Hours" 
                        value={stats?.totalHours || 0} 
                        icon={TrendingUp} 
                        colorClass="bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30" 
                    />
                    <StatsCard 
                        title="Days Absent" 
                        value={stats?.absent || 0} 
                        icon={XCircle} 
                        colorClass="bg-red-500/10 text-red-400 border border-red-500/30" 
                    />
                </div>

            </div>

            {/* Attendance History */}
            <div className="glass rounded-2xl border border-[var(--glass-border)] overflow-hidden">
                <div className="p-6 border-b border-[var(--glass-border)] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[var(--text-color)] flex items-center gap-2">
                        <CalendarIcon size={20} className="text-[var(--accent)]" />
                        Monthly Report ({new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--glass-bg)] border-b border-[var(--glass-border)] text-gray-400 text-sm uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Check In</th>
                                <th className="px-6 py-4 font-semibold">Check Out</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--glass-border)]">
                            {history && history.length > 0 ? (
                                history.map((record) => {
                                    const date = new Date(record.date);
                                    let statusColor = 'text-green-400 bg-green-500/10 border-green-500/30';
                                    if (record.status === 'late') statusColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
                                    if (record.status === 'absent') statusColor = 'text-red-400 bg-red-500/10 border-red-500/30';
                                    if (record.status === 'half_day') statusColor = 'text-orange-400 bg-orange-500/10 border-orange-500/30';

                                    return (
                                        <tr key={record._id} className="hover:bg-[var(--glass-bg)] transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="font-medium text-white">{date.toLocaleDateString()}</p>
                                                <p className="text-xs text-gray-500">{date.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                                            </td>
                                            <td className="px-6 py-4 text-gray-300">
                                                {record.check_in_time || '--:--'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-300">
                                                {record.check_out_time || '--:--'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${statusColor}`}>
                                                    {record.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                        <CalendarIcon size={48} className="mx-auto mb-3 opacity-50" />
                                        <p>No attendance records found for this month.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Attendance;
