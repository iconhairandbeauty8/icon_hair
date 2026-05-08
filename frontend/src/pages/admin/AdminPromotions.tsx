import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { promotionApi, serviceApi, resolveImageUrl } from '../../services/api';
import ImageUpload from '../../components/ui/ImageUpload';

// ─── Types ────────────────────────────────────────────────────────────────────
const TYPE_META: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
  daily_special:    { label: 'Daily Special',    icon: '🌅', color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  weekly_deal:      { label: 'Weekly Deal',      icon: '📅', color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200'  },
  monthly_campaign: { label: 'Monthly Campaign', icon: '📆', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  discount_code:    { label: 'Discount Code',    icon: '🏷',  color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  package:          { label: 'Package Deal',     icon: '📦', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
};

const EMPTY_FORM = {
  title: '', description: '', type: 'daily_special',
  discount_type: 'percentage', discount_value: 10,
  code: '', applicable_dates: [] as string[],
  image_url: '', applicable_services: [] as string[], is_active: true,
};

// ─── Service picker (all types) ───────────────────────────────────────────────
function ServicePicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const { data } = useQuery({ queryKey: ['services'], queryFn: () => serviceApi.list() });
  const services = Array.isArray(data?.data) ? data.data : [];
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);

  const byCategory = services.reduce((acc: Record<string, any[]>, s: any) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        Applicable Services{' '}
        <span className="text-gray-400 font-normal">(leave empty = all services)</span>
        {selected.length > 0 && <span className="text-purple-600 font-semibold ml-1">· {selected.length} selected</span>}
      </label>
      <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
        {Object.entries(byCategory).map(([cat, list]) => (
          <div key={cat}>
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wide text-gray-400">{cat}</div>
            {(list as any[]).map((s: any) => (
              <button
                key={s.id} type="button"
                onClick={() => toggle(s.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                  selected.includes(s.id) ? 'bg-purple-50' : ''
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.duration_minutes} min</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-purple-600">NZ${s.price}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    selected.includes(s.id) ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                  }`}>
                    {selected.includes(s.id) && <span className="text-white text-[10px] font-bold">✓</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ))}
        {services.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">No services found</p>
        )}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-purple-600 mt-1.5 font-medium">
          Combined value: NZ${services.filter((s: any) => selected.includes(s.id)).reduce((sum: number, s: any) => sum + Number(s.price), 0).toFixed(2)}
        </p>
      )}
    </div>
  );
}

// ─── Multi-date picker ────────────────────────────────────────────────────────
function MultiDatePicker({ dates, onChange }: { dates: string[]; onChange: (d: string[]) => void }) {
  const [input, setInput] = useState('');

  const addDate = () => {
    if (!input) return;
    if (dates.includes(input)) { setInput(''); return; }
    const sorted = [...dates, input].sort();
    onChange(sorted);
    setInput('');
  };

  const removeDate = (d: string) => onChange(dates.filter(x => x !== d));

  const fmt = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        Active Dates{' '}
        <span className="text-gray-400 font-normal">(leave empty = no date restriction)</span>
      </label>

      {/* Input row */}
      <div className="flex gap-2 mb-2">
        <input
          type="date"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDate())}
          className="input-luxury text-sm py-2 flex-1"
        />
        <button
          type="button"
          onClick={addDate}
          disabled={!input}
          className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-40 transition-colors flex-shrink-0"
        >
          + Add
        </button>
      </div>

      {/* Chips */}
      {dates.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {dates.map(d => (
            <span key={d} className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium px-2.5 py-1.5 rounded-lg">
              📅 {fmt(d)}
              <button
                type="button"
                onClick={() => removeDate(d)}
                className="text-purple-400 hover:text-purple-700 transition-colors leading-none"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">No dates selected — promotion runs any day it's active.</p>
      )}
    </div>
  );
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
function PromoModal({
  initial, onSave, onClose, isSaving,
}: {
  initial: typeof EMPTY_FORM & { id?: string };
  onSave: (data: typeof EMPTY_FORM & { id?: string }) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = !!initial.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h3 className="font-display text-xl font-bold text-gray-900">{isEdit ? 'Edit Promotion' : 'Create Promotion'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Fill in the details below</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Type selector */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Promotion Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(TYPE_META).map(([key, meta]) => (
                <button
                  key={key} type="button"
                  onClick={() => set('type', key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                    form.type === key
                      ? `${meta.border} ${meta.bg} ${meta.color}`
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-base">{meta.icon}</span>
                  <span className="text-xs leading-tight">{meta.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              className="input-luxury text-sm py-2.5" placeholder="e.g. Weekend Glow Package" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={3} className="input-luxury text-sm resize-none"
              placeholder="Describe what customers get with this offer..." />
          </div>

          {/* Discount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Discount Type</label>
              <select value={form.discount_type} onChange={e => set('discount_type', e.target.value)} className="input-luxury text-sm py-2.5">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_amount">Fixed Amount (NZD)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Value {form.discount_type === 'percentage' ? '(%)' : '(NZ$)'}
              </label>
              <input type="number" min={0} value={form.discount_value}
                onChange={e => set('discount_value', +e.target.value)}
                className="input-luxury text-sm py-2.5" />
            </div>
          </div>

          {/* Promo code */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Promo Code <span className="text-gray-400 font-normal">(optional)</span></label>
            <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
              className="input-luxury text-sm py-2.5 font-mono tracking-widest" placeholder="e.g. LUXE20" />
          </div>

          {/* Multi-date picker */}
          <MultiDatePicker
            dates={form.applicable_dates}
            onChange={d => set('applicable_dates', d)}
          />

          {/* Service picker — all types */}
          <ServicePicker
            selected={form.applicable_services}
            onChange={ids => set('applicable_services', ids)}
          />

          {/* Image */}
          <ImageUpload
            value={form.image_url}
            onChange={url => set('image_url', url)}
            folder="promotions"
            label="Promotion Banner (optional)"
            aspectRatio="banner"
          />

          {/* Active toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-800">Published</p>
              <p className="text-xs text-gray-400">Visible on the public offers page</p>
            </div>
            <button
              type="button"
              onClick={() => set('is_active', !form.is_active)}
              className={`w-12 h-6 rounded-full transition-colors relative ${form.is_active ? 'bg-purple-600' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => onSave(form)}
              disabled={isSaving || !form.title}
              className="flex-1 btn-gold py-3 text-sm disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : isEdit ? '💾 Save Changes' : '✨ Create Promotion'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Promo Card ───────────────────────────────────────────────────────────────
function PromoCard({ promo, onEdit, onToggle }: { promo: any; onEdit: () => void; onToggle: () => void }) {
  const meta = TYPE_META[promo.type] ?? TYPE_META.daily_special;
  const isExpired = promo.end_date && new Date(promo.end_date) < new Date();
  const daysLeft = promo.end_date
    ? Math.max(0, Math.ceil((new Date(promo.end_date).getTime() - Date.now()) / 86400000))
    : null;
  const dates: string[] = Array.isArray(promo.applicable_dates) ? promo.applicable_dates : [];

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-md ${
      promo.is_active && !isExpired ? 'border-gray-100' : 'border-gray-200 opacity-60'
    }`}>
      {promo.image_url ? (
        <div className="h-32 overflow-hidden">
          <img src={resolveImageUrl(promo.image_url)} alt={promo.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className={`h-2 ${meta.bg} border-b ${meta.border}`} />
      )}

      <div className="p-4">
        {/* Type + status */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}>
            {meta.icon} {meta.label}
          </span>
          <div className="flex items-center gap-2">
            {isExpired && <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">Expired</span>}
            {!isExpired && daysLeft !== null && daysLeft <= 3 && (
              <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">⏳ {daysLeft}d left</span>
            )}
            <button
              onClick={onToggle}
              className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${promo.is_active ? 'bg-purple-600' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${promo.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">{promo.title}</h3>
        {promo.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{promo.description}</p>
        )}

        {/* Package / applicable services */}
        {promo.service_details?.length > 0 && (
          <div className="bg-indigo-50 rounded-lg p-2.5 mb-3">
            <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide mb-1.5">
              {promo.type === 'package' ? 'Includes' : 'Applicable to'}
            </p>
            <div className="space-y-1">
              {promo.service_details.map((s: any) => (
                <div key={s.id} className="flex justify-between text-xs">
                  <span className="text-indigo-700">{s.name}</span>
                  <span className="text-indigo-500 font-medium">NZ${s.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discount + code */}
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-lg">
            {promo.discount_type === 'percentage' ? `${promo.discount_value}% OFF` : `NZ$${promo.discount_value} OFF`}
          </span>
          {promo.code && (
            <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg tracking-widest">
              {promo.code}
            </span>
          )}
        </div>

        {/* Active dates */}
        {dates.length > 0 && (
          <p className="text-[11px] text-gray-400 mb-3 flex items-center gap-1 flex-wrap">
            📅
            {dates.map(d => new Date(d + 'T12:00:00').toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })).join(' · ')}
          </p>
        )}

        <button onClick={onEdit}
          className="w-full py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:border-purple-300 hover:text-purple-600 transition-all">
          ✏️ Edit
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminPromotions() {
  const qc = useQueryClient();
  const [activeType, setActiveType] = useState<string>('all');
  const [modal, setModal] = useState<null | (typeof EMPTY_FORM & { id?: string })>(null);

  const { data } = useQuery({ queryKey: ['promotions-admin'], queryFn: promotionApi.listAll });
  const promos: any[] = Array.isArray(data?.data) ? data.data : [];

  const create = useMutation({
    mutationFn: (d: any) => promotionApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promotions-admin'] });
      qc.invalidateQueries({ queryKey: ['promotions-public'] });
      setModal(null);
      toast.success('Promotion created!');
    },
    onError: () => toast.error('Failed to create promotion'),
  });

  const update = useMutation({
    mutationFn: ({ id, ...d }: any) => promotionApi.update(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promotions-admin'] });
      qc.invalidateQueries({ queryKey: ['promotions-public'] });
      setModal(null);
      toast.success('Promotion updated!');
    },
    onError: () => toast.error('Failed to update promotion'),
  });

  const handleSave = (form: typeof EMPTY_FORM & { id?: string }) => {
    if (form.id) update.mutate(form);
    else create.mutate(form);
  };

  const handleToggle = (promo: any) => {
    update.mutate({
      ...promo,
      applicable_dates: Array.isArray(promo.applicable_dates) ? promo.applicable_dates : [],
      is_active: !promo.is_active,
    });
  };

  const filtered = activeType === 'all' ? promos : promos.filter(p => p.type === activeType);
  const counts = promos.reduce((acc, p) => { acc[p.type] = (acc[p.type] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900">Promotions</h2>
          <p className="text-sm text-gray-400 mt-0.5">{promos.filter(p => p.is_active).length} active · {promos.length} total</p>
        </div>
        <button onClick={() => setModal({ ...EMPTY_FORM })} className="btn-gold">+ Create Promotion</button>
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setActiveType('all')}
          className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all border ${
            activeType === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
          }`}
        >
          All ({promos.length})
        </button>
        {Object.entries(TYPE_META).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setActiveType(key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all border flex items-center gap-1.5 ${
              activeType === key ? `${meta.bg} ${meta.color} ${meta.border}` : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
            }`}
          >
            {meta.icon} {meta.label} {counts[key] ? `(${counts[key]})` : ''}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">{activeType !== 'all' ? TYPE_META[activeType]?.icon : '📋'}</p>
          <p className="font-semibold text-gray-600 mb-1">No {activeType !== 'all' ? TYPE_META[activeType]?.label : ''} promotions yet</p>
          <p className="text-sm text-gray-400 mb-4">Create your first one to start attracting customers.</p>
          <button onClick={() => setModal({ ...EMPTY_FORM, type: activeType !== 'all' ? activeType : 'daily_special' })}
            className="btn-gold text-sm px-5 py-2">+ Create One</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <PromoCard
              key={p.id}
              promo={p}
              onEdit={() => setModal({
                id: p.id, title: p.title, description: p.description ?? '',
                type: p.type, discount_type: p.discount_type, discount_value: p.discount_value,
                code: p.code ?? '',
                applicable_dates: Array.isArray(p.applicable_dates) ? p.applicable_dates : [],
                image_url: p.image_url ?? '',
                applicable_services: Array.isArray(p.applicable_services)
                  ? p.applicable_services
                  : (p.service_details?.map((s: any) => s.id) ?? []),
                is_active: p.is_active,
              })}
              onToggle={() => handleToggle(p)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <PromoModal
          initial={modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
          isSaving={create.isPending || update.isPending}
        />
      )}
    </div>
  );
}
