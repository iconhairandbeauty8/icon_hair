import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { bookingApi, staffApi, resolveImageUrl } from '../../services/api';
import type { Booking, BookingStatus } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUSES: BookingStatus[] = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
const START_H  = 8;          // 8 AM
const END_H    = 20;         // 8 PM
const SLOT_MIN = 30;         // minutes per grid slot
const SLOT_H   = 56;         // px per 30-min slot  → 1 hour = 112px
const N_SLOTS  = (END_H - START_H) * (60 / SLOT_MIN);  // 24 slots
const GRID_H   = N_SLOTS * SLOT_H;                      // 1344 px total
const COL_GAP  = 3;          // px gap between side-by-side cards

// ─── Status styles ────────────────────────────────────────────────────────────
const S: Record<string, { bg: string; light: string; text: string; dot: string; badge: string }> = {
  confirmed: { bg: 'bg-blue-500',    light: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700' },
  pending:   { bg: 'bg-amber-400',   light: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400',   badge: 'bg-amber-100 text-amber-700' },
  completed: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  cancelled: { bg: 'bg-red-400',     light: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400',     badge: 'bg-red-100 text-red-500' },
  no_show:   { bg: 'bg-gray-400',    light: 'bg-gray-50',    text: 'text-gray-500',    dot: 'bg-gray-400',    badge: 'bg-gray-100 text-gray-500' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function toDateStr(d: Date) { return d.toISOString().split('T')[0]; }
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true });
}
function fmtHour(h: number) {
  return h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`;
}

/** Snap booking to grid slots, return top & height in px */
function bookingGeom(b: Booking) {
  const s = new Date(b.start_time);
  const e = new Date(b.end_time);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return { top: 0, height: SLOT_H };

  const sm = s.getHours() * 60 + s.getMinutes() - START_H * 60;
  const em = e.getHours() * 60 + e.getMinutes() - START_H * 60;
  const startSlot = Math.round(sm / SLOT_MIN);
  const endSlot   = Math.max(startSlot + 1, Math.round(em / SLOT_MIN));

  return {
    top:    Math.max(0, startSlot) * SLOT_H,
    height: Math.max(1, endSlot - startSlot) * SLOT_H,
  };
}

/** Greedy column layout for overlapping bookings */
function layoutDay(bookings: Booking[]) {
  const result = new Map<string, { col: number; totalCols: number }>();
  if (!bookings.length) return result;

  const sorted = [...bookings].sort((a, b) => +new Date(a.start_time) - +new Date(b.start_time));
  const colEnds: number[] = [];
  const colOf   = new Map<string, number>();

  for (const b of sorted) {
    const start = +new Date(b.start_time);
    const end   = +new Date(b.end_time);
    let col = colEnds.findIndex(e => e <= start);
    if (col === -1) col = colEnds.length;
    colEnds[col] = end;
    colOf.set(b.id, col);
  }

  for (const b of sorted) {
    const start = +new Date(b.start_time);
    const end   = +new Date(b.end_time);
    const col   = colOf.get(b.id)!;
    let maxCol  = col;
    for (const [id, c] of colOf) {
      if (id === b.id) continue;
      const o = sorted.find(x => x.id === id)!;
      if (+new Date(o.start_time) < end && +new Date(o.end_time) > start)
        maxCol = Math.max(maxCol, c);
    }
    result.set(b.id, { col, totalCols: maxCol + 1 });
  }
  return result;
}

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${S[status]?.badge ?? S.pending.badge}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminBookings() {
  const qc = useQueryClient();
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [listFilters, setListFilters] = useState({
    date_from: new Date().toISOString().split('T')[0], status: '', page: 1,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => bookingApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-bookings'] });
      qc.invalidateQueries({ queryKey: ['cal-bookings'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Update failed'),
  });

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ['admin-bookings', listFilters],
    queryFn: () => bookingApi.list(listFilters),
    enabled: view === 'list',
  });

  const bookings: Booking[] = Array.isArray(listData?.data?.bookings) ? listData.data.bookings : [];
  const total = typeof listData?.data?.total === 'number' ? listData.data.total : 0;

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['calendar', 'list'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {v === 'calendar' ? '📅 Calendar' : '📋 List'}
          </button>
        ))}
      </div>

      {view === 'calendar' ? (
        <CalendarView updateStatus={updateStatus} />
      ) : (
        <ListView
          filters={listFilters} setFilters={setListFilters}
          bookings={bookings} total={total} isLoading={listLoading}
          updateStatus={updateStatus}
        />
      )}
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────
function ListView({ filters, setFilters, bookings, total, isLoading, updateStatus }: any) {
  return (
    <>
      <div className="bg-white rounded-2xl p-4 shadow-soft border border-gray-100 flex flex-wrap gap-3 items-center">
        <input type="date" value={filters.date_from}
          onChange={e => setFilters((f: any) => ({ ...f, date_from: e.target.value, page: 1 }))}
          className="input-luxury text-sm py-2 w-auto" />
        <select value={filters.status}
          onChange={e => setFilters((f: any) => ({ ...f, status: e.target.value, page: 1 }))}
          className="input-luxury text-sm py-2 w-auto">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <span className="text-gray-400 text-sm ml-auto">{total} bookings</span>
      </div>
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                  {['Ref','Customer','Service','Stylist','Date & Time','Price','Status','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b: Booking) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gold-600">#{b.reference}</td>
                    <td className="px-4 py-3"><div className="font-medium">{b.customer_name}</div><div className="text-xs text-gray-400">{b.customer_phone}</div></td>
                    <td className="px-4 py-3 text-gray-700">{b.service_name}</td>
                    <td className="px-4 py-3 text-gray-700">{b.staff_name}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{new Date(b.start_time).toLocaleDateString('en-NZ')}<br />{fmtTime(b.start_time)}</td>
                    <td className="px-4 py-3 font-semibold">NZ${Number(b.price).toFixed(2)}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3">
                      <select value={b.status} onChange={e => updateStatus.mutate({ id: b.id, status: e.target.value })}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none focus:border-gold-400">
                        {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && <tr><td colSpan={8} className="text-center text-gray-400 py-12">No bookings found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {total > 20 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-400">Page {filters.page} of {Math.ceil(total / 20)}</span>
            <div className="flex gap-2">
              <button onClick={() => setFilters((f: any) => ({ ...f, page: Math.max(1, f.page - 1) }))} disabled={filters.page === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:border-gold-400">← Prev</button>
              <button onClick={() => setFilters((f: any) => ({ ...f, page: f.page + 1 }))} disabled={filters.page >= Math.ceil(total / 20)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:border-gold-400">Next →</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────
function CalendarView({ updateStatus }: { updateStatus: any }) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [staffFilter, setStaffFilter] = useState('');
  const [selected, setSelected] = useState<Booking | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const weekEnd = addDays(weekStart, 6);
  const days    = [...Array(7)].map((_, i) => addDays(weekStart, i));
  // hours for the time gutter: show each hour label
  const hourRows = Array.from({ length: END_H - START_H + 1 }, (_, i) => START_H + i);

  const { data: calData, isLoading } = useQuery({
    queryKey: ['cal-bookings', toDateStr(weekStart), staffFilter],
    queryFn: () => bookingApi.list({
      date_from: toDateStr(weekStart),
      date_to: toDateStr(weekEnd),
      ...(staffFilter ? { employee_id: staffFilter } : {}),
      limit: 300,
    }),
  });
  const { data: staffData } = useQuery({
    queryKey: ['staff-list-cal'],
    queryFn: () => staffApi.list(),
  });

  const allBookings: Booking[] = Array.isArray(calData?.data?.bookings) ? calData.data.bookings : [];
  const staffList = Array.isArray(staffData?.data) ? staffData.data : [];

  // Scroll to 9 AM on mount
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = SLOT_H * 2; // 2 slots = 1 hour = 9 AM
  }, []);

  const now    = new Date();
  const nowPct = Math.max(0, Math.min(1,
    (now.getHours() * 60 + now.getMinutes() - START_H * 60) / ((END_H - START_H) * 60)
  ));
  const nowTop = nowPct * GRID_H;
  const isThisWeek = (() => { const t = new Date(); t.setHours(0,0,0,0); return t >= weekStart && t <= weekEnd; })();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden flex flex-col"
      style={{ height: 'calc(100vh - 190px)' }}>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-1">
          <button onClick={() => setWeekStart(d => addDays(d, -7))}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors text-lg font-bold">‹</button>
          <button onClick={() => setWeekStart(d => addDays(d, 7))}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors text-lg font-bold">›</button>
          <button onClick={() => setWeekStart(getWeekStart(new Date()))}
            className="ml-1 px-3 h-8 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors">
            Today
          </button>
        </div>
        <span className="font-semibold text-gray-800 text-sm">
          {weekStart.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })} – {weekEnd.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        {isLoading && <span className="text-xs text-gray-400 animate-pulse">Loading…</span>}

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {/* Legend */}
          <div className="hidden lg:flex items-center gap-1.5">
            {STATUSES.map(s => (
              <span key={s} className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${S[s].badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${S[s].dot}`} />
                {s.replace('_', ' ')}
              </span>
            ))}
          </div>
          <select value={staffFilter} onChange={e => setStaffFilter(e.target.value)}
            className="h-9 text-sm border border-gray-200 rounded-xl px-3 focus:outline-none focus:border-purple-400 bg-white cursor-pointer">
            <option value="">All Staff</option>
            {staffList.map((s: any) => (
              <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Day headers ── */}
      <div className="grid flex-shrink-0 border-b border-gray-200 bg-white"
        style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
        <div />
        {days.map(d => {
          const isToday = d.toDateString() === new Date().toDateString();
          const count   = allBookings.filter(b => new Date(b.start_time).toDateString() === d.toDateString()).length;
          return (
            <div key={d.toISOString()}
              className={`py-2 text-center border-l border-gray-100 ${isToday ? 'bg-purple-50' : ''}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? 'text-purple-500' : 'text-gray-400'}`}>
                {d.toLocaleDateString('en-NZ', { weekday: 'short' })}
              </p>
              <p className={`text-xl font-black leading-none mt-0.5 ${isToday ? 'text-purple-600' : 'text-gray-800'}`}>
                {d.getDate()}
              </p>
              {count > 0 && (
                <p className={`text-[9px] font-semibold mt-0.5 ${isToday ? 'text-purple-400' : 'text-gray-400'}`}>
                  {count} booking{count > 1 ? 's' : ''}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Scrollable grid ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', height: GRID_H }}>

          {/* Time gutter */}
          <div className="relative border-r border-gray-200 bg-gray-50/50" style={{ height: GRID_H }}>
            {hourRows.map(h => (
              <div key={h}
                style={{ position: 'absolute', top: (h - START_H) * SLOT_H * 2, left: 0, right: 0 }}
                className="flex items-center justify-end pr-2"
              >
                <span className="text-[10px] font-semibold text-gray-400 leading-none bg-gray-50/50 px-0.5"
                  style={{ transform: 'translateY(-50%)' }}>
                  {fmtHour(h)}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d, di) => {
            const isToday = d.toDateString() === new Date().toDateString();
            const dayBookings = allBookings.filter(b =>
              new Date(b.start_time).toDateString() === d.toDateString()
            );
            const layout = layoutDay(dayBookings);

            return (
              <div key={di}
                style={{ height: GRID_H, position: 'relative', overflow: 'hidden' }}
                className={`border-l border-gray-100 ${isToday ? 'bg-purple-50/20' : ''}`}
              >
                {/* Hour gridlines */}
                {hourRows.map(h => (
                  <div key={h}>
                    {/* Full hour — solid */}
                    <div style={{ position: 'absolute', top: (h - START_H) * SLOT_H * 2, left: 0, right: 0, height: 1, background: '#e5e7eb' }} />
                    {/* Half hour — dashed, only between rows */}
                    {h < END_H && (
                      <div style={{ position: 'absolute', top: (h - START_H) * SLOT_H * 2 + SLOT_H, left: 8, right: 0, height: 1, background: 'repeating-linear-gradient(90deg,#e5e7eb 0,#e5e7eb 4px,transparent 4px,transparent 8px)' }} />
                    )}
                  </div>
                ))}

                {/* Current time line */}
                {isToday && isThisWeek && (
                  <div style={{ position: 'absolute', top: nowTop, left: -4, right: 0, zIndex: 20, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                    <div style={{ flex: 1, height: 2, background: '#ef4444' }} />
                  </div>
                )}

                {/* Booking cards */}
                {dayBookings.map(b => {
                  const { top, height } = bookingGeom(b);
                  const { col, totalCols } = layout.get(b.id) ?? { col: 0, totalCols: 1 };
                  const widthPct = 100 / totalCols;
                  const st = S[b.status] ?? S.pending;

                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelected(b)}
                      style={{
                        position: 'absolute',
                        top:    top + 1,
                        left:   `calc(${col * widthPct}% + ${COL_GAP}px)`,
                        width:  `calc(${widthPct}% - ${COL_GAP * 2}px)`,
                        height: height - 2,
                        zIndex: 5,
                        cursor: 'pointer',
                      }}
                      className="rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:z-10 transition-shadow"
                    >
                      {/* Colored top header */}
                      <div className={`${st.bg} px-2 py-1 flex items-center gap-1`}>
                        <p className="text-white text-[11px] font-bold truncate leading-tight flex-1">
                          {b.customer_name}
                        </p>
                      </div>
                      {/* Light body */}
                      <div className={`${st.light} px-2 py-1 h-full`}>
                        <p className="text-[10px] font-semibold text-gray-600 truncate leading-snug">
                          {fmtTime(b.start_time)} – {fmtTime(b.end_time)}
                        </p>
                        {height > SLOT_H + 12 && (
                          <p className="text-[10px] text-gray-500 truncate leading-snug mt-0.5">
                            {b.service_name}
                          </p>
                        )}
                        {height > SLOT_H * 2 && b.staff_name && (
                          <p className="text-[10px] text-gray-400 truncate leading-snug mt-0.5">
                            {b.staff_name}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <BookingDetail booking={selected} onClose={() => setSelected(null)} updateStatus={updateStatus} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Booking Detail Modal ─────────────────────────────────────────────────────
function BookingDetail({ booking: b, onClose, updateStatus }: {
  booking: Booking; onClose: () => void; updateStatus: any;
}) {
  const st = S[b.status] ?? S.pending;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 8 }}
        transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.22 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}>
        {/* Status bar */}
        <div className={`h-1.5 ${st.bg}`} />
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-5">
            <div>
              <p className="text-xs font-mono text-purple-600 font-bold mb-1">#{b.reference}</p>
              <h3 className="text-xl font-bold text-gray-900 leading-tight">{b.customer_name}</h3>
              {b.customer_phone && <p className="text-sm text-gray-400 mt-0.5">{b.customer_phone}</p>}
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-lg transition-colors">×</button>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 mb-5">
            {[
              ['✂️', b.service_name],
              ['👤', b.staff_name],
              ['📅', new Date(b.start_time).toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
              ['🕐', `${fmtTime(b.start_time)} – ${fmtTime(b.end_time)}`],
              ['💵', `NZ$${Number(b.price).toFixed(2)}`],
            ].filter(([, v]) => v).map(([icon, val]) => (
              <div key={icon as string} className="flex items-start gap-3">
                <span className="w-5 text-center text-sm flex-shrink-0">{icon}</span>
                <span className="text-sm text-gray-700">{val}</span>
              </div>
            ))}
          </div>

          {b.notes && (
            <p className="text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-xl p-3 mb-5 leading-relaxed">{b.notes}</p>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => {
                const ss = S[s];
                return (
                  <button key={s}
                    onClick={() => { updateStatus.mutate({ id: b.id, status: s }); onClose(); }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border capitalize transition-all ${
                      b.status === s
                        ? `${ss.badge} border-transparent shadow-sm`
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                    }`}>
                    {s.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
