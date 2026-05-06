import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const galleryItems = [
  { id: 1, category: 'Hair', label: 'Balayage Transformation', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600' },
  { id: 2, category: 'Hair', label: 'Blonde Highlights', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600' },
  { id: 3, category: 'Nails', label: 'Gel Manicure', url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600' },
  { id: 4, category: 'Skincare', label: 'Luxury Facial', url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600' },
  { id: 5, category: 'Hair', label: 'Keratin Treatment', url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600' },
  { id: 6, category: 'Beauty', label: 'Lash Extensions', url: 'https://images.unsplash.com/photo-1631084655463-e671365ec05f?w=600' },
  { id: 7, category: 'Hair', label: 'Men\'s Cut', url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600' },
  { id: 8, category: 'Wellness', label: 'Hot Stone Massage', url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600' },
  { id: 9, category: 'Nails', label: 'Nail Art', url: 'https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=600' },
  { id: 10, category: 'Hair', label: 'Colour Correction', url: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600' },
  { id: 11, category: 'Beauty', label: 'Brow Styling', url: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=600' },
  { id: 12, category: 'Skincare', label: 'Rejuvenation', url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600' },
];

const CATS = ['All', 'Hair', 'Nails', 'Skincare', 'Beauty', 'Wellness'];

export default function GalleryPage() {
  const [cat, setCat] = useState('All');
  const [lightbox, setLightbox] = useState<any>(null);

  const filtered = cat === 'All' ? galleryItems : galleryItems.filter(g => g.category === cat);

  return (
    <div className="min-h-screen pt-20">
      <div className="bg-onyx-950 py-16 text-center">
        <p className="text-gold-400 font-accent italic text-lg mb-2">Our Work</p>
        <h1 className="font-display text-4xl md:text-5xl text-white font-bold">Gallery</h1>
        <p className="text-white/60 mt-3">Transformations, artistry and luxury — captured.</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${cat === c ? 'bg-gold-gradient text-white shadow-gold' : 'border border-gray-200 text-onyx-600 hover:border-gold-400'}`}>
              {c}
            </button>
          ))}
        </div>

        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {filtered.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
              className="break-inside-avoid cursor-pointer overflow-hidden rounded-2xl group" onClick={() => setLightbox(item)}>
              <div className="relative">
                <img src={item.url} alt={item.label} className="w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-onyx-900/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div>
                    <p className="text-white font-semibold text-sm">{item.label}</p>
                    <p className="text-gold-300 text-xs">{item.category}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm px-4"
            onClick={() => setLightbox(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
              <img src={lightbox.url} alt={lightbox.label} className="w-full rounded-2xl" />
              <div className="text-center mt-4">
                <p className="text-white font-semibold">{lightbox.label}</p>
                <p className="text-gold-400 text-sm">{lightbox.category}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
