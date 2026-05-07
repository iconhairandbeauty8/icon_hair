// AdminServices.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { serviceApi, branchApi, resolveImageUrl } from '../../services/api';
import ImageUpload from '../../components/ui/ImageUpload';

const CATEGORIES = ['Hair','Hair Colour','Hair Treatment','Skincare','Nails','Beauty','Wellness','Barbering'];

export default function AdminServices() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState({ name:'', category:'Hair', description:'', price:0, duration_minutes:60, image_url:'', branch_ids:[] as string[] });
  const [catFilter, setCatFilter] = useState('');

  const { data, isLoading } = useQuery({ queryKey:['admin-services'], queryFn:() => serviceApi.list() });
  const { data: branchRes } = useQuery({ queryKey:['branches'], queryFn: branchApi.list });
  const branches = Array.isArray(branchRes?.data) ? branchRes.data : [];
  const services = (Array.isArray(data?.data) ? data.data : []).filter((s:any) => !catFilter || s.category === catFilter);

  const save = useMutation({
    mutationFn: (d:any) => editTarget ? serviceApi.update(editTarget.id, d) : serviceApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['admin-services'] }); setShowForm(false); toast.success('Saved!'); },
  });

  const openNew = () => { setEditTarget(null); setForm({ name:'', category:'Hair', description:'', price:0, duration_minutes:60, image_url:'', branch_ids:[] }); setShowForm(true); };
  const openEdit = (s:any) => { setEditTarget(s); setForm({ ...s, branch_ids: s.branch_ids || [] }); setShowForm(true); };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button onClick={()=>setCatFilter('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!catFilter?'bg-gold-gradient text-white':'border border-gray-200 text-onyx-600'}`}>All</button>
          {CATEGORIES.map(c=>(
            <button key={c} onClick={()=>setCatFilter(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${catFilter===c?'bg-gold-gradient text-white':'border border-gray-200 text-onyx-600'}`}>{c}</button>
          ))}
        </div>
        <button onClick={openNew} className="btn-gold text-sm">+ Add Service</button>
      </div>

      {isLoading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_,i)=><div key={i} className="h-40 skeleton rounded-2xl"/>)}</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s:any) => (
            <div key={s.id} className="card-luxury overflow-hidden group">
              {/* Image */}
              <div className="aspect-video bg-gradient-to-br from-gold-100 to-champagne overflow-hidden">
                {s.image_url
                  ? <img src={resolveImageUrl(s.image_url)} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gold-400">
                      <span className="text-3xl">✂️</span>
                      <span className="text-xs font-medium">{s.category}</span>
                    </div>
                }
              </div>
              {/* Info */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="text-xs text-gold-600 uppercase tracking-wide">{s.category}</span>
                    <h3 className="font-semibold text-onyx-900 mt-0.5 truncate">{s.name}</h3>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-gold-600 font-bold">NZ${s.price}</div>
                    <div className="text-xs text-onyx-400">{s.duration_minutes}min</div>
                  </div>
                </div>
                <p className="text-sm text-onyx-500 line-clamp-2 mb-3">{s.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-onyx-400">{s.booking_count||0} bookings · ★{Number(s.avg_rating||0).toFixed(1)}</div>
                  <button onClick={()=>openEdit(s)} className="text-xs border border-gray-200 px-3 py-1 rounded-lg hover:border-gold-400 hover:text-gold-600 transition-colors">Edit</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-display text-xl font-bold">{editTarget?'Edit':'Add'} Service</h3>
              <button onClick={()=>setShowForm(false)} className="text-onyx-400 hover:text-onyx-700">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 pt-4">
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-onyx-600 mb-1">Name</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="input-luxury text-sm py-2" /></div>
              <div><label className="block text-xs font-medium text-onyx-600 mb-1">Category</label>
                <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="input-luxury text-sm py-2">
                  {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-onyx-600 mb-1">Description</label>
                <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2} className="input-luxury text-sm"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-onyx-600 mb-1">Price (NZD)</label>
                  <input type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:+e.target.value}))} className="input-luxury text-sm py-2"/></div>
                <div><label className="block text-xs font-medium text-onyx-600 mb-1">Duration (min)</label>
                  <input type="number" value={form.duration_minutes} onChange={e=>setForm(f=>({...f,duration_minutes:+e.target.value}))} className="input-luxury text-sm py-2"/></div>
              </div>
              <ImageUpload
                value={form.image_url}
                onChange={url => setForm(f => ({ ...f, image_url: url }))}
                folder="services"
                label="Service Image"
                aspectRatio="video"
              />
              <div>
                <label className="block text-xs font-medium text-onyx-600 mb-1">Available at Branches</label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {branches.map((b:any) => (
                    <label key={b.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.branch_ids.includes(b.id)}
                        onChange={e => setForm(f => ({ ...f, branch_ids: e.target.checked ? [...f.branch_ids, b.id] : f.branch_ids.filter(id => id !== b.id) }))}
                        className="accent-gold-500"
                      />
                      <span className="text-sm text-onyx-700">{b.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={()=>setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">Cancel</button>
                <button onClick={()=>save.mutate(form)} disabled={save.isPending} className="flex-1 btn-gold py-2.5 text-sm disabled:opacity-60">{save.isPending?'Saving...':'Save'}</button>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
