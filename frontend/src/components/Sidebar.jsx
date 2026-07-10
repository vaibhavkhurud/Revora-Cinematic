import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Store, 
  CalendarCheck, 
  Video, 
  Package, 
  LineChart, 
  Bell, 
  Settings,
  LogOut,
  PlusCircle,
  History,
  CreditCard,
  Download,
  UserCircle,
  X,
  Clock,
  DollarSign
} from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const navByRole = {
    super_admin: [
        { name: 'Dashboard',     path: '/admin/dashboard',       icon: LayoutDashboard },
        { name: 'Showrooms',     path: '/admin/showrooms',       icon: Store },
        { name: 'Bookings',      path: '/admin/bookings',        icon: CalendarCheck },
        { name: 'Videographers', path: '/admin/videographers',   icon: Video },
        { name: 'Packages',      path: '/admin/packages',        icon: Package },
        { name: 'Analytics',     path: '/admin/analytics',       icon: LineChart },
        { name: 'Earnings',      path: '/admin/earnings',        icon: DollarSign },
        { name: 'Notifications', path: '/notifications',   icon: Bell },
        { name: 'Settings',      path: '/admin/settings',        icon: Settings },
    ],
    showroom_owner: [
        { name: 'Dashboard',       path: '/showroom/dashboard',       icon: LayoutDashboard },
        { name: 'New Booking',     path: '/showroom/new-booking',     icon: PlusCircle },
        { name: 'Booking History', path: '/showroom/booking-history', icon: History },
        { name: 'Payments',        path: '/showroom/payments',        icon: CreditCard },
        { name: 'Downloads',       path: '/showroom/downloads',       icon: Download },
        { name: 'Profile',         path: '/showroom/profile',         icon: UserCircle },
    ],
    videographer: [
        { name: 'Dashboard', path: '/videographer/dashboard', icon: LayoutDashboard },
        { name: 'Attendance', path: '/videographer/attendance', icon: Clock },
        { name: 'Earnings',  path: '/videographer/earnings',  icon: DollarSign },
        { name: 'Shoots',    path: '/videographer/shoots',    icon: Video },
        { name: 'Profile',   path: '/videographer/profile',   icon: UserCircle },
    ],
};

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
    const { logout, user } = useContext(AuthContext);
    const navItems = navByRole[user?.role] || [];

    const sidebarClasses = `w-64 h-screen flex flex-col glass border-r border-[var(--glass-border)] z-40 transition-transform duration-300
        fixed md:sticky top-0 left-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`;

    return (
        <>
            {isOpen && <button aria-label="Close sidebar overlay" onClick={onClose} className="fixed inset-0 bg-black/60 z-30 md:hidden" />}
            <aside className={sidebarClasses}>
                <div className="p-6 border-b border-[var(--glass-border)] flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--accent)] tracking-tight">REVORA</h2>
                        <p className="text-xs text-gray-400 tracking-widest uppercase mt-1">Cinematic</p>
                    </div>
                    <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                
                <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                end={item.path.endsWith('/dashboard')}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                        isActive 
                                        ? 'bg-[var(--accent)] text-black font-medium shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
                                        : 'text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                                    }`
                                }
                            >
                                <Icon size={20} />
                                <span>{item.name}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-[var(--glass-border)]">
                    <button 
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
