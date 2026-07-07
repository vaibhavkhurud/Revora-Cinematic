import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Login = () => {
    const { login } = useContext(AuthContext);
    
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(formData.email, formData.password);
            // AuthContext handles redirect based on role
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--glass-border)]">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-[var(--text-color)] mb-2">Revora Cinematic</h1>
                <p className="text-sm text-gray-400">Welcome back! Please login to your account.</p>
            </div>

            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-sm rounded-lg text-center">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--text-color)]">Email</label>
                    <input 
                        type="email" 
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--accent)] transition-colors"
                        placeholder="Enter your email"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--text-color)]">Password</label>
                    <input 
                        type="password" 
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--accent)] transition-colors"
                        placeholder="Enter your password"
                    />
                </div>
                
                <div className="flex justify-end">
                    <Link to="/forgot-password" className="text-sm text-[var(--accent)] hover:underline">Forgot password?</Link>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3 bg-[var(--accent)] text-black font-semibold rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                    {loading ? 'Logging in...' : 'Log In'}
                </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-400">
                Don't have a showroom account? <Link to="/register" className="text-[var(--accent)] hover:underline">Register here</Link>
            </div>
        </div>
    );
};

export default Login;
