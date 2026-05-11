import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';

// Public pages
import HomePage from './pages/public/HomePage';
import ServicesPage from './pages/public/ServicesPage';
import StaffPage from './pages/public/StaffPage';
import GalleryPage from './pages/public/GalleryPage';
import ContactPage from './pages/public/ContactPage';
import SocialFeedPage from './pages/public/SocialFeedPage';

// Booking flow
import BookingPage from './pages/booking/BookingPage';
import BookingConfirmPage from './pages/booking/BookingConfirmPage';
import BookingSuccessPage from './pages/booking/BookingSuccessPage';

// Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Staff portal
import StaffPortalPage from './pages/staff/StaffPortalPage';

// Customer portal
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerBookings from './pages/customer/CustomerBookings';

// Admin
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBookings from './pages/admin/AdminBookings';
import AdminStaff from './pages/admin/AdminStaff';
import AdminServices from './pages/admin/AdminServices';
import AdminInventory from './pages/admin/AdminInventory';
import AdminReports from './pages/admin/AdminReports';
import AdminPromotions from './pages/admin/AdminPromotions';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminSocial from './pages/admin/AdminSocial';
import AdminLoyalty from './pages/admin/AdminLoyalty';

import { useAuthStore } from './store/authStore';
import PublicLayout from './components/layout/PublicLayout';
import ReviewModal from './components/ReviewModal';
import { bookingApi } from './services/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 1 },
  },
});

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role_name)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Refreshes the stored user on every app load so role_name is always up to date */
function AuthSync() {
  const { token, fetchMe } = useAuthStore();
  useEffect(() => {
    if (token) fetchMe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** Shows a review modal when a customer has a completed booking awaiting feedback */
function ReviewPrompt() {
  const { user } = useAuthStore();
  const [pendingBooking, setPendingBooking] = useState<null | {
    id: string; service_name: string; staff_name: string; start_time: string;
  }>(null);

  useEffect(() => {
    if (user?.role_name !== 'customer') return;
    bookingApi.pendingReview()
      .then(res => { if (res.data.booking) setPendingBooking(res.data.booking); })
      .catch(() => {});
  }, [user?.id]); // re-check when user changes

  if (!pendingBooking) return null;
  return <ReviewModal booking={pendingBooking} onClose={() => setPendingBooking(null)} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthSync />
        <ReviewPrompt />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#1a1a1a', color: '#faf8f4', borderRadius: '12px' },
            success: { iconTheme: { primary: '#d4a01e', secondary: '#faf8f4' } },
          }}
        />
        <Routes>
          {/* Public website */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/team" element={<StaffPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/feed" element={<SocialFeedPage />} />
          </Route>

          {/* Booking flow */}
          <Route path="/book" element={<BookingPage />} />
          <Route path="/book/confirm" element={<BookingConfirmPage />} />
          <Route path="/book/success" element={<BookingSuccessPage />} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Staff portal */}
          <Route path="/staff-portal" element={
            <ProtectedRoute roles={['staff']}>
              <StaffPortalPage />
            </ProtectedRoute>
          } />

          {/* Customer portal */}
          <Route path="/my/*" element={
            <ProtectedRoute roles={['customer']}>
              <CustomerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/my/bookings" element={
            <ProtectedRoute roles={['customer']}>
              <CustomerBookings />
            </ProtectedRoute>
          } />

          {/* Admin portal */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="promotions" element={<AdminPromotions />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="social" element={<AdminSocial />} />
            <Route path="loyalty" element={<AdminLoyalty />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
