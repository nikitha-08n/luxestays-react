import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePropertiesQuery } from '../../../property/hooks/useProperty';
import { useAuthStore } from '../../../../store/authStore';
import { getImageUrl } from '../../../../utils/getImageUrl';
import { api } from '../../../../lib/axios';
import toast from 'react-hot-toast';
import { 
  Building, MapPin, BedDouble, Bath, Sparkles, Coins, Gift, 
  ArrowRight, ShieldCheck, Heart, Home as HomeIcon, Code, X,
  ExternalLink, PlusCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function RenterDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data: propertiesResponse, isLoading } = usePropertiesQuery();
  const properties = propertiesResponse?.success ? propertiesResponse.data : [];
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [apiViewTab, setApiViewTab] = useState('visual');

  const [externalListings, setExternalListings] = useState([]);
  const [loadingExternal, setLoadingExternal] = useState(false);

  useEffect(() => {
    // Sync latest user profile details (such as updated loyalty points) from DB
    api.get('/auth/profile')
      .then(res => {
        if (res.success && res.data) {
          useAuthStore.getState().setUser(res.data);
        }
      })
      .catch(err => console.error('Failed to sync user profile:', err));

    setLoadingExternal(true);
    api.get('/external-listings')
      .then(res => {
        if (res.success) {
          setExternalListings(res.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingExternal(false));
  }, []);

  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);

  const mergedListings = [
    ...properties.map(p => ({
      id: p._id,
      title: p.title,
      address: p.address,
      city: p.city,
      price: p.price,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      propertyType: p.propertyType,
      contactNumber: p.contactNumber || p.ownerId?.email || 'N/A',
      description: p.description,
      imageUrl: getImageUrl(p.images?.[0]?.url) || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80',
      source: "Local Database",
      isLocal: true
    })),
    ...externalListings
  ];

  const filteredListings = mergedListings.filter(item => {
    const matchCity = selectedCity === 'All' || item.city.toLowerCase() === selectedCity.toLowerCase();
    const matchType = selectedType === 'All' || item.propertyType.toLowerCase() === selectedType.toLowerCase();
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCity && matchType && matchSearch;
  });

  const uniqueCities = ['All', ...new Set(mergedListings.map(item => item.city))].sort((a, b) => {
    if (a === 'All') return -1;
    if (b === 'All') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-10 py-4 max-w-7xl mx-auto">
      {/* Upper Greeting & Rewards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-8 rounded-3xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/10 flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-[60px] pointer-events-none"></div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Welcome back, <span className="gold-gradient-text">{user?.name || 'Renter'}</span>!
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed">
              Explore premium residences, schedule visits directly, save favorite homes to your wishlist, and chat in real-time with property owners.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-center mt-6 pt-6 border-t border-slate-150 dark:border-slate-900">
            <Link
              to="/properties"
              className="bg-gradient-to-r from-brand-500 to-sky-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              Launch Map Search <ArrowRight size={14} />
            </Link>
            <Link
              to="/wishlist"
              className="text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-bold text-xs flex items-center gap-1"
            >
              <Heart size={14} className="text-rose-500 fill-rose-500" /> Go to Wishlist
            </Link>
          </div>
        </div>

        {/* Loyalty Reward Points Card */}
        <div className="glass-panel p-8 rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-amber-500/0 to-transparent flex flex-col justify-between shadow-sm relative">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
              <Gift size={24} />
            </div>
            <span className="text-[10px] font-bold tracking-wider text-amber-500 uppercase bg-amber-500/10 px-3 py-1 rounded-full flex items-center gap-1">
              <Coins size={12} /> Points Active
            </span>
          </div>

          <div className="my-6">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Loyalty Balance</p>
            <p className="text-4xl font-black text-slate-800 dark:text-slate-100 mt-1 flex items-baseline gap-1">
              {user?.points || 0}
              <span className="text-sm font-semibold text-slate-500">Points</span>
            </p>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug border-t border-slate-200/50 dark:border-slate-800/80 pt-4">
            Earn **150 points** for online checkout transactions. Accumulated loyalty points can be redeemed as cash discounts on rent after **10 to 15 months** of active payments.
          </div>
        </div>
      </div>



      {/* Primary MLS Real Estate API Feed */}
      <div className="space-y-6">
        {/* Section Header & Search Filters */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-850 bg-white/50 dark:bg-slate-900/10 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ExternalLink className="text-brand-500 animate-pulse" size={24} />
                Available Rent Houses (Connected via MLS API Feed)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Displaying real-world houses fetched via the external endpoint: <code className="font-mono text-brand-500 dark:text-brand-400">GET /api/v1/external-listings</code>.
              </p>
            </div>

            {/* City Dropdown Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                <MapPin size={14} /> City:
              </span>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setVisibleCount(12);
                }}
                className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none transition"
              >
                {uniqueCities.map(city => (
                  <option key={city} value={city}>
                    {city === 'All' ? 'All Cities' : city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4 border-t border-slate-150 dark:border-slate-850/80">
            {/* Search Bar */}
            <div className="w-full sm:w-72 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedCity('All');
                  setVisibleCount(12);
                }}
                placeholder="Search by title, location or street..."
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-2 px-4 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 transition"
              />
            </div>

            {/* Property Type Sub-Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-850">
              <button
                onClick={() => { setSelectedType('All'); setVisibleCount(12); }}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                  selectedType === 'All'
                    ? 'bg-white dark:bg-slate-850 shadow-md text-brand-600 dark:text-brand-400 font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => { setSelectedType('HOUSE'); setVisibleCount(12); }}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                  selectedType === 'HOUSE'
                    ? 'bg-white dark:bg-slate-850 shadow-md text-brand-600 dark:text-brand-400 font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Houses
              </button>
              <button
                onClick={() => { setSelectedType('APARTMENT'); setVisibleCount(12); }}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                  selectedType === 'APARTMENT'
                    ? 'bg-white dark:bg-slate-850 shadow-md text-brand-600 dark:text-brand-400 font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Apartments
              </button>
              <button
                onClick={() => { setSelectedType('PG'); setVisibleCount(12); }}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                  selectedType === 'PG'
                    ? 'bg-white dark:bg-slate-850 shadow-md text-brand-600 dark:text-brand-400 font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                PGs & Co-Living
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
            <span>Showing {Math.min(filteredListings.length, visibleCount)} of {filteredListings.length} properties found</span>
            <span>External Source Feed</span>
          </div>
        </div>

        {/* Listings Grid */}
        {loadingExternal ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="h-72 bg-slate-100/50 dark:bg-slate-900/40 rounded-3xl"></div>
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900/10 border border-slate-200 dark:border-slate-850 rounded-3xl max-w-lg mx-auto">
            <Building className="mx-auto h-12 w-12 text-slate-400 mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-350">No API Properties Found</h3>
            <p className="text-sm text-slate-500 mt-1">Adjust search parameters or selected filters to find houses.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredListings.slice(0, visibleCount).map((listing) => (
                <div
                  key={listing.id}
                  className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden hover:shadow-md transition duration-200 group relative shadow-sm"
                >
                  {/* Thumbnail Image */}
                  <div className="aspect-video w-full overflow-hidden bg-slate-950 relative">
                    <img
                      src={listing.imageUrl}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                    />
                    {listing.isLocal ? (
                      <span className="absolute bottom-2.5 left-2.5 bg-gradient-to-r from-brand-500 to-sky-600 text-white text-[9px] font-bold py-0.5 px-2 rounded-full flex items-center gap-0.5">
                        <Sparkles size={8} className="text-amber-300 fill-amber-300" /> LuxeStays Listing
                      </span>
                    ) : (
                      <span className="absolute bottom-2.5 left-2.5 bg-sky-500/90 text-white text-[9px] font-bold py-0.5 px-2 rounded-full flex items-center gap-0.5">
                        <ShieldCheck size={8} /> External MLS
                      </span>
                    )}
                    <span className="absolute top-2.5 right-2.5 bg-slate-950/70 text-white text-[9px] font-bold py-0.5 px-2 rounded-full">
                      {listing.city}
                    </span>
                  </div>

                  {/* Body Details */}
                  <div className="p-4 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                        {listing.title}
                      </h4>
                      <p className="text-[9px] text-slate-550 flex items-center gap-0.5">
                        <MapPin size={9} /> {listing.address}
                      </p>
                      <p className="text-[10px] text-slate-400 line-clamp-2 pt-1.5 leading-relaxed">
                        {listing.description}
                      </p>
                      <p className="text-[9px] text-brand-600 dark:text-brand-400 font-extrabold flex items-center gap-0.5 pt-1">
                        📞 Owner: {listing.contactNumber}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] border-t border-slate-100 dark:border-slate-800 pt-2.5">
                        <span className="text-[9px] font-semibold text-slate-450">
                          {listing.bedrooms} BHK • {listing.propertyType}
                        </span>
                        <span className="font-extrabold text-brand-550 dark:text-brand-400 text-xs">
                          ₹{listing.price.toLocaleString('en-IN')}/mo
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-1">
                        {listing.isLocal ? (
                          <Link
                            to={`/properties/${listing.id}`}
                            className="w-full bg-gradient-to-r from-brand-500 to-sky-600 hover:from-brand-600 hover:to-sky-700 text-white font-bold py-2 rounded-xl text-[10px] flex items-center justify-center gap-1 transition shadow-sm"
                          >
                            <Building size={12} /> View Details & Book
                          </Link>
                        ) : (
                          user?.role === 'OWNER' || user?.role === 'ADMIN' ? (
                            <button
                              type="button"
                              onClick={() => {
                                navigate('/properties/new', { state: { externalProperty: listing } });
                                toast.success(`Importing listing: ${listing.title}`);
                              }}
                              className="w-full bg-slate-100 dark:bg-slate-950 hover:bg-brand-500 hover:text-white dark:hover:bg-brand-500 text-slate-650 dark:text-slate-350 border border-slate-200 dark:border-slate-850 font-bold py-2 rounded-xl text-[10px] flex items-center justify-center gap-1 transition"
                            >
                              <PlusCircle size={12} /> List this House on LuxeStays
                            </button>
                          ) : (
                            <div className="text-center py-2 text-[10px] font-bold text-slate-450 uppercase tracking-wider bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl">
                              🔌 API Listing (Unlisted)
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {visibleCount < filteredListings.length && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setVisibleCount(prev => prev + 12)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 px-8 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-850 transition shadow-sm"
                >
                  Load More Properties
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Raw JSON API Response Viewer Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl w-full max-w-5xl max-h-[85vh] shadow-2xl relative overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Code className="text-brand-500" size={20} />
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-200">Developer API Inspector</h3>
                  <p className="text-[10px] text-slate-500">GET http://localhost:5000/api/v1/properties</p>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex bg-slate-150 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-850">
                <button
                  onClick={() => setApiViewTab('visual')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                    apiViewTab === 'visual'
                      ? 'bg-white dark:bg-slate-850 shadow-md text-brand-600 dark:text-brand-400 font-extrabold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  📊 Visual API Doc
                </button>
                <button
                  onClick={() => setApiViewTab('raw')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                    apiViewTab === 'raw'
                      ? 'bg-white dark:bg-slate-850 shadow-md text-brand-600 dark:text-brand-400 font-extrabold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  💻 Raw JSON Schema
                </button>
              </div>

              <button
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-grow bg-slate-50 dark:bg-slate-950/40">
              {apiViewTab === 'raw' ? (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-900 overflow-x-auto">
                  <pre className="text-emerald-400 font-mono text-xs select-all whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(propertiesResponse, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-2xl">
                      <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Total Listings Returned</p>
                      <p className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{properties.length} Properties</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-2xl">
                      <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Geographic Coverage</p>
                      <p className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{locations.length} Cities</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-2xl">
                      <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Unapproved/Pending Listings</p>
                      <p className="text-xl font-black text-amber-500 mt-1">
                        {properties.filter(p => p.status === 'PENDING').length} Pending
                      </p>
                    </div>
                  </div>

                  {/* Listings breakdown table */}
                  {locations.map(city => {
                    const cityProps = properties.filter(p => p.city === city);
                    return (
                      <div key={city} className="space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-2xl p-5 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <MapPin size={16} className="text-brand-500" />
                          {city} Properties in Response
                        </h4>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                                <th className="pb-2 w-1/4">Title / Address</th>
                                <th className="pb-2 w-1/5">Type</th>
                                <th className="pb-2 w-1/5">Coordinates</th>
                                <th className="pb-2 w-1/6">Price</th>
                                <th className="pb-2 w-1/6 text-right">Moderation Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                              {cityProps.map(prop => (
                                <tr key={prop._id} className="text-slate-650 dark:text-slate-350">
                                  <td className="py-2.5">
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{prop.title}</p>
                                    <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{prop.address}</p>
                                  </td>
                                  <td className="py-2.5 font-semibold text-[10px]">{prop.propertyType}</td>
                                  <td className="py-2.5 font-mono text-[10px] text-slate-500">
                                    [{prop.location?.coordinates?.[0]?.toFixed(5)}, {prop.location?.coordinates?.[1]?.toFixed(5)}]
                                  </td>
                                  <td className="py-2.5 font-extrabold text-slate-800 dark:text-slate-200">
                                    ₹{prop.price.toLocaleString('en-IN')}
                                  </td>
                                  <td className="py-2.5 text-right">
                                    {prop.status === 'APPROVED' ? (
                                      <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        APPROVED
                                      </span>
                                    ) : (
                                      <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        PENDING
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
