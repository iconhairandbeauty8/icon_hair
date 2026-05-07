import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import { reportApi } from '../../services/api';

const GOLD = '#d4a01e';
const BLUE = '#3b82f6';

type Period = 'daily' | 'weekly' | 'monthly';

function ExportButton({ data, filename }: { data: any[]; filename: string }) {
  const exportCSV = () => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map((r) => keys.map((k) => r[k]).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
  };
  return (
    <button onClick={exportCSV} className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gold-400 hover:text-gold-600 transition-colors">
      ⬇ Export CSV
    </button>
  );
}

export default function AdminReports() {
  const [period, setPeriod] = useState<Period>('monthly');
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [tab, setTab] = useState<'revenue' | 'staff' | 'services' | 'customers' | 'branches'>('revenue');

  const params = { period, date_from: dateFrom, date_to: dateTo };

  const { data: revenueData } = useQuery({ queryKey: ['rep-revenue', params], queryFn: () => reportApi.revenue(params) });
  const { data: staffData } = useQuery({ queryKey: ['rep-staff', params], queryFn: () => reportApi.staffPerformance(params) });
  const { data: servicesData } = useQuery({ queryKey: ['rep-services', params], queryFn: () => reportApi.servicesAnalysis(params) });
  const { data: customersData } = useQuery({ queryKey: ['rep-customers'], queryFn: () => reportApi.customerAnalytics() });
  const { data: branchData } = useQuery({ queryKey: ['rep-branches', params], queryFn: () => reportApi.branchComparison(params) });

  const revenue = Array.isArray(revenueData?.data) ? revenueData.data : [];
  const staff = Array.isArray(staffData?.data) ? staffData.data : [];
  const services = Array.isArray(servicesData?.data) ? servicesData.data : [];
  const customers = Array.isArray(customersData?.data) ? customersData.data.slice(0, 20) : [];
  const branches = Array.isArray(branchData?.data) ? branchData.data : [];

  const chartRevenue = revenue.map((r: any) => ({
    period: r.period?.slice(0, 10) || '',
    Revenue: Number(r.total_revenue || 0),
    Bookings: Number(r.total_bookings || 0),
    Customers: Number(r.unique_customers || 0),
  }));

  const tabs = [
    { id: 'revenue', label: '📈 Revenue' },
    { id: 'staff', label: '👤 Staff Performance' },
    { id: 'services', label: '✂️ Services' },
    { id: 'customers', label: '👥 Customers' },
    { id: 'branches', label: '🏢 Branches' },
  ];

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="bg-white rounded-2xl p-4 shadow-soft border border-gray-100 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${period === p ? 'bg-white shadow text-gold-600' : 'text-onyx-500'}`}>
              {p}
            </button>
          ))}
        </div>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-luxury text-sm py-2 w-auto" />
        <span className="text-onyx-400 text-sm">to</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-luxury text-sm py-2 w-auto" />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-100">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                tab === t.id ? 'border-gold-500 text-gold-600' : 'border-transparent text-onyx-500 hover:text-onyx-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* REVENUE TAB */}
          {tab === 'revenue' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-semibold text-onyx-900">Revenue Over Time</h3>
                <ExportButton data={revenue} filename="revenue-report" />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartRevenue}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={GOLD} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} axisLine={false} />
                  <Tooltip formatter={(v: any, name) => [name === 'Revenue' ? `NZ$${v}` : v, name]} />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="Revenue" stroke={GOLD} strokeWidth={2} fill="url(#rev)" />
                  <Line yAxisId="right" type="monotone" dataKey="Bookings" stroke={BLUE} strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {[
                  { label: 'Total Revenue', value: `NZ$${revenue.reduce((a: number, r: any) => a + Number(r.total_revenue || 0), 0).toLocaleString('en-NZ')}` },
                  { label: 'Total Bookings', value: revenue.reduce((a: number, r: any) => a + Number(r.total_bookings || 0), 0) },
                  { label: 'Avg Booking Value', value: `NZ$${(revenue.reduce((a: number, r: any) => a + Number(r.avg_booking_value || 0), 0) / (revenue.length || 1)).toFixed(2)}` },
                  { label: 'Unique Customers', value: revenue.reduce((a: number, r: any) => a + Number(r.unique_customers || 0), 0) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gold-50 rounded-xl p-4">
                    <div className="text-xs text-onyx-500 mb-1">{label}</div>
                    <div className="font-bold text-onyx-900 text-lg">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STAFF TAB */}
          {tab === 'staff' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-semibold text-onyx-900">Staff Performance</h3>
                <ExportButton data={staff} filename="staff-performance" />
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={staff.slice(0, 8).map((s: any) => ({ name: s.first_name || s.staff_name?.split(' ')[0], Revenue: Number(s.total_revenue || 0), Bookings: Number(s.total_bookings || 0) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Revenue" fill={GOLD} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Bookings" fill={BLUE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs text-onyx-400 uppercase tracking-wide">
                      {['Staff Member', 'Role', 'Bookings', 'Revenue', 'Avg Service Value', 'Rating', 'No-Shows'].map((h) => (
                        <th key={h} className="px-4 py-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {staff.map((s: any) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gold-gradient flex items-center justify-center text-white text-xs font-bold">
                              {(s.staff_name || s.first_name || '?')[0]}
                            </div>
                            <span className="font-medium text-onyx-900">{s.staff_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-onyx-500">{s.role}</td>
                        <td className="px-4 py-2.5 font-semibold">{s.total_bookings || 0}</td>
                        <td className="px-4 py-2.5 text-gold-600 font-semibold">NZ${Number(s.total_revenue || 0).toFixed(0)}</td>
                        <td className="px-4 py-2.5">NZ${Number(s.avg_booking_value || 0).toFixed(0)}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-gold-500">{'★'.repeat(Math.round(s.avg_rating || 0))}</span>
                          <span className="text-gray-200">{'★'.repeat(5 - Math.round(s.avg_rating || 0))}</span>
                          <span className="text-xs text-onyx-400 ml-1">({Number(s.avg_rating || 0).toFixed(1)})</span>
                        </td>
                        <td className="px-4 py-2.5 text-red-500">{s.no_shows || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SERVICES TAB */}
          {tab === 'services' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-semibold text-onyx-900">Services Analysis</h3>
                <ExportButton data={services} filename="services-analysis" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((s: any) => (
                  <div key={s.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="text-xs text-gold-600 uppercase tracking-wide mb-1">{s.category}</div>
                    <div className="font-semibold text-onyx-900 text-sm mb-2">{s.name}</div>
                    <div className="flex justify-between text-xs text-onyx-500">
                      <span>{s.booking_count || 0} bookings</span>
                      <span>NZ${s.price}</span>
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-gold-gradient h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, ((s.booking_count || 0) / (services[0]?.booking_count || 1)) * 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gold-600 font-semibold mt-2">
                      NZ${Number(s.total_revenue || 0).toFixed(0)} total revenue
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CUSTOMERS TAB */}
          {tab === 'customers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-semibold text-onyx-900">Customer Analytics</h3>
                <ExportButton data={customers} filename="customer-analytics" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs text-onyx-400 uppercase tracking-wide">
                      {['Customer', 'Visits', 'Total Spent', 'Avg Spend', 'Last Visit', 'Tier', 'Points'].map((h) => (
                        <th key={h} className="px-4 py-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {customers.map((c: any) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-onyx-900">{c.name}</div>
                          <div className="text-xs text-onyx-400">{c.email}</div>
                        </td>
                        <td className="px-4 py-2.5 font-semibold">{c.total_visits}</td>
                        <td className="px-4 py-2.5 text-gold-600 font-semibold">NZ${Number(c.total_spent || 0).toFixed(0)}</td>
                        <td className="px-4 py-2.5">NZ${Number(c.avg_spend || 0).toFixed(0)}</td>
                        <td className="px-4 py-2.5 text-xs text-onyx-500">
                          {c.last_visit ? new Date(c.last_visit).toLocaleDateString('en-NZ') : '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            c.membership_tier === 'vip' ? 'bg-gold-100 text-gold-700'
                            : c.membership_tier === 'gold' ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                          } capitalize`}>
                            {c.membership_tier || 'standard'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">{c.loyalty_points || 0} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BRANCHES TAB */}
          {tab === 'branches' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-semibold text-onyx-900">Branch Comparison</h3>
                <ExportButton data={branches} filename="branch-comparison" />
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={branches.map((b: any) => ({ name: b.name?.split(' ')[0], Revenue: Number(b.total_revenue || 0), Bookings: Number(b.total_bookings || 0) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Revenue" fill={GOLD} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Bookings" fill={BLUE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {branches.map((b: any) => (
                  <div key={b.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="font-semibold text-onyx-900 mb-1">{b.name}</div>
                    <div className="text-xs text-onyx-400 mb-3">{b.city}</div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-onyx-500">Revenue</span><span className="font-semibold text-gold-600">NZ${Number(b.total_revenue || 0).toFixed(0)}</span></div>
                      <div className="flex justify-between"><span className="text-onyx-500">Bookings</span><span className="font-medium">{b.total_bookings || 0}</span></div>
                      <div className="flex justify-between"><span className="text-onyx-500">Customers</span><span className="font-medium">{b.unique_customers || 0}</span></div>
                      <div className="flex justify-between"><span className="text-onyx-500">Staff</span><span className="font-medium">{b.staff_count || 0}</span></div>
                      <div className="flex justify-between"><span className="text-onyx-500">Rating</span>
                        <span className="font-medium text-gold-500">{'★'.repeat(Math.round(b.avg_rating || 0))} {Number(b.avg_rating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
