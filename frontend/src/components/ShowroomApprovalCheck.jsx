import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader } from 'lucide-react';
import api from '../services/api';
import { useToast } from './Toast';

const ShowroomApprovalCheck = () => {
    const { toast } = useToast();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [redirect, setRedirect] = useState(false);

    useEffect(() => {
        const checkApproval = async () => {
            try {
                // Reuse dashboard endpoint since it returns showroom object
                const res = await api.get('/showroom-owner/dashboard');
                setStatus(res.data.showroom.status);
            } catch (error) {
                console.error('Failed to fetch showroom profile:', error);
                setStatus('error');
            } finally {
                setLoading(false);
            }
        };

        checkApproval();
    }, []);

    useEffect(() => {
        if (!loading && status !== 'approved') {
            toast('Your showroom must be approved to access this feature.', 'warning');
            setRedirect(true);
        }
    }, [loading, status, toast]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
                <Loader size={48} className="animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    if (redirect) {
        return <Navigate to="/showroom/dashboard" replace />;
    }

    return <Outlet />;
};

export default ShowroomApprovalCheck;
