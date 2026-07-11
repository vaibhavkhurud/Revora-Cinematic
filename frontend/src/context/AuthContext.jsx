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
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, registerShowroom, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
