import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { reviewApi, serviceApi, staffApi } from '../../services/api';

const HERO_VIDEO = 'https://assets.mixkit.co/videos/preview/mixkit-woman-getting-her-hair-blow-dried-at-a-salon-42774-large.mp4';

const categories = [
  { icon: '✂️', label: 'Hair', desc: 'Cuts, colour & treatments' },
  { icon: '💅', label: 'Nails', desc: 'Manicures & pedicures' },
  { icon: '✨', label: 'Skincare', desc: 'Facials & rejuvenation' },
  { icon: '💆', label: 'Wellness', desc: 'Massage & relaxation' },
  { icon: '👁️', label: 'Beauty', desc: 'Lashes, brows & more' },
  { icon: '🌿', label: 'Organic', desc: 'Eco-friendly treatments' },
];

const stats = [
  { value: '12+', label: 'Branches across NZ' },
  { value: '200+', label: 'Expert stylists' },
  { value: '50K+', label: 'Happy clients' },
  { value: '4.9★', label: 'Average rating' },
];

const beforeAfter = [
  { label: 'Balayage Transformation', category: 'Hair Colour' },
  { label: 'Keratin Treatment', category: 'Hair Treatment' },
  { label: 'Nail Art Design', category: 'Nails' },
  { label: 'Deluxe Facial', category: 'Skincare' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rating ? 'star-filled' : 'star-empty'} style={{ fontSize: 14 }}>★</span>
      ))}
    </div>
  );
}

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const { data: reviews } = useQuery({ queryKey: ['reviews-home'], queryFn: () => reviewApi.list({ limit: 6 }) });
  const { data: services } = useQuery({ queryKey: ['services-home'], queryFn: () => serviceApi.list() });
  const { data: staff } = useQuery({ queryKey: ['staff-home'], queryFn: () => staffApi.list() });

  const featuredServices = services?.data?.slice(0, 6) || [];
  const featuredStaff = staff?.data?.slice(0, 4) || [];
  const latestReviews = reviews?.data?.slice(0, 3) || [];

  return (
    <div className="bg-ivory">

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Video BG */}
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <video
            autoPlay muted loop playsInline
            className="w-full h-full object-cover"
            poster="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920"
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-onyx-950/60 via-onyx-950/40 to-onyx-950/80" />
        </motion.div>

        {/* Hero content */}
        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-gold-400 font-accent italic text-xl mb-3 tracking-wide"
          >
            New Zealand's Premier Salon
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="font-display text-5xl md:text-7xl text-white font-bold leading-tight mb-6"
          >
            Where Beauty<br />
            <span className="text-shimmer">Meets Luxury</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="text-white/70 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed"
          >
            Expert stylists, premium products, and an experience crafted for you — across 12+ locations in New Zealand.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/book" className="btn-gold text-base px-10 py-4 inline-flex items-center gap-2">
              ✨ Book Appointment
            </Link>
            <Link to="/services" className="btn-outline-gold text-base px-10 py-4 inline-flex items-center gap-2 !border-white/40 !text-white hover:!bg-white hover:!text-onyx-900">
              Explore Services
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-white/50 to-transparent" />
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-onyx-950 py-12">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }} viewport={{ once: true }}
              className="text-center"
            >
              <div className="font-display text-3xl md:text-4xl text-shimmer font-bold mb-1">{s.value}</div>
              <div className="text-white/50 text-sm">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SERVICE CATEGORIES ── */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-gold-500 font-accent italic text-lg mb-2">What We Offer</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="font-display text-4xl md:text-5xl text-onyx-900 font-bold">
              Premium Services
            </motion.h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.label}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} viewport={{ once: true }}
              >
                <Link to={`/services?category=${cat.label}`}
                  className="block card-luxury p-6 text-center group hover:border-gold-300">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{cat.icon}</div>
                  <div className="font-semibold text-onyx-900 text-sm mb-1">{cat.label}</div>
                  <div className="text-onyx-400 text-xs">{cat.desc}</div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED SERVICES ── */}
      <section className="py-24 bg-onyx-950 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-14">
            <div>
              <p className="text-gold-400 font-accent italic text-lg mb-2">Signature Treatments</p>
              <h2 className="font-display text-4xl text-white font-bold">Most Loved Services</h2>
            </div>
            <Link to="/services" className="hidden md:block text-gold-400 hover:text-gold-300 text-sm font-medium transition-colors">
              View All Services →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredServices.map((service: any, i: number) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="glass-dark rounded-2xl overflow-hidden hover:border-gold-500/40 transition-all duration-300 group"
              >
                {/* Image */}
                <div className="aspect-video bg-gradient-to-br from-onyx-800 to-onyx-900 overflow-hidden">
                  {service.image_url
                    ? <img src={service.image_url} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl text-gold-500/30">✂️</div>
                  }
                </div>
                {/* Info */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="text-xs text-gold-400 font-medium tracking-wider uppercase mb-1">{service.category}</div>
                      <h3 className="text-white font-semibold text-lg leading-tight">{service.name}</h3>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-gold-400 font-bold text-xl">NZ${service.price}</div>
                      <div className="text-white/40 text-xs">{service.duration_minutes} min</div>
                    </div>
                  </div>
                  <p className="text-white/50 text-sm leading-relaxed mb-4 line-clamp-2">{service.description}</p>
                  <Link to="/book"
                    className="w-full text-center block py-2.5 rounded-xl border border-gold-500/40 text-gold-400 text-sm font-medium hover:bg-gold-gradient hover:text-white hover:border-transparent transition-all duration-300">
                    Book Now
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARALLAX BANNER ── */}
      <section
        className="parallax-section h-[500px] flex items-center justify-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1920')" }}
      >
        <div className="absolute inset-0 bg-onyx-950/60" />
        <div className="relative z-10 text-center px-4">
          <p className="text-gold-400 font-accent italic text-xl mb-3">The Finest Care</p>
          <h2 className="font-display text-4xl md:text-6xl text-white font-bold mb-6">
            Your Beauty, Our Passion
          </h2>
          <p className="text-white/70 text-lg max-w-xl mx-auto mb-8">
            Using only premium products. Delivered by our award-winning stylists.
          </p>
          <Link to="/book" className="btn-gold px-12 py-4 text-lg">Book Your Experience</Link>
        </div>
      </section>

      {/* ── OUR TEAM ── */}
      <section className="py-24 px-4 bg-ivory">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-gold-500 font-accent italic text-lg mb-2">The Artists</p>
            <h2 className="font-display text-4xl md:text-5xl text-onyx-900 font-bold">Meet Our Team</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredStaff.map((member: any, i: number) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="card-luxury group"
              >
                <div className="aspect-square overflow-hidden bg-gradient-to-br from-gold-100 to-champagne">
                  {member.image_url ? (
                    <img src={member.image_url} alt={member.first_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl text-gold-300">
                      {member.first_name?.[0]}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold text-onyx-900">{member.first_name} {member.last_name}</h3>
                  <p className="text-gold-600 text-sm font-medium">{member.role}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating rating={Math.round(member.avg_rating || 5)} />
                    <span className="text-xs text-onyx-400">({member.review_count || 0})</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/team" className="btn-outline-gold">Meet All Stylists</Link>
          </div>
        </div>
      </section>

      {/* ── BEFORE/AFTER ── */}
      <section className="py-24 bg-champagne px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-gold-500 font-accent italic text-lg mb-2">Transformations</p>
            <h2 className="font-display text-4xl md:text-5xl text-onyx-900 font-bold">Before & After</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {beforeAfter.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="card-luxury overflow-hidden group"
              >
                <div className="aspect-[3/4] bg-gradient-to-br from-gold-200 via-champagne to-gold-100 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-onyx-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="text-5xl text-gold-400/50">✨</span>
                  <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="text-white font-semibold text-sm">{item.label}</div>
                    <div className="text-gold-300 text-xs">{item.category}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/gallery" className="btn-outline-gold">View Full Gallery</Link>
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className="py-24 px-4 bg-ivory">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-gold-500 font-accent italic text-lg mb-2">Client Love</p>
            <h2 className="font-display text-4xl md:text-5xl text-onyx-900 font-bold">What Our Clients Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestReviews.length > 0 ? latestReviews.map((review: any, i: number) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="card-luxury p-6"
              >
                <StarRating rating={review.rating} />
                <p className="text-onyx-600 leading-relaxed my-4 text-sm italic">"{review.comment}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center text-white font-bold text-sm">
                    {review.customer_name?.[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-onyx-900 text-sm">{review.customer_name}</div>
                    {review.service_name && <div className="text-gold-600 text-xs">{review.service_name}</div>}
                  </div>
                </div>
              </motion.div>
            )) : [1, 2, 3].map((i) => (
              <div key={i} className="card-luxury p-6">
                <div className="flex gap-1 mb-3">{[1,2,3,4,5].map(s=><span key={s} className="star-filled text-sm">★</span>)}</div>
                <p className="text-onyx-600 text-sm italic mb-4">
                  {i === 1 ? '"Absolutely incredible experience! The balayage was exactly what I wanted. Will definitely be back."'
                  : i === 2 ? '"Best salon in Auckland. The team is professional, talented and so welcoming. Love this place!"'
                  : '"My go-to salon for years. Consistently amazing results and such a relaxing atmosphere."'}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center text-white font-bold text-sm">
                    {i === 1 ? 'S' : i === 2 ? 'M' : 'J'}
                  </div>
                  <div>
                    <div className="font-semibold text-onyx-900 text-sm">
                      {i === 1 ? 'Sarah K.' : i === 2 ? 'Mike T.' : 'Jessica L.'}
                    </div>
                    <div className="text-gold-600 text-xs">
                      {i === 1 ? 'Balayage' : i === 2 ? "Men's Cut" : 'Facial'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 bg-onyx-950">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-gold-400 font-accent italic text-xl mb-3">Ready to Transform?</p>
            <h2 className="font-display text-4xl md:text-5xl text-white font-bold mb-6">
              Book Your Appointment Today
            </h2>
            <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
              Join 50,000+ clients who trust LuxeSalon for their beauty needs. Easy online booking, flexible scheduling.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book" className="btn-gold text-base px-12 py-4">Book Now</Link>
              <Link to="/branches" className="btn-outline-gold text-base px-12 py-4 !border-white/30 !text-white hover:!bg-white hover:!text-onyx-900">
                Find a Branch
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
