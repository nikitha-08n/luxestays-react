import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePropertyDetailsQuery } from '../hooks/useProperty';
import { useWishlistCheckQuery, useToggleWishlistMutation } from '../hooks/useWishlist';
import { useCreateBookingMutation } from '../../booking/hooks/useBooking';
import { usePropertyReviewsQuery, useCreateReviewMutation } from '../hooks/useReview';
import { getImageUrl } from '../../../utils/getImageUrl';
import useAuthStore from '../../../store/authStore';
import { 
  MapPin, BedDouble, Bath, Maximize, Calendar, ShieldCheck, 
  Sparkles, CheckCircle2, Phone, Mail, ArrowLeft, Loader2,
  Heart, MessageSquare, Star, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user: currentUser } = useAuthStore();

  const { data: detailsResponse, isLoading, error } = usePropertyDetailsQuery(id);
  const { data: wishlistResponse } = useWishlistCheckQuery(id, { enabled: isAuthenticated });
  const { data: reviewsResponse } = usePropertyReviewsQuery(id);

  const toggleWishlist = useToggleWishlistMutation();
  const createBooking = useCreateBookingMutation({
    onSuccess: () => {
      navigate('/bookings');
    }
  });
  const createReview = useCreateReviewMutation();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [visitDate, setVisitDate] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [roomNumber, setRoomNumber] = useState(1);
  const [bookedRooms, setBookedRooms] = useState([]);

  const property = detailsResponse?.success ? detailsResponse.data : null;

  useEffect(() => {
    if (property?._id) {
      fetch(`/api/v1/properties/${property._id}/booked-rooms`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setBookedRooms(data.data);
            const firstAvailable = Array.from({ length: property.bedrooms || 1 })
              .map((_, idx) => idx + 1)
              .find(rNum => !data.data.includes(rNum));
            if (firstAvailable) setRoomNumber(firstAvailable);
          }
        })
        .catch(err => console.error(err));
    }
  }, [property]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-500 h-10 w-10" />
      </div>
    );
  }

  if (error || !detailsResponse?.success) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-4">
        <h2 className="text-2xl font-bold text-rose-500 mb-4">Failed to load property details</h2>
        <p className="text-slate-400 text-sm mb-6">
          {error?.response?.data?.message || 'The property listing you are trying to view might have been deleted or is pending moderation.'}
        </p>
        <Link to="/" className="text-brand-500 font-bold hover:underline flex items-center justify-center gap-2">
          <ArrowLeft size={16} /> Return to Home
        </Link>
      </div>
    );
  }

  const isWishlisted = wishlistResponse?.success && wishlistResponse.data.wishlisted;
  const reviewsList = reviewsResponse?.success ? reviewsResponse.data : [];
  const isOwner = currentUser?.id && property?.ownerId?._id && currentUser.id === property.ownerId._id;

  const handleWishlistToggle = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to save properties to your wishlist.');
      navigate('/login');
      return;
    }
    toggleWishlist.mutate(id);
  };

  const handleBookVisitSubmit = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!visitDate) {
      toast.error('Please select a visit date');
      return;
    }
    createBooking.mutate({ 
      propertyId: id, 
      visitDate,
      roomNumber: property.propertyType === 'APARTMENT' ? roomNumber : 1
    });
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!reviewComment.trim()) {
      alert('Please enter a comment');
      return;
    }
    if (reviewComment.trim().length < 5) {
      alert('Comment must be at least 5 characters long');
      return;
    }
    createReview.mutate(
      { propertyId: id, rating: reviewRating, comment: reviewComment },
      { onSuccess: () => setReviewComment('') }
    );
  };

  const handleStartChat = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/chats?userId=${property.ownerId?._id}`);
  };

  const mainImage = property.images?.[activeImageIndex]?.url || property.images?.[0]?.url;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-550 dark:text-slate-450 hover:text-slate-700 dark:hover:text-slate-205 mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Search Listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Areas */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Picture Gallery */}
          <div className="space-y-4">
            <div className="aspect-video w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-900 shadow-lg relative bg-slate-950">
              <img
                src={getImageUrl(mainImage)}
                alt={property.title}
                className="w-full h-full object-cover transition-all duration-300"
              />
              <span className="absolute bottom-4 right-4 bg-slate-950/70 backdrop-blur-md text-white text-xs font-bold py-1.5 px-3 rounded-full">
                {activeImageIndex + 1} of {property.images?.length || 1}
              </span>

              {/* Wishlist toggle floating overlay button */}
              <button
                onClick={handleWishlistToggle}
                className="absolute top-4 right-4 p-3 rounded-full bg-white/95 dark:bg-slate-900/95 shadow-md hover:scale-105 transition-all text-slate-500 hover:text-rose-500"
              >
                <Heart size={20} className={isWishlisted ? 'fill-rose-500 text-rose-500 animate-pulse' : ''} />
              </button>
            </div>

            {/* Thumbnails */}
            {property.images?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-350 dark:scrollbar-thumb-slate-800">
                {property.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`aspect-video w-full rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === index ? 'border-brand-500 shadow-md ring-2 ring-brand-500/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={getImageUrl(img.url)} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Heading Info */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 dark:border-slate-900 shadow-md space-y-4">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block bg-brand-500/10 text-brand-500 dark:text-brand-400 text-xs font-extrabold py-1 px-3 rounded-full uppercase tracking-wider">
                    {property.propertyType}
                  </span>
                  {property.averageRating > 0 && (
                    <span className="flex items-center gap-0.5 text-amber-500 text-xs font-bold bg-amber-500/10 px-2.5 py-1 rounded-full">
                      <Star size={12} className="fill-amber-500" />
                      {property.averageRating} ({property.totalReviews})
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-extrabold text-slate-850 dark:text-slate-100">{property.title}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-2">
                  <MapPin size={16} className="text-slate-400" />
                  {property.address}, {property.city}, {property.state} {property.zipCode}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">Monthly Rent</p>
                <p className="text-3xl font-extrabold gold-gradient-text mt-1">₹{property.price.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Key Specs */}
            <div className="grid grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-900 pt-6">
              <div className="text-center p-3 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl">
                <BedDouble size={20} className="mx-auto text-brand-500 mb-1" />
                <p className="text-xs text-slate-450 dark:text-slate-500">Bedrooms</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{property.bedrooms} Bed</p>
              </div>
              <div className="text-center p-3 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl">
                <Bath size={20} className="mx-auto text-sky-500 mb-1" />
                <p className="text-xs text-slate-450 dark:text-slate-500">Bathrooms</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{property.bathrooms} Bath</p>
              </div>
              <div className="text-center p-3 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl">
                <Maximize size={20} className="mx-auto text-indigo-500 mb-1" />
                <p className="text-xs text-slate-450 dark:text-slate-500">Area</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{property.area} Sq.Ft</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 dark:border-slate-900 shadow-md space-y-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-900 pb-3">
              Description
            </h2>
            <p className="text-sm text-slate-650 dark:text-slate-350 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Amenities */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 dark:border-slate-900 shadow-md space-y-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-900 pb-3">
              Amenities
            </h2>
            {property.amenities?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {property.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-350">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-450 dark:text-slate-500">No specific amenities configured.</p>
            )}
          </div>

          {/* Reviews & Ratings section */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 dark:border-slate-900 shadow-md space-y-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-900 pb-3">
              Visitor Reviews ({reviewsList.length})
            </h2>

            {/* List Reviews */}
            {reviewsList.length === 0 ? (
              <p className="text-sm text-slate-450 dark:text-slate-500">No reviews have been written for this property yet.</p>
            ) : (
              <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-900">
                {reviewsList.map((review) => (
                  <div key={review._id} className="pt-4 first:pt-0 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{review.userId?.name || 'Anonymous User'}</span>
                      <span className="text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={i < review.rating ? 'fill-amber-500' : 'text-slate-200 dark:text-slate-800'}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-350 italic">"{review.comment}"</p>
                  </div>
                ))}
              </div>
            )}

            {/* Write Review Form */}
            {isAuthenticated && !isOwner && (
              <form onSubmit={handleReviewSubmit} className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Leave a Review</h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-bold mr-2">Your Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="text-amber-500 hover:scale-110 transition-transform"
                    >
                      <Star size={18} className={star <= reviewRating ? 'fill-amber-500' : 'text-slate-200 dark:text-slate-800'} />
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder="Describe your experience staying at this luxury residence..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 bottom-3 p-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          
          {/* Booking Request Box */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 dark:border-slate-900 shadow-lg relative overflow-hidden bg-white/70 dark:bg-slate-950/40">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-sky-500"></div>
            <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100 mb-4">Request Booking</h3>
            
            <form onSubmit={handleBookVisitSubmit} className="space-y-4">
              <div className="flex justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-900">
                <span className="text-slate-400">Monthly Rent</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">₹{property.price.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-900">
                <span className="text-slate-400">Security Deposit</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">₹{(property.price * 3).toLocaleString('en-IN')} (3 Mo)</span>
              </div>
              
              {isOwner ? (
                <div className="p-3.5 bg-emerald-500/10 text-emerald-600 rounded-xl text-center text-xs font-bold mt-4">
                  This is your property listing.
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                    {property.propertyType === 'APARTMENT' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Select Apartment Room
                        </label>
                        <select
                          value={roomNumber}
                          onChange={(e) => setRoomNumber(Number(e.target.value))}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 px-3 text-xs text-slate-750 dark:text-slate-350 focus:outline-none"
                        >
                          {Array.from({ length: property.bedrooms || 1 }).map((_, idx) => {
                             const roomNum = idx + 1;
                             const isBooked = bookedRooms.includes(roomNum);
                             return (
                               <option key={roomNum} value={roomNum} disabled={isBooked}>
                                 Room {roomNum} {isBooked ? '(Booked - Unavailable)' : '(Available)'}
                               </option>
                             );
                          })}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Preferred Visit Date
                      </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Calendar size={16} />
                      </span>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={createBooking.isPending}
                    className="w-full bg-gradient-to-r from-brand-500 to-sky-600 hover:from-brand-600 hover:to-sky-700 text-white font-bold py-3.5 px-6 rounded-xl transition duration-300 shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
                  >
                    {createBooking.isPending ? 'Scheduling...' : 'Schedule Visit & Request Booking'}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Owner details info */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 dark:border-slate-900 shadow-md">
            <h3 className="text-base font-bold text-slate-850 dark:text-slate-100 mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-500" />
              Listed By
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-450 dark:text-slate-500">Property Owner</p>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">{property.ownerId?.name || 'LuxeStays Member'}</p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-900">
                <div className="flex items-center gap-2.5 text-sm text-slate-500 dark:text-slate-400">
                  <Phone size={16} className="text-brand-500" />
                  <span>{property.contactNumber || '+91 98765 43210'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-500 dark:text-slate-400">
                  <Mail size={16} className="text-brand-500" />
                  <span className="truncate">{property.ownerId?.email}</span>
                </div>
              </div>

              {/* Chat launch button */}
              {!isOwner && (
                <button
                  type="button"
                  onClick={handleStartChat}
                  className="w-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl text-xs transition duration-200 flex items-center justify-center gap-1.5 mt-2"
                >
                  <MessageSquare size={14} />
                  Chat with Landlord
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
