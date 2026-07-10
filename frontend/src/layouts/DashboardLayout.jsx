import React, { useContext, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';
import { AuthContext } from '../context/AuthContext';
import { Menu, User } from 'lucide-react';

const DashboardLayout = () => {
    const { user } = useContext(AuthContext);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-[var(--bg-color)] overflow-hidden">
            {/* Sidebar (Desktop) */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Background glow effects for the main content area */}
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--accent)] opacity-[0.03] rounded-full blur-[120px] pointer-events-none"></div>
                
                {/* Header */}
                <header className="h-20 glass border-b border-[var(--glass-border)] flex items-center justify-between px-6 z-40 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden text-[var(--text-color)] hover:text-[var(--accent)]">
                            <Menu size={24} />
                        </button>
                        <h2 className="text-xl font-semibold text-[var(--text-h)] hidden sm:block">
                            Welcome back, {user.name.split(' ')[0]}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-[var(--text-color)]">{user.name}</p>
                                <p className="text-xs text-[var(--accent)] capitalize">{user.role.replace('_', ' ')}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[var(--glass-bg)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent)]">
                                <User size={20} />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Scrollable Area */}
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
