import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { dashboardApi, reportApi, bookingApi } from '../../services/api';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { BookingStatus } from '../../types';

const GOLD = '#7c3aed';
const ONYX = '#1a1a1a';
const PIE_COLORS = ['#7c3aed', '#9333ea', '#6d28d9', '#5b21b6', '#4c1d95'];

function StatusBadge({ status }: { status: BookingStatus }) {
  return <span className={`badge-${status}`}>{status.replace('_', ' ')}</span>;
}

function StatCard({ icon, label, value, sub, color = 'gold' }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-onyx-400 text-xs font-medium uppercase tracking-wide">{label}</p>
          <p className="font-display text-2xl font-bold text-onyx-900 mt-1">{value}</p>
          {sub && <p className="text-onyx-400 text-xs mt-0.5">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${
          color === 'gold' ? 'bg-gold-100' : color === 'green' ? 'bg-green-100' : color === 'blue' ? 'bg-blue-100' : 'bg-red-100'
        }`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { data: dashData } = useQuery({ queryKey: ['dashboard'], queryFn: () => dashboardApi.get() });
  const { data: revenueData } = useQuery({
    queryKey: ['revenue-chart'],
    queryFn: () => reportApi.revenue({ period: 'daily', date_from: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0] }),
  });
  const { data: servicesData } = useQuery({ queryKey: ['services-chart'], queryFn: () => reportApi.servicesAnalysis() });
  const { data: bookingsData } = useQuery({ queryKey: ['bookings-today'], queryFn: () => bookingApi.list({ date_from: new Date().toISOString().split('T')[0], limit: 10 }) });

  const dash = dashData?.data;
  const revenue = Array.isArray(revenueData?.data) ? revenueData.data : [];
  const services = Array.isArray(servicesData?.data) ? servicesData.data.slice(0, 5) : [];
  const recentBookings = Array.isArray(bookingsData?.data?.bookings) ? bookingsData.data.bookings : [];

  const chartData = revenue.map((r: any) => ({
    date: new Date(r.period).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' }),
    Revenue: Number(r.total_revenue || 0).toFixed(2),
    Bookings: Number(r.total_bookings || 0),
  }));

  const pieData = services.map((s: any) => ({
    name: s.name.length > 20 ? s.name.slice(0, 18) + '…' : s.name,
    value: Number(s.booking_count || 0),
  }));

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📅" label="Today's Bookings" value={dash?.stats?.today_bookings?.count ?? '—'} sub={`NZ$${Number(dash?.stats?.today_bookings?.revenue || 0).toFixed(0)} revenue`} color="gold" />
        <StatCard icon="📈" label="Month Revenue" value={`$${Number(dash?.stats?.month?.revenue || 0).toLocaleString('en-NZ', { maximumFractionDigits: 0 })}`} sub={`${dash?.stats?.month?.bookings ?? 0} bookings`} color="green" />
        <StatCard icon="👥" label="Total Customers" value={dash?.stats?.total_customers ?? '—'} color="blue" />
        <StatCard icon="⚠️" label="Low Stock Alerts" value={dash?.stats?.low_stock_alerts ?? 0} sub="Items need reordering" color={Number(dash?.stats?.low_stock_alerts) > 0 ? 'red' : 'green'} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-soft border border-gray-100">
          <h3 className="font-display font-semibold text-onyx-900 mb-4">Revenue (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: any) => [`NZ$${v}`, 'Revenue']} contentStyle={{ borderRadius: 12, border: '1px solid #eee' }} />
              <Area type="monotone" dataKey="Revenue" stroke={GOLD} strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100">
          <h3 className="font-display font-semibold text-onyx-900 mb-4">Top Services</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {pieData.map((_: any, i: number) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => [v, 'Bookings']} />
              <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Staff on duty + recent bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff on duty */}
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100">
          <h3 className="font-display font-semibold text-onyx-900 mb-4">Staff Today</h3>
          <div className="space-y-3">
            {(Array.isArray(dash?.staff_on_duty) ? dash.staff_on_duty : []).map((member: any) => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gold-gradient flex-shrink-0 flex items-center justify-center text-white font-semibold text-xs overflow-hidden">
                  {member.image_url
                    ? <img src={member.image_url} alt={member.first_name} className="w-full h-full object-cover" />
                    : `${member.first_name[0]}${member.last_name[0]}`}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-onyx-900 truncate">{member.first_name} {member.last_name}</div>
                  <div className="text-xs text-onyx-400">{member.role}</div>
                </div>
                <div className="text-xs text-gold-600 font-medium">{member.today_bookings} appts</div>
              </div>
            ))}
            {(!dash?.staff_on_duty || dash.staff_on_duty.length === 0) && (
              <p className="text-onyx-400 text-sm text-center py-4">No staff data available</p>
            )}
          </div>
        </div>

        {/* Recent bookings */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-soft border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-semibold text-onyx-900">Today's Bookings</h3>
            <Link to="/admin/bookings" className="text-gold-600 text-xs hover:text-gold-700">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-onyx-400 text-xs uppercase tracking-wide border-b border-gray-100">
                  <th className="pb-2 pr-4">Customer</th>
                  <th className="pb-2 pr-4">Service</th>
                  <th className="pb-2 pr-4 hidden sm:table-cell">Stylist</th>
                  <th className="pb-2 pr-4">Time</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentBookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="font-medium text-onyx-900">{b.customer_name}</div>
                    </td>
                    <td className="py-2.5 pr-4 text-onyx-600">{b.service_name}</td>
                    <td className="py-2.5 pr-4 text-onyx-600 hidden sm:table-cell">{b.staff_name}</td>
                    <td className="py-2.5 pr-4 text-onyx-600">
                      {new Date(b.start_time).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
                {recentBookings.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-onyx-400 py-8">No bookings today</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top services bar chart */}
      <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100">
        <h3 className="font-display font-semibold text-onyx-900 mb-4">Service Performance (Bookings)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={services.map((s: any) => ({ name: s.name.split(' ')[0], bookings: s.booking_count || 0, revenue: s.total_revenue || 0 }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12 }} />
            <Bar dataKey="bookings" fill={GOLD} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
