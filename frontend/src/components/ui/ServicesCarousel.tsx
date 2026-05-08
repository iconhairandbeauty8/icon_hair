import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
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

  // Mouse parallax
  const sectionRef = useRef<HTMLElement>(null);
  const [spot, setSpot] = useState({ x: 50, y: 50 });
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springCfg = { stiffness: 60, damping: 22 };
  const sx = useSpring(rawX, springCfg);
  const sy = useSpring(rawY, springCfg);
  const orb1X = useTransform(sx, [-1, 1], [-35, 35]);
  const orb1Y = useTransform(sy, [-1, 1], [-20, 20]);
  const orb2X = useTransform(sx, [-1, 1], [25, -25]);
  const orb2Y = useTransform(sy, [-1, 1], [18, -18]);
  const orb3X = useTransform(sx, [-1, 1], [-55, 55]);
  const orb3Y = useTransform(sy, [-1, 1], [-30, 30]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    rawX.set((x - 0.5) * 2);
    rawY.set((y - 0.5) * 2);
    setSpot({ x: x * 100, y: y * 100 });
  };
  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
    setSpot({ x: 50, y: 50 });
  };

  return (
    <section
      ref={sectionRef}
      className="relative pt-0 pb-12 sm:pb-16"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        overflowX: 'clip',
        background: `radial-gradient(480px circle at ${spot.x}% ${spot.y}%, rgba(255,255,255,0.22) 0%, transparent 65%),
          linear-gradient(180deg, #ffffff 0%, rgba(124,58,237,0.45) 28%, rgba(147,51,234,0.45) 68%, #ffffff 90%, #ffffff 100%)`,
        transition: 'background 0.08s ease',
      }}
    >

      {/* Parallax orbs */}
      <motion.div style={{ x: orb1X, y: orb1Y }}
        className="pointer-events-none absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
      <motion.div style={{ x: orb2X, y: orb2Y }}
        className="pointer-events-none absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
      <motion.div style={{ x: orb3X, y: orb3Y }}
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-white/5 blur-3xl" />

      {/* Section header */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 text-center mb-8 sm:mb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 mb-4"
        >
          <span className="w-6 h-px bg-gray-400" />
          <span className="text-gray-500 text-xs font-semibold tracking-widest uppercase">What We Offer</span>
          <span className="w-6 h-px bg-gray-400" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }} viewport={{ once: true }}
          className="font-display text-4xl md:text-6xl font-bold text-gray-900"
        >
          Our Services
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }} viewport={{ once: true }}
          className="text-gray-500 mt-3 text-sm"
        >
          Swipe to explore · tap to select
        </motion.p>
      </div>

      {/* Card deck */}
      {isLoading ? (
        <div className="relative z-10 flex items-center justify-center gap-6" style={{ height: 460 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-3xl bg-white/10 border border-white/20 animate-pulse"
              style={{ width: cardWidth, height: 440, opacity: 1 - i * 0.35, flexShrink: 0 }}
            />
          ))}
        </div>
      ) : services.length === 0 ? null : (
        <div
          className="relative z-10 mx-auto"
          style={{ height: visibleRange === 0 ? 460 : 480, perspective: '1400px' }}
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
                  marginTop: -210,
                  zIndex: 20 - abs,
                }}
                animate={{
                  x: offset * spacing,
                  scale: isCenter ? 1.06 : 1 - abs * 0.1,
                  opacity: isCenter ? 1 : 1 - abs * 0.35,
                  rotateY: offset * -7,
                  filter: abs > 0 ? `blur(${abs * 2}px)` : 'blur(0px)',
                }}
                transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                onClick={() => !isCenter && setActive(i)}
                whileHover={isCenter ? { y: -12, transition: { duration: 0.22, ease: 'easeOut' } } : {}}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -50) next();
                  if (info.offset.x > 50) prev();
                }}
              >
                {/* Card */}
                <div className={`h-[440px] rounded-[28px] overflow-hidden relative transition-all duration-300 ${
                  isCenter ? 'shadow-2xl shadow-black/35' : 'shadow-md shadow-black/20'
                }`}>

                  {/* Image with zoom on active */}
                  <motion.div
                    className="absolute inset-0"
                    animate={{ scale: isCenter ? 1.08 : 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  >
                    {svc.image_url
                      ? <img src={resolveImageUrl(svc.image_url)} alt={svc.name} className="w-full h-full object-cover" />
                      : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 via-purple-600 to-purple-900 flex items-center justify-center">
                          <span className="text-8xl opacity-25 select-none">
                            {CATEGORY_ICON[svc.category?.toLowerCase()] ?? '💇'}
                          </span>
                        </div>
                      )
                    }
                  </motion.div>

                  {/* Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

                  {/* Top row — category + popular */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                    {svc.category && (
                      <span className="text-[10px] font-semibold tracking-widest uppercase text-white/90 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
                        {svc.category}
                      </span>
                    )}
                    {isCenter && svc.booking_count > 0 && (
                      <span className="text-[10px] font-semibold text-amber-300 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-400/25 ml-auto">
                        ✦ Popular
                      </span>
                    )}
                  </div>

                  {/* Frosted glass bottom panel */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/45 backdrop-blur-xl border-t border-white/10 p-5">
                    <h3 className="font-bold text-white text-lg leading-snug mb-2 truncate">
                      {svc.name}
                    </h3>

                    {/* Price + duration chips */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs font-semibold text-white bg-white/15 px-3 py-1 rounded-full">
                        NZ${svc.price}
                      </span>
                      <span className="text-xs text-white/50 bg-white/8 px-3 py-1 rounded-full border border-white/10">
                        {svc.duration_minutes} min
                      </span>
                    </div>

                    {/* Book button */}
                    <Link
                      to={`/book?service_id=${svc.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className={`block w-full text-center text-sm font-bold py-2.5 rounded-2xl transition-all duration-200 ${
                        isCenter
                          ? 'bg-white text-purple-700 hover:bg-white/90 shadow-md'
                          : 'bg-white/12 text-white/60 border border-white/15 hover:bg-white/20'
                      }`}
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Navigation */}
      <div className="relative z-10 flex flex-col items-center gap-4 mt-10">
        {/* Active service name */}
        {services[active] && (
          <motion.p
            key={active}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="text-gray-700 text-sm font-semibold tracking-wide"
          >
            {services[active].name}
          </motion.p>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-700
                       hover:bg-gold-gradient hover:text-white hover:border-transparent transition-all duration-200 text-sm"
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            {services.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === active ? 'w-6 h-2 bg-gold-gradient' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-700
                       hover:bg-gold-gradient hover:text-white hover:border-transparent transition-all duration-200 text-sm"
          >
            →
          </button>
        </div>

        <Link to="/services" className="text-gray-500 text-xs hover:text-gray-900 transition-colors font-medium mt-1">
          View all services →
        </Link>
      </div>
    </section>
  );
}
