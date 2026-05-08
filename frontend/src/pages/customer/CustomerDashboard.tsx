import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { bookingApi, loyaltyApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] } }),
};

const TIER_META: Record<string, { icon: string; label: string; bg: string; text: string; bar: string; next: string; nextVal: number }> = {
  standard: { icon: '🌿', label: 'Standard', bg: 'bg-white/20',    text: 'text-white',   bar: 'bg-white/60',   next: 'Silver',   nextVal: 500  },
  silver:   { icon: '🥈', label: 'Silver',   bg: 'bg-white/20',    text: 'text-white',   bar: 'bg-white/60',   next: 'Gold',     nextVal: 1000 },
  gold:     { icon: '🥇', label: 'Gold',     bg: 'bg-yellow-400/30', text: 'text-yellow-200', bar: 'bg-yellow-300', next: 'VIP',  nextVal: 2500 },
  vip:      { icon: '💎', label: 'VIP',      bg: 'bg-white/20',    text: 'text-white',   bar: 'bg-white',      next: 'Platinum', nextVal: 5000 },
  platinum: { icon: '👑', label: 'Platinum', bg: 'bg-white/20',    text: 'text-white',   bar: 'bg-white',      next: '',         nextVal: 0   },
};

// For the sidebar card (light background)
const TIER_BADGE: Record<string, { bg: string; text: string; bar: string }> = {
  standard: { bg: 'bg-gray-100',   text: 'text-gray-700',   bar: 'bg-gray-400'   },
  silver:   { bg: 'bg-slate-100',  text: 'text-slate-700',  bar: 'bg-slate-400'  },
  gold:     { bg: 'bg-yellow-100', text: 'text-yellow-700', bar: 'bg-yellow-400' },
  vip:      { bg: 'bg-purple-100', text: 'text-purple-700', bar: 'bg-purple-500' },
  platinum: { bg: 'bg-indigo-100', text: 'text-indigo-700', bar: 'bg-indigo-500' },
};

