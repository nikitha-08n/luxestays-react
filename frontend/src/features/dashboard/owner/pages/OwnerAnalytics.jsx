import { useState, useEffect } from 'react';
import { api } from '../../../../lib/axios';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Home, Calendar, Users, RefreshCw, 
  MapPin, CheckSquare, Clock, XSquare, Loader2,
  ExternalLink, ShieldCheck, PlusCircle, BedDouble, Bath, Building
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OwnerAnalytics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [externalListings, setExternalListings] = useState([]);
  const [loadingExternal, setLoadingExternal] = useState(false);
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/owner/analytics');
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExternalListings = async () => {
    setLoadingExternal(true);
    try {
      const res = await fetch('/api/v1/external-listings');
      const data = await res.json();
      if (data.success) {
        setExternalListings(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExternal(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchExternalListings();
  }, []);

  const filteredListings = externalListings.filter(item => {
    const matchCity = selectedCity === 'All' || item.city.toLowerCase() === selectedCity.toLowerCase();
    const matchType = selectedType === 'All' || item.propertyType.toLowerCase() === selectedType.toLowerCase();
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCity && matchType && matchSearch;
  });

  const uniqueCities = ['All', ...new Set(externalListings.map(item => item.city))].sort((a, b) => {
    if (a === 'All') return -1;
    if (b === 'All') return 1;
    return a.localeCompare(b);
  });

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-500 h-10 w-10" />
      </div>
    );
  }

  const statusStats = stats?.statusStats || { PENDING: 0, APPROVED: 0, PAID: 0, CANCELLED: 0 };
  const totalBookings = stats?.totalVisits || 0;

  const getPercent = (value) => {
    if (totalBookings === 0) return 0;
    return Math.round((value / totalBookings) * 100);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Home className="text-brand-500" size={28} />
            Landlord Portfolio Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Monitor occupancy counts, schedules approvals, and payments records.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/properties/new"
            className="p-2.5 bg-gradient-to-r from-brand-500 to-sky-600 hover:from-brand-600 hover:to-sky-700 text-white rounded-xl shadow-md transition flex items-center gap-1.5 text-xs font-bold"
          >
            List New Property
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Earnings */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-900 bg-white/50 dark:bg-slate-900/10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Deposits Paid</span>
            <span className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500"><TrendingUp size={18} /></span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-4">
            ₹{stats?.totalRevenue?.toLocaleString('en-IN') || 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-2">Secured funds confirmed in escrow</p>
        </div>

        {/* Owned properties */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-900 bg-white/50 dark:bg-slate-900/10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-sky-500"></div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">My Listings</span>
            <span className="p-2 bg-brand-500/10 rounded-xl text-brand-500"><Home size={18} /></span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-4">
            {stats?.totalProperties || 0} Property{stats?.totalProperties !== 1 ? 'ies' : ''}
          </p>
          <p className="text-[10px] text-slate-400 mt-2">Total properties under management</p>
        </div>

        {/* Visit requests */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-900 bg-white/50 dark:bg-slate-900/10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500"></div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Incoming Visits</span>
            <span className="p-2 bg-amber-500/10 rounded-xl text-amber-500"><Calendar size={18} /></span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-4">
            {stats?.totalVisits || 0} Request{stats?.totalVisits !== 1 ? 's' : ''}
          </p>
          <p className="text-[10px] text-slate-400 mt-2">Schedules pending or confirmed</p>
        </div>
      </div>

      {/* Booking Ratios progress graph */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-900 bg-white/50 dark:bg-slate-900/10 shadow-lg space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Visit Status Ratios</h3>
          <p className="text-xs text-slate-400 mt-1">Approval and checkout progress of visit schedules.</p>
        </div>

        {totalBookings > 0 ? (
          <div className="space-y-4">
            {/* PAID (Escrow Confirmed) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-650 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><CheckSquare size={12} className="text-emerald-500" /> Deposits Paid</span>
                <span>{statusStats.PAID} ({getPercent(statusStats.PAID)}%)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-550 rounded-full"
                  style={{ width: `${getPercent(statusStats.PAID)}%` }}
                ></div>
              </div>
            </div>

            {/* PENDING APPROVAL */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-650 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><Clock size={12} className="text-amber-500" /> Pending Review</span>
                <span>{statusStats.PENDING} ({getPercent(statusStats.PENDING)}%)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${getPercent(statusStats.PENDING)}%` }}
                ></div>
              </div>
            </div>

            {/* APPROVED (Unpaid) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-650 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><Calendar size={12} className="text-sky-500" /> Approved (Awaiting Payment)</span>
                <span>{statusStats.APPROVED} ({getPercent(statusStats.APPROVED)}%)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-550 rounded-full"
                  style={{ width: `${getPercent(statusStats.APPROVED)}%` }}
                ></div>
              </div>
            </div>

            {/* DECLINED / CANCELLED */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-650 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><XSquare size={12} className="text-rose-500" /> Declined or Cancelled</span>
                <span>{statusStats.CANCELLED + statusStats.REJECTED} ({getPercent(statusStats.CANCELLED + statusStats.REJECTED)}%)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{ width: `${getPercent(statusStats.CANCELLED + statusStats.REJECTED)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-450 py-12 text-center">No visits registered on your listings yet.</p>
        )}
      </div>
    </div>
  );
}
