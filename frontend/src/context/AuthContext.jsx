import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getRoleDashboard } from '../components/ProtectedRoute';
import { useToast } from '../components/Toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!user || !token) return;

        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const sseUrl = `${API_BASE_URL.replace(/\/$/, '')}/auth/session-stream?token=${encodeURIComponent(token)}`;
        
        let eventSource;
        try {
            eventSource = new EventSource(sseUrl, { withCredentials: true });
            
            eventSource.addEventListener('logout', (event) => {
                let data = {};
                try {
                    data = JSON.parse(event.data);
                } catch (e) {
                    console.error('Failed to parse SSE data', e);
                }
                
                toast(data.message || 'Logged out because you logged in from another device', 'error');
                
                // Clear local storage and state
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
                
                // Redirect immediately
                window.location.href = '/login?reason=session_invalidated';
            });

            eventSource.onerror = (err) => {
                console.error('SSE connection error:', err);
            };
        } catch (err) {
            console.error('Failed to create EventSource:', err);
        }

        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [user]);

    useEffect(() => {
        if (!user) return;

        const checkSession = async () => {
            try {
                await api.get('/auth/check-session');
            } catch (err) {
                console.error('Periodic session validation failed:', err);
            }
        };

        // Check every 10 seconds
        const interval = setInterval(checkSession, 10000);

        // Run once on mount or login
        checkSession();

        return () => {
            clearInterval(interval);
        };
    }, [user]);

    const login = async (email, password) => {
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data));
            setUser(res.data);
            toast('Logged in successfully', 'success');
            navigate(getRoleDashboard(res.data.role));
            return res.data;
        } catch (error) {
            toast(error.response?.data?.message || 'Login failed', 'error');
            throw error;
        }
    };

    const registerShowroom = async (userData) => {
        try {
            const res = await api.post('/auth/register', userData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data));
            setUser(res.data);
            toast('Registered successfully', 'success');
            navigate(getRoleDashboard(res.data.role));
            return res.data;
        } catch (error) {
            toast(error.response?.data?.message || 'Registration failed', 'error');
            throw error;
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
            toast('Logged out successfully', 'success');
        } catch (error) {
            console.error('Logout failed', error);
            toast('Logout failed', 'warning');
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            window.location.href = '/';
        }
    };

    const updateUser = (updatedUser) => {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const newUser = { ...storedUser, ...updatedUser };
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
    };

    return (
        <AuthContext.Provider value={{ user, login, registerShowroom, logout, loading, updateUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
