import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useResetPasswordMutation } from '../../../hooks/useAuth';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Building, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const resetSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'Reset code must be exactly 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const resetMutation = useResetPasswordMutation({
    onSuccess: () => {
      navigate('/login');
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: emailParam,
      otp: '',
      newPassword: '',
    },
  });

  // Sync email parameter if loaded dynamically
  useEffect(() => {
    if (emailParam) {
      setValue('email', emailParam);
    }
  }, [emailParam, setValue]);

  const onSubmit = (data) => {
    resetMutation.mutate(data);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel max-w-md w-full p-8 rounded-3xl border border-slate-200/60 dark:border-slate-900 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500"></div>

        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 items-center justify-center text-white shadow-md shadow-rose-500/20 mb-4">
            <Lock size={24} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Reset Password</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Enter the verification code and set a new password
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <Mail size={18} />
              </span>
              <input
                type="email"
                {...register('email')}
                placeholder="name@example.com"
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors duration-300"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.email.message}</p>
            )}
          </div>

          {/* OTP Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Verification Code (OTP)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <ShieldCheck size={18} />
              </span>
              <input
                type="text"
                maxLength={6}
                {...register('otp')}
                placeholder="000000"
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors duration-300 font-mono tracking-widest placeholder:tracking-normal"
              />
            </div>
            {errors.otp && (
              <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.otp.message}</p>
            )}
          </div>

          {/* New Password Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              New Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <Lock size={18} />
              </span>
              <input
                type="password"
                {...register('newPassword')}
                placeholder="••••••••"
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors duration-300"
              />
            </div>
            {errors.newPassword && (
              <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.newPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={resetMutation.isPending}
            className="w-full mt-6 bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 text-white font-bold py-3.5 px-6 rounded-xl transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {resetMutation.isPending ? 'Resetting Password...' : 'Reset Password'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-200 dark:border-slate-900 pt-6 text-xs text-slate-500 dark:text-slate-400">
          Remembered your password?{' '}
          <Link to="/login" className="text-brand-500 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
