import React from 'react';
import { 
    Store, 
    CalendarCheck, 
    Clock, 
    CheckCircle, 
    DollarSign,
    MoreHorizontal
} from 'lucide-react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';

// Dummy data for charts
const revenueData = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 5500 },
  { name: 'Mar', revenue: 3200 },
  { name: 'Apr', revenue: 7800 },
  { name: 'May', revenue: 6400 },
  { name: 'Jun', revenue: 9200 },
  { name: 'Jul', revenue: 11500 },
];

const StatCard = ({ title, value, icon: Icon, trend, trendUp }) => (
    <div className="glass p-6 rounded-2xl border border-[var(--glass-border)] relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--accent)] opacity-[0.05] rounded-full group-hover:scale-150 transition-transform duration-500"></div>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-[var(--text-h)]">{value}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--accent)]">
                <Icon size={24} />
            </div>
        </div>
        {trend && (
            <div className="mt-4 flex items-center text-sm">
                <span className={trendUp ? 'text-green-400' : 'text-red-400'}>
                    {trend}
                </span>
                <span className="text-gray-500 ml-2">vs last month</span>
            </div>
        )}
    </div>
);

const SuperAdminDashboard = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-h)]">Overview</h1>
                    <p className="text-gray-400 text-sm mt-1">Here's what's happening today.</p>
                </div>
                <button className="px-4 py-2 bg-[var(--accent)] text-black font-semibold rounded-lg hover:bg-opacity-90 transition-colors">
                    Download Report
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <StatCard title="Total Showrooms" value="24" icon={Store} trend="+12%" trendUp={true} />
                <StatCard title="Total Bookings" value="1,284" icon={CalendarCheck} trend="+8%" trendUp={true} />
                <StatCard title="Pending" value="42" icon={Clock} trend="-5%" trendUp={false} />
                <StatCard title="Completed" value="892" icon={CheckCircle} trend="+18%" trendUp={true} />
                <StatCard title="Revenue" value="$42.5k" icon={DollarSign} trend="+22%" trendUp={true} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Chart Section */}
                <div className="lg:col-span-2 glass p-6 rounded-2xl border border-[var(--glass-border)]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-[var(--text-h)]">Revenue Overview</h3>
                        <select className="bg-[var(--glass-bg)] border border-[var(--glass-border)] text-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none">
                            <option>This Year</option>
                            <option>Last 6 Months</option>
                        </select>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#111827', borderColor: 'var(--glass-border)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--accent)' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="glass p-6 rounded-2xl border border-[var(--glass-border)]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-[var(--text-h)]">Recent Activity</h3>
                        <button className="text-gray-400 hover:text-white"><MoreHorizontal size={20}/></button>
                    </div>
                    
                    <div className="space-y-6">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center shrink-0">
                                    <Store size={16} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[var(--text-h)]">Elite Motors created a booking</p>
                                    <p className="text-xs text-gray-500 mt-1">2 hours ago • Package: Premium Cinematic</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <button className="w-full mt-6 py-2 border border-[var(--glass-border)] rounded-lg text-sm text-gray-400 hover:text-white hover:bg-[var(--glass-bg)] transition-colors">
                        View All Activity
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