export function CustomerDashboard() {
  const { user, logout } = useAuthStore();
  const { data: bookingsData } = useQuery({ queryKey: ['my-bookings'],      queryFn: () => bookingApi.list({ limit: 10 }) });
  const { data: loyaltyData }  = useQuery({ queryKey: ['my-loyalty'],       queryFn: loyaltyApi.profile });
  const { data: settingsData } = useQuery({ queryKey: ['loyalty-settings'], queryFn: loyaltyApi.getSettings });

  const bookings   = bookingsData?.data?.bookings || [];
  const loyalty    = loyaltyData?.data;
  const tiers: any[] = settingsData?.data?.tiers ?? [];

  const upcoming   = bookings.filter((b: any) => ['pending', 'confirmed'].includes(b.status));
  const completed  = bookings.filter((b: any) => b.status === 'completed');
  const totalSpend = completed.reduce((s: number, b: any) => s + Number(b.price || 0), 0);

  const tier        = loyalty?.membership_tier || 'standard';
  const tierMeta    = TIER_META[tier]  ?? TIER_META.standard;
  const tierBadge   = TIER_BADGE[tier] ?? TIER_BADGE.standard;
  const tierConfig  = tiers.find((t: any) => t.key === tier);
  const discount    = tierConfig?.discount ?? 0;
  const points      = Number(loyalty?.total_points || 0);
  const progressPct = tierMeta.nextVal > 0 ? Math.min(100, (points / tierMeta.nextVal) * 100) : 100;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center shadow-sm shadow-purple-200">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-bold text-gray-900 text-base tracking-tight">LuxeSalon</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/services" className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 transition-colors">Services</Link>
            <Link to="/team"     className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 transition-colors">Our Team</Link>
            <div className="w-px h-4 bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs ring-2 ring-purple-200">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden md:block">{user?.first_name}</span>
            </div>
            <button onClick={logout} className="text-xs text-gray-400 hover:text-red-500 transition-colors hidden sm:block">Sign out</button>
          </div>
        </div>
      </header>

      <div className="pt-16">

        {/* ── Purple hero header ── */}
        <div className="relative overflow-hidden bg-purple-600">
          {/* Decorative blobs */}
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-purple-500 rounded-full opacity-40 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-indigo-600 rounded-full opacity-30 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-white rounded-full opacity-5 blur-2xl pointer-events-none" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

          <div className="relative max-w-6xl mx-auto px-4 py-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                <p className="text-purple-200 text-xs font-semibold tracking-widest uppercase mb-2">My Portal</p>
                <h1 className="font-display text-4xl sm:text-5xl font-bold text-white leading-tight">
                  Hello, {user?.first_name} 👋
                </h1>
                {/* Tier badge */}
                <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-sm font-semibold border border-white/20 ${tierMeta.bg} ${tierMeta.text}`}>
                  {tierMeta.icon} {tierMeta.label} Member
                  {discount > 0 && <span className="opacity-75 text-xs">· {discount}% off</span>}
                </div>
              </motion.div>
              <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}>
                <Link to="/book"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-purple-700 font-semibold text-sm hover:bg-purple-50 transition-all shadow-lg shadow-purple-900/20 active:scale-95">
                  ✂️ Book Appointment
                </Link>
              </motion.div>
            </div>

            {/* Stats row — white cards floating over purple */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10">
              {[
                { icon: '📅', label: 'Total Bookings', value: bookings.length,                      suffix: '' },
                { icon: '✅', label: 'Completed',       value: completed.length,                     suffix: '' },
                { icon: '💰', label: 'Total Spent',     value: `NZ$${totalSpend.toFixed(0)}`,        suffix: '' },
                { icon: '⭐', label: 'Loyalty Points',  value: points,                               suffix: 'pts' },
              ].map((s, i) => (
                <motion.div
                  key={s.label} initial="hidden" animate="visible" custom={i + 2} variants={fadeUp}
                  className="bg-white rounded-2xl p-4 shadow-lg shadow-purple-900/10"
                >
                  <span className="text-xl">{s.icon}</span>
                  <p className="font-display text-2xl font-bold text-gray-900 mt-2">
                    {s.value}
                    {s.suffix && <span className="text-sm font-normal text-gray-400 ml-1">{s.suffix}</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left — bookings */}
            <div className="lg:col-span-2 space-y-6">

              {/* Upcoming */}
              <motion.div initial="hidden" animate="visible" custom={5} variants={fadeUp}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Upcoming Appointments</h3>
                  <Link to="/my/bookings" className="text-purple-600 text-xs font-medium hover:text-purple-700">View all →</Link>
                </div>
                {upcoming.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center text-3xl mx-auto mb-3">🗓</div>
                    <p className="font-semibold text-gray-700 mb-1">No upcoming bookings</p>
                    <p className="text-sm text-gray-400 mb-5">Treat yourself to a LuxeSalon experience.</p>
                    <Link to="/book" className="btn-primary text-sm px-6 py-2.5">Book Now</Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {upcoming.map((b: any) => (
                      <div key={b.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/70 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-lg flex-shrink-0">✂️</div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{b.service_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">with {b.staff_name}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(b.start_time).toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </p>
                          <p className="text-xs text-purple-600 mt-0.5 font-medium">
                            {new Date(b.start_time).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Recent visits */}
              {completed.length > 0 && (
                <motion.div initial="hidden" animate="visible" custom={6} variants={fadeUp}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Recent Visits</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {completed.slice(0, 4).map((b: any) => (
                      <div key={b.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/70 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{b.service_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(b.start_time).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-purple-600">NZ${Number(b.price).toFixed(2)}</span>
                          <Link to="/book"
                            className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:border-purple-300 hover:text-purple-600 transition-all">
                            Rebook
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="space-y-5">

              {/* Loyalty card */}
              <motion.div initial="hidden" animate="visible" custom={6} variants={fadeUp}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Purple accent bar */}
                <div className="bg-purple-600 px-5 py-4 relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full pointer-events-none" />
                  <div className="absolute -right-2 top-4 w-14 h-14 bg-white/10 rounded-full pointer-events-none" />
                  <div className="flex items-center justify-between relative">
                    <div>
                      <p className="text-purple-200 text-xs font-semibold uppercase tracking-wide">Loyalty Status</p>
                      <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-sm font-semibold border border-white/20 ${tierMeta.bg} ${tierMeta.text}`}>
                        {tierMeta.icon} {tierMeta.label}
                      </div>
                    </div>
                    <span className="text-4xl">{tierMeta.icon}</span>
                  </div>
                </div>
                <div className="p-5">
                  {discount > 0 && (
                    <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2 mb-4">
                      <span className="text-purple-500 text-sm">🏷</span>
                      <p className="text-xs text-purple-700"><span className="font-bold">{discount}% off</span> all services</p>
                    </div>
                  )}
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <span className="text-3xl font-bold text-gray-900">{points}</span>
                      <span className="text-sm text-gray-400 ml-1.5">points</span>
                    </div>
                    {tierMeta.nextVal > 0 && (
                      <span className="text-xs text-gray-400">{tierMeta.nextVal} for {tierMeta.next}</span>
                    )}
                  </div>
                  <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                      className={`h-full rounded-full ${tierBadge.bar}`}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2">NZ$1 spent = 1 loyalty point</p>
                </div>
              </motion.div>

              {/* Quick actions */}
              <motion.div initial="hidden" animate="visible" custom={7} variants={fadeUp}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-4">Quick Actions</h3>
                <div className="space-y-1.5">
                  {[
                    { to: '/book',        icon: '✂️', label: 'Book Appointment', primary: true  },
                    { to: '/my/bookings', icon: '📋', label: 'My Bookings',       primary: false },
                    { to: '/services',    icon: '🛎', label: 'Browse Services',   primary: false },
                    { to: '/team',        icon: '👥', label: 'Our Team',          primary: false },
                    { to: '/feed',        icon: '🎁', label: 'Offers & Feed',     primary: false },
                  ].map(({ to, icon, label, primary }) => (
                    <Link key={to} to={to}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        primary
                          ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm shadow-purple-200'
                          : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                      }`}>
                      <span>{icon}</span> {label}
                    </Link>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;
