import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/shared/MainLayout';
import Home from '../components/shared/Home';
import NotFound from '../components/shared/NotFound';
import Login from '../features/auth/pages/Login';
import Register from '../features/auth/pages/Register';
import VerifyOTP from '../features/auth/pages/VerifyOTP';
import ForgotPassword from '../features/auth/pages/ForgotPassword';
import ResetPassword from '../features/auth/pages/ResetPassword';
import ListProperty from '../features/property/components/ListProperty';
import PropertyDetails from '../features/property/components/PropertyDetails';
import AdminModeration from '../features/dashboard/admin/pages/AdminModeration';
import PropertySearch from '../features/property/components/PropertySearch';
import RoleRoute from './RoleRoute';
import AdminAnalytics from '../features/dashboard/admin/pages/AdminAnalytics';
import OwnerAnalytics from '../features/dashboard/owner/pages/OwnerAnalytics';
import Wishlist from '../features/property/pages/Wishlist';
import BookingsDashboard from '../features/dashboard/shared/BookingsDashboard';
import ChatInbox from '../features/chat/pages/ChatInbox';
import RenterDashboard from '../features/dashboard/renter/pages/RenterDashboard';
import Profile from '../features/auth/pages/Profile';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* List Property Creation */}
        <Route element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']} />}>
          <Route path="properties/new" element={<ListProperty />} />
        </Route>

        {/* Owner View */}
        <Route element={<RoleRoute allowedRoles={['OWNER', 'ADMIN']} />}>
          <Route path="dashboard/owner" element={<OwnerAnalytics />} />
        </Route>

        {/* Public Routes */}
        <Route index element={<Home />} />
        <Route path="properties/:id" element={<PropertyDetails />} />
        <Route path="properties" element={<PropertySearch />} />

        {/* Authentication Pages */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="verify-otp" element={<VerifyOTP />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />

        {/* Authenticated Member Views (Accessible to all roles) */}
        <Route element={<RoleRoute allowedRoles={['RENTER', 'OWNER', 'ADMIN']} />}>
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="bookings" element={<BookingsDashboard />} />
          <Route path="chats" element={<ChatInbox />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Role-Protected Dashboards */}
        {/* Renter View */}
        <Route element={<RoleRoute allowedRoles={['RENTER', 'ADMIN']} />}>
          <Route path="dashboard/renter" element={<RenterDashboard />} />
        </Route>

        {/* Admin View (Can moderate property list) */}
        <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
          <Route path="dashboard/admin" element={<AdminAnalytics />} />
          <Route path="dashboard/admin/moderation" element={<AdminModeration />} />
        </Route>

        {/* Fallbacks */}
        <Route
          path="error-test"
          element={
            <div className="text-center py-24 glass-panel rounded-3xl border border-slate-200 dark:border-slate-900 max-w-lg mx-auto">
              <h2 className="text-2xl font-bold mb-4 text-rose-500">Test Error boundary</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Simulate a rendering crash to test the global ErrorBoundary catcher.</p>
              <button
                onClick={() => {
                  throw new Error('Simulated runtime exception for verification.');
                }}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 px-6 rounded-xl transition duration-200"
              >
                Trigger Runtime Error
              </button>
            </div>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

// Helper Link mapping internally to clear naming conflicts
import { Link as RouteLink } from 'react-router-dom';
