import { useWishlistQuery } from '../hooks/useWishlist';
import { Link } from 'react-router-dom';
import { Heart, Home, BedDouble, Bath, Maximize, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getImageUrl } from '../../../utils/getImageUrl';

export default function Wishlist() {
  const { data: response, isLoading } = useWishlistQuery();
  const wishlistedItems = response?.success ? response.data : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 min-h-[70vh]">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Heart className="text-rose-500 fill-rose-500 animate-pulse" size={28} />
          My Saved Residences
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Quickly monitor your favorite luxury apartments and houses.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-brand-500 h-10 w-10" />
        </div>
      ) : wishlistedItems.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900 rounded-3xl max-w-lg mx-auto">
          <AlertCircle className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-350">Your wishlist is empty</h3>
          <p className="text-sm text-slate-400 mt-1.5 mb-6">Explore residences and click the heart icon to save them here.</p>
          <Link
            to="/properties"
            className="inline-flex bg-gradient-to-r from-brand-500 to-sky-600 hover:from-brand-600 hover:to-sky-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition duration-300"
          >
            Start Exploring
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistedItems.map((property) => (
            <motion.div
              key={property._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-900 overflow-hidden shadow-lg flex flex-col justify-between group"
            >
              {/* Cover Photo */}
              <div className="aspect-[4/3] w-full relative bg-slate-950 overflow-hidden">
                <img
                  src={getImageUrl(property.images?.[0]?.url)}
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Card Body */}
              <div className="p-5 flex-grow space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-brand-500 transition-colors">
                    {property.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{property.city}, {property.state}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-slate-100 dark:border-slate-900 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5"><BedDouble size={14} />{property.bedrooms} Beds</div>
                  <div className="flex items-center gap-1.5"><Bath size={14} />{property.bathrooms} Baths</div>
                  <div className="flex items-center gap-1.5"><Maximize size={14} />{property.area} sqft</div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-black gold-gradient-text">
                    ₹{property.price.toLocaleString('en-IN')}/mo
                  </span>
                  <Link
                    to={`/properties/${property._id}`}
                    className="text-xs font-bold text-brand-500 hover:underline"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
