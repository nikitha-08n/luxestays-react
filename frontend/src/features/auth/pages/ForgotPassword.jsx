import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForgotPasswordMutation } from '../../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Building, Mail, KeyRound, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export default function ForgotPassword() {
  const navigate = useNavigate();
  const forgotMutation = useForgotPasswordMutation({
    onSuccess: (data) => {
      const email = getValues('email');
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    },
  });

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data) => {
    forgotMutation.mutate(data.email);
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
            <KeyRound size={24} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Forgot Password</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Enter your email to receive a password reset verification code
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

          <button
            type="submit"
            disabled={forgotMutation.isPending}
            className="w-full mt-6 bg-gradient-to-r from-brand-500 to-sky-600 hover:from-brand-600 hover:to-sky-700 text-white font-bold py-3.5 px-6 rounded-xl transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {forgotMutation.isPending ? 'Sending Code...' : 'Send Verification Code'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-200 dark:border-slate-900 pt-6 text-xs text-slate-500 dark:text-slate-400">
          Remember your password?{' '}
          <Link to="/login" className="text-brand-500 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
