import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { socialApi, resolveImageUrl } from '../../services/api';
import MultiImageUpload from '../../components/ui/MultiImageUpload';

export default function AdminSocial() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', content:'', type:'post', image_urls: [] as string[] });

  const { data } = useQuery({ queryKey:['social-admin'], queryFn: socialApi.list });
  const posts = Array.isArray(data?.data) ? data.data : [];

  const create = useMutation({
    mutationFn: (d:any) => socialApi.create({ ...d, image_urls: d.image_urls.filter(Boolean) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['social-admin'] }); setShowForm(false); toast.success('Post published!'); },
  });

  const TYPE_LABELS: Record<string,string> = { post:'📝 Post', offer:'🎁 Offer', service_highlight:'✂️ Service Highlight', before_after:'✨ Before & After' };

  return (
    <div className="space-y-5">
      <div className="flex justify-end"><button onClick={()=>setShowForm(true)} className="btn-gold">+ Create Post</button></div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {posts.map((post:any)=>(
          <div key={post.id} className="card-luxury overflow-hidden">
            {post.image_urls?.[0]&&(
              <div className="aspect-video overflow-hidden bg-gray-100">
                <img src={resolveImageUrl(post.image_urls[0])} alt="" className="w-full h-full object-cover"/>
              </div>
            )}
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gold-600 font-medium">{TYPE_LABELS[post.type]||post.type}</span>
                <span className="text-xs text-onyx-400">{new Date(post.created_at).toLocaleDateString('en-NZ')}</span>
              </div>
              {post.title&&<h3 className="font-semibold text-onyx-900 mb-1">{post.title}</h3>}
              <p className="text-sm text-onyx-600 line-clamp-3">{post.content}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-onyx-400">
                <span>❤️ {post.like_count||0} likes</span>
                <span>💬 {post.comments?.length||0} comments</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-5"><h3 className="font-display text-xl font-bold">Create Post</h3><button onClick={()=>setShowForm(false)}>✕</button></div>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium mb-1">Post Type</label>
                <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className="input-luxury text-sm py-2">
                  {Object.entries(TYPE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium mb-1">Title (optional)</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="input-luxury text-sm py-2"/></div>
              <div><label className="block text-xs font-medium mb-1">Content *</label><textarea value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} rows={4} className="input-luxury text-sm" placeholder="Write your post..."/></div>
              <MultiImageUpload
                values={form.image_urls}
                onChange={urls => setForm(f => ({ ...f, image_urls: urls }))}
                folder="social"
                label="Post Images"
                max={6}
              />
              <div className="flex gap-3 pt-2">
                <button onClick={()=>setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">Cancel</button>
                <button onClick={()=>create.mutate(form)} disabled={create.isPending||!form.content} className="flex-1 btn-gold py-2.5 text-sm disabled:opacity-60">{create.isPending?'Publishing...':'Publish'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
