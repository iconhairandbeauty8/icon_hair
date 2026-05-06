import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { socialApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const TYPE_ICONS: Record<string, string> = { post: '📝', offer: '🎁', service_highlight: '✂️', before_after: '✨' };

export default function SocialFeedPage() {
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['social-pub'], queryFn: socialApi.list });
  const posts = data?.data || [];

  const like = useMutation({
    mutationFn: (id: string) => socialApi.like(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-pub'] }),
    onError: () => { if (!isAuthenticated) toast.error('Sign in to like posts'); },
  });

  return (
    <div className="min-h-screen pt-20">
      <div className="bg-onyx-950 py-16 text-center">
        <p className="text-gold-400 font-accent italic text-lg mb-2">Latest Updates</p>
        <h1 className="font-display text-4xl md:text-5xl text-white font-bold">LuxeSalon Feed</h1>
        <p className="text-white/60 mt-3">Offers, transformations, and salon news.</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        {isLoading ? (
          [...Array(4)].map((_,i) => <div key={i} className="h-64 skeleton rounded-2xl"/>)
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-onyx-400">
            <div className="text-5xl mb-4">📱</div>
            <p>No posts yet. Check back soon!</p>
          </div>
        ) : (
          posts.map((post: any, i: number) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} viewport={{ once: true }}
              className="card-luxury overflow-hidden">
              {post.image_urls?.[0] && (
                <div className="aspect-video overflow-hidden">
                  <img src={post.image_urls[0]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"/>
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gold-gradient flex items-center justify-center text-white font-bold text-sm">L</div>
                    <div>
                      <div className="font-semibold text-onyx-900 text-sm">LuxeSalon NZ</div>
                      <div className="text-xs text-onyx-400">{new Date(post.created_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                  </div>
                  <span className="text-xs bg-gold-50 text-gold-700 px-2 py-1 rounded-full font-medium">
                    {TYPE_ICONS[post.type]} {post.type.replace('_', ' ')}
                  </span>
                </div>
                {post.title && <h3 className="font-display text-xl font-bold text-onyx-900 mb-2">{post.title}</h3>}
                <p className="text-onyx-600 leading-relaxed">{post.content}</p>

                {/* Multiple images */}
                {post.image_urls?.length > 1 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {post.image_urls.slice(1).map((url: string, j: number) => (
                      <div key={j} className="aspect-square rounded-xl overflow-hidden">
                        <img src={url} alt="" className="w-full h-full object-cover"/>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => like.mutate(post.id)}
                    className="flex items-center gap-1.5 text-sm text-onyx-500 hover:text-red-500 transition-colors"
                  >
                    <span>❤️</span>
                    <span>{post.like_count || 0}</span>
                  </button>
                  <span className="flex items-center gap-1.5 text-sm text-onyx-400">
                    <span>💬</span>
                    <span>{post.comments?.length || 0}</span>
                  </span>
                  <div className="ml-auto">
                    <Link to="/book" className="text-sm text-gold-600 font-medium hover:text-gold-700 transition-colors">Book Now →</Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
