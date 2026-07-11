import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getRoleDashboard } from './ProtectedRoute';

const PublicOnlyRoute = ({ children }) => {
    const { user } = useContext(AuthContext);

    if (user) {
        return <Navigate to={getRoleDashboard(user.role)} replace />;
    }

    return children;
};

export default PublicOnlyRoute;
