import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { staffApi, resolveImageUrl } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

// ─── Calendar constants ────────────────────────────────────────────────────────
const START_H  = 8;
const END_H    = 20;
const SLOT_MIN = 30;
const SLOT_H   = 52;   // px per 30-min slot → 1 hour = 104 px
const N_SLOTS  = (END_H - START_H) * (60 / SLOT_MIN);
const GRID_H   = N_SLOTS * SLOT_H;
const COL_GAP  = 2;

// ─── Status styles ─────────────────────────────────────────────────────────────
const ST: Record<string, { bg: string; light: string; badge: string; border: string }> = {
  confirmed: { bg: 'bg-violet-500', light: 'bg-violet-50',  badge: 'bg-violet-100 text-violet-700', border: 'border-violet-200' },
  pending:   { bg: 'bg-amber-400',  light: 'bg-amber-50',   badge: 'bg-amber-100 text-amber-700',   border: 'border-amber-200'  },
  completed: { bg: 'bg-emerald-500',light: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700',border: 'border-emerald-200'},
  cancelled: { bg: 'bg-red-400',    light: 'bg-red-50',     badge: 'bg-red-100 text-red-500',       border: 'border-red-200'    },
  no_show:   { bg: 'bg-gray-400',   light: 'bg-gray-50',    badge: 'bg-gray-100 text-gray-500',     border: 'border-gray-200'   },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
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
function fmtDateFull(iso: string) {
  return new Date(iso).toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function bookingGeom(b: any) {
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

function layoutDay(bookings: any[]) {
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

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function StaffPortalPage() {
  const { user, logout } = useAuthStore();
  const [tab, setTab]       = useState<'bookings' | 'profile'>('bookings');
  const [calView, setCalView] = useState<'calendar' | 'list'>('calendar');

  const { data, isLoading } = useQuery({
    queryKey: ['staff-me'],
    queryFn: () => staffApi.me(),
  });

  const employee    = data?.data?.employee;
  const upcomingList: any[] = Array.isArray(data?.data?.bookings) ? data.data.bookings : [];

  // Group upcoming bookings by date for the list view
  const grouped = upcomingList.reduce((acc: Record<string, any[]>, b) => {
    const key = b.start_time?.split('T')[0] ?? '';
    if (!key) return acc;
    (acc[key] ??= []).push(b);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top bar ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">Staff Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">{user?.email}</span>
            <button
              onClick={logout}
              className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : !employee ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">👤</div>
            <p className="text-gray-700 font-semibold">No staff profile linked</p>
            <p className="text-gray-400 text-sm mt-1">Contact your manager for access.</p>
          </div>
        ) : (
          <>
            {/* ── Profile card ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5"
            >
              <div className="h-20 bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700" />
              <div className="px-5 pb-5 relative">
                <div className="flex items-end gap-4 -mt-10 mb-3">
                  <div className="w-20 h-20 rounded-2xl ring-4 ring-white overflow-hidden bg-purple-100 flex-shrink-0 shadow-sm">
                    {employee.image_url
                      ? <img src={resolveImageUrl(employee.image_url)} alt={employee.first_name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-purple-400">{employee.first_name?.[0]}</div>
                    }
                  </div>
                  <div className="pb-1">
                    <h1 className="font-bold text-xl text-gray-900">{employee.first_name} {employee.last_name}</h1>
                    <p className="text-purple-600 text-sm font-medium">{employee.role}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  {employee.experience_years > 0 && (
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="text-purple-400">✦</span>
                      {employee.experience_years} yrs experience
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="text-amber-400">★</span>
                    {parseFloat(employee.avg_rating || 0).toFixed(1)} ({employee.review_count || 0} reviews)
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="text-blue-400">📅</span>
                    {upcomingList.length} upcoming
                  </span>
                </div>
              </div>
            </motion.div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
              {(['bookings', 'profile'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t === 'bookings' ? 'Schedule' : 'Profile'}
                </button>
              ))}
            </div>

            {/* ── Schedule tab ── */}
            {tab === 'bookings' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                    {(['calendar', 'list'] as const).map(v => (
                      <button key={v} onClick={() => setCalView(v)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          calView === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}>
                        {v === 'calendar' ? '📅 Calendar' : '📋 List'}
                      </button>
                    ))}
                  </div>
                </div>

                {calView === 'calendar'
                  ? <StaffCalendar />
                  : <StaffList grouped={grouped} />
                }
              </div>
            )}

            {/* ── Profile tab ── */}
            {tab === 'profile' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                  <h3 className="font-semibold text-gray-900">Personal Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'First Name',  value: employee.first_name },
                      { label: 'Last Name',   value: employee.last_name },
                      { label: 'Email',       value: employee.email },
                      { label: 'Phone',       value: employee.phone },
                      { label: 'Role',        value: employee.role },
                      { label: 'Experience',  value: employee.experience_years ? `${employee.experience_years} years` : '—' },
                    ].map(f => (
                      <div key={f.label}>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{f.label}</p>
                        <p className="text-sm text-gray-900">{f.value || '—'}</p>
                      </div>
                    ))}
                  </div>
                  {employee.bio && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Bio</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{employee.bio}</p>
                    </div>
                  )}
                </div>

                {Array.isArray(employee.services) && employee.services.filter(Boolean).length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Services</h3>
                    <div className="flex flex-wrap gap-2">
                      {employee.services.filter(Boolean).map((s: string, i: number) => (
                        <span key={i} className="text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1.5 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-center pt-2">
                  <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    ← Back to website
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Staff Calendar ────────────────────────────────────────────────────────────
function StaffCalendar() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [selected, setSelected]   = useState<any | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const weekEnd = addDays(weekStart, 6);
  const days    = [...Array(7)].map((_, i) => addDays(weekStart, i));
  const hourRows = Array.from({ length: END_H - START_H + 1 }, (_, i) => START_H + i);

  const { data, isLoading } = useQuery({
    queryKey: ['staff-cal', toDateStr(weekStart)],
    queryFn: () => staffApi.myBookings({
      date_from: toDateStr(weekStart),
      date_to:   toDateStr(weekEnd),
    }),
  });

  const bookings: any[] = Array.isArray(data?.data?.bookings) ? data.data.bookings : [];

  // Scroll to 9 AM on mount
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = SLOT_H * 2;
  }, []);

  const now = new Date();
  const nowTop = Math.max(0, Math.min(1,
    (now.getHours() * 60 + now.getMinutes() - START_H * 60) / ((END_H - START_H) * 60)
  )) * GRID_H;
  const isThisWeek = (() => {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return t >= weekStart && t <= weekEnd;
  })();

  // Weekly stats
  const todayStr     = new Date().toDateString();
  const todayCount   = bookings.filter(b => new Date(b.start_time).toDateString() === todayStr).length;
  const weekRevenue  = bookings
    .filter(b => b.status !== 'cancelled' && b.status !== 'no_show')
    .reduce((sum, b) => sum + Number(b.price || 0), 0);

  return (
    <div>
      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Today',        value: todayCount,               color: 'text-purple-600' },
          { label: 'This Week',    value: bookings.length,          color: 'text-blue-600'   },
          { label: 'Week Revenue', value: `NZ$${weekRevenue.toFixed(0)}`, color: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
            <p className={`text-xl font-black leading-none ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Calendar wrapper ── */}
      <div
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
        style={{ height: 'calc(100vh - 430px)', minHeight: 380 }}
      >
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-1">
            <button onClick={() => setWeekStart(d => addDays(d, -7))}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors font-bold text-lg leading-none">‹</button>
            <button onClick={() => setWeekStart(d => addDays(d, 7))}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors font-bold text-lg leading-none">›</button>
            <button onClick={() => setWeekStart(getWeekStart(new Date()))}
              className="ml-1 px-3 h-8 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors">
              Today
            </button>
          </div>
          <span className="text-sm font-semibold text-gray-700">
            {weekStart.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })} –{' '}
            {weekEnd.toLocaleDateString('en-NZ',   { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          {isLoading && <span className="text-xs text-gray-400 animate-pulse">Loading…</span>}
        </div>

        {/* Day headers */}
        <div
          className="grid flex-shrink-0 border-b border-gray-200 bg-white"
          style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}
        >
          <div />
          {days.map(d => {
            const isToday = d.toDateString() === new Date().toDateString();
            const count   = bookings.filter(b => new Date(b.start_time).toDateString() === d.toDateString()).length;
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
                  <p className={`text-[9px] font-bold mt-0.5 ${isToday ? 'text-purple-400' : 'text-gray-400'}`}>
                    {count}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Scrollable grid */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', height: GRID_H }}>

            {/* Time gutter */}
            <div className="relative border-r border-gray-200 bg-gray-50/50" style={{ height: GRID_H }}>
              {hourRows.map(h => (
                <div key={h}
                  style={{ position: 'absolute', top: (h - START_H) * SLOT_H * 2, left: 0, right: 0 }}
                  className="flex items-center justify-end pr-1.5"
                >
                  <span className="text-[9px] font-semibold text-gray-400 leading-none"
                    style={{ transform: 'translateY(-50%)' }}>
                    {fmtHour(h)}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((d, di) => {
              const isToday    = d.toDateString() === new Date().toDateString();
              const dayBookings = bookings.filter(b =>
                new Date(b.start_time).toDateString() === d.toDateString()
              );
              const layout = layoutDay(dayBookings);

              return (
                <div key={di}
                  style={{ height: GRID_H, position: 'relative', overflow: 'hidden' }}
                  className={`border-l border-gray-100 ${isToday ? 'bg-purple-50/25' : ''}`}
                >
                  {/* Gridlines */}
                  {hourRows.map(h => (
                    <div key={h}>
                      <div style={{ position: 'absolute', top: (h - START_H) * SLOT_H * 2, left: 0, right: 0, height: 1, background: '#e5e7eb' }} />
                      {h < END_H && (
                        <div style={{ position: 'absolute', top: (h - START_H) * SLOT_H * 2 + SLOT_H, left: 4, right: 0, height: 1,
                          background: 'repeating-linear-gradient(90deg,#e5e7eb 0,#e5e7eb 3px,transparent 3px,transparent 7px)' }} />
                      )}
                    </div>
                  ))}

                  {/* Current-time line — purple for staff portal */}
                  {isToday && isThisWeek && (
                    <div style={{ position: 'absolute', top: nowTop, left: -3, right: 0, zIndex: 20, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', flexShrink: 0 }} />
                      <div style={{ flex: 1, height: 2, background: '#7c3aed' }} />
                    </div>
                  )}

                  {/* Booking cards */}
                  {dayBookings.map(b => {
                    const { top, height } = bookingGeom(b);
                    const { col, totalCols } = layout.get(b.id) ?? { col: 0, totalCols: 1 };
                    const widthPct = 100 / totalCols;
                    const st = ST[b.status] ?? ST.pending;

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
                        {/* Colored header */}
                        <div className={`${st.bg} px-2 py-1`}>
                          <p className="text-white text-[10px] font-bold truncate leading-tight">
                            {b.customer_first_name} {b.customer_last_name}
                          </p>
                        </div>
                        {/* Light body */}
                        <div className={`${st.light} px-2 py-1 h-full`}>
                          <p className="text-[9px] font-semibold text-gray-600 truncate leading-snug">
                            {fmtTime(b.start_time)}
                          </p>
                          {height > SLOT_H + 8 && (
                            <p className="text-[9px] text-gray-500 truncate leading-snug mt-0.5">{b.service_name}</p>
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
      </div>

      {/* Booking detail sheet */}
      <AnimatePresence>
        {selected && (
          <BookingSheet booking={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── List View ─────────────────────────────────────────────────────────────────
function StaffList({ grouped }: { grouped: Record<string, any[]> }) {
  if (Object.keys(grouped).length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="text-4xl mb-3">📅</div>
        <p className="text-gray-600 font-semibold">No upcoming bookings</p>
        <p className="text-gray-400 text-sm mt-1">Your schedule will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([date, dayBookings]) => (
        <motion.div key={date} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
            {fmtDateFull(date + 'T00:00:00')}
          </p>
          <div className="space-y-2">
            {dayBookings.map((b: any) => {
              const st = ST[b.status] ?? ST.pending;
              return (
                <div key={b.id}
                  className={`bg-white rounded-xl border ${st.border} shadow-sm p-3.5 flex items-center gap-3`}>
                  <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${st.bg}`} />
                  <div className="text-center w-14 flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{fmtTime(b.start_time)}</p>
                    {b.end_time && <p className="text-[10px] text-gray-400">{fmtTime(b.end_time)}</p>}
                  </div>
                  <div className="w-px h-8 bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {b.customer_first_name} {b.customer_last_name}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5 truncate">{b.service_name}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize flex-shrink-0 ${st.badge}`}>
                    {b.status.replace('_', ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Booking detail sheet ──────────────────────────────────────────────────────
function BookingSheet({ booking: b, onClose }: { booking: any; onClose: () => void }) {
  const st = ST[b.status] ?? ST.pending;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        exit={{   y: 60, opacity: 0 }}
        transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.26 }}
        className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile hint) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Status accent bar */}
        <div className={`h-1.5 ${st.bg}`} />

        <div className="p-5">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${st.badge}`}>
                {b.status.replace('_', ' ')}
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-2 leading-tight">
                {b.customer_first_name} {b.customer_last_name}
              </h3>
              {b.customer_phone && (
                <p className="text-sm text-gray-400 mt-0.5">{b.customer_phone}</p>
              )}
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 text-lg transition-colors">
              ×
            </button>
          </div>

          {/* Details block */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mb-4">
            {[
              { icon: '✂️', label: 'Service', value: b.service_name },
              { icon: '📅', label: 'Date',    value: new Date(b.start_time).toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
              { icon: '🕐', label: 'Time',    value: `${fmtTime(b.start_time)} – ${fmtTime(b.end_time)}` },
              { icon: '💵', label: 'Price',   value: b.price ? `NZ$${Number(b.price).toFixed(2)}` : null },
            ].filter(row => row.value).map(row => (
              <div key={row.label} className="flex items-start gap-3">
                <span className="text-base w-5 text-center flex-shrink-0 mt-0.5">{row.icon}</span>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{row.label}</p>
                  <p className="text-sm text-gray-800 font-medium">{row.value}</p>
                </div>
              </div>
            ))}
          </div>

          {b.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-gray-700 leading-relaxed">{b.notes}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
