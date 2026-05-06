// AdminPromotions.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { promotionApi } from '../../services/api';
import ImageUpload from '../../components/ui/ImageUpload';

export default function AdminPromotions() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', description:'', type:'daily_special', discount_type:'percentage', discount_value:10, code:'', start_date:'', end_date:'', image_url:'' });

  const { data } = useQuery({ queryKey:['promotions-admin'], queryFn: promotionApi.list });
  const promos = data?.data || [];

  const create = useMutation({
    mutationFn: promotionApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey:['promotions-admin'] }); setShowForm(false); toast.success('Promotion created!'); },
  });

  const TYPE_LABELS: Record<string,string> = { daily_special:'🌅 Daily Special', weekly_deal:'📅 Weekly Deal', monthly_campaign:'📆 Monthly Campaign', discount_code:'🏷 Discount Code', package:'📦 Package' };

  return (
    <div className="space-y-5">
      <div className="flex justify-end"><button onClick={()=>setShowForm(true)} className="btn-gold">+ Create Promotion</button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {promos.map((p:any)=>(
          <div key={p.id} className="card-luxury overflow-hidden">
            {p.image_url&&<div className="h-32 overflow-hidden"><img src={p.image_url} alt={p.title} className="w-full h-full object-cover"/></div>}
            <div className="p-5">
              <span className="text-xs text-gold-600 font-medium">{TYPE_LABELS[p.type]||p.type}</span>
              <h3 className="font-semibold text-onyx-900 mt-1">{p.title}</h3>
              <p className="text-sm text-onyx-500 mt-1 line-clamp-2">{p.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="bg-gold-100 text-gold-700 text-xs font-bold px-2 py-1 rounded-lg">
                  {p.discount_type==='percentage'?`${p.discount_value}% OFF`:`NZ$${p.discount_value} OFF`}
                </span>
                {p.code&&<span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg">{p.code}</span>}
              </div>
              {(p.start_date||p.end_date)&&<p className="text-xs text-onyx-400 mt-2">
                {p.start_date&&new Date(p.start_date).toLocaleDateString('en-NZ')} – {p.end_date&&new Date(p.end_date).toLocaleDateString('en-NZ')}
              </p>}
            </div>
          </div>
        ))}
      </div>

      {showForm&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-5"><h3 className="font-display text-xl font-bold">Create Promotion</h3><button onClick={()=>setShowForm(false)}>✕</button></div>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium mb-1">Title</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="input-luxury text-sm py-2"/></div>
              <div><label className="block text-xs font-medium mb-1">Type</label>
                <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className="input-luxury text-sm py-2">
                  {Object.entries(TYPE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium mb-1">Description</label><textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2} className="input-luxury text-sm"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium mb-1">Discount Type</label>
                  <select value={form.discount_type} onChange={e=>setForm(f=>({...f,discount_type:e.target.value}))} className="input-luxury text-sm py-2">
                    <option value="percentage">Percentage</option><option value="fixed_amount">Fixed Amount (NZD)</option>
                  </select></div>
                <div><label className="block text-xs font-medium mb-1">Discount Value</label><input type="number" value={form.discount_value} onChange={e=>setForm(f=>({...f,discount_value:+e.target.value}))} className="input-luxury text-sm py-2"/></div>
              </div>
              <div><label className="block text-xs font-medium mb-1">Promo Code (optional)</label><input value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value.toUpperCase()}))} className="input-luxury text-sm py-2 font-mono" placeholder="SUMMER25"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium mb-1">Start Date</label><input type="date" value={form.start_date} onChange={e=>setForm(f=>({...f,start_date:e.target.value}))} className="input-luxury text-sm py-2"/></div>
                <div><label className="block text-xs font-medium mb-1">End Date</label><input type="date" value={form.end_date} onChange={e=>setForm(f=>({...f,end_date:e.target.value}))} className="input-luxury text-sm py-2"/></div>
              </div>
              <ImageUpload
                value={form.image_url}
                onChange={url => setForm(f => ({ ...f, image_url: url }))}
                folder="promotions"
                label="Promotion Banner"
                aspectRatio="banner"
              />
              <div className="flex gap-3 pt-2">
                <button onClick={()=>setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">Cancel</button>
                <button onClick={()=>create.mutate(form)} disabled={create.isPending} className="flex-1 btn-gold py-2.5 text-sm">{create.isPending?'Creating...':'Create'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
