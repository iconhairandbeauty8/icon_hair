import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { serviceApi, resolveImageUrl } from '../../services/api';

const CATEGORY_ICON: Record<string, string> = {
  hair: '✂️', nails: '💅', skincare: '✨', wellness: '💆',
  beauty: '👁️', makeup: '💄', massage: '🤲', waxing: '🌿', threading: '🧵',
};

export default function ServicesCarousel() {
  const [active, setActive] = useState(0);
  const [spacing, setSpacing] = useState(250);
  const [visibleRange, setVisibleRange] = useState(2);
  const [cardWidth, setCardWidth] = useState(272);

  const { data: svcData, isLoading } = useQuery({
    queryKey: ['services-carousel'],
    queryFn: () => serviceApi.list(),
  });

  const services: any[] = Array.isArray(svcData?.data)
    ? [...svcData.data].sort((a, b) => (b.booking_count ?? 0) - (a.booking_count ?? 0))
    : [];

  // Keep active index in bounds when service list changes
  useEffect(() => {
    setActive(i => (services.length > 0 ? Math.min(i, services.length - 1) : 0));
  }, [services.length]);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 480) {
        setSpacing(Math.round(w * 0.62));
        setVisibleRange(1);
        setCardWidth(Math.round(w * 0.72));
      } else if (w < 640) {
        setSpacing(Math.round(w * 0.6));
        setVisibleRange(1);
        setCardWidth(Math.round(w * 0.68));
      } else if (w < 1024) {
        setSpacing(200);
        setVisibleRange(1);
        setCardWidth(272);
      } else {
        setSpacing(260);
        setVisibleRange(2);
        setCardWidth(272);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const total = services.length;
  const prev = () => setActive(i => (i - 1 + total) % total);
  const next = () => setActive(i => (i + 1) % total);

  return (
    <section className="relative py-20 sm:py-32 bg-[#0d0018]" style={{ overflowX: 'hidden' }}>

      {/* Blend in from white hero above */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white to-transparent z-10" />

      {/* Purple gradient radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_55%,rgba(124,58,237,0.22),rgba(147,51,234,0.08),transparent)]" />

      {/* Subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Section header */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 text-center mb-12 sm:mb-20">
        <motion.p
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[#c084fc] text-xs font-semibold tracking-widest uppercase mb-3"
        >
          What We Offer
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }} viewport={{ once: true }}
          className="font-display text-3xl md:text-5xl font-bold text-white"
        >
          Our Services
        </motion.h2>
      </div>

      {/* Card deck */}
      {isLoading ? (
        <div className="relative z-10 flex items-center justify-center gap-6" style={{ height: 440 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-3xl bg-[#1a0030]/60 border border-white/10"
              style={{ width: cardWidth, height: 400, opacity: 1 - i * 0.35, flexShrink: 0 }}
            />
          ))}
        </div>
      ) : services.length === 0 ? null : (
        <div
          className="relative z-10 mx-auto"
          style={{ height: visibleRange === 0 ? 420 : 440, perspective: '1400px' }}
        >
          {services.map((svc, i) => {
            let offset = i - active;
            const half = Math.floor(total / 2);
            if (offset > half) offset -= total;
            if (offset < -half) offset += total;
            const abs = Math.abs(offset);
            if (abs > visibleRange) return null;

            const isCenter = offset === 0;

            return (
              <motion.div
                key={svc.id}
                className="absolute top-1/2 left-1/2 cursor-pointer select-none"
                style={{
                  width: cardWidth,
                  marginLeft: -(cardWidth / 2),
                  marginTop: -200,
                  zIndex: 20 - abs,
                }}
                animate={{
                  x: offset * spacing,
                  scale: isCenter ? 1.05 : 1 - abs * 0.09,
                  opacity: isCenter ? 1 : 1 - abs * 0.32,
                  rotateY: offset * -6,
                  filter: abs > 0 ? `blur(${abs * 1.5}px)` : 'blur(0px)',
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                onClick={() => !isCenter && setActive(i)}
                whileHover={isCenter ? { y: -10, transition: { duration: 0.25, ease: 'easeOut' } } : {}}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -50) next();
                  if (info.offset.x > 50) prev();
                }}
              >
                <div
                  className={`h-[400px] rounded-3xl overflow-hidden flex flex-col transition-all duration-300 ${
                    isCenter
                      ? 'bg-[#1a0030] border border-[#9333ea]/50 shadow-2xl shadow-[#7c3aed]/30 ring-1 ring-[#9333ea]/20'
                      : 'bg-[#1a0030]/60 border border-white/[0.07]'
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-48 shrink-0 overflow-hidden">
                    {svc.image_url
                      ? <img src={resolveImageUrl(svc.image_url)} alt={svc.name} className="w-full h-full object-cover" />
                      : (
                        <div className={`w-full h-full flex items-center justify-center text-5xl ${
                          isCenter
                            ? 'bg-gradient-to-br from-[#7c3aed] via-[#4a1070] to-[#1a0030]'
                            : 'bg-[#2a0045]/60'
                        }`}>
                          {CATEGORY_ICON[svc.category?.toLowerCase()] ?? '💇'}
                        </div>
                      )
                    }
                    {/* Bottom gradient over image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />
                    {/* Category pill */}
                    {svc.category && (
                      <span className="absolute top-3 left-3 text-[10px] font-bold tracking-widest uppercase text-white bg-gold-gradient backdrop-blur-md px-2.5 py-1 rounded-full">
                        {svc.category}
                      </span>
                    )}
                    {/* Popular badge */}
                    {isCenter && svc.booking_count > 0 && (
                      <span className="absolute top-3 right-3 text-[10px] font-bold tracking-wide text-white bg-gold-gradient backdrop-blur-md px-2.5 py-1 rounded-full">
                        ★ Popular
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className={`font-bold text-base leading-snug mb-1.5 ${isCenter ? 'text-white' : 'text-white/70'}`}>
                        {svc.name}
                      </h3>
                      <p className="text-white/40 text-xs leading-relaxed line-clamp-2">
                        {svc.description}
                      </p>
                    </div>

                    <div>
                      <div className={`w-full h-px my-3 ${isCenter ? 'bg-purple-500/25' : 'bg-white/[0.07]'}`} />
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-bold text-sm ${isCenter ? 'text-white' : 'text-white/60'}`}>
                            NZ${svc.price}
                          </div>
                          <div className="text-white/30 text-xs">{svc.duration_minutes} min</div>
                        </div>
                        <Link
                          to={`/book?service_id=${svc.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-200 ${
                            isCenter
                              ? 'bg-gold-gradient text-white shadow-gold hover:opacity-90'
                              : 'bg-white/8 text-white/50 border border-white/10 hover:bg-white/15'
                          }`}
                        >
                          Book
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Navigation */}
      <div className="relative z-10 flex items-center justify-center gap-5 mt-8">
        <button
          onClick={prev}
          className="w-10 h-10 rounded-full bg-white/8 border border-white/15 flex items-center justify-center text-white/60
                     hover:bg-gold-gradient hover:border-transparent hover:text-white transition-all duration-200"
        >
          ←
        </button>
        <div className="flex items-center gap-2">
          {services.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`rounded-full transition-all duration-300 ${
                i === active
                  ? 'w-6 h-2 bg-gold-gradient'
                  : 'w-2 h-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="w-10 h-10 rounded-full bg-white/8 border border-white/15 flex items-center justify-center text-white/60
                     hover:bg-gold-gradient hover:border-transparent hover:text-white transition-all duration-200"
        >
          →
        </button>
      </div>

      {/* View all link */}
      <div className="relative z-10 text-center mt-5">
        <Link to="/services" className="text-sm text-white/30 hover:text-purple-400 transition-colors font-medium">
          View all services →
        </Link>
      </div>
    </section>
  );
}
