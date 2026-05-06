// AdminCustomers.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../../services/api';

export default function AdminCustomers() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({ queryKey:['customers', search], queryFn:()=>customerApi.list({search}) });
  const customers = Array.isArray(data?.data) ? data.data : [];

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-4 shadow-soft border border-gray-100">
        <input value={search} onChange={e=>setSearch(e.target.value)} className="input-luxury text-sm py-2.5 w-full max-w-sm" placeholder="🔍 Search by name, email or phone..."/>
      </div>
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        {isLoading ? <div className="p-8 space-y-2">{[...Array(5)].map((_,i)=><div key={i} className="h-14 skeleton rounded-xl"/>)}</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr className="text-left text-xs text-onyx-400 uppercase tracking-wide">
                {['Customer','Contact','Visits','Total Spent','Last Visit','Tier'].map(h=><th key={h} className="px-4 py-3 font-medium">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c:any)=>(
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-white text-xs font-bold">{c.first_name?.[0]}</div>
                        <div><div className="font-medium text-onyx-900">{c.first_name} {c.last_name}</div></div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><div className="text-xs text-onyx-500">{c.email}</div><div className="text-xs text-onyx-400">{c.phone}</div></td>
                    <td className="px-4 py-3 font-semibold">{c.total_bookings||0}</td>
                    <td className="px-4 py-3 text-gold-600 font-semibold">NZ${Number(c.total_spent||0).toFixed(0)}</td>
                    <td className="px-4 py-3 text-xs text-onyx-500">{c.last_visit?new Date(c.last_visit).toLocaleDateString('en-NZ'):'—'}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${c.membership_tier==='vip'?'bg-gold-100 text-gold-700':c.membership_tier==='gold'?'bg-yellow-100 text-yellow-700':'bg-gray-100 text-gray-600'}`}>{c.membership_tier||'standard'}</span></td>
                  </tr>
                ))}
                {customers.length===0&&<tr><td colSpan={6} className="text-center text-onyx-400 py-10">No customers found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
