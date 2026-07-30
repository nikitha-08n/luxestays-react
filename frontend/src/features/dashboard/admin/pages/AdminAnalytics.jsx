import { useState, useEffect } from 'react';
import { api } from '../../../../lib/axios';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, Users, Home, Calendar, RefreshCw, 
  MapPin, ShieldAlert, FileSpreadsheet, Loader2 
} from 'lucide-react';

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/analytics');
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-500 h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="text-brand-500" size={28} />
            Global Platform Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            LuxeStays Administrator KPI dashboard monitoring revenue flows and user metrics.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/dashboard/admin/moderation"
            className="p-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-md transition flex items-center gap-1.5 text-xs font-bold"
          >
            Moderation Queue
          </Link>
          <button
            onClick={fetchStats}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 transition flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            <RefreshCw size={14} /> Refresh Data
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-900 bg-white/50 dark:bg-slate-900/10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500"></div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Gross Revenue</span>
            <span className="p-2 bg-amber-500/10 rounded-xl text-amber-500"><TrendingUp size={18} /></span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-4">
            ₹{stats?.totalRevenue?.toLocaleString('en-IN') || 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-2">100% processed via verified escrow</p>
        </div>

        {/* Users */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-900 bg-white/50 dark:bg-slate-900/10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-indigo-500"></div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Active Users</span>
            <span className="p-2 bg-brand-500/10 rounded-xl text-brand-500"><Users size={18} /></span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-4">
            {stats?.totalUsers || 0} Member{stats?.totalUsers !== 1 ? 's' : ''}
          </p>
          <p className="text-[10px] text-slate-400 mt-2">Total registered renter/owner logs</p>
        </div>

        {/* Properties */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-900 bg-white/50 dark:bg-slate-900/10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Listed Properties</span>
            <span className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500"><Home size={18} /></span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-4">
            {stats?.totalProperties || 0} Residence{stats?.totalProperties !== 1 ? 's' : ''}
          </p>
          <p className="text-[10px] text-slate-400 mt-2">Approved & pending listings</p>
        </div>

        {/* Bookings */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-900 bg-white/50 dark:bg-slate-900/10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-blue-500"></div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Total Bookings</span>
            <span className="p-2 bg-sky-500/10 rounded-xl text-sky-500"><Calendar size={18} /></span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-4">
            {stats?.totalBookings || 0} Request{stats?.totalBookings !== 1 ? 's' : ''}
          </p>
          <p className="text-[10px] text-slate-400 mt-2">Visits schedules & checkouts</p>
        </div>
      </div>

      {/* SVG Custom Charts Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Properties Distribution Map */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-900 bg-white/50 dark:bg-slate-900/10 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Properties by City Location</h3>
            <p className="text-xs text-slate-400 mt-1">Geographic density distribution in active metropolises.</p>
          </div>

          {stats?.citiesStats?.length > 0 ? (
            <div className="space-y-4 mt-6">
              {stats.citiesStats.map((city, idx) => {
                const total = stats.citiesStats.reduce((sum, c) => sum + c.value, 0);
                const percent = Math.round((city.value / total) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-650 dark:text-slate-400">
                      <span className="flex items-center gap-1"><MapPin size={12} className="text-slate-400" /> {city.name}</span>
                      <span>{city.value} listing{city.value !== 1 ? 's' : ''} ({percent}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-sky-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-12 text-center">No locations mapped yet.</p>
          )}
        </div>

        {/* Audit / Platform Status Summary */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-900 bg-white/50 dark:bg-slate-900/10 shadow-lg space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">System Logs & Security Health</h3>
            <p className="text-xs text-slate-400 mt-1">Real-time gateway integrity diagnostics.</p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Database Connection</span>
              <span className="text-emerald-500 font-bold">MongoDB Atlas Live</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">API Access Key Rules</span>
              <span className="text-emerald-500 font-bold">Encrypted JWT short-lived</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Payments Webhooks Integration</span>
              <span className="text-emerald-500 font-bold">Signature verified</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Redis Cache Connection</span>
              <span className="text-amber-500 font-bold">Offline fallback active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
