import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { usePropertiesQuery } from '../../features/property/hooks/useProperty';
import { 
  ShieldCheck, Server, Cpu, Database, CheckCircle2, ChevronRight,
  BedDouble, Bath, Maximize, MapPin, Building, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { getImageUrl } from '../../utils/getImageUrl';

export default function Home() {
  const { isAuthenticated, user } = useAuthStore();
  // Query backend health to prove E2E connectivity
  const { data: health, isLoading: isHealthLoading, error: healthError } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: async () => {
      const response = await api.get('/health');
      return response.data;
    },
    refetchInterval: 10000,
  });

  // Query live approved properties list
  const { data: propertiesResponse, isLoading: isPropertiesLoading } = usePropertiesQuery({ limit: 3 });
  const properties = propertiesResponse?.success ? propertiesResponse.data : [];

  // Query personalized recommendations
  const { data: recsResponse, isLoading: isRecsLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const response = await api.get('/recommendations');
      return response.success ? response.data : [];
    },
  });
  const recommendations = recsResponse || [];

  return (
    <div className="relative flex flex-col items-center w-full space-y-16 pb-16">
      {/* Hero Section */}
      <section className="w-full text-center py-16 md:py-24 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto px-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-6">
            <ShieldCheck size={14} /> MERN Production Stack Verified
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            Discover the Art of <br />
            <span className="gold-gradient-text font-black">Luxury Living</span>
          </h1>

          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Experience premium curated house rentals with real-time availability, fully verified properties, and seamless secure payments.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/properties"
              className="group flex items-center gap-2 bg-gradient-to-r from-brand-500 to-sky-600 hover:from-brand-600 hover:to-sky-700 text-white font-bold py-3.5 px-8 rounded-xl transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-500/20"
            >
              Browse Properties
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            {isAuthenticated ? (
              <Link
                to={`/dashboard/${user?.role?.toLowerCase() || 'renter'}`}
                className="bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold py-3.5 px-8 rounded-xl transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto text-center"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/register"
                className="bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold py-3.5 px-8 rounded-xl transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto text-center"
              >
                Register Account
              </Link>
            )}
          </div>
        </motion.div>
      </section>

      {/* Featured Properties Section */}
      <section className="w-full max-w-6xl mx-auto px-4 space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-extrabold flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Sparkles className="text-brand-500 animate-pulse" size={22} />
              Featured Residences
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Handpicked premium properties verified by LuxeStays administrators
            </p>
          </div>
          <Link to="/properties" className="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1">
            View All <ChevronRight size={14} />
          </Link>
        </div>

        {isPropertiesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-80 bg-slate-100/50 dark:bg-slate-900/40 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-3xl border border-slate-200 dark:border-slate-900 max-w-md mx-auto">
            <Building className="mx-auto h-10 w-10 text-slate-400 mb-3" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-350">No properties listed yet</p>
            <p className="text-xs text-slate-450 dark:text-slate-500 mt-1">Check back later or register as an Owner to list one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Link
                to={`/properties/${property._id}`}
                key={property._id}
                className="glass-panel rounded-3xl border border-slate-200/60 dark:border-slate-900 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between group"
              >
                <div className="aspect-video w-full overflow-hidden relative bg-slate-950">
                  <img
                    src={getImageUrl(property.images?.[0]?.url)}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute bottom-3 left-3 bg-slate-950/70 backdrop-blur-md text-white text-xs font-bold py-1 px-3 rounded-full">
                    {property.propertyType}
                  </span>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-brand-500 transition-colors">
                      {property.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-455 flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-slate-400" />
                      {property.city}, {property.state}
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-slate-900 pt-4">
                    <div className="flex gap-3 text-slate-650 dark:text-slate-400 font-semibold">
                      <span className="flex items-center gap-1"><BedDouble size={14} /> {property.bedrooms} Bed</span>
                      <span className="flex items-center gap-1"><Bath size={14} /> {property.bathrooms} Bath</span>
                    </div>
                    <span className="text-lg font-extrabold gold-gradient-text">
                      ₹{property.price.toLocaleString('en-IN')}/mo
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recommended for You Section */}
      {recommendations.length > 0 && (
        <section className="w-full max-w-6xl mx-auto px-4 space-y-8">
          <div>
            <h2 className="text-2xl font-extrabold flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Building className="text-brand-500" size={22} />
              Recommended for You
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Top luxury residences picked based on your interest profile and high ratings
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((property) => (
              <Link
                to={`/properties/${property._id}`}
                key={property._id}
                className="glass-panel rounded-3xl border border-slate-200/60 dark:border-slate-900 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between group"
              >
                <div className="aspect-video w-full overflow-hidden relative bg-slate-950">
                  <img
                    src={getImageUrl(property.images?.[0]?.url)}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute bottom-3 left-3 bg-slate-950/70 backdrop-blur-md text-white text-[10px] font-bold py-1 px-2.5 rounded-full">
                    {property.propertyType}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-brand-500 transition-colors">
                      {property.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="text-slate-400" />
                      {property.city}
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] border-t border-slate-100 dark:border-slate-900 pt-3">
                    <span className="font-semibold text-slate-500">{property.bedrooms} Bed • {property.bathrooms} Bath</span>
                    <span className="font-black text-brand-500">₹{property.price.toLocaleString('en-IN')}/mo</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Live Integration Diagnostics */}
      <section className="w-full max-w-4xl mx-auto px-4 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="glass-panel p-8 rounded-3xl border border-slate-200 dark:border-slate-900/60 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100 dark:border-slate-900">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Server className="text-brand-400" size={20} />
                Live Integration Diagnostics
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Real-time API requests validating database and caching layers connectivity
              </p>
            </div>
            
            {isHealthLoading ? (
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-900 text-slate-550 dark:text-slate-400 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-400 animate-pulse"></span> Connecting...
              </span>
            ) : healthError ? (
              <span className="px-3 py-1 bg-rose-500/10 text-rose-455 text-xs font-semibold rounded-full border border-rose-500/20 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span> Offline
              </span>
            ) : (
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span> Live & Healthy
              </span>
            )}
          </div>

          {isHealthLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-24 bg-slate-100/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-900 rounded-2xl"></div>
              ))}
            </div>
          ) : healthError ? (
            <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-center">
              <p className="text-sm font-semibold text-rose-400 mb-2">Backend Connection Failed</p>
              <p className="text-xs text-slate-550">
                Verify the Express server is running on port 5000 and MongoDB/Redis connections are active.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-5 bg-slate-50/50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-900 rounded-2xl flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  API Gateway
                </span>
                <div>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-3">{health?.uptime}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-655 mt-1">Environment: {health?.environment}</p>
                </div>
              </div>

              <div className="p-5 bg-slate-50/50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-900 rounded-2xl flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Database size={12} className="text-emerald-500" />
                  MongoDB Atlas
                </span>
                <div>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-3 capitalize">{health?.database?.status}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-650 mt-1">Database: {health?.database?.name}</p>
                </div>
              </div>

              <div className="p-5 bg-slate-50/50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-900 rounded-2xl flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu size={12} className={health?.redis?.status === 'connected' ? 'text-emerald-500' : 'text-slate-600'} />
                  Redis In-Memory
                </span>
                <div>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-3 capitalize">{health?.redis?.status}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-650 mt-1">Speed: Direct Cache Access</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </section>
    </div>
  );
}
