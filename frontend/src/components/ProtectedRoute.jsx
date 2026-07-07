import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Redirects to login if not authenticated
// Redirects to correct dashboard if role doesn't match
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user } = useContext(AuthContext);
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to correct dashboard based on their actual role
        return <Navigate to={getRoleDashboard(user.role)} replace />;
    }

    return children;
};

export const getRoleDashboard = (role) => {
    switch (role) {
        case 'super_admin': return '/admin/dashboard';
        case 'showroom_owner': return '/showroom/dashboard';
        case 'videographer': return '/videographer/dashboard';
        default: return '/login';
    }
};

export default ProtectedRoute;
