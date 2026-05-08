import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { staffApi, resolveImageUrl } from '../../services/api';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

function Stars({ rating = 5 }: { rating?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`text-xs ${i <= rating ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
      ))}
    </div>
  );
}

export default function StaffPage() {
  const { data, isLoading } = useQuery({ queryKey: ['staff-pub'], queryFn: () => staffApi.list() });
  const staff = Array.isArray(data?.data) ? data.data : [];

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
            <span className="text-purple-400 text-xs font-semibold tracking-[0.2em] uppercase">The Artists</span>
            <span className="w-6 h-px bg-purple-500/60" />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="font-display text-5xl md:text-6xl font-bold text-white">
            Meet Our Team
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="text-white/60 mt-4 text-lg max-w-xl mx-auto">
            Our talented stylists bring passion and expertise to every appointment.
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
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-white/70 border border-purple-100/60">
                  <div className="aspect-[3/4] skeleton bg-purple-50" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-3.5 skeleton bg-gray-100 rounded w-3/4" />
                    <div className="h-3 skeleton bg-gray-100 rounded w-1/2" />
                    <div className="h-8 skeleton bg-gray-100 rounded-xl mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <div className="text-5xl mb-4">👥</div>
              <p className="font-medium">No team members found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {staff.map((member: any, i: number) => (
                <motion.div
                  key={member.id}
                  initial="hidden" whileInView="visible" variants={fadeUp} custom={i}
                  viewport={{ once: true }}
                  className="group relative bg-white/70 backdrop-blur-sm border border-purple-100/60 rounded-2xl
                             shadow-sm hover:shadow-xl hover:shadow-purple-200/40 hover:-translate-y-2
                             transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* Top accent line */}
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-purple-400/60 to-transparent
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

                  {/* Portrait image */}
                  <div className="relative w-full overflow-hidden bg-purple-50 shrink-0" style={{ aspectRatio: '3/4' }}>
                    {member.image_url ? (
                      <img
                        src={resolveImageUrl(member.image_url)}
                        alt={`${member.first_name} ${member.last_name}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-white
                                      bg-gradient-to-br from-purple-400 to-violet-600">
                        {member.first_name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <span className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm
                                     text-emerald-400 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-white/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Available
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex flex-col flex-1 p-4">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight capitalize">
                      {member.first_name} {member.last_name}
                    </h3>
                    <p className="text-purple-500 text-xs font-semibold uppercase tracking-wide mt-1">{member.role}</p>
                    {member.experience_years > 0 && (
                      <p className="text-gray-400 text-xs mt-0.5">{member.experience_years} yrs experience</p>
                    )}

                    <div className="flex items-center gap-1 mt-2">
                      <Stars rating={Math.round(member.avg_rating || 5)} />
                      <span className="text-gray-400 text-xs ml-0.5">({member.review_count || 0})</span>
                    </div>

                    {member.bio && (
                      <p className="text-gray-500 text-xs mt-2 line-clamp-2 leading-relaxed">{member.bio}</p>
                    )}

                    {member.services?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {member.services.slice(0, 2).map((s: string) => (
                          <span key={s} className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-100 font-medium">{s}</span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto pt-3">
                      <Link
                        to={`/book?staff_id=${member.id}`}
                        className="block w-full text-center text-xs font-bold py-2.5 rounded-xl
                                   bg-purple-50 text-purple-700 border border-purple-100
                                   group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600
                                   transition-all duration-300"
                      >
                        Book with {member.first_name}
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
