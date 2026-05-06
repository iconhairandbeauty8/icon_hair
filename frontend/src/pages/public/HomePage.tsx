import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { reviewApi, serviceApi, staffApi } from '../../services/api';
import ServicesCarousel from '../../components/ui/ServicesCarousel';

/* ─── Animation variant ──────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

/* ─── Static data ────────────────────────────────────────── */

const fallbackReviews = [
  { name: 'Sarah K.', service: 'Balayage', text: 'Absolutely incredible experience! The balayage was exactly what I wanted. Will definitely be back.' },
  { name: 'Mike T.', service: "Men's Cut", text: 'Best salon in Auckland. The team is professional, talented and so welcoming. Love this place!' },
  { name: 'Jessica L.', service: 'Facial', text: 'My go-to salon for years. Consistently amazing results and such a relaxing atmosphere.' },
];

/* ─── Star rating component ──────────────────────────────── */
function Stars({ rating = 5 }: { rating?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`text-sm ${i <= rating ? 'star-filled' : 'star-empty'}`}>★</span>
      ))}
    </div>
  );
}

/* ─── Component ──────────────────────────────────────────── */
export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ sscX: 0, aaX: 0, aaShiftX: 0, aaShiftY: 0 });

  const handleBannerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    setTilt({ sscX: y * 18, aaX: -y * 18, aaShiftX: x * 24, aaShiftY: y * 24 });
  };
  const handleBannerMouseLeave = () => setTilt({ sscX: 0, aaX: 0, aaShiftX: 0, aaShiftY: 0 });

  const { data: reviews } = useQuery({ queryKey: ['reviews-home'], queryFn: () => reviewApi.list({ limit: 6 }) });
  const { data: services } = useQuery({ queryKey: ['services-home'], queryFn: () => serviceApi.list() });
  const { data: staff } = useQuery({ queryKey: ['staff-home'], queryFn: () => staffApi.list() });

  const featuredServices = services?.data?.slice(0, 3) || [];
  const featuredStaff = staff?.data?.slice(0, 4) || [];
  const latestReviews = reviews?.data?.slice(0, 3) || [];

  return (
    <div>

      {/* ══════════════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden bg-gray-950"
      >
        {/* Hero video */}
        <video
          autoPlay muted loop playsInline
          poster="/assets/images/hero.png"
          className="absolute inset-0 w-full h-full object-cover sm:object-center"
          style={{ objectPosition: '65% 15%' }}
        >
          <source src="/assets/videos/herov.mp4" type="video/mp4" />
        </video>
        {/* Overlay — dark at top for text, fades to white at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-white" />

        <div
          className="relative z-10 text-center max-w-3xl mx-auto"
          style={{ textShadow: '0 2px 16px rgba(0,0,0,0.35)' }}
        >
          {/* Badge */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
            New Zealand's Premier Salon
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="font-sans font-bold text-5xl sm:text-6xl md:text-7xl text-white leading-[1.1] mb-4"
          >
            Where Beauty
          </motion.h1>
          <motion.h1
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="font-display italic text-5xl sm:text-6xl md:text-7xl leading-[1.1] mb-8"
          >
            <span className="text-shimmer">Meets Luxury</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="text-white/75 text-lg md:text-xl leading-relaxed max-w-xl mx-auto mb-10"
          >
            Expert stylists, premium products, and an experience crafted for you — across 12+ locations in New Zealand.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
            style={{ textShadow: 'none' }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link to="/book" className="btn-primary px-8 py-3.5 text-base rounded-xl">
              Book Appointment
            </Link>
            <Link to="/services"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border-2 border-white/40 text-white font-semibold text-base hover:bg-white hover:text-gray-900 transition-all duration-200">
              Explore Services
            </Link>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={5}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-10 text-black text-xs sm:text-sm font-medium"
          >
            {['200+ Stylists', '12 Locations', 'Easy Online Booking', 'No Booking Fees'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="text-purple-300">✓</span> {t}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/30"
        >
          <span className="text-[10px] tracking-widest uppercase">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent" />
        </motion.div>
      </section>


      {/* ══════════════════════════════════════════════════════
          3. SERVICE CATEGORIES — deck carousel
      ══════════════════════════════════════════════════════ */}
      <ServicesCarousel />

      {/* ══════════════════════════════════════════════════════
          4. FEATURED SERVICES
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Full-section video background */}
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover object-center"
        >
          <source src="/assets/videos/services.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay so cards stay readable */}
        <div className="absolute inset-0 bg-black/55" />
        {/* Blend top edge into white */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white via-white/60 to-transparent" />
        {/* Blend bottom edge into white */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/60 to-transparent" />

        <div className="relative z-10 py-24 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-end justify-between mb-14">
              <div>
                <motion.p initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }}
                  className="text-purple-300 text-xs font-semibold tracking-widest uppercase mb-3">Signature Treatments</motion.p>
                <motion.h2 initial="hidden" whileInView="visible" variants={fadeUp} custom={1} viewport={{ once: true }}
                  className="font-display text-4xl md:text-5xl text-white font-bold">Most Loved Services</motion.h2>
              </div>
              <Link to="/services" className="hidden md:flex items-center gap-1.5 text-sm text-purple-300 hover:text-white font-medium transition-colors">
                View All <span>→</span>
              </Link>
            </div>

            {featuredServices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredServices.map((service: any, i: number) => (
                  <motion.div
                    key={service.id}
                    initial="hidden" whileInView="visible" variants={fadeUp} custom={i}
                    viewport={{ once: true }}
                    className="card group"
                  >
                    <div className="aspect-video bg-gray-100 overflow-hidden">
                      {service.image_url
                        ? <img src={service.image_url} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl text-gray-200">✂️</div>
                      }
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0 pr-3">
                          {service.category && (
                            <span className="text-purple-600 text-xs font-semibold tracking-wider uppercase">{service.category}</span>
                          )}
                          <h3 className="font-semibold text-gray-900 mt-0.5">{service.name}</h3>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-gray-900">NZ${service.price}</div>
                          <div className="text-gray-400 text-xs">{service.duration_minutes} min</div>
                        </div>
                      </div>
                      {service.description && (
                        <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">{service.description}</p>
                      )}
                      <Link to="/book"
                        className="w-full text-center block py-2.5 rounded-xl border border-purple-200 text-purple-600 text-sm font-semibold
                                   hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all duration-200">
                        Book Now
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card">
                    <div className="aspect-video bg-gray-100 skeleton" />
                    <div className="p-6 space-y-3">
                      <div className="h-3 bg-gray-100 rounded skeleton w-1/3" />
                      <div className="h-4 bg-gray-100 rounded skeleton w-2/3" />
                      <div className="h-10 bg-gray-100 rounded-xl skeleton mt-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          5. PARALLAX BANNER
      ══════════════════════════════════════════════════════ */}
      <section ref={bannerRef} onMouseMove={handleBannerMouseMove} onMouseLeave={handleBannerMouseLeave}
        className="relative flex items-center justify-center overflow-hidden bg-white py-16 sm:py-0 sm:h-[420px]">

        {/* Images — visible on all screen sizes */}
        <div className="flex absolute inset-0 items-center justify-center gap-6 sm:gap-16" style={{ perspective: '900px' }}>
          <div
            className="w-36 h-52 sm:w-52 sm:h-72 overflow-hidden rounded-lg opacity-100 shrink-0"
            style={{
              transform: `translateX(${tilt.aaShiftX}px) translateY(${tilt.aaShiftY}px) rotateX(${tilt.aaX}deg) rotate(-8deg)`,
              transition: 'transform 0.3s ease-out',
            }}
          >
            <img src="/assets/images/aa.png" alt="" className="w-full h-full object-cover" />
          </div>
          <img
            src="/assets/images/ssc.png"
            alt=""
            className="h-36 sm:h-48 w-auto object-contain opacity-100"
            style={{
              transform: `translateX(${-tilt.aaShiftX}px) translateY(${-tilt.aaShiftY}px) rotateX(${tilt.sscX}deg) rotate(98deg)`,
              transition: 'transform 0.3s ease-out',
            }}
          />
        </div>

        <div className="relative z-10 text-center px-4 max-w-xl mx-auto">
          <motion.p initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }}
            className="section-label mb-4">The Finest Care</motion.p>
          <motion.h2 initial="hidden" whileInView="visible" variants={fadeUp} custom={1} viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-gray-900 mb-6">
            Your Beauty, Our Passion
          </motion.h2>
          <motion.div initial="hidden" whileInView="visible" variants={fadeUp} custom={2} viewport={{ once: true }}>
            <Link to="/book" className="btn-primary px-8 sm:px-10 py-3.5">Book Your Experience</Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          6. TEAM
      ══════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <motion.p initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }}
              className="section-label mb-3">The Artists</motion.p>
            <motion.h2 initial="hidden" whileInView="visible" variants={fadeUp} custom={1} viewport={{ once: true }}
              className="section-title">Meet Our Team</motion.h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredStaff.length > 0 ? featuredStaff.map((member: any, i: number) => (
              <motion.div
                key={member.id}
                initial="hidden" whileInView="visible" variants={fadeUp} custom={i}
                viewport={{ once: true }}
                className="card group text-center"
              >
                <div className="aspect-square bg-gray-50 overflow-hidden">
                  {member.image_url ? (
                    <img src={member.image_url} alt={member.first_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-purple-200">
                      {member.first_name?.[0]}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm">{member.first_name} {member.last_name}</h3>
                  <p className="text-purple-600 text-xs font-medium mt-0.5">{member.role}</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Stars rating={Math.round(member.avg_rating || 5)} />
                    <span className="text-gray-400 text-xs">({member.review_count || 0})</span>
                  </div>
                </div>
              </motion.div>
            )) : (
              /* Skeleton */
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="card">
                  <div className="aspect-square bg-gray-100 skeleton" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 skeleton bg-gray-100 rounded w-3/4 mx-auto" />
                    <div className="h-3 skeleton bg-gray-100 rounded w-1/2 mx-auto" />
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="text-center mt-10">
            <Link to="/team" className="btn-ghost">Meet All Stylists</Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          7. REVIEWS
      ══════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <motion.p initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }}
              className="section-label mb-3">Client Love</motion.p>
            <motion.h2 initial="hidden" whileInView="visible" variants={fadeUp} custom={1} viewport={{ once: true }}
              className="section-title">What Our Clients Say</motion.h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(latestReviews.length > 0 ? latestReviews : fallbackReviews).map((review: any, i: number) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" variants={fadeUp} custom={i}
                viewport={{ once: true }}
                className="card p-6"
              >
                <Stars rating={review.rating || 5} />
                <p className="text-gray-600 text-sm leading-relaxed my-4">
                  "{review.comment || review.text}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-sm shrink-0">
                    {(review.customer_name || review.name)?.[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{review.customer_name || review.name}</div>
                    {(review.service_name || review.service) && (
                      <div className="text-purple-600 text-xs">{review.service_name || review.service}</div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          8. CTA
      ══════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-24 px-4 bg-gray-950">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }}>
            <p className="section-label text-purple-400 mb-4">Ready to Transform?</p>
            <h2 className="font-display text-4xl md:text-5xl text-white font-bold mb-6 leading-tight">
              Book Your Appointment Today
            </h2>
            <p className="text-gray-400 text-lg mb-10 leading-relaxed">
              Join 50,000+ clients who trust LuxeSalon for their beauty needs. Easy online booking, flexible scheduling.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/book" className="btn-primary px-10 py-3.5 text-base">Book Now</Link>
              <Link to="/branches"
                className="inline-flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl border-2 border-white/20 text-white font-semibold text-base hover:border-white/40 transition-colors">
                Find a Branch
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
