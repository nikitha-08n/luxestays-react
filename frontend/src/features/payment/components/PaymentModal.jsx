import { useState } from 'react';
import { api } from '../../../lib/axios';
import toast from 'react-hot-toast';
import { X, ShieldCheck, CreditCard, Sparkles, Loader2, Coins } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

export default function PaymentModal({ booking, onClose, onSuccess }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('ONLINE');
  const [utr, setUtr] = useState('');

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

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // 1. Create order on the backend
      const orderResponse = await api.post('/payments/order', { bookingId: booking._id });
      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Order creation failed');
      }

      const { orderId } = orderResponse.data;

      if (paymentMethod === 'OFFLINE') {
        if (!utr || utr.trim().length !== 12) {
          toast.error('Please enter a valid 12-digit UPI Transaction Ref / UTR number');
          setIsProcessing(false);
          return;
        }

        // Offline payment is simulated/confirmed directly by the landlord via direct UPI transfer
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const mockPaymentId = `pay_cash_${utr.trim()}`;
        const verifyResponse = await api.post('/payments/verify', {
          bookingId: booking._id,
          orderId,
          paymentId: mockPaymentId,
          paymentMethod: 'OFFLINE',
          utrNumber: utr.trim(),
        });

        if (verifyResponse.success) {
          toast.success('Offline Cash Payment confirmed. +150 loyalty points added!');
          const updatedPoints = verifyResponse.data?.points;
          if (updatedPoints !== undefined) {
            useAuthStore.getState().setUser({
              ...useAuthStore.getState().user,
              points: updatedPoints
            });
          }
          onSuccess();
        } else {
          toast.error(verifyResponse.message || 'Payment confirmation failed');
        }
        setIsProcessing(false);
        return;
      }

      // Online payment: Load SDK & trigger checkout overlay
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Razorpay SDK failed to load. Please check your internet connection.');
        setIsProcessing(false);
        return;
      }

      const options = {
        key: orderResponse.data.key || 'rzp_test_TJaMqmZL24wMGy',
        amount: total * 100, // in paise
        currency: 'INR',
        name: 'LuxeStays',
        description: `Deposit fee for: ${booking.propertyId?.title || 'Luxury Residence'}`,
        handler: async function (response) {
          setIsProcessing(true);
          try {
            const verifyResponse = await api.post('/payments/verify', {
              bookingId: booking._id,
              orderId,
              paymentId: response.razorpay_payment_id,
              paymentMethod: 'ONLINE',
            });

            if (verifyResponse.success) {
              toast.success('Online Payment processed! +150 loyalty points added.');
              const updatedPoints = verifyResponse.data?.points;
              if (updatedPoints !== undefined) {
                useAuthStore.getState().setUser({
                  ...useAuthStore.getState().user,
                  points: updatedPoints
                });
              }
              onSuccess();
            } else {
              toast.error(verifyResponse.message || 'Payment verification failed');
            }
          } catch (err) {
            console.error(err);
            toast.error('Payment verification failed');
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: useAuthStore.getState().user?.name || '',
          email: useAuthStore.getState().user?.email || '',
        },
        theme: {
          color: '#0EA5E9',
        },
      };

      if (!orderResponse.data.isMock) {
        options.order_id = orderId;
      }
      const rzp = new window.Razorpay(options);
      rzp.open();
      setIsProcessing(false);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Checkout failed');
      setIsProcessing(false);
    }
  };

  const rent = booking.amount;
  const processFee = 500;
  const total = rent + processFee;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-4 pt-10 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl relative flex flex-col max-h-[80vh] overflow-hidden">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <CreditCard className="text-brand-500" size={20} />
            <h3 className="font-extrabold text-slate-800 dark:text-slate-200">Secure Checkout</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Invoice Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-grow">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Property Description</p>
            <p className="text-sm font-bold text-slate-750 dark:text-slate-200 mt-1 truncate">
              {booking.propertyId?.title}
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>First Month Rent Deposit</span>
              <span>₹{rent.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Security Processing Fee</span>
              <span>₹{processFee.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-800 dark:text-slate-200 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800">
              <span>Total Checkout Payment</span>
              <span className="gold-gradient-text text-base">₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="pt-2">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2.5">
              Choose Payment Method
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('ONLINE')}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition duration-200 ${
                  paymentMethod === 'ONLINE'
                    ? 'border-brand-500 bg-brand-500/5 text-brand-600 dark:text-brand-400 font-extrabold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                }`}
              >
                <Sparkles size={18} className="mb-1.5 text-amber-500" />
                <span className="text-xs">Online Payment</span>
                <span className="text-[9px] text-amber-500 font-bold mt-0.5 flex items-center gap-0.5">
                  <Coins size={10} /> +150 Points
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('OFFLINE')}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition duration-200 ${
                  paymentMethod === 'OFFLINE'
                    ? 'border-brand-500 bg-brand-500/5 text-brand-600 dark:text-brand-400 font-extrabold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                }`}
              >
                <CreditCard size={18} className="mb-1.5 text-sky-500" />
                <span className="text-xs">Direct UPI Transfer</span>
                <span className="text-[9px] text-slate-450 mt-0.5 font-bold">
                  Scan QR Code
                </span>
              </button>
            </div>
          </div>

          {/* UPI Direct Transfer Details */}
          {paymentMethod === 'OFFLINE' && (() => {
            const landlordName = booking.propertyId?.ownerId?.name || 'Landlord';
            const landlordEmail = booking.propertyId?.ownerId?.email || 'payout@luxestays';
            
            const formattedUpi = booking.propertyId?.upiId || booking.propertyId?.ownerId?.upiId || `${landlordEmail.split('@')[0]}@ybl`;
            const bankAcc = booking.propertyId?.bankAccountNumber || booking.propertyId?.ownerId?.bankAccountNumber;
            const bankIfsc = booking.propertyId?.bankIfscCode || booking.propertyId?.ownerId?.bankIfscCode;
            
            return (
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800 rounded-2xl p-4.5 space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-[10px] text-slate-455 uppercase font-black tracking-wider block">
                    Scan & Pay Landlord Directly via UPI
                  </span>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Landlord: <span className="text-brand-500 font-extrabold">{landlordName}</span>
                  </p>
                  <p className="text-xs font-mono text-slate-550 bg-white dark:bg-slate-950 inline-block px-3 py-1 rounded-lg border border-slate-150 dark:border-slate-850 mt-1">
                    UPI ID: {formattedUpi}
                  </p>
                  
                  {bankAcc && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 bg-white dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-150 dark:border-slate-850 text-left space-y-0.5">
                      <p className="font-extrabold text-slate-700 dark:text-slate-350">🏦 Bank Transfer Details:</p>
                      <p>Account: <span className="font-mono font-extrabold text-slate-850 dark:text-slate-200">{bankAcc}</span></p>
                      {bankIfsc && (
                        <p>IFSC Code: <span className="font-mono font-extrabold text-slate-850 dark:text-slate-200">{bankIfsc}</span></p>
                      )}
                    </div>
                  )}
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                        `upi://pay?pa=${formattedUpi}&pn=${encodeURIComponent(landlordName)}&am=${total}&cu=INR&tn=LuxeStays Deposit`
                      )}`}
                      alt="UPI QR Code"
                      className="h-32 w-32 object-contain"
                    />
                    <span className="text-[8px] text-slate-400 font-bold tracking-wider mt-1.5 uppercase">
                      Scan using GPay / PhonePe / Paytm
                    </span>
                  </div>
                </div>

                {/* UTR Input */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                    UPI Transaction UTR / Ref Number (12-Digits)
                  </label>
                  <input
                    type="text"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 12-digit transaction UTR"
                    maxLength={12}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 transition font-mono text-center tracking-widest"
                  />
                </div>
              </div>
            );
          })()}

        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
          {/* Secure badging */}
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2.5 flex gap-2.5 items-center">
            <ShieldCheck className="text-emerald-500 flex-shrink-0" size={16} />
            <p className="text-[9px] text-emerald-600 leading-snug">
              Encrypted end-to-end processing. Platform handles payouts directly into landlords whitelisted accounts.
            </p>
          </div>

          {/* Checkout trigger button */}
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-brand-500 to-sky-600 hover:from-brand-600 hover:to-sky-700 text-white font-bold py-3.5 px-6 rounded-xl transition duration-300 shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Processing Transaction...
              </>
            ) : (
              <>
                <Sparkles size={16} className="text-amber-300 animate-pulse" />
                {paymentMethod === 'OFFLINE' ? 'Confirm UTR & Verify Payment' : `Confirm & Pay ₹${total.toLocaleString('en-IN')}`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
