import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { loyaltyApi, whatsappApi } from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Tier {
  key: string;
  label: string;
  icon: string;
  min_value: number;
  discount: number;
}

const TIER_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  standard: { bg: 'bg-gray-100',    text: 'text-gray-700',   border: 'border-gray-200',  badge: 'bg-gray-100 text-gray-600'    },
  silver:   { bg: 'bg-slate-100',   text: 'text-slate-700',  border: 'border-slate-200', badge: 'bg-slate-100 text-slate-700'  },
  gold:     { bg: 'bg-yellow-100',  text: 'text-yellow-700', border: 'border-yellow-200',badge: 'bg-yellow-100 text-yellow-700'},
  vip:      { bg: 'bg-purple-100',  text: 'text-purple-700', border: 'border-purple-200',badge: 'bg-purple-100 text-purple-700'},
  platinum: { bg: 'bg-indigo-100',  text: 'text-indigo-700', border: 'border-indigo-200',badge: 'bg-indigo-100 text-indigo-700'},
};

const CRITERIA_META: Record<string, { label: string; icon: string; unit: string; desc: string; hint: string }> = {
  points: {
    label: 'Loyalty Points',
    icon:  '🪙',
    unit:  'pts',
    desc:  'Every NZ$1 spent earns 1 point. Tier is based on total accumulated points.',
    hint:  'Best for rewarding frequent small purchases.',
  },
  spend: {
    label: 'Total Spend',
    icon:  '💰',
    unit:  'NZ$',
    desc:  'Tier is based on the total amount a customer has spent across all completed bookings.',
    hint:  'Best for rewarding high-value customers.',
  },
  visits: {
    label: 'Visit Count',
    icon:  '📅',
    unit:  'visits',
    desc:  'Tier is based on the number of completed appointments a customer has had.',
    hint:  'Best for rewarding loyal, returning customers.',
  },
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminLoyalty() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'configure' | 'members' | 'whatsapp'>('configure');
  const [qrUrl, setQrUrl]       = useState('');
  const [loadingQr, setLoadingQr] = useState(false);

  // Settings state
  const [criteria, setCriteria] = useState<'points' | 'spend' | 'visits'>('points');
  const [tiers, setTiers]       = useState<Tier[]>([]);
  const [dirty, setDirty]       = useState(false);

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['loyalty-settings'],
    queryFn: loyaltyApi.getSettings,
  });
  const { data: membersData } = useQuery({
    queryKey: ['loyalty-customers'],
    queryFn: loyaltyApi.customers,
  });

  const settings = settingsData?.data;
  const members: any[] = Array.isArray(membersData?.data) ? membersData.data : [];

  // Sync settings into local state on load
  useEffect(() => {
    if (settings?.tiers?.length) {
      setCriteria(settings.criteria ?? 'points');
      setTiers(settings.tiers);
      setDirty(false);
    }
  }, [settings]);

  // When criteria changes, reset thresholds to recommended defaults
  const handleCriteriaChange = (c: 'points' | 'spend' | 'visits') => {
    if (c === criteria) return;
    const defaults: number[] = settings?.criteria_defaults?.[c] ?? [0, 500, 1000, 2500, 5000];
    setTiers(prev => prev.map((t, i) => ({ ...t, min_value: defaults[i] ?? 0 })));
    setCriteria(c);
    setDirty(true);
  };

  const updateTier = (idx: number, field: 'min_value' | 'discount', val: number) => {
    setTiers(prev => prev.map((t, i) => i === idx ? { ...t, [field]: val } : t));
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => loyaltyApi.saveSettings({ criteria, tiers }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loyalty-settings'] });
      qc.invalidateQueries({ queryKey: ['loyalty-customers'] });
      setDirty(false);
      toast.success('Tier rules saved — all customer profiles updated!');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const loadQR = async () => {
    setLoadingQr(true);
    try { const res = await whatsappApi.getQR(); setQrUrl(res.data.qr); }
    catch { toast.error('Failed to load QR'); }
    finally { setLoadingQr(false); }
  };

  const meta = CRITERIA_META[criteria];

  // Tier distribution for overview
  const tierCounts = tiers.reduce((acc, t) => {
    acc[t.key] = members.filter(m => m.membership_tier === t.key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5">
      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { key: 'configure', label: '⚙️ Configure Tiers' },
          { key: 'members',   label: `👥 Members (${members.length})` },
          { key: 'whatsapp',  label: '📱 WhatsApp' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════ CONFIGURE TAB ══════════ */}
      {tab === 'configure' && (
        <div className="space-y-5">
          {settingsLoading ? (
            <div className="h-64 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ) : (
            <>
              {/* Criteria selector */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 text-base">How should customers earn their tier?</h3>
                  <p className="text-sm text-gray-400 mt-0.5">Choose the metric used to calculate each customer's loyalty level.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(Object.entries(CRITERIA_META) as [string, typeof CRITERIA_META[string]][]).map(([key, m]) => (
                    <button
                      key={key}
                      onClick={() => handleCriteriaChange(key as any)}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                        criteria === key
                          ? 'border-purple-500 bg-purple-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {criteria === key && (
                        <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-[10px] font-bold">✓</span>
                        </span>
                      )}
                      <div className="text-2xl mb-2">{m.icon}</div>
                      <p className="font-semibold text-gray-900 text-sm">{m.label}</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{m.desc}</p>
                      <p className="text-[10px] text-purple-500 font-medium mt-2">{m.hint}</p>
                    </button>
                  ))}
                </div>

                {dirty && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                    ⚠ Thresholds have been reset to recommended values for <strong>{meta.label}</strong>. Adjust if needed and save.
                  </p>
                )}
              </div>

              {/* Tier threshold editor */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">Tier Thresholds</h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      Set the minimum <strong>{meta.label}</strong> ({meta.unit}) required to reach each tier.
                    </p>
                  </div>
                  <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-3 py-1 rounded-full">
                    {meta.icon} {meta.label}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                        <th className="pb-3 pl-1">Tier</th>
                        <th className="pb-3 px-4">
                          Min {meta.label}
                          <span className="text-gray-300 font-normal ml-1">({meta.unit})</span>
                        </th>
                        <th className="pb-3 px-4">Discount</th>
                        <th className="pb-3 px-4 text-right">Current Members</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {tiers.map((tier, idx) => {
                        const color = TIER_COLORS[tier.key] ?? TIER_COLORS.standard;
                        const count = tierCounts[tier.key] ?? 0;
                        return (
                          <tr key={tier.key} className="hover:bg-gray-50/50">
                            <td className="py-3 pl-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{tier.icon}</span>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${color.badge}`}>
                                  {tier.label}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {idx === 0 ? (
                                <span className="text-gray-400 text-sm">0 (entry level)</span>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-gray-400 text-xs">{meta.unit === 'NZ$' ? 'NZ$' : ''}</span>
                                  <input
                                    type="number" min={0}
                                    value={tier.min_value}
                                    onChange={e => updateTier(idx, 'min_value', Number(e.target.value))}
                                    className="w-28 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-purple-400 text-gray-900 font-medium"
                                  />
                                  {meta.unit !== 'NZ$' && (
                                    <span className="text-gray-400 text-xs">{meta.unit}</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number" min={0} max={100}
                                  value={tier.discount}
                                  onChange={e => updateTier(idx, 'discount', Number(e.target.value))}
                                  className="w-20 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-purple-400 text-gray-900 font-medium"
                                />
                                <span className="text-gray-400 text-xs">%</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`text-sm font-bold ${count > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                                {count}
                              </span>
                              {count > 0 && <span className="text-xs text-gray-400 ml-1">customers</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Save */}
                <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
                  <p className="text-xs text-gray-400 max-w-sm">
                    Saving will immediately recalculate and update the tier for every customer based on their {meta.label.toLowerCase()}.
                  </p>
                  <button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="btn-gold px-6 py-2.5 text-sm disabled:opacity-60 flex items-center gap-2"
                  >
                    {saveMutation.isPending ? (
                      <><span className="animate-spin">⏳</span> Recalculating…</>
                    ) : (
                      <>💾 Save &amp; Recalculate All</>
                    )}
                  </button>
                </div>
              </div>

              {/* How it works info */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                <p className="text-sm font-semibold text-blue-800 mb-2">ℹ How tier assignment works</p>
                <ul className="space-y-1.5 text-sm text-blue-700">
                  <li>• Tiers are recalculated for all customers every time you save changes here.</li>
                  <li>• You can switch criteria at any time — all customers will be re-evaluated instantly.</li>
                  <li>• The <strong>Standard</strong> tier is always the entry level (min = 0) and cannot be changed.</li>
                  <li>• Discounts are stored per-tier and can be used by your booking system to apply reductions.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════ MEMBERS TAB ══════════ */}
      {tab === 'members' && (
        <div className="space-y-5">
          {/* Tier distribution */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {tiers.map(tier => {
              const color  = TIER_COLORS[tier.key] ?? TIER_COLORS.standard;
              const count  = tierCounts[tier.key] ?? 0;
              const meta_c = CRITERIA_META[criteria];
              return (
                <div key={tier.key} className={`bg-white rounded-2xl p-4 shadow-soft border ${color.border} text-center`}>
                  <div className="text-2xl mb-1">{tier.icon}</div>
                  <p className="font-semibold text-gray-900 text-sm">{tier.label}</p>
                  <p className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block font-semibold ${color.badge}`}>
                    {tier.discount}% off
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {tier.min_value === 0 ? 'Entry level' : `${meta_c?.unit === 'NZ$' ? 'NZ$' : ''}${tier.min_value}${meta_c?.unit !== 'NZ$' ? ` ${meta_c?.unit}` : ''}+`}
                  </p>
                  <p className="text-2xl font-black text-gray-900 mt-2">{count}</p>
                  <p className="text-xs text-gray-400">members</p>
                </div>
              );
            })}
          </div>

          {/* Members table */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">All Loyalty Members</h3>
              <span className="text-xs text-gray-400">Sorted by {CRITERIA_META[criteria]?.label}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                    {['Member', 'Tier', 'Points', 'Total Spend', 'Visits', 'Phone'].map(h => (
                      <th key={h} className="px-4 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {members.map((m: any) => {
                    const tier  = tiers.find(t => t.key === m.membership_tier) ?? tiers[0];
                    const color = tier ? TIER_COLORS[tier.key] ?? TIER_COLORS.standard : TIER_COLORS.standard;
                    return (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold flex-shrink-0">
                              {m.first_name?.[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{m.first_name} {m.last_name}</p>
                              <p className="text-xs text-gray-400">{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${color.badge}`}>
                            {tier?.icon} {tier?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-yellow-600">{m.total_points || 0}</td>
                        <td className="px-4 py-3 font-medium text-gray-700">NZ${Number(m.total_spend || 0).toFixed(0)}</td>
                        <td className="px-4 py-3 text-gray-600">{m.total_visits || 0}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{m.phone || '—'}</td>
                      </tr>
                    );
                  })}
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-gray-400 py-12">
                        <div className="text-3xl mb-2">🏅</div>
                        <p className="text-sm font-medium">No loyalty members yet</p>
                        <p className="text-xs mt-1">Customers who sign up or book will appear here.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ WHATSAPP TAB ══════════ */}
      {tab === 'whatsapp' && (
        <div className="max-w-lg space-y-5">
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-1">WhatsApp Marketing</h3>
            <p className="text-sm text-gray-400 mb-5">
              Connect your WhatsApp Business account to send promotions to loyalty members.
            </p>
            {qrUrl ? (
              <div className="flex flex-col items-center gap-3">
                <img src={qrUrl} alt="WhatsApp QR" className="w-48 h-48 rounded-xl border border-gray-200" />
                <p className="text-xs text-gray-500 text-center">Scan with WhatsApp Business to connect</p>
              </div>
            ) : (
              <button onClick={loadQR} disabled={loadingQr}
                className="btn-gold w-full py-3 text-sm disabled:opacity-60">
                {loadingQr ? 'Loading...' : '📱 Generate WhatsApp QR'}
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
            <h4 className="font-semibold text-gray-900 mb-1">Bulk Message</h4>
            <p className="text-xs text-gray-400 mb-3">Send a promotion to all VIP &amp; Platinum members.</p>
            <textarea rows={4} className="input-luxury text-sm mb-3 w-full"
              placeholder="Type your promotion message..." />
            <button className="btn-gold w-full py-2.5 text-sm">
              Send to VIP &amp; Platinum ({members.filter(m => ['vip','platinum'].includes(m.membership_tier)).length} members)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
