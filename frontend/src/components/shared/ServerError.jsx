import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function ServerError() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="text-center z-10 max-w-lg w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-block"
        >
          <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400 inline-flex">
            <AlertCircle size={64} className="animate-pulse" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-7xl font-extrabold tracking-tight text-slate-800"
        >
          500
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold mt-2 mb-4"
        >
          <span className="bg-gradient-to-r from-rose-400 to-amber-500 bg-clip-text text-transparent">
            Server Connection Issue
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-slate-400 mb-8 max-w-sm mx-auto"
        >
          We are having trouble communicating with our luxury systems. Please check your network connection or try again later.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={handleReload}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 text-white font-semibold py-3 px-8 rounded-xl transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-rose-500/20"
          >
            <RefreshCw size={18} />
            Try Reconnecting
          </button>
          <a
            href="/"
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold py-3 px-8 rounded-xl transition duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Home size={18} />
            Go to Home
          </a>
        </motion.div>
      </div>
    </div>
  );
}
