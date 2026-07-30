import { useState } from 'react';
import { usePropertiesQuery, useModeratePropertyMutation } from '../../../property/hooks/useProperty';
import { 
  Check, X, AlertCircle, Eye, Building2, MapPin, 
  DollarSign, FileText, Loader2, Sparkles 
} from 'lucide-react';
import { getImageUrl } from '../../../../utils/getImageUrl';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminModeration() {
  const { data: response, isLoading, refetch } = usePropertiesQuery({ status: 'PENDING' });
  const moderateMutation = useModeratePropertyMutation({
    onSuccess: () => refetch(),
  });

  const [inspectingProperty, setInspectingProperty] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = (id) => {
    if (window.confirm('Are you sure you want to approve this property listing?')) {
      moderateMutation.mutate({ id, status: 'APPROVED' });
      setInspectingProperty(null);
    }
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    moderateMutation.mutate({
      id: rejectingId,
      status: 'REJECTED',
      rejectionReason,
    });
    setRejectingId(null);
    setRejectionReason('');
    setInspectingProperty(null);
  };

  const pendingList = response?.success ? response.data : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Building2 className="text-rose-500" size={28} />
          Property Moderation Console
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Inspect, approve, or reject pending property listings submitted by owners.
        </p>
      </div>

      {isLoading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-brand-500 h-10 w-10" />
        </div>
      ) : pendingList.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-3xl border border-slate-200 dark:border-slate-900 max-w-lg mx-auto">
          <AlertCircle className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-350">No pending properties</h3>
          <p className="text-sm text-slate-400 mt-1">All submitted property listings are currently moderated.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingList.map((property) => (
            <motion.div
              key={property._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-900 overflow-hidden shadow-lg flex flex-col justify-between"
            >
              {/* Cover Photo */}
              <div className="aspect-video w-full relative bg-slate-950">
                <img
                  src={getImageUrl(property.images?.[0]?.url)}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-bold py-1 px-3 rounded-full uppercase tracking-wider shadow-md">
                  Pending
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-grow space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{property.title}</h3>
                  <p className="text-xs text-slate-450 dark:text-slate-500 flex items-center gap-1.5 mt-1.5">
                    <MapPin size={14} />
                    {property.city}, {property.state}
                  </p>
                </div>

                <div className="flex justify-between items-center py-2 border-t border-b border-slate-100 dark:border-slate-900 text-sm">
                  <span className="text-slate-400">Rent Price</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">₹{property.price.toLocaleString('en-IN')}/mo</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Owner:</span>
                  <span className="font-semibold text-slate-650 dark:text-slate-400">{property.ownerId?.name || 'Owner'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-5 pb-5 pt-2 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setInspectingProperty(property)}
                  className="bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Eye size={14} />
                  Inspect
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(property._id)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                >
                  <Check size={14} />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setRejectingId(property._id)}
                  className="bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/10"
                >
                  <X size={14} />
                  Reject
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Rejection Modal Dialog */}
      <AnimatePresence>
        {rejectingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <AlertCircle className="text-rose-500" />
                Reject Property Listing
              </h3>
              <form onSubmit={handleRejectSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Reason for Rejection
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide specific details (e.g. Blurry images, mismatching details, missing documents...)"
                    className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
                  ></textarea>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingId(null);
                      setRejectionReason('');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-450 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-2 rounded-xl text-xs"
                  >
                    Confirm Reject
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inspect Detailed Modal Dialog */}
      <AnimatePresence>
        {inspectingProperty && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-900 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-850 dark:text-slate-100">{inspectingProperty.title}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-450 mt-1">{inspectingProperty.address}, {inspectingProperty.city}</p>
                  </div>
                  <button
                    onClick={() => setInspectingProperty(null)}
                    className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-250 p-2 rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Cover & Gallery */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {inspectingProperty.images?.map((img) => (
                    <div key={img.publicId} className="aspect-video rounded-xl overflow-hidden bg-slate-950">
                      <img src={getImageUrl(img.url)} alt="detail" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                    <p className="text-xs text-slate-400">Monthly Rent</p>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">₹{inspectingProperty.price.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                    <p className="text-xs text-slate-400">Specifications</p>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">{inspectingProperty.bedrooms}B / {inspectingProperty.bathrooms}B / {inspectingProperty.area} Sq.Ft</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                    <p className="text-xs text-slate-400">Furnishing</p>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1 capitalize">{inspectingProperty.furnishing.toLowerCase()}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-sm text-slate-650 dark:text-slate-350 leading-relaxed whitespace-pre-wrap">{inspectingProperty.description}</p>
                </div>

                {/* Amenities */}
                {inspectingProperty.amenities?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {inspectingProperty.amenities.map((amenity) => (
                        <span key={amenity} className="text-xs bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 py-1.5 px-3 rounded-full font-bold">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons footer */}
                <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-900 pt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingId(inspectingProperty._id);
                    }}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition"
                  >
                    Reject Listing
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(inspectingProperty._id)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition"
                  >
                    Approve Listing
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
