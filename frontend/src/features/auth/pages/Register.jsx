import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegisterMutation } from '../../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Building, User, Mail, Lock, UserCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['RENTER', 'OWNER'], { required_error: 'Please select a account type' }),
});

export default function Register() {
  const navigate = useNavigate();
  const registerMutation = useRegisterMutation({
    onSuccess: (data) => {
      const email = getValues('email');
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'RENTER',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = (data) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel max-w-lg w-full p-8 rounded-3xl border border-slate-200/60 dark:border-slate-900 shadow-2xl relative overflow-hidden transition-colors duration-300"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-sky-400 to-amber-500"></div>

        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-sky-400 items-center justify-center text-white shadow-md shadow-brand-500/20 mb-4">
            <Building size={24} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">Create Account</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Start your journey with LuxeStays luxury properties
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Role Choice Segment Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              I want to
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setValue('role', 'RENTER')}
                className={`py-3.5 px-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${
                  selectedRole === 'RENTER'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold shadow-lg shadow-brand-500/5'
                    : 'border-slate-200 dark:border-slate-900 text-slate-500 hover:border-slate-300 dark:hover:border-slate-800'
                }`}
              >
                <User size={18} />
                <span className="text-xs">Rent a Home</span>
              </button>
              <button
                type="button"
                onClick={() => setValue('role', 'OWNER')}
                className={`py-3.5 px-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${
                  selectedRole === 'OWNER'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold shadow-lg shadow-brand-500/5'
                    : 'border-slate-200 dark:border-slate-900 text-slate-500 hover:border-slate-300 dark:hover:border-slate-800'
                }`}
              >
                <Building size={18} />
                <span className="text-xs">List my Property</span>
              </button>
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <UserCheck size={18} />
              </span>
              <input
                type="text"
                {...register('name')}
                placeholder="John Doe"
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors duration-300"
              />
            </div>
            {errors.name && (
              <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.name.message}</p>
            )}
          </div>

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
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors duration-300"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <Lock size={18} />
              </span>
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors duration-300"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full mt-6 bg-gradient-to-r from-brand-500 to-sky-600 hover:from-brand-600 hover:to-sky-700 text-white font-bold py-3 px-6 rounded-xl transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {registerMutation.isPending ? 'Creating Account...' : 'Sign Up'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-200 dark:border-slate-900 pt-6 text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-500 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
