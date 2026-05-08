import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const galleryItems = [
  { id: 1,  category: 'Hair',     label: 'Balayage Transformation', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600' },
  { id: 2,  category: 'Hair',     label: 'Blonde Highlights',       url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600' },
  { id: 3,  category: 'Nails',    label: 'Gel Manicure',            url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600' },
  { id: 4,  category: 'Skincare', label: 'Luxury Facial',           url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600' },
  { id: 5,  category: 'Hair',     label: 'Keratin Treatment',       url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600' },
  { id: 6,  category: 'Beauty',   label: 'Lash Extensions',         url: 'https://images.unsplash.com/photo-1631084655463-e671365ec05f?w=600' },
  { id: 7,  category: 'Hair',     label: "Men's Cut",               url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600' },
  { id: 8,  category: 'Wellness', label: 'Hot Stone Massage',       url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600' },
  { id: 9,  category: 'Nails',    label: 'Nail Art',                url: 'https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=600' },
  { id: 10, category: 'Hair',     label: 'Colour Correction',       url: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600' },
  { id: 11, category: 'Beauty',   label: 'Brow Styling',            url: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=600' },
  { id: 12, category: 'Skincare', label: 'Rejuvenation',            url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600' },
];

const CATS = ['All', 'Hair', 'Nails', 'Skincare', 'Beauty', 'Wellness'];

export default function GalleryPage() {
  const [cat, setCat] = useState('All');
  const [lightbox, setLightbox] = useState<any>(null);

  const filtered = cat === 'All' ? galleryItems : galleryItems.filter(g => g.category === cat);

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
            <span className="text-purple-400 text-xs font-semibold tracking-[0.2em] uppercase">Our Work</span>
            <span className="w-6 h-px bg-purple-500/60" />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="font-display text-5xl md:text-6xl font-bold text-white">
            Gallery
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="text-white/60 mt-4 text-lg">
            Transformations, artistry and luxury — captured.
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
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  cat === c
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                    : 'border border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:text-purple-600'
                }`}>
                {c}
              </button>
            ))}
          </div>

          {/* Masonry grid */}
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                className="break-inside-avoid cursor-pointer overflow-hidden rounded-2xl group shadow-sm hover:shadow-xl hover:shadow-purple-200/30 transition-shadow duration-300"
                onClick={() => setLightbox(item)}
              >
                <div className="relative">
                  <img src={item.url} alt={item.label} className="w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/70 via-black/20 to-transparent
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <div>
                      <p className="text-white font-semibold text-sm">{item.label}</p>
                      <p className="text-purple-300 text-xs font-medium mt-0.5">{item.category}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm px-4"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              transition={{ ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <img src={lightbox.url} alt={lightbox.label} className="w-full rounded-2xl shadow-2xl" />
              <div className="text-center mt-5">
                <p className="text-white font-bold text-lg">{lightbox.label}</p>
                <p className="text-purple-400 text-sm font-medium mt-1">{lightbox.category}</p>
              </div>
              <button
                onClick={() => setLightbox(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20
                           text-white hover:bg-white/20 transition-colors flex items-center justify-center text-lg"
              >
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
