import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { bookingApi, resolveImageUrl } from '../../services/api';
import type { Booking, BookingStatus } from '../../types';

const STATUSES: BookingStatus[] = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];

function StatusBadge({ status }: { status: BookingStatus }) {
  return <span className={`badge-${status}`}>{status.replace('_', ' ')}</span>;
}

export default function AdminBookings() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ date_from: new Date().toISOString().split('T')[0], status: '', page: 1 });
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', filters],
    queryFn: () => bookingApi.list(filters),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => bookingApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-bookings'] }); toast.success('Status updated'); },
    onError: () => toast.error('Update failed'),
  });

  const bookings: Booking[] = Array.isArray(data?.data?.bookings) ? data.data.bookings : [];
  const total = typeof data?.data?.total === 'number' ? data.data.total : 0;

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-soft border border-gray-100 flex flex-wrap gap-3 items-center">
        <input
          type="date"
          value={filters.date_from}
          onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value, page: 1 }))}
          className="input-luxury text-sm py-2 w-auto"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
          className="input-luxury text-sm py-2 w-auto"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'list' ? 'bg-gold-gradient text-white' : 'border border-gray-200 text-onyx-600'}`}>
            📋 List
          </button>
          <button onClick={() => setView('calendar')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'calendar' ? 'bg-gold-gradient text-white' : 'border border-gray-200 text-onyx-600'}`}>
            📅 Calendar
          </button>
        </div>
        <div className="text-onyx-400 text-sm">{total} bookings found</div>
      </div>

      {view === 'list' ? (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 skeleton rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-left text-onyx-400 text-xs uppercase tracking-wide">
                    {[
                      { label: 'Ref', cls: 'hidden lg:table-cell' },
                      { label: 'Customer', cls: '' },
                      { label: 'Service', cls: 'hidden sm:table-cell' },
                      { label: 'Stylist', cls: 'hidden md:table-cell' },
                      { label: 'Date & Time', cls: 'hidden sm:table-cell' },
                      { label: 'Price', cls: 'hidden md:table-cell' },
                      { label: 'Status', cls: '' },
                      { label: 'Actions', cls: '' },
                    ].map((h) => (
                      <th key={h.label} className={`px-4 py-3 font-medium ${h.cls}`}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bookings.map((b) => (
                    <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gold-600 hidden lg:table-cell">#{b.reference}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-onyx-900">{b.customer_name}</div>
                        <div className="text-xs text-onyx-400">{b.customer_phone}</div>
                      </td>
                      <td className="px-4 py-3 text-onyx-700 hidden sm:table-cell">{b.service_name}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          {b.staff_image && (
                            <img src={resolveImageUrl(b.staff_image)} className="w-6 h-6 rounded-full object-cover" alt="" />
                          )}
                          <span className="text-onyx-700">{b.staff_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-onyx-700 text-xs hidden sm:table-cell">
                        {new Date(b.start_time).toLocaleDateString('en-NZ')}<br />
                        {new Date(b.start_time).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-onyx-900 hidden md:table-cell">NZ${Number(b.price).toFixed(2)}</td>
                      <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                      <td className="px-4 py-3">
                        <select
                          value={b.status}
                          onChange={(e) => updateStatus.mutate({ id: b.id, status: e.target.value })}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-gold-400 cursor-pointer"
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                      </td>
                    </motion.tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr><td colSpan={9} className="text-center text-onyx-400 py-12 px-4">No bookings found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > 20 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-onyx-400">Page {filters.page} of {Math.ceil(total / 20)}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, f.page - 1) }))}
                  disabled={filters.page === 1}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:border-gold-400 transition-colors"
                >← Prev</button>
                <button
                  onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                  disabled={filters.page >= Math.ceil(total / 20)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:border-gold-400 transition-colors"
                >Next →</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <CalendarView bookings={bookings} />
      )}
    </div>
  );
}

function CalendarView({ bookings }: { bookings: Booking[] }) {
  const today = new Date();
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const hours = Array.from({ length: 10 }, (_, i) => i + 9); // 9am to 6pm

  const getBookingsForDayAndHour = (day: Date, hour: number) =>
    bookings.filter((b) => {
      const d = new Date(b.start_time);
      return d.toDateString() === day.toDateString() && d.getHours() === hour;
    });

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header */}
          <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
            <div className="p-3" />
            {days.map((d) => (
              <div key={d.toISOString()} className="p-3 text-center border-l border-gray-100">
                <div className="text-xs text-onyx-400 uppercase">{d.toLocaleDateString('en-NZ', { weekday: 'short' })}</div>
                <div className={`text-lg font-bold mt-0.5 ${d.toDateString() === today.toDateString() ? 'text-gold-600' : 'text-onyx-900'}`}>
                  {d.getDate()}
                </div>
              </div>
            ))}
          </div>
          {/* Time grid */}
          {hours.map((hour) => (
            <div key={hour} className="grid border-b border-gray-50" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
              <div className="p-2 text-xs text-onyx-400 text-right pr-3">{hour}:00</div>
              {days.map((d) => {
                const dayBookings = getBookingsForDayAndHour(d, hour);
                return (
                  <div key={d.toISOString()} className="border-l border-gray-50 p-1 min-h-[52px]">
                    {dayBookings.map((b) => (
                      <div key={b.id} className={`text-xs rounded-lg px-2 py-1 mb-1 truncate ${
                        b.status === 'confirmed' ? 'bg-blue-100 text-blue-800'
                        : b.status === 'completed' ? 'bg-green-100 text-green-800'
                        : b.status === 'cancelled' ? 'bg-red-100 text-red-800'
                        : 'bg-gold-100 text-gold-800'
                      }`}>
                        {b.customer_name?.split(' ')[0]} – {b.service_name}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
