import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Bell, User, LogOut, MessageSquare, Building, LayoutDashboard, Heart, Compass, Sun, Moon, Calendar } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useNotificationsQuery, useMarkAsReadMutation, useMarkAllAsReadMutation } from '../../features/notification/hooks/useNotification';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';

export default function MainLayout() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isSidebarOpen, toggleSidebar, closeSidebar, unreadNotificationCount, theme, toggleTheme } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);
  const { data: notificationsRes } = useNotificationsQuery({ enabled: isAuthenticated });
  const markAsRead = useMarkAsReadMutation();
  const markAllAsRead = useMarkAllAsReadMutation();

  const notifications = notificationsRes?.success ? notificationsRes.data : [];
  const unreadCount = notifications.filter(n => !n.read).length;

  // 1. Fetch renter bookings (if renter)
  const { data: renterBookingsRes } = useQuery({
    queryKey: ['headerRenterBookings'],
    queryFn: async () => {
      const response = await api.get('/bookings/my-bookings');
      return response.success ? response.data : [];
    },
    enabled: isAuthenticated && user?.role === 'RENTER',
    refetchInterval: 15000,
  });

  // 2. Fetch owner bookings (if landlord/owner)
  const { data: ownerBookingsRes } = useQuery({
    queryKey: ['headerOwnerBookings'],
    queryFn: async () => {
      const response = await api.get('/bookings/owner-requests');
      return response.success ? response.data : [];
    },
    enabled: isAuthenticated && user?.role === 'OWNER',
    refetchInterval: 15000,
  });

  // 3. Fetch chats unread
  const { data: chatsRes } = useQuery({
    queryKey: ['headerChats'],
    queryFn: async () => {
      const response = await api.get('/chats');
      return response.success ? response.data : [];
    },
    enabled: isAuthenticated,
    refetchInterval: 10000,
  });

  const unreadChatsCount = (chatsRes || []).filter(c => c.unread).length;

  const bookingsBadgeCount = user?.role === 'OWNER'
    ? (ownerBookingsRes || []).filter(b => b.status === 'PENDING').length
    : (renterBookingsRes || []).filter(b => b.status === 'APPROVED').length;

  // Sync theme changes with the HTML document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleLogout = () => {
    logout();
    closeSidebar();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Explore', path: '/properties', icon: Compass },
    ...(isAuthenticated ? [
      { label: 'Wishlist', path: '/wishlist', icon: Heart },
      { label: 'Bookings', path: '/bookings', icon: Calendar, badge: bookingsBadgeCount },
      { label: 'Chats', path: '/chats', icon: MessageSquare, badge: unreadChatsCount },
      { label: 'Dashboard', path: `/dashboard/${user?.role?.toLowerCase()}`, icon: LayoutDashboard }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-brand-500 selection:text-white transition-colors duration-300">
      {/* Background radial glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-200/50 via-slate-50 to-slate-50 dark:from-slate-900/50 dark:via-slate-950 dark:to-slate-950 pointer-events-none z-0"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/60 dark:border-slate-900/60 shadow-lg backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative z-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
              <Building size={20} className="stroke-[2.5]" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent group-hover:text-brand-400 transition-colors duration-200">
              Luxe<span className="gold-gradient-text font-black">Stays</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 text-sm font-semibold transition-all duration-200 hover:text-slate-900 dark:hover:text-white ${
                    isActive ? 'text-brand-500 dark:text-brand-400 font-bold' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'stroke-[2.5]' : ''} />
                  <span>{link.label}</span>
                  {link.badge > 0 && (
                    <span className="min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white dark:border-slate-950 px-1 animate-pulse">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-6">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              aria-label="Toggle Theme"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {isAuthenticated ? (
              <>
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-500 rounded-full text-xs font-bold text-white flex items-center justify-center border-2 border-slate-50 dark:border-slate-950 scale-90 animate-bounce">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown panel */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 py-2">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Alerts</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllAsRead.mutate()}
                            className="text-[10px] text-brand-500 font-bold hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {notifications.length === 0 ? (
                          <p className="text-center py-6 text-xs text-slate-400">No notifications</p>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n._id}
                              onClick={() => {
                                if (!n.read) markAsRead.mutate(n._id);
                                setShowNotifications(false);
                              }}
                              className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer transition ${
                                !n.read ? 'bg-brand-500/5 font-bold' : ''
                              }`}
                            >
                              <p className="text-xs text-slate-800 dark:text-slate-200">{n.title}</p>
                              <p className="text-[10px] text-slate-400 mt-1 leading-snug">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-900">
                  <Link
                    to="/profile"
                    className="p-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-900 text-slate-600 dark:text-slate-400 hover:text-brand-500 transition-all duration-200"
                    title="Edit Profile"
                  >
                    <User size={18} />
                  </Link>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Welcome,</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{user?.name || 'User'}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-900 text-rose-500 hover:text-rose-400 transition-all duration-200"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-brand-500 to-sky-600 hover:from-brand-600 hover:to-sky-700 text-white text-sm font-bold py-2.5 px-5 rounded-xl transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-500/10"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Actions */}
          <div className="md:hidden flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {isAuthenticated && (
              <Link to="/notifications" className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <Bell size={20} />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadNotificationCount}
                  </span>
                )}
              </Link>
            )}

            <button
              onClick={toggleSidebar}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebar}
              className="fixed inset-0 bg-black z-45 md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-72 bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-900 z-50 p-6 flex flex-col justify-between md:hidden shadow-2xl transition-colors duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <span className="text-lg font-bold">Menu</span>
                  <button onClick={closeSidebar} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={closeSidebar}
                        className="flex items-center justify-between text-base font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white p-3 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-900/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={20} />
                          <span>{link.label}</span>
                        </div>
                        {link.badge > 0 && (
                          <span className="min-w-[20px] h-[20px] bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center border border-slate-50 dark:border-slate-950 px-1 animate-pulse">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div>
                {isAuthenticated ? (
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-900 flex flex-col gap-4">
                    <Link
                      to="/profile"
                      onClick={closeSidebar}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <div className="p-2 bg-slate-200 dark:bg-slate-900 rounded-lg">
                        <User size={20} className="text-brand-500 dark:text-brand-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{user?.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                      </div>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 font-semibold py-3 px-4 rounded-xl transition duration-200"
                    >
                      <LogOut size={18} />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pt-6 border-t border-slate-200 dark:border-slate-900">
                    <Link
                      to="/login"
                      onClick={closeSidebar}
                      className="w-full flex items-center justify-center border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold py-3 px-4 rounded-xl transition duration-200"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={closeSidebar}
                      className="w-full flex items-center justify-center bg-gradient-to-r from-brand-500 to-sky-600 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 shadow-md shadow-brand-500/10"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-100/60 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-900/80 py-12 backdrop-blur-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-500 to-sky-400 flex items-center justify-center text-white">
              <Building size={16} />
            </div>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-200">Luxe<span className="gold-gradient-text font-black">Stays</span></span>
          </div>
          <p className="text-slate-500 text-xs">
            &copy; 2026 LuxeStays. All rights reserved. Built for ultra-luxury experiences.
          </p>
          <div className="flex gap-6 text-sm text-slate-500 dark:text-slate-400">
            <Link to="/properties" className="hover:text-slate-900 dark:hover:text-white transition-colors">Properties</Link>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
