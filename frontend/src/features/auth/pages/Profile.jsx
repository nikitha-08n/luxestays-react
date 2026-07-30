import { useState, useEffect } from 'react';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';
import toast from 'react-hot-toast';
import { User, Mail, Phone, CreditCard, ShieldCheck, Loader2, Sparkles } from 'lucide-react';

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [upiId, setUpiId] = useState(user?.upiId || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(user?.bankAccountNumber || '');
  const [bankIfscCode, setBankIfscCode] = useState(user?.bankIfscCode || '');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setUpiId(user.upiId || '');
      setBankAccountNumber(user.bankAccountNumber || '');
      setBankIfscCode(user.bankIfscCode || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.patch('/auth/profile', {
        name: name.trim(),
        phone: phone.trim(),
        upiId: upiId.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankIfscCode: bankIfscCode.trim(),
      });

      if (response.success) {
        toast.success('Profile details updated successfully!');
        setUser(response.data);
      } else {
        toast.error(response.message || 'Profile update failed');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Profile save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const isLandlord = user?.role === 'OWNER';

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <User className="text-brand-500" size={28} />
          Account Profile & Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your account profile details, contact information, and default billing payment targets.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Profile Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/10 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <User size={18} className="text-brand-500" />
            General Profile Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-slate-100/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400 mb-2">
                Email (Read-Only)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-slate-100/30 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-400 focus:outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Phone size={16} />
                </span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-100/50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400 mb-1">
                  Account Type
                </span>
                <span className="inline-block bg-brand-500/10 text-brand-500 dark:text-brand-400 text-xs font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider">
                  {user?.role} Account
                </span>
              </div>
              {user?.role === 'RENTER' && (
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400 mb-1">
                    Loyalty Points
                  </span>
                  <span className="inline-block bg-amber-500/10 text-amber-600 dark:text-amber-500 text-xs font-black px-3 py-1.5 rounded-full tracking-wider">
                    ★ {user?.points || 0} Points
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Landlord-Specific Payout Settings */}
        {isLandlord && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/10 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <CreditCard size={18} className="text-emerald-500" />
              Direct Rent Payout Coordinates
            </h2>
            <p className="text-xs text-slate-450 dark:text-slate-400 mb-4 leading-relaxed">
              Rent payments initiated by tenants for your properties will be routed directly to these details.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400 mb-2">
                  UPI ID (Recommended)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="landlord@okaxis"
                  className="w-full bg-slate-100/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400 mb-2">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="987654321098"
                  className="w-full bg-slate-100/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400 mb-2">
                  Bank IFSC Code
                </label>
                <input
                  type="text"
                  value={bankIfscCode}
                  onChange={(e) => setBankIfscCode(e.target.value)}
                  placeholder="SBIN0001234"
                  className="w-full bg-slate-100/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>
        )}

        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex gap-3 items-center">
          <ShieldCheck className="text-emerald-500 flex-shrink-0" size={20} />
          <p className="text-xs text-emerald-600 leading-snug">
            Your details are stored securely. Contact our platform admin if you need to modify your registered email address.
          </p>
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-gradient-to-r from-brand-500 to-sky-600 hover:from-brand-600 hover:to-sky-700 text-white font-bold py-3 px-8 rounded-xl text-sm transition shadow-md shadow-brand-500/10 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Saving Changes...
              </>
            ) : (
              <>
                <Sparkles size={16} className="text-amber-300 animate-pulse" />
                Save Profile Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
