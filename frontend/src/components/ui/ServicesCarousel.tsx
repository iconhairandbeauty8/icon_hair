import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const services = [
  {
    icon: '✂️',
    title: 'Hair Styling',
    desc: 'Expert cuts, balayage, and treatments tailored to your unique look and personality.',
    category: 'Hair',
    badge: null,
  },
  {
    icon: '💅',
    title: 'Nail Care',
    desc: 'Manicures, pedicures, and nail art crafted by certified nail specialists.',
    category: 'Nails',
    badge: null,
  },
  {
    icon: '✨',
    title: 'Skincare',
    desc: 'Rejuvenating facials and skin treatments for a radiant, healthy glow.',
    category: 'Skincare',
    badge: 'Popular',
  },
  {
    icon: '💆',
    title: 'Wellness',
    desc: 'Relaxing massage and holistic therapies for total mind-body harmony.',
    category: 'Wellness',
    badge: null,
  },
  {
    icon: '👁️',
    title: 'Beauty',
    desc: 'Lash extensions, brow shaping, and premium precision beauty services.',
    category: 'Beauty',
    badge: null,
  },
];

const CARD_W = 272;

export default function ServicesCarousel() {
  const [active, setActive] = useState(2);
  const [spacing, setSpacing] = useState(250);
  const [visibleRange, setVisibleRange] = useState(2);

  // Responsive spacing
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) { setSpacing(0); setVisibleRange(0); }
      else if (w < 1024) { setSpacing(190); setVisibleRange(1); }
      else { setSpacing(250); setVisibleRange(2); }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const total = services.length;
  const prev = () => setActive(i => (i - 1 + total) % total);
  const next = () => setActive(i => (i + 1) % total);

  return (
    <section className="relative py-28 overflow-hidden bg-white">

      {/* Hero image behind deck — blends into white */}
      <div className="pointer-events-none absolute inset-0">
        <img
          src="/images/hero.png"
          alt=""
          className="w-full h-full object-cover object-center opacity-60"
        />
        {/* Fade to white on all edges */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white" />
      </div>

      {/* Section header */}
      <div className="relative max-w-7xl mx-auto px-4 text-center mb-16">
        <motion.p
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="section-label mb-3"
        >
          What We Offer
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }} viewport={{ once: true }}
          className="section-title"
        >
          Our Services
        </motion.h2>
      </div>

      {/* Card deck */}
      <div
        className="relative mx-auto"
        style={{ height: 420, perspective: '1400px' }}
      >
        {services.map((svc, i) => {
          // Shortest-path offset so cards loop around
          let offset = i - active;
          const half = Math.floor(total / 2);
          if (offset > half) offset -= total;
          if (offset < -half) offset += total;
          const abs = Math.abs(offset);
          if (abs > visibleRange) return null;

          const isCenter = offset === 0;

          return (
            <motion.div
              key={svc.title}
              className="absolute top-1/2 left-1/2 cursor-pointer select-none"
              style={{
                width: CARD_W,
                marginLeft: -(CARD_W / 2),
                marginTop: -195,
                zIndex: 20 - abs,
              }}
              animate={{
                x: offset * spacing,
                scale: isCenter ? 1.06 : 1 - abs * 0.08,
                opacity: isCenter ? 1 : 1 - abs * 0.28,
                rotateY: offset * -5,
                filter: abs > 0 ? `blur(${abs * 1.2}px)` : 'blur(0px)',
              }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              onClick={() => !isCenter && setActive(i)}
              whileHover={isCenter ? { y: -10, transition: { duration: 0.25, ease: 'easeOut' } } : {}}
              // Swipe support on mobile
              drag={visibleRange === 0 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) next();
                if (info.offset.x > 60) prev();
              }}
            >
              <div
                className={`h-[390px] rounded-2xl p-7 flex flex-col justify-between transition-shadow duration-300 ${
                  isCenter
                    ? 'bg-white shadow-2xl shadow-purple-200/70 border border-purple-100 ring-1 ring-purple-50'
                    : 'bg-white shadow-md border border-gray-100'
                }`}
              >
                {/* Top section */}
                <div>
                  {/* Popular badge */}
                  {isCenter && svc.badge && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-purple-600 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full mb-4">
                      ⭐ {svc.badge}
                    </span>
                  )}

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5 transition-colors ${
                    isCenter ? 'bg-purple-100' : 'bg-gray-50'
                  }`}>
                    {svc.icon}
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-gray-900 text-lg leading-snug mb-2.5">
                    {svc.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                    {svc.desc}
                  </p>
                </div>

                {/* Bottom CTA */}
                <div>
                  <div className={`w-8 h-px mb-5 ${isCenter ? 'bg-purple-300' : 'bg-gray-200'}`} />
                  <Link
                    to={`/services?category=${svc.category}`}
                    onClick={(e) => e.stopPropagation()}
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-colors group ${
                      isCenter
                        ? 'text-purple-600 hover:text-purple-800'
                        : 'text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    Learn more
                    <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="relative flex items-center justify-center gap-4 mt-6">
        {/* Prev */}
        <button
          onClick={prev}
          className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500
                     hover:border-purple-400 hover:text-purple-600 transition-all"
        >
          ←
        </button>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {services.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`rounded-full transition-all duration-300 ${
                i === active
                  ? 'w-6 h-2 bg-purple-600'
                  : 'w-2 h-2 bg-gray-200 hover:bg-purple-300'
              }`}
            />
          ))}
        </div>

        {/* Next */}
        <button
          onClick={next}
          className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500
                     hover:border-purple-400 hover:text-purple-600 transition-all"
        >
          →
        </button>
      </div>

      {/* View all link */}
      <div className="relative text-center mt-8">
        <Link to="/services" className="text-sm text-gray-400 hover:text-purple-600 transition-colors font-medium">
          View all services →
        </Link>
      </div>
    </section>
  );
}
