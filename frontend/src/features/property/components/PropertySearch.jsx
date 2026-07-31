import { useState, useEffect } from 'react';
import { useSearchPropertiesQuery } from '../hooks/useProperty';
import MapView from './MapView';
import { Link } from 'react-router-dom';
import { 
  Search, SlidersHorizontal, BedDouble, Bath, Maximize, MapPin, 
  ChevronRight, Building, Compass, Sparkles, Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../../../utils/getImageUrl';

// Quick local geocoder lookup cache for major Indian cities
const CITY_COORDS_CACHE = {
  chennai: [13.0827, 80.2707],
  bangalore: [12.9716, 77.5946],
  mumbai: [19.0760, 72.8777],
  delhi: [28.6139, 77.2090],
  hyderabad: [17.3850, 78.4867],
  kolkata: [22.5726, 88.3639],
};

export default function PropertySearch() {
  const [cityInput, setCityInput] = useState('Chennai');
  const [searchParams, setSearchParams] = useState({
    latitude: 13.0827,
    longitude: 80.2707,
    radius: 20,
    city: 'Chennai',
    propertyType: '',
    minPrice: '',
    maxPrice: '',
  });

  const [activeCenter, setActiveCenter] = useState([13.0827, 80.2707]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const { data: response, isLoading, refetch } = useSearchPropertiesQuery(searchParams);

  // Trigger search on component mount
  useEffect(() => {
    refetch();
  }, [searchParams, refetch]);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!cityInput.trim()) return;

    setIsGeocoding(true);
    const lowercaseCity = cityInput.toLowerCase().trim();
    let coords = CITY_COORDS_CACHE[lowercaseCity];

    if (!coords) {
      try {
        // Free open Nominatim geocoding engine (no billing credentials needed)
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityInput)}&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
          coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
      } catch (err) {
        console.error('Nominatim geocoder error:', err);
      }
    }

    setIsGeocoding(false);

    if (coords) {
      setActiveCenter(coords);
      setSearchParams(prev => ({
        ...prev,
        latitude: coords[0],
        longitude: coords[1],
        city: cityInput.trim(),
      }));
    } else {
      alert('Could not find location coordinates for this city. Try Bangalore, Chennai, or Mumbai.');
    }
  };

  const properties = response?.success ? response.data : [];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Sidebar: Filters & Results list */}
      <div className="w-full lg:w-[45%] bg-slate-50 dark:bg-slate-950/60 p-6 flex flex-col border-r border-slate-200 dark:border-slate-900 overflow-y-auto lg:max-h-screen">
        
        {/* Search Panel Header */}
        <div className="mb-6 space-y-4">
          <h1 className="text-2xl font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
            <Compass className="text-brand-500" size={24} />
            Explore Luxury Rentals
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-1">
            Radius-based search finding premium residences in your preferred vicinity.
          </p>

          <form onSubmit={handleSearchSubmit} className="space-y-4">
            {/* City search bar */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="Enter city (e.g. Chennai, Bangalore, Mumbai...)"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3.5 pl-11 pr-24 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
              <button
                type="submit"
                disabled={isGeocoding}
                className="absolute right-2 top-2 bg-gradient-to-r from-brand-500 to-sky-600 hover:from-brand-600 hover:to-sky-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition disabled:opacity-50 flex items-center gap-1"
              >
                <Navigation size={12} />
                {isGeocoding ? 'Locating...' : 'Search'}
              </button>
            </div>

            {/* Slider & Filter dropdowns */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-900 space-y-4 bg-white dark:bg-slate-900/30">
              <div>
                <div className="flex justify-between items-center mb-1 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span>Search Radius</span>
                  <span className="text-brand-500 font-extrabold">{searchParams.radius} KM</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="100"
                  value={searchParams.radius}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, radius: Number(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Property Type
                  </label>
                  <select
                    value={searchParams.propertyType}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, propertyType: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="">All Types</option>
                    <option value="APARTMENT">Apartment</option>
                    <option value="HOUSE">House</option>
                    <option value="CONDO">Condo</option>
                    <option value="VILLA">Villa</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Min Price
                    </label>
                    <input
                      type="number"
                      placeholder="₹ Min"
                      value={searchParams.minPrice}
                      onChange={(e) => setSearchParams(prev => ({ ...prev, minPrice: e.target.value }))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Max Price
                    </label>
                    <input
                      type="number"
                      placeholder="₹ Max"
                      value={searchParams.maxPrice}
                      onChange={(e) => setSearchParams(prev => ({ ...prev, maxPrice: e.target.value }))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Results grid list container */}
        <div className="flex-grow space-y-4">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-900">
            <Sparkles size={14} className="text-amber-500" />
            Matching Listings ({properties.length})
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900 rounded-3xl">
              <Building className="mx-auto h-10 w-10 text-slate-400 mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-405">No matches found</p>
              <p className="text-xs text-slate-450 dark:text-slate-500 mt-1">Try expanding the search radius or resetting the pricing filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {properties.map((property) => (
                <Link
                  to={`/properties/${property._id}`}
                  key={property._id}
                  className="flex gap-4 p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-shadow group"
                >
                  {/* Property Thumbnail */}
                  <div className="h-24 w-32 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 relative">
                    <img
                      src={getImageUrl(property.images?.[0]?.url)}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Summary details */}
                  <div className="flex-grow flex flex-col justify-between py-1 min-w-0">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-205 line-clamp-1 group-hover:text-brand-500 transition-colors">
                        {property.title}
                      </h3>
                      <p className="text-[10px] text-slate-550 dark:text-slate-450 mt-1 flex items-center gap-0.5">
                        <MapPin size={10} className="text-slate-400" />
                        {property.city}, {property.state}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex gap-2.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-0.5"><BedDouble size={12} /> {property.bedrooms} Bed</span>
                        <span className="flex items-center gap-0.5"><Bath size={12} /> {property.bathrooms} Bath</span>
                      </div>
                      <span className="text-sm font-black gold-gradient-text">
                        ₹{property.price.toLocaleString('en-IN')}/mo
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar: Dynamic Leaflet map view */}
      <div className="flex-grow h-[50vh] lg:h-screen w-full lg:w-[55%] sticky top-0">
        <MapView center={activeCenter} properties={properties} />
      </div>
    </div>
  );
}
