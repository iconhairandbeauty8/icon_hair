import { useQuery } from '@tanstack/react-query';
import { loyaltyApi, whatsappApi } from '../../services/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

const TIERS = [
  { name: 'Standard', icon: '🌿', color: 'bg-gray-100 text-gray-700', points: '0–499', discount: '0%' },
  { name: 'Silver', icon: '🥈', color: 'bg-slate-100 text-slate-700', points: '500–999', discount: '5%' },
  { name: 'Gold', icon: '🥇', color: 'bg-yellow-100 text-yellow-700', points: '1,000–2,499', discount: '10%' },
  { name: 'VIP', icon: '💎', color: 'bg-gold-100 text-gold-700', points: '2,500–4,999', discount: '15%' },
  { name: 'Platinum', icon: '👑', color: 'bg-purple-100 text-purple-700', points: '5,000+', discount: '20%' },
];

export default function AdminLoyalty() {
  const { data } = useQuery({ queryKey:['loyalty-customers'], queryFn: loyaltyApi.customers });
  const [qrUrl, setQrUrl] = useState('');
  const [loadingQr, setLoadingQr] = useState(false);

  const members = Array.isArray(data?.data) ? data.data : [];

  const loadQR = async () => {
    setLoadingQr(true);
    try { const res = await whatsappApi.getQR(); setQrUrl(res.data.qr); }
    catch { toast.error('Failed to load QR'); }
    finally { setLoadingQr(false); }
  };

  return (
    <div className="space-y-6">
      {/* Tier overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {TIERS.map((tier) => {
          const count = members.filter((m:any)=>m.membership_tier===tier.name.toLowerCase()).length;
          return (
            <div key={tier.name} className="bg-white rounded-2xl p-4 shadow-soft border border-gray-100 text-center">
              <div className="text-2xl mb-1">{tier.icon}</div>
              <div className="font-semibold text-onyx-900 text-sm">{tier.name}</div>
              <div className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${tier.color}`}>{tier.discount}</div>
              <div className="text-xs text-onyx-400 mt-1">{tier.points} pts</div>
              <div className="text-lg font-bold text-onyx-900 mt-2">{count}</div>
              <div className="text-xs text-onyx-400">members</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members list */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-display font-semibold text-onyx-900">Loyalty Members</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr className="text-left text-xs text-onyx-400 uppercase tracking-wide">
                {['Member','Tier','Points','Total Bookings','Phone'].map(h=><th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {members.map((m:any)=>{
                  const tier = TIERS.find(t=>t.name.toLowerCase()===m.membership_tier)||TIERS[0];
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gold-gradient flex items-center justify-center text-white text-xs font-bold">{m.first_name?.[0]}</div>
                          <div><div className="font-medium text-onyx-900">{m.first_name} {m.last_name}</div><div className="text-xs text-onyx-400">{m.email}</div></div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tier.color}`}>{tier.icon} {tier.name}</span></td>
                      <td className="px-4 py-2.5 font-semibold text-gold-600">{m.total_points||0}</td>
                      <td className="px-4 py-2.5">{m.total_bookings||0}</td>
                      <td className="px-4 py-2.5 text-xs text-onyx-400">{m.phone||'—'}</td>
                    </tr>
                  );
                })}
                {members.length===0&&<tr><td colSpan={5} className="text-center text-onyx-400 py-10">No loyalty members yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* WhatsApp QR */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5">
          <h3 className="font-display font-semibold text-onyx-900 mb-2">WhatsApp Marketing</h3>
          <p className="text-xs text-onyx-400 mb-4">Connect your WhatsApp Business account to send promotions to loyalty customers.</p>
          {qrUrl ? (
            <div className="flex flex-col items-center gap-3">
              <img src={qrUrl} alt="WhatsApp QR" className="w-48 h-48 rounded-xl border border-gray-200"/>
              <p className="text-xs text-onyx-500 text-center">Scan with WhatsApp Business to connect</p>
            </div>
          ) : (
            <button onClick={loadQR} disabled={loadingQr} className="btn-gold w-full py-3 text-sm disabled:opacity-60">
              {loadingQr ? 'Loading...' : '📱 Generate WhatsApp QR'}
            </button>
          )}

          <div className="mt-5 pt-5 border-t border-gray-100">
            <h4 className="font-medium text-sm text-onyx-700 mb-3">Send Bulk Message</h4>
            <textarea rows={3} className="input-luxury text-sm mb-2" placeholder="Type your promotion message..."/>
            <button className="btn-gold w-full py-2.5 text-sm">Send to All VIP Members</button>
          </div>
        </div>
      </div>
    </div>
  );
}
