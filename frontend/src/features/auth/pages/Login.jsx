import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLoginMutation } from '../../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Building, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation({
    onSuccess: (data) => {
      // Dynamic dashboard redirect based on role
      const role = data.user?.role?.toLowerCase() || 'renter';
      navigate(`/dashboard/${role}`);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel max-w-md w-full p-8 rounded-3xl border border-slate-200/60 dark:border-slate-900 shadow-2xl relative overflow-hidden transition-colors duration-300"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-sky-500"></div>

        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-sky-400 items-center justify-center text-white shadow-md shadow-brand-500/20 mb-4">
            <Building size={24} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">Welcome Back</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Sign in to access your luxury stays and properties
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

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-brand-500 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <Lock size={18} />
              </span>
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors duration-300"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full mt-6 bg-gradient-to-r from-brand-500 to-sky-600 hover:from-brand-600 hover:to-sky-700 text-white font-bold py-3.5 px-6 rounded-xl transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {loginMutation.isPending ? (
              'Signing In...'
            ) : (
              <>
                Sign In
                <LogIn size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-200 dark:border-slate-900 pt-6 text-xs text-slate-500 dark:text-slate-400">
          New to LuxeStays?{' '}
          <Link to="/register" className="text-brand-500 font-bold hover:underline">
            Get Started
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
