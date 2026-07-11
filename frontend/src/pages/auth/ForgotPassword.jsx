import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../components/Toast';

const ForgotPassword = () => {
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);
        try {
            const res = await api.post('/auth/forgot-password', { email });
            setMessage(res.data.message);
            toast(res.data.message || 'Reset link sent successfully', 'success');
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to send reset link';
            setError(errorMsg);
            toast(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--glass-border)]">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-[var(--text-color)] mb-2">Reset Password</h1>
                <p className="text-sm text-gray-400">Enter your email to receive a reset link.</p>
            </div>

            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-sm rounded-lg text-center">{error}</div>}
            {message && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 text-green-500 text-sm rounded-lg text-center">{message}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--text-color)]">Email</label>
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--accent)] transition-colors"
                        placeholder="Enter your email"
                    />
                </div>
                
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3 bg-[var(--accent)] text-black font-semibold rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-400">
                Remember your password? <Link to="/login" className="text-[var(--accent)] hover:underline">Log in</Link>
            </div>
        </div>
    );
};

export default ForgotPassword;
