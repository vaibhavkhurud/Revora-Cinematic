import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import SuperAdminDashboard from './pages/dashboard/SuperAdminDashboard';
import Showrooms from './pages/admin/Showrooms';
import Packages from './pages/admin/Packages';
import ShowroomOwnerDashboard from './pages/showroom/ShowroomOwnerDashboard';

const PlaceholderPage = ({ title, description }) => (
  <div className="glass rounded-2xl border border-[var(--glass-border)] p-8 text-[var(--text-color)]">
    <h1 className="text-2xl font-bold text-[var(--text-h)]">{title}</h1>
    <p className="text-gray-400 mt-2">{description}</p>
  </div>
);

const VideographerDashboard = () => (
  <div className="p-8 text-[var(--text-color)]">
    <h1 className="text-2xl font-bold">Videographer Dashboard</h1>
    <p className="text-gray-400 mt-2">Coming soon...</p>
  </div>
);

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* Super Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<SuperAdminDashboard />} />
              <Route path="showrooms" element={<Showrooms />} />
              <Route path="packages" element={<Packages />} />
            </Route>

            {/* Showroom Owner Routes */}
            <Route
              path="/showroom"
              element={
                <ProtectedRoute allowedRoles={['showroom_owner']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ShowroomOwnerDashboard />} />
              <Route path="new-booking" element={<PlaceholderPage title="New Booking" description="Create booking workflow coming soon." />} />
              <Route path="booking-history" element={<PlaceholderPage title="Booking History" description="Review all past and current booking activity." />} />
              <Route path="payments" element={<PlaceholderPage title="Payments" description="Track pending and completed payments." />} />
              <Route path="downloads" element={<PlaceholderPage title="Downloads" description="Download delivered shoot files and invoices." />} />
              <Route path="profile" element={<PlaceholderPage title="Profile" description="Manage showroom profile and account details." />} />
            </Route>

            {/* Videographer Routes */}
            <Route
              path="/videographer"
              element={
                <ProtectedRoute allowedRoles={['videographer']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<VideographerDashboard />} />
            </Route>

            {/* Default */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
