// AdminBranches.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { branchApi } from '../../services/api';
import ImageUpload from '../../components/ui/ImageUpload';
import MapPicker from '../../components/ui/MapPicker';

export default function AdminBranches() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState({ name:'', address:'', suburb:'', city:'Auckland', postcode:'', phone:'', email:'', description:'', latitude:'', longitude:'', image_url:'' });

  const { data } = useQuery({ queryKey:['branches-admin'], queryFn: branchApi.list });
  const branches = Array.isArray(data?.data) ? data.data : [];

  const save = useMutation({
    mutationFn: (d:any) => editTarget ? branchApi.update(editTarget.id, d) : branchApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['branches-admin'] }); setShowForm(false); toast.success('Branch saved!'); },
  });

  const NZ_CITIES = ['Auckland','Wellington','Christchurch','Hamilton','Tauranga','Dunedin','Palmerston North','Napier','Nelson','Rotorua'];

  const resetForm = () => setForm({ name:'', address:'', suburb:'', city:'Auckland', postcode:'', phone:'', email:'', description:'', latitude:'', longitude:'', image_url:'' });

  return (
    <div className="space-y-5">
      <div className="flex justify-end"><button onClick={()=>{setEditTarget(null);resetForm();setShowForm(true)}} className="btn-gold">+ Add Branch</button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {branches.map((b:any)=>(
          <div key={b.id} className="card-luxury overflow-hidden">
            <div className="h-40 bg-gradient-to-br from-gold-100 to-champagne overflow-hidden">
              {b.image_url&&<img src={b.image_url} alt={b.name} className="w-full h-full object-cover"/>}
            </div>
            <div className="p-5">
              <h3 className="font-display font-bold text-onyx-900">{b.name}</h3>
              <p className="text-sm text-onyx-500 mt-1">📍 {b.suburb}, {b.city}</p>
              <p className="text-sm text-onyx-500">📞 {b.phone}</p>
              <div className="flex gap-3 mt-3 text-xs text-onyx-400">
                <span>👥 {b.staff_count||0} staff</span>
                <span>✂️ {b.service_count||0} services</span>
                <span>★ {Number(b.avg_rating||0).toFixed(1)}</span>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={()=>{setEditTarget(b);setForm(b);setShowForm(true)}} className="flex-1 text-xs border border-gray-200 rounded-lg py-2 hover:border-gold-400 hover:text-gold-600 transition-colors">Edit</button>
                <a href={`https://maps.google.com/?q=${b.latitude},${b.longitude}`} target="_blank" rel="noreferrer"
                  className="text-xs border border-gray-200 px-3 py-2 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors">🗺</a>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showForm&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-5"><h3 className="font-display text-xl font-bold">{editTarget?'Edit':'Add'} Branch</h3><button onClick={()=>setShowForm(false)}>✕</button></div>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium mb-1">Branch Name</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="input-luxury text-sm py-2"/></div>
              <div><label className="block text-xs font-medium mb-1">Street Address</label><input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} className="input-luxury text-sm py-2"/></div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="block text-xs font-medium mb-1">Suburb</label><input value={form.suburb} onChange={e=>setForm(f=>({...f,suburb:e.target.value}))} className="input-luxury text-sm py-2"/></div>
                <div><label className="block text-xs font-medium mb-1">City</label>
                  <select value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} className="input-luxury text-sm py-2">
                    {NZ_CITIES.map(c=><option key={c}>{c}</option>)}</select></div>
                <div><label className="block text-xs font-medium mb-1">Postcode</label><input value={form.postcode} onChange={e=>setForm(f=>({...f,postcode:e.target.value}))} className="input-luxury text-sm py-2"/></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs font-medium mb-1">Phone</label><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className="input-luxury text-sm py-2"/></div>
                <div><label className="block text-xs font-medium mb-1">Email</label><input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className="input-luxury text-sm py-2"/></div>
              </div>
              <div><label className="block text-xs font-medium mb-1">Description</label><textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2} className="input-luxury text-sm"/></div>
              <MapPicker
                lat={form.latitude}
                lng={form.longitude}
                onChange={(lat, lng, address) => setForm(f => ({
                  ...f,
                  latitude: String(lat),
                  longitude: String(lng),
                  ...(address && !f.address ? { address } : {}),
                }))}
                label="Branch Location (click map or search)"
              />
              <ImageUpload
                value={form.image_url}
                onChange={url => setForm(f => ({ ...f, image_url: url }))}
                folder="branches"
                label="Branch Image"
                aspectRatio="banner"
              />
              <div className="flex gap-3 pt-2">
                <button onClick={()=>setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">Cancel</button>
                <button onClick={()=>save.mutate(form)} disabled={save.isPending} className="flex-1 btn-gold py-2.5 text-sm">{save.isPending?'Saving...':'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
