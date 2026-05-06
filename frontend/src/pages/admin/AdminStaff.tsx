// AdminStaff.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { staffApi, branchApi, serviceApi } from '../../services/api';
import ImageUpload from '../../components/ui/ImageUpload';

export default function AdminStaff() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState({ first_name:'', last_name:'', email:'', phone:'', role:'Hairdresser', branch_id:'', bio:'', image_url:'', experience_years:0, service_ids:[] as string[] });

  const { data: staffRes, isLoading } = useQuery({ queryKey:['admin-staff'], queryFn: () => staffApi.list() });
  const { data: branchRes } = useQuery({ queryKey:['branches'], queryFn: branchApi.list });
  const { data: servicesRes } = useQuery({ queryKey:['services'], queryFn: () => serviceApi.list() });

  const staff = staffRes?.data || [];
  const branches = branchRes?.data || [];
  const services = servicesRes?.data || [];

  const save = useMutation({
    mutationFn: (data: any) => editTarget ? staffApi.update(editTarget.id, data) : staffApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['admin-staff'] }); setShowForm(false); setEditTarget(null); toast.success('Saved!'); },
    onError: () => toast.error('Save failed'),
  });

  const openEdit = (member: any) => { setEditTarget(member); setForm({ ...member, service_ids: member.service_ids || [] }); setShowForm(true); };
  const openNew = () => { setEditTarget(null); setForm({ first_name:'', last_name:'', email:'', phone:'', role:'Hairdresser', branch_id:'', bio:'', image_url:'', experience_years:0, service_ids:[] }); setShowForm(true); };

  const ROLES = ['Hairdresser','Barber','Colourist','Beautician','Nail Technician','Massage Therapist','Skincare Specialist','Lash Artist','Brow Specialist'];

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="text-onyx-400 text-sm">{staff.length} team members</p>
        <button onClick={openNew} className="btn-gold">+ Add Staff</button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_,i) => <div key={i} className="h-56 skeleton rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {staff.map((member: any) => (
            <div key={member.id} className="card-luxury group">
              <div className="aspect-square bg-gradient-to-br from-gold-100 to-champagne overflow-hidden">
                {member.image_url
                  ? <img src={member.image_url} alt={member.first_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full flex items-center justify-center text-4xl text-gold-400">{member.first_name?.[0]}</div>
                }
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-onyx-900">{member.first_name} {member.last_name}</h3>
                <p className="text-gold-600 text-xs font-medium">{member.role}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-gold-400 text-xs">{'★'.repeat(Math.round(member.avg_rating||5))}</span>
                  <span className="text-xs text-onyx-400">({member.review_count||0})</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(member)} className="flex-1 text-xs border border-gray-200 rounded-lg py-1.5 hover:border-gold-400 hover:text-gold-600 transition-colors">Edit</button>
                  <button onClick={() => save.mutate({ ...member, is_active: !member.is_active })}
                    className={`text-xs px-2 py-1.5 rounded-lg transition-colors ${member.is_active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-500'}`}>
                    {member.is_active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-display text-xl font-bold">{editTarget ? 'Edit' : 'Add'} Staff Member</h3>
              <button onClick={() => setShowForm(false)} className="text-onyx-400 hover:text-onyx-700">✕</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-onyx-600 mb-1">First Name</label>
                  <input value={form.first_name} onChange={e=>setForm(f=>({...f,first_name:e.target.value}))} className="input-luxury text-sm py-2" /></div>
                <div><label className="block text-xs font-medium text-onyx-600 mb-1">Last Name</label>
                  <input value={form.last_name} onChange={e=>setForm(f=>({...f,last_name:e.target.value}))} className="input-luxury text-sm py-2" /></div>
              </div>
              <div><label className="block text-xs font-medium text-onyx-600 mb-1">Role</label>
                <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} className="input-luxury text-sm py-2">
                  {ROLES.map(r=><option key={r}>{r}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-onyx-600 mb-1">Branch</label>
                <select value={form.branch_id} onChange={e=>setForm(f=>({...f,branch_id:e.target.value}))} className="input-luxury text-sm py-2">
                  <option value="">Select branch</option>
                  {branches.map((b:any)=><option key={b.id} value={b.id}>{b.name}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-onyx-600 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className="input-luxury text-sm py-2" /></div>
              <div><label className="block text-xs font-medium text-onyx-600 mb-1">Phone</label>
                <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className="input-luxury text-sm py-2" /></div>
              <div><label className="block text-xs font-medium text-onyx-600 mb-1">Bio</label>
                <textarea value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} rows={2} className="input-luxury text-sm" /></div>
              <ImageUpload
                value={form.image_url}
                onChange={url => setForm(f => ({ ...f, image_url: url }))}
                folder="staff"
                label="Profile Photo"
                aspectRatio="square"
              />
              <div><label className="block text-xs font-medium text-onyx-600 mb-1">Experience (years)</label>
                <input type="number" value={form.experience_years} onChange={e=>setForm(f=>({...f,experience_years:+e.target.value}))} className="input-luxury text-sm py-2" /></div>
              <div>
                <label className="block text-xs font-medium text-onyx-600 mb-1">Services</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                  {services.map((s:any)=>(
                    <label key={s.id} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={form.service_ids.includes(s.id)}
                        onChange={e=>setForm(f=>({...f,service_ids:e.target.checked?[...f.service_ids,s.id]:f.service_ids.filter(id=>id!==s.id)}))}
                        className="accent-gold-500" />
                      <span className="text-xs text-onyx-600">{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-onyx-600 hover:border-gold-400">Cancel</button>
                <button onClick={() => save.mutate(form)} disabled={save.isPending} className="flex-1 btn-gold py-2.5 text-sm disabled:opacity-60">
                  {save.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
