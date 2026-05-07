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
    <section className="relative py-16 sm:py-28 bg-white" style={{ overflowX: 'hidden' }}>

      {/* Hero image behind deck */}
      <div className="pointer-events-none absolute inset-0">
        <img
          src="/assets/images/hero.png"
          alt=""
          className="w-full h-full object-cover object-center opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white" />
      </div>

      {/* Section header */}
      <div className="relative max-w-7xl mx-auto px-4 text-center mb-10 sm:mb-16">
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
      {isLoading ? (
        <div className="flex items-center justify-center gap-6" style={{ height: 420 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-white border border-gray-100 shadow-md skeleton"
              style={{ width: cardWidth, height: 380, opacity: 1 - i * 0.3, flexShrink: 0 }}
            />
          ))}
        </div>
      ) : services.length === 0 ? null : (
      <div
        className="relative mx-auto"
        style={{ height: visibleRange === 0 ? 400 : 420, perspective: '1400px' }}
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
                marginTop: -190,
                zIndex: 20 - abs,
              }}
              animate={{
                x: offset * spacing,
                scale: isCenter ? 1.04 : 1 - abs * 0.08,
                opacity: isCenter ? 1 : 1 - abs * 0.28,
                rotateY: offset * -5,
                filter: abs > 0 ? `blur(${abs * 1.2}px)` : 'blur(0px)',
              }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              onClick={() => !isCenter && setActive(i)}
              whileHover={isCenter ? { y: -8, transition: { duration: 0.25, ease: 'easeOut' } } : {}}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -50) next();
                if (info.offset.x > 50) prev();
              }}
            >
              <div
                className={`h-[380px] rounded-2xl overflow-hidden flex flex-col transition-shadow duration-300 ${
                  isCenter
                    ? 'bg-white shadow-2xl shadow-purple-200/70 border border-purple-100 ring-1 ring-purple-50'
                    : 'bg-white shadow-md border border-gray-100'
                }`}
              >
                {/* Service image or icon */}
                <div className={`h-36 shrink-0 flex items-center justify-center overflow-hidden ${isCenter ? 'bg-purple-50' : 'bg-gray-50'}`}>
                  {svc.image_url
                    ? <img src={resolveImageUrl(svc.image_url)} alt={svc.name} className="w-full h-full object-cover" />
                    : <span className="text-4xl">{CATEGORY_ICON[svc.category?.toLowerCase()] ?? '💇'}</span>
                  }
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col justify-between flex-1">
                  <div>
                    {svc.category && (
                      <span className={`text-[10px] font-bold tracking-widest uppercase ${isCenter ? 'text-purple-500' : 'text-gray-400'}`}>
                        {svc.category}
                      </span>
                    )}
                    <h3 className="font-bold text-gray-900 text-base leading-snug mt-0.5 mb-1.5">
                      {svc.name}
                    </h3>
                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
                      {svc.description}
                    </p>
                  </div>

                  <div>
                    <div className={`w-8 h-px my-3 ${isCenter ? 'bg-purple-300' : 'bg-gray-200'}`} />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-bold text-sm ${isCenter ? 'text-gray-900' : 'text-gray-600'}`}>NZ${svc.price}</div>
                        <div className="text-gray-400 text-xs">{svc.duration_minutes} min</div>
                      </div>
                      <Link
                        to={`/book?service_id=${svc.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                          isCenter
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'border border-gray-200 text-gray-400 hover:border-purple-400 hover:text-purple-600'
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
      <div className="relative flex items-center justify-center gap-4 mt-6">
        <button
          onClick={prev}
          className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500
                     hover:border-purple-400 hover:text-purple-600 transition-all"
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
                  ? 'w-6 h-2 bg-purple-600'
                  : 'w-2 h-2 bg-gray-200 hover:bg-purple-300'
              }`}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500
                     hover:border-purple-400 hover:text-purple-600 transition-all"
        >
          →
        </button>
      </div>

      {/* View all link */}
      <div className="relative text-center mt-6">
        <Link to="/services" className="text-sm text-gray-400 hover:text-purple-600 transition-colors font-medium">
          View all services →
        </Link>
      </div>
    </section>
  );
}
