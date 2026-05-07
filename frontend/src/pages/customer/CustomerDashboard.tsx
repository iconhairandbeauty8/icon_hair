// CustomerDashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { bookingApi, loyaltyApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { motion } from 'framer-motion';

export function CustomerDashboard() {
  const { user, logout } = useAuthStore();
  const { data: bookingsData } = useQuery({ queryKey: ['my-bookings'], queryFn: () => bookingApi.list({ limit: 5 }) });
  const { data: loyaltyData } = useQuery({ queryKey: ['my-loyalty'], queryFn: loyaltyApi.profile });

  const bookings = bookingsData?.data?.bookings || [];
  const loyalty = loyaltyData?.data;

  const upcomingBookings = bookings.filter((b: any) => ['pending','confirmed'].includes(b.status));
  const pastBookings = bookings.filter((b: any) => ['completed','cancelled','no_show'].includes(b.status));

  const TIER_COLORS: Record<string,string> = { standard:'bg-gray-100 text-gray-700', silver:'bg-slate-100 text-slate-700', gold:'bg-yellow-100 text-yellow-700', vip:'bg-gold-100 text-gold-700', platinum:'bg-purple-100 text-purple-700' };
  const tier = loyalty?.membership_tier || 'standard';

  return (
    <div className="min-h-screen bg-ivory pt-20">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-onyx-900">Hello, {user?.first_name} 👋</h1>
            <p className="text-onyx-500 mt-1">Welcome to your LuxeSalon portal</p>
          </div>
          <div className="flex gap-3">
            <Link to="/book" className="btn-gold">+ Book Appointment</Link>
            <button onClick={logout} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-onyx-600 hover:border-red-300 hover:text-red-600 transition-colors">Logout</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { icon: '📅', label: 'Total Bookings', value: bookings.length },
              { icon: '✅', label: 'Completed', value: pastBookings.filter((b:any)=>b.status==='completed').length },
              { icon: '⭐', label: 'Loyalty Points', value: loyalty?.total_points || 0 },
            ].map(s => (
              <motion.div key={s.label} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="card-luxury p-5 text-center">
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="font-display text-2xl font-bold text-onyx-900">{s.value}</div>
                <div className="text-xs text-onyx-400 mt-0.5">{s.label}</div>
              </motion.div>
            ))}

            {/* Upcoming */}
            <div className="col-span-2 sm:col-span-3 card-luxury p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-onyx-700">Upcoming Appointments</h3>
                <Link to="/my/bookings" className="text-gold-600 text-xs hover:text-gold-700">View all →</Link>
              </div>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-6 text-onyx-400">
                  <div className="text-3xl mb-2">📅</div>
                  <p className="text-sm">No upcoming bookings</p>
                  <Link to="/book" className="btn-gold mt-3 inline-block text-sm px-5 py-2">Book Now</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between p-3 bg-gold-50 rounded-xl">
                      <div>
                        <div className="font-medium text-onyx-900 text-sm">{b.service_name}</div>
                        <div className="text-xs text-onyx-500 mt-0.5">with {b.staff_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-onyx-900">{new Date(b.start_time).toLocaleDateString('en-NZ')}</div>
                        <div className="text-xs text-gold-600">{new Date(b.start_time).toLocaleTimeString('en-NZ',{hour:'2-digit',minute:'2-digit'})}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Loyalty sidebar */}
          <div className="space-y-4">
            <div className="card-luxury p-5">
              <h3 className="font-semibold text-onyx-700 mb-3">Loyalty Status</h3>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3 capitalize ${TIER_COLORS[tier]}`}>
                {tier === 'vip' ? '💎' : tier === 'gold' ? '🥇' : tier === 'silver' ? '🥈' : tier === 'platinum' ? '👑' : '🌿'} {tier}
              </div>
              <div className="text-2xl font-bold text-gold-600">{loyalty?.total_points || 0}</div>
              <div className="text-xs text-onyx-400">loyalty points</div>
              <div className="mt-4 bg-gray-100 rounded-full h-2">
                <div className="bg-gold-gradient h-2 rounded-full" style={{width:`${Math.min(100,(loyalty?.total_points||0)/50)}%`}}/>
              </div>
              <p className="text-xs text-onyx-400 mt-2">Every NZ$1 spent = 1 point</p>
            </div>

            <div className="card-luxury p-5">
              <h3 className="font-semibold text-onyx-700 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link to="/book" className="flex items-center gap-2 p-2.5 rounded-xl bg-gold-50 text-gold-700 text-sm font-medium hover:bg-gold-100 transition-colors">
                  <span>✂️</span> Book Appointment
                </Link>
                <Link to="/services" className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-gray-50 text-onyx-600 text-sm transition-colors">
                  <span>📋</span> Browse Services
                </Link>
                <Link to="/team" className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-gray-50 text-onyx-600 text-sm transition-colors">
                  <span>👥</span> Our Team
                </Link>
                <Link to="/feed" className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-gray-50 text-onyx-600 text-sm transition-colors">
                  <span>🎁</span> Offers & Promotions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;
