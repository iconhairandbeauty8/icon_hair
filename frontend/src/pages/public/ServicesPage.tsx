import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { serviceApi, resolveImageUrl } from '../../services/api';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function ServicesPage() {
  const [params] = useSearchParams();
  const [catFilter, setCatFilter] = useState(params.get('category') || '');
  const { data, isLoading } = useQuery({ queryKey: ['services-pub', catFilter], queryFn: () => serviceApi.list({ category: catFilter || undefined }) });
  const { data: catData } = useQuery({ queryKey: ['service-cats'], queryFn: serviceApi.categories });

  const services = Array.isArray(data?.data) ? data.data : [];
  const categories = Array.isArray(catData?.data) ? catData.data : [];

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
            <span className="text-purple-400 text-xs font-semibold tracking-[0.2em] uppercase">Our Treatments</span>
            <span className="w-6 h-px bg-purple-500/60" />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="font-display text-5xl md:text-6xl font-bold text-white">
            Premium Services
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="text-white/60 mt-4 text-lg max-w-xl mx-auto">
            Expert treatments using luxury products, tailored for New Zealand's finest clients.
          </motion.p>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="relative py-14 sm:py-20 px-4 overflow-hidden bg-gradient-to-b from-white via-purple-50/20 to-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-100/40 blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full bg-violet-100/30 blur-[90px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-10 justify-center">
            <button
              onClick={() => setCatFilter('')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                !catFilter
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                  : 'border border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600 bg-white'
              }`}
            >
              All Services
            </button>
            {categories.map((c: any) => (
              <button key={c.category} onClick={() => setCatFilter(c.category)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  catFilter === c.category
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                    : 'border border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600 bg-white'
                }`}>
                {c.category} <span className="opacity-60">({c.service_count})</span>
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-[24px] bg-gray-100 skeleton" style={{ height: '380px' }} />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <div className="text-5xl mb-4">✂️</div>
              <p className="font-medium">No services found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((s: any, i: number) => (
                <motion.div
                  key={s.id}
                  initial="hidden" whileInView="visible" variants={fadeUp} custom={i}
                  viewport={{ once: true }}
                  className="group relative rounded-[24px] overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-purple-200/40 hover:-translate-y-1 transition-all duration-300"
                  style={{ height: '380px' }}
                >
                  {/* Image */}
                  <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.04]">
                    {s.image_url
                      ? <img src={resolveImageUrl(s.image_url)} alt={s.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-purple-400 via-purple-600 to-purple-900 flex items-center justify-center">
                          <span className="text-7xl opacity-20">✂️</span>
                        </div>
                    }
                  </div>
                  {/* Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  {/* Badges */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                    {s.category && (
                      <span className="text-[10px] font-semibold tracking-widest uppercase text-white/90 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
                        {s.category}
                      </span>
                    )}
                    {s.avg_rating > 0 && (
                      <span className="flex items-center gap-1 bg-amber-500/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-400/30 ml-auto">
                        <span className="text-amber-400 text-xs">★</span>
                        <span className="text-white text-xs font-semibold">{Number(s.avg_rating).toFixed(1)}</span>
                      </span>
                    )}
                  </div>
                  {/* Bottom panel */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-xl border-t border-white/10 p-5 z-10">
                    <h3 className="font-bold text-white text-lg leading-snug mb-1 truncate">{s.name}</h3>
                    {s.description && (
                      <p className="text-white/45 text-xs mb-3 line-clamp-1">{s.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white bg-white/15 px-3 py-1 rounded-full">NZ${s.price}</span>
                        <span className="text-xs text-white/50 bg-white/8 px-2.5 py-1 rounded-full border border-white/10">{s.duration_minutes} min</span>
                      </div>
                      <Link
                        to={`/book?service_id=${s.id}`}
                        onClick={e => e.stopPropagation()}
                        className="text-xs font-bold px-4 py-2 rounded-xl bg-white text-purple-700 hover:bg-white/90 transition-all duration-200 hover:scale-105"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default ServicesPage;
