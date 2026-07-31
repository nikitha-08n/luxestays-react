import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMyBookingsQuery, useOwnerRequestsQuery, useUpdateBookingStatusMutation } from '../../booking/hooks/useBooking';
import useAuthStore from '../../../store/authStore';
import PaymentModal from '../../payment/components/PaymentModal';
import api from '../../../lib/axios';
import toast from 'react-hot-toast';
import { 
  Calendar, Check, X, AlertCircle, Loader2, DollarSign, 
  MapPin, Clock, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../../../utils/getImageUrl';

export default function BookingsDashboard() {
  const { user } = useAuthStore();
  const isOwnerOrAdmin = user?.role === 'OWNER' || user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState(isOwnerOrAdmin ? 'owner' : 'renter');
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);

  const [renterSubTab, setRenterSubTab] = useState('visits');
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const response = await api.get('/payments/invoices');
      if (response.success) {
        setInvoices(response.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'renter' && renterSubTab === 'dues') {
      fetchInvoices();
    }
  }, [activeTab, renterSubTab]);

  const handlePayInvoice = async (invoice, paymentMethod) => {
    let utrInput = '';
    if (paymentMethod === 'OFFLINE') {
      const landlordUpi = invoice.booking?.propertyId?.upiId || invoice.booking?.propertyId?.ownerId?.upiId || (invoice.booking?.propertyId?.ownerId?.email 
        ? `${invoice.booking.propertyId.ownerId.email.split('@')[0]}@ybl` 
        : 'landlord@upi');
      const promptVal = window.prompt(
        `Direct Offline Payment via UPI:\n` +
        `Landlord UPI: ${landlordUpi}\n` +
        `Amount: ₹${invoice.total.toLocaleString('en-IN')}\n\n` +
        `Please pay via GPay/PhonePe and enter the 12-digit transaction UTR number to verify:`
      );
      if (promptVal === null) return; // User cancelled
      if (!promptVal || promptVal.trim().length !== 12 || isNaN(promptVal)) {
        toast.error("Please enter a valid 12-digit numeric UPI UTR number");
        return;
      }
      utrInput = promptVal.trim();

      // Submit offline payment details to the server
      try {
        const response = await api.post('/payments/pay-invoice', {
          invoiceId: invoice.id,
          paymentMethod: 'OFFLINE',
          amount: invoice.total,
          utrNumber: utrInput,
        });
        if (response.success) {
          toast.success(`Rent Invoice for ${invoice.month} paid successfully via UPI! +150 loyalty points added!`);
          toast.success(`UTR Ref #${utrInput} recorded successfully!`);
          const updatedPoints = response.data?.points;
          if (updatedPoints !== undefined) {
            useAuthStore.getState().setUser({
              ...useAuthStore.getState().user,
              points: updatedPoints
            });
          }
          fetchInvoices();
        } else {
          toast.error(response.message || 'Payment failed');
        }
      } catch (err) {
        console.error(err);
        toast.error(err.message || 'Payment error occurred');
      }
      return;
    }

    // ONLINE Payment via Razorpay SDK checkout
    try {
      const loadRazorpayScript = () => {
        return new Promise((resolve) => {
          if (window.Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Razorpay SDK failed to load. Please check your internet connection.');
        return;
      }

      // 1. Create Order ID
      const orderResponse = await api.post('/payments/invoice-order', {
        invoiceId: invoice.id,
        amount: invoice.total,
      });

      if (!orderResponse.success) {
        toast.error(orderResponse.message || 'Failed to initialize payment');
        return;
      }

      const { orderId, key, isMock, amount } = orderResponse.data;

      // 2. Open Razorpay Popup
      const options = {
        key: key,
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'LuxeStays Monthly Rent',
        description: `${invoice.month} Rent for ${invoice.propertyTitle}`,
        image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=120&q=80',
        order_id: isMock ? undefined : orderId,
        handler: async function (response) {
          try {
            const payRes = await api.post('/payments/pay-invoice', {
              invoiceId: invoice.id,
              paymentMethod: 'ONLINE',
              amount: invoice.total,
              orderId: orderId,
              paymentId: response.razorpay_payment_id || `pay_${Math.random().toString(36).substring(2, 11)}`,
            });

            if (payRes.success) {
              toast.success(`Rent Invoice for ${invoice.month} paid successfully!`);
              toast.success('Earned 150 Loyalty Points!');
              const updatedPoints = payRes.data?.points;
              if (updatedPoints !== undefined) {
                useAuthStore.getState().setUser({
                  ...useAuthStore.getState().user,
                  points: updatedPoints
                });
              }
              fetchInvoices();
            } else {
              toast.error(payRes.message || 'Payment verification failed');
            }
          } catch (err) {
            console.error(err);
            toast.error(err.message || 'Error verifying rent payment');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#0EA5E9',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Could not initiate online payment');
    }
  };

  const { data: renterResponse, isLoading: loadingRenter, refetch: refetchRenter } = useMyBookingsQuery();
  const { data: ownerResponse, isLoading: loadingOwner, refetch: refetchOwner } = useOwnerRequestsQuery({
    enabled: isOwnerOrAdmin,
  });

  const updateStatus = useUpdateBookingStatusMutation({
    onSuccess: () => {
      refetchRenter();
      if (isOwnerOrAdmin) refetchOwner();
    }
  });

  const handleApprove = (id) => {
    updateStatus.mutate({ id, status: 'APPROVED' });
  };

  const handleReject = (id) => {
    if (window.confirm('Are you sure you want to decline this visit request?')) {
      updateStatus.mutate({ id, status: 'REJECTED' });
    }
  };

  const handleCancel = (id) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      updateStatus.mutate({ id, status: 'CANCELLED' });
    }
  };

  const renterList = renterResponse?.success ? renterResponse.data : [];
  const ownerList = ownerResponse?.success ? ownerResponse.data : [];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-amber-500/10 text-amber-500 text-xs font-bold px-2.5 py-1 rounded-full">Pending Approval</span>;
      case 'APPROVED':
        return <span className="bg-blue-500/10 text-blue-500 text-xs font-bold px-2.5 py-1 rounded-full">Approved (Unpaid)</span>;
      case 'REJECTED':
        return <span className="bg-rose-500/10 text-rose-500 text-xs font-bold px-2.5 py-1 rounded-full">Declined</span>;
      case 'PAID':
        return <span className="bg-emerald-500/10 text-emerald-500 text-xs font-bold px-2.5 py-1 rounded-full">Paid & Confirmed</span>;
      case 'CANCELLED':
        return <span className="bg-slate-500/10 text-slate-500 text-xs font-bold px-2.5 py-1 rounded-full">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 min-h-[70vh]">
      <div className="mb-8 flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="text-brand-500" size={28} />
            My Bookings & Visits
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Monitor and manage your schedules, deposit payments, and visit requests.
          </p>
        </div>

        {/* Tab switcher */}
        {isOwnerOrAdmin && (
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('owner')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'owner'
                  ? 'bg-white dark:bg-slate-850 shadow-md text-brand-500 font-extrabold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Incoming Requests
            </button>
            <button
              onClick={() => setActiveTab('renter')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'renter'
                  ? 'bg-white dark:bg-slate-850 shadow-md text-brand-500 font-extrabold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              My Bookings
            </button>
          </div>
        )}
      </div>

      {/* RENTER VIEW TABLE */}
      {activeTab === 'renter' && (
        <div className="space-y-6">
          {/* Sub-tabs for Renters */}
          <div className="flex border-b border-slate-200 dark:border-slate-850 pb-3 gap-6">
            <button
              onClick={() => setRenterSubTab('visits')}
              className={`text-sm font-bold pb-1.5 transition ${
                renterSubTab === 'visits'
                  ? 'border-b-2 border-brand-500 text-slate-850 dark:text-slate-100 font-extrabold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              🗓️ Visit Requests
            </button>
            <button
              onClick={() => setRenterSubTab('dues')}
              className={`text-sm font-bold pb-1.5 transition flex items-center gap-1.5 ${
                renterSubTab === 'dues'
                  ? 'border-b-2 border-brand-500 text-slate-850 dark:text-slate-100 font-extrabold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              💸 Monthly Rent Dues
            </button>
          </div>

          {renterSubTab === 'visits' && (
            <div className="space-y-4">
              {loadingRenter ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-500 h-8 w-8" /></div>
              ) : renterList.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900 rounded-3xl max-w-lg mx-auto">
                  <AlertCircle className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No bookings scheduled</h3>
                  <p className="text-sm text-slate-400 mt-1 mb-5">Start browsing luxury properties and schedule a visit date!</p>
                  <Link to="/properties" className="inline-flex bg-brand-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs">
                    Explore Homes
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {renterList.map((booking) => (
                    <div
                      key={booking._id}
                      className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900/20 shadow-sm"
                    >
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="h-16 w-24 rounded-lg overflow-hidden bg-slate-950 flex-shrink-0">
                          <img src={getImageUrl(booking.propertyId?.images?.[0]?.url)} alt="property" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{booking.propertyId?.title}</h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin size={12} /> {booking.propertyId?.city}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock size={12} /> Visit: {new Date(booking.visitDate).toLocaleDateString()}
                          </p>
                          {booking.propertyId?.propertyType === 'APARTMENT' && (
                            <p className="text-xs text-brand-600 dark:text-brand-400 font-extrabold mt-0.5">
                              🚪 Booked Room: Room {booking.roomNumber || 1}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                        <div className="text-left md:text-right">
                          <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Deposit Fee</p>
                          <p className="text-sm font-black gold-gradient-text">₹{booking.amount.toLocaleString('en-IN')}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {getStatusBadge(booking.status)}

                          {/* Pay button for approved requests */}
                          {booking.status === 'APPROVED' && (
                            <button
                              onClick={() => setSelectedBookingForPayment(booking)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1 transition shadow-md shadow-emerald-500/15"
                            >
                              <DollarSign size={14} /> Pay Deposit
                            </button>
                          )}

                          {/* Cancel request button for pending */}
                          {booking.status === 'PENDING' && (
                            <button
                              onClick={() => handleCancel(booking._id)}
                              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-755 text-slate-555 dark:text-slate-350 font-bold py-2 px-4 rounded-xl text-xs transition"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {renterSubTab === 'dues' && (
            <div className="space-y-4">
              {loadingInvoices ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-500 h-8 w-8" /></div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900 rounded-3xl max-w-lg mx-auto">
                  <AlertCircle className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <h3 className="text-lg font-bold text-slate-700 dark:text-slate-350">No active tenancies found</h3>
                  <p className="text-sm text-slate-455 mt-1">Rent invoices will generate automatically once you pay your deposit for an approved visit request.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/20 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {invoice.month} Rent Bill
                          </span>
                          {invoice.status === 'OVERDUE' && (
                            <span className="text-xs font-black text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                              ⚠️ Overdue (Missed Due Date)
                            </span>
                          )}
                          {invoice.status === 'PAID' && (
                            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                              ✓ Rent Paid
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-black text-slate-800 dark:text-slate-100">{invoice.propertyTitle}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin size={12} /> {invoice.city}
                        </p>
                        <p className="text-xs text-slate-500">
                          📅 Due Date: <span className="font-bold">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                        </p>
                      </div>

                      <div className="flex flex-col md:items-end gap-2.5 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                        <div className="grid grid-cols-2 md:flex md:flex-col gap-4 text-xs">
                          <div>
                            <span className="text-slate-450 font-bold block">Base Rent:</span>
                            <span className="font-extrabold text-slate-700 dark:text-slate-300">₹{invoice.baseRent.toLocaleString('en-IN')}</span>
                          </div>
                          {invoice.penalty > 0 && (
                            <div>
                              <span className="text-rose-500 font-extrabold block">Late Penalty Fee:</span>
                              <span className="font-black text-rose-500">₹{invoice.penalty.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                        </div>

                        <div className="text-left md:text-right border-t border-slate-100 dark:border-slate-800 pt-2">
                          <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Total Rent Due</span>
                          <p className="text-lg font-black gold-gradient-text">₹{invoice.total.toLocaleString('en-IN')}</p>
                        </div>

                        {invoice.status !== 'PAID' && (
                          <div className="flex gap-2 w-full">
                            <button
                              onClick={() => handlePayInvoice(invoice, 'ONLINE')}
                              className="flex-grow md:flex-none bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1 transition shadow-md shadow-emerald-500/10"
                            >
                              <DollarSign size={14} /> Pay Online (+150 Points)
                            </button>
                            <button
                              onClick={() => handlePayInvoice(invoice, 'OFFLINE')}
                              className="flex-grow md:flex-none bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 font-bold py-2 px-4 rounded-xl text-xs transition"
                            >
                              Pay Offline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* OWNER REQUESTS TABLE */}
      {activeTab === 'owner' && (
        <div className="space-y-4">
          {loadingOwner ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-500 h-8 w-8" /></div>
          ) : ownerList.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900 rounded-3xl max-w-lg mx-auto">
              <AlertCircle className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-350">No incoming requests</h3>
              <p className="text-sm text-slate-450 mt-1">Visit requests from potential renters will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {ownerList.map((booking) => (
                <div
                  key={booking._id}
                  className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900/20 shadow-sm"
                >
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="h-16 w-24 rounded-lg overflow-hidden bg-slate-950 flex-shrink-0">
                      <img src={getImageUrl(booking.propertyId?.images?.[0]?.url)} alt="property" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{booking.propertyId?.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Clock size={12} /> Requested: {new Date(booking.visitDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        By Renter: <span className="font-semibold">{booking.renterId?.name}</span> ({booking.renterId?.email})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Booking Amount</p>
                      <p className="text-sm font-black gold-gradient-text">₹{booking.amount.toLocaleString('en-IN')}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {booking.status === 'PENDING' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(booking._id)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1 transition"
                          >
                            <Check size={14} /> Accept
                          </button>
                          <button
                            onClick={() => handleReject(booking._id)}
                            className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1 transition"
                          >
                            <X size={14} /> Decline
                          </button>
                        </div>
                      ) : (
                        getStatusBadge(booking.status)
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Razorpay checkout modal */}
      {selectedBookingForPayment && (
        <PaymentModal
          booking={selectedBookingForPayment}
          onClose={() => setSelectedBookingForPayment(null)}
          onSuccess={() => {
            setSelectedBookingForPayment(null);
            refetchRenter();
          }}
        />
      )}
    </div>
  );
}
