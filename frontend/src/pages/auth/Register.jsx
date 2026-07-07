import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Register = () => {
    const { registerShowroom } = useContext(AuthContext);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        showroomName: '',
        contactNumber: '',
        address: ''
    });
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
            await registerShowroom(formData);
            // AuthContext handles redirect based on role
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--glass-border)] my-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-[var(--text-color)] mb-2">Register Showroom</h1>
                <p className="text-sm text-gray-400">Join Revora Cinematic and manage your bookings.</p>
            </div>

            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-sm rounded-lg text-center">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-[var(--text-color)]">Full Name</label>
                        <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--accent)] transition-colors" placeholder="Owner Name" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-[var(--text-color)]">Email</label>
                        <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--accent)] transition-colors" placeholder="Email Address" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--text-color)]">Password</label>
                    <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full px-4 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--accent)] transition-colors" placeholder="Create a password" />
                </div>

                <div className="border-t border-[var(--glass-border)] my-4 pt-4">
                    <h3 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wider">Showroom Details</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-[var(--text-color)]">Showroom Name</label>
                            <input type="text" name="showroomName" required value={formData.showroomName} onChange={handleChange} className="w-full px-4 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--accent)] transition-colors" placeholder="e.g. Revora Elite Motors" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-[var(--text-color)]">Contact Number</label>
                            <input type="text" name="contactNumber" required value={formData.contactNumber} onChange={handleChange} className="w-full px-4 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--accent)] transition-colors" placeholder="Phone Number" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-[var(--text-color)]">Address</label>
                            <input type="text" name="address" required value={formData.address} onChange={handleChange} className="w-full px-4 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--accent)] transition-colors" placeholder="Full Address" />
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="w-full py-3 mt-4 bg-[var(--accent)] text-black font-semibold rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50">
                    {loading ? 'Registering...' : 'Complete Registration'}
                </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-400">
                Already have an account? <Link to="/login" className="text-[var(--accent)] hover:underline">Log in</Link>
            </div>
        </div>
    );
};

export default Register;
