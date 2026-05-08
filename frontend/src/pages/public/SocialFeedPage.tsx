import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { socialApi, resolveImageUrl } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const TYPE_LABEL: Record<string, string> = {
  post: 'Post',
  offer: 'Offer',
  service_highlight: 'Service',
  before_after: 'Before & After',
};

const TYPE_COLOR: Record<string, string> = {
  post:              'bg-purple-50 text-purple-600 border-purple-100',
  offer:             'bg-amber-50 text-amber-600 border-amber-100',
  service_highlight: 'bg-blue-50 text-blue-600 border-blue-100',
  before_after:      'bg-emerald-50 text-emerald-600 border-emerald-100',
};

export default function SocialFeedPage() {
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['social-pub'], queryFn: socialApi.list });
  const posts = Array.isArray(data?.data) ? data.data : [];

  const like = useMutation({
    mutationFn: (id: string) => socialApi.like(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-pub'] }),
    onError: () => { if (!isAuthenticated) toast.error('Sign in to like posts'); },
  });

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative flex items-center justify-center overflow-hidden bg-purple-900" style={{ minHeight: '38vh', paddingTop: '2.5rem', paddingBottom: '3.5rem' }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-purple-800/30 blur-[120px]" />
          <div className="absolute -bottom-16 -right-16 w-[400px] h-[400px] rounded-full bg-violet-700/20 blur-[100px]" />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #a78bfa 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-white via-white/60 to-transparent" />

        <div className="relative z-10 text-center max-w-3xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 mb-4">
            <span className="w-6 h-px bg-purple-500/60" />
            <span className="text-purple-400 text-xs font-semibold tracking-[0.2em] uppercase">Latest Updates</span>
            <span className="w-6 h-px bg-purple-500/60" />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="font-display text-5xl md:text-6xl font-bold text-white">
            LuxeSalon Feed
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="text-white/60 mt-4 text-lg">
            Offers, transformations, and salon news.
          </motion.p>
        </div>
      </section>

      {/* ── Feed ── */}
      <section className="relative py-14 sm:py-20 px-4 overflow-hidden bg-gradient-to-b from-white via-purple-50/20 to-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-100/40 blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full bg-violet-100/30 blur-[90px]" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/70 border border-purple-100/60 overflow-hidden">
                <div className="aspect-video skeleton bg-purple-50" />
                <div className="p-6 space-y-3">
                  <div className="h-4 skeleton bg-gray-100 rounded w-2/3" />
                  <div className="h-3 skeleton bg-gray-100 rounded w-full" />
                  <div className="h-3 skeleton bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <div className="text-5xl mb-4">📱</div>
              <p className="font-medium">No posts yet. Check back soon!</p>
            </div>
          ) : (
            posts.map((post: any, i: number) => (
              <motion.div
                key={post.id}
                initial="hidden" whileInView="visible" variants={fadeUp} custom={i}
                viewport={{ once: true }}
                className="bg-white/70 backdrop-blur-sm border border-purple-100/60 rounded-2xl
                           shadow-sm hover:shadow-lg hover:shadow-purple-200/30 transition-all duration-300 overflow-hidden"
              >
                {/* Feature image */}
                {post.image_urls?.[0] && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={resolveImageUrl(post.image_urls[0])} alt=""
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}

                <div className="p-5 sm:p-6">
                  {/* Author row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        L
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">LuxeSalon NZ</div>
                        <div className="text-xs text-gray-400">
                          {new Date(post.created_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${TYPE_COLOR[post.type] || TYPE_COLOR.post}`}>
                      {TYPE_LABEL[post.type] || post.type}
                    </span>
                  </div>

                  {post.title && (
                    <h3 className="font-display text-lg font-bold text-gray-900 mb-2">{post.title}</h3>
                  )}
                  <p className="text-gray-600 text-sm leading-relaxed">{post.content}</p>

                  {/* Additional images */}
                  {post.image_urls?.length > 1 && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {post.image_urls.slice(1).map((url: string, j: number) => (
                        <div key={j} className="aspect-square rounded-xl overflow-hidden">
                          <img src={resolveImageUrl(url)} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center gap-4 mt-5 pt-4 border-t border-purple-100/50">
                    <button
                      onClick={() => like.mutate(post.id)}
                      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <span>❤️</span>
                      <span>{post.like_count || 0}</span>
                    </button>
                    <span className="flex items-center gap-1.5 text-sm text-gray-400">
                      <span>💬</span>
                      <span>{post.comments?.length || 0}</span>
                    </span>
                    <div className="ml-auto">
                      <Link
                        to="/book"
                        className="text-xs font-bold px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
