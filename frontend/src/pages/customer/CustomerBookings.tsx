import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { bookingApi } from '../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import type { Booking } from '../../types';

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  pending:   { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  confirmed: { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  completed: { bg: 'bg-green-100',  text: 'text-green-700'  },
  cancelled: { bg: 'bg-red-100',    text: 'text-red-600'    },
  no_show:   { bg: 'bg-gray-100',   text: 'text-gray-500'   },
};

function serviceIcon(name = '') {
  const n = name.toLowerCase();
  if (n.includes('colour') || n.includes('color') || n.includes('highlight') || n.includes('balayage')) return '🎨';
  if (n.includes('nail') || n.includes('mani') || n.includes('pedi')) return '💅';
  if (n.includes('facial') || n.includes('skin')) return '✨';
  if (n.includes('lash') || n.includes('brow') || n.includes('wax')) return '💄';
  if (n.includes('massage') || n.includes('stone')) return '🧘';
  return '✂️';
}

export default function CustomerBookings() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings-all'],
    queryFn: () => bookingApi.list({ limit: 50 }),
  });
  const bookings: Booking[] = data?.data?.bookings || [];

  const cancel = useMutation({
    mutationFn: (id: string) => bookingApi.updateStatus(id, 'cancelled'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-bookings-all'] }); toast.success('Booking cancelled'); },
    onError: () => toast.error('Could not cancel booking'),
  });

  const upcoming = bookings.filter(b => ['pending', 'confirmed'].includes(b.status));
  const past     = bookings.filter(b => ['completed', 'cancelled', 'no_show'].includes(b.status));
  const list     = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center shadow-sm shadow-purple-200">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-bold text-gray-900 text-base tracking-tight">LuxeSalon</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/my" className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">Dashboard</Link>
            <Link to="/book" className="btn-primary text-sm px-4 py-2">+ Book</Link>
          </div>
        </div>
      </header>

      <div className="pt-16">

        {/* ── Purple hero header ── */}
        <div className="relative overflow-hidden bg-purple-600">
          {/* Decorative blobs */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-500 rounded-full opacity-40 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 left-1/4 w-60 h-60 bg-indigo-600 rounded-full opacity-30 blur-3xl pointer-events-none" />
          {/* Dot grid */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

          <div className="relative max-w-4xl mx-auto px-4 py-10">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Link to="/my" className="inline-flex items-center gap-1.5 text-purple-200 text-sm hover:text-white transition-colors mb-3">
                ← Dashboard
              </Link>
              <h1 className="font-display text-4xl font-bold text-white">My Bookings</h1>
              <p className="text-purple-200 text-sm mt-1">
                {bookings.length} appointment{bookings.length !== 1 ? 's' : ''} total
              </p>
            </motion.div>

            {/* Summary pills */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
              className="flex gap-3 mt-6"
            >
              {[
                { label: 'Upcoming', count: upcoming.length, color: 'bg-white/20 text-white' },
                { label: 'Completed', count: past.filter(b => b.status === 'completed').length, color: 'bg-white/10 text-purple-200' },
              ].map(p => (
                <div key={p.label} className={`px-4 py-2 rounded-xl text-sm font-semibold ${p.color} border border-white/20`}>
                  {p.count} {p.label}
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="bg-white border-b border-gray-100 sticky top-16 z-10">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex gap-0">
              {([
                { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
                { key: 'past',     label: 'Past',     count: past.length     },
              ] as const).map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`relative px-6 py-4 text-sm font-semibold transition-colors flex items-center gap-2 ${
                    tab === t.key ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    tab === t.key ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {t.count}
                  </span>
                  {tab === t.key && (
                    <motion.div layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bookings list ── */}
        <div className="max-w-4xl mx-auto px-4 py-6 pb-16">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-white border border-gray-100 animate-pulse" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center text-4xl mx-auto mb-4">
                {tab === 'upcoming' ? '🗓' : '📂'}
              </div>
              <h3 className="font-display text-xl font-bold text-gray-700 mb-2">
                {tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                {tab === 'upcoming'
                  ? 'Treat yourself to a LuxeSalon experience.'
                  : 'Your completed appointments will appear here.'}
              </p>
              {tab === 'upcoming' && <Link to="/book" className="btn-primary">Book Now</Link>}
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
                {list.map((booking, i) => {
                  const st = STATUS_STYLE[booking.status] ?? STATUS_STYLE.pending;
                  return (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-100 transition-all overflow-hidden"
                    >
                      {/* Purple left accent */}
                      <div className="flex">
                        <div className={`w-1 flex-shrink-0 ${
                          booking.status === 'completed' ? 'bg-green-400'
                          : booking.status === 'confirmed' ? 'bg-blue-400'
                          : booking.status === 'cancelled' ? 'bg-red-300'
                          : 'bg-purple-500'
                        }`} />

                        <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                          {/* Icon */}
                          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-2xl flex-shrink-0">
                            {serviceIcon(booking.service_name)}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{booking.service_name}</h3>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${st.bg} ${st.text}`}>
                                {booking.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">
                              with <span className="text-gray-700 font-medium">{booking.staff_name}</span>
                            </p>
                            <div className="flex flex-wrap gap-4 mt-2">
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                📅 {new Date(booking.start_time).toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                ⏰ {new Date(booking.start_time).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {booking.reference && (
                                <span className="text-xs text-gray-300 font-mono">#{booking.reference}</span>
                              )}
                            </div>
                          </div>

                          {/* Price + actions */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 flex-shrink-0">
                            <p className="text-xl font-bold text-purple-600">NZ${Number(booking.price).toFixed(2)}</p>
                            <div className="flex gap-2">
                              {['pending', 'confirmed'].includes(booking.status) && (
                                <button
                                  onClick={() => { if (confirm('Cancel this booking?')) cancel.mutate(booking.id); }}
                                  className="text-xs border border-red-200 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all"
                                >
                                  Cancel
                                </button>
                              )}
                              {booking.status === 'completed' && (
                                <Link
                                  to="/book"
                                  className="text-xs border border-purple-200 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-all font-medium"
                                >
                                  Rebook
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
