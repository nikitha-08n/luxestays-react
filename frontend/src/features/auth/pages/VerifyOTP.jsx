import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useVerifyOTPMutation } from '../../../hooks/useAuth';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../../lib/axios';
import toast from 'react-hot-toast';

const otpSchema = z.object({
  otp: z.string().length(6, 'Verification code must be exactly 6 digits'),
});

export default function VerifyOTP() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const [counter, setCounter] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!email) {
      toast.error('Email parameter is missing');
      navigate('/register');
    }
  }, [email, navigate]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (counter > 0) {
      const timer = setTimeout(() => setCounter(counter - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [counter]);

  const verifyMutation = useVerifyOTPMutation({
    onSuccess: (data) => {
      // Dynamic redirect based on user role
      const role = data.user?.role?.toLowerCase() || 'renter';
      navigate(`/dashboard/${role}`);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const onSubmit = (data) => {
    verifyMutation.mutate({
      email,
      otp: data.otp,
    });
  };

  const handleResend = async () => {
    if (!canResend) return;
    setIsResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('Verification code resent successfully');
      setCounter(60);
      setCanResend(false);
    } catch (error) {
      toast.error(error.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel max-w-md w-full p-8 rounded-3xl border border-slate-200/60 dark:border-slate-900 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-sky-500"></div>

        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-sky-400 items-center justify-center text-white shadow-md shadow-brand-500/20 mb-4">
            <ShieldCheck size={24} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Verify Account</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            We have sent a security code to your email
          </p>
          <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold mt-1 flex items-center justify-center gap-1.5">
            <Mail size={12} /> {email}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 text-center">
              Enter 6-Digit Code
            </label>
            <input
              type="text"
              maxLength={6}
              {...register('otp')}
              placeholder="000000"
              className="w-full text-center bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-2xl py-4 text-2xl font-black letter-spacing-4 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors duration-300 placeholder:text-slate-300 dark:placeholder:text-slate-800"
            />
            {errors.otp && (
              <p className="text-xs text-rose-500 mt-2 text-center font-semibold">{errors.otp.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={verifyMutation.isPending}
            className="w-full bg-gradient-to-r from-brand-500 to-sky-600 hover:from-brand-600 hover:to-sky-700 text-white font-bold py-3.5 px-6 rounded-xl transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {verifyMutation.isPending ? 'Verifying Code...' : 'Verify & Continue'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-200 dark:border-slate-900">
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center gap-1.5 text-sm text-brand-500 font-bold hover:underline disabled:opacity-50"
            >
              <RefreshCw size={14} className={isResending ? 'animate-spin' : ''} />
              Resend Code
            </button>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Resend code in <span className="font-bold text-slate-700 dark:text-slate-300">{counter}</span> seconds
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
