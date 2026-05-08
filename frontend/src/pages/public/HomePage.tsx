import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { reviewApi, serviceApi, staffApi, resolveImageUrl } from '../../services/api';
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

  const handleBannerTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const y = ((touch.clientY - rect.top) / rect.height) * 2 - 1;
    const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    setTilt({ sscX: y * 18, aaX: -y * 18, aaShiftX: x * 24, aaShiftY: y * 24 });
  };
  const handleBannerTouchEnd = () => setTilt({ sscX: 0, aaX: 0, aaShiftX: 0, aaShiftY: 0 });

  const { data: reviews } = useQuery({ queryKey: ['reviews-home'], queryFn: () => reviewApi.list({ limit: 6 }) });
  const { data: services } = useQuery({ queryKey: ['services-home'], queryFn: () => serviceApi.list() });
  const { data: staff } = useQuery({ queryKey: ['staff-home'], queryFn: () => staffApi.list() });

  const featuredServices = Array.isArray(services?.data) ? services.data.slice(0, 3) : [];
  const featuredStaff = Array.isArray(staff?.data) ? staff.data.slice(0, 4) : [];
  const latestReviews = Array.isArray(reviews?.data) ? reviews.data.slice(0, 3) : [];

  return (
    <div>

      {/* ══════════════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden bg-purple-900"
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-white" />

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
        {/* Video background */}
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover object-center">
          <source src="/assets/videos/services.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white via-white/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/50 to-transparent" />

        <div className="relative z-10 py-14 px-4">
          <div className="max-w-7xl mx-auto">

            {/* Header */}
            <div className="text-center mb-10">
              <motion.div initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }}
                className="inline-flex items-center gap-2 mb-4">
                <span className="w-6 h-px bg-white/40" />
                <span className="text-white/70 text-xs font-semibold tracking-widest uppercase">Signature Treatments</span>
                <span className="w-6 h-px bg-white/40" />
              </motion.div>
              <motion.h2 initial="hidden" whileInView="visible" variants={fadeUp} custom={1} viewport={{ once: true }}
                className="font-display text-4xl md:text-5xl text-white font-bold mb-4">
                Most Loved Services
              </motion.h2>
              <motion.div initial="hidden" whileInView="visible" variants={fadeUp} custom={2} viewport={{ once: true }}>
                <Link to="/services" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white font-medium transition-colors">
                  Browse all services <span>→</span>
                </Link>
              </motion.div>
            </div>

            {/* Cards */}
            {featuredServices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredServices.map((service: any, i: number) => (
                  <motion.div
                    key={service.id}
                    initial="hidden" whileInView="visible" variants={fadeUp} custom={i}
                    viewport={{ once: true }}
                    className="group relative rounded-[28px] overflow-hidden shadow-xl shadow-black/30"
                    style={{ height: '420px' }}
                  >
                    {/* Image */}
                    <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                      {service.image_url
                        ? <img src={resolveImageUrl(service.image_url)} alt={service.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gradient-to-br from-purple-400 via-purple-600 to-purple-900 flex items-center justify-center">
                            <span className="text-7xl opacity-25">✂️</span>
                          </div>
                      }
                    </div>

                    {/* Scrim */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                    {/* Top badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      {service.category && (
                        <span className="text-[10px] font-semibold tracking-widest uppercase text-white/90 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
                          {service.category}
                        </span>
                      )}
                      {service.avg_rating > 0 && (
                        <div className="flex items-center gap-1 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 ml-auto">
                          <span className="text-amber-400 text-xs">★</span>
                          <span className="text-white text-xs font-semibold">{Number(service.avg_rating).toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    {/* Frosted glass bottom panel */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/45 backdrop-blur-xl border-t border-white/10 p-5">
                      <h3 className="font-bold text-white text-lg leading-snug mb-2 truncate">{service.name}</h3>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-semibold text-white bg-white/15 px-3 py-1 rounded-full">
                          NZ${service.price}
                        </span>
                        <span className="text-xs text-white/50 bg-white/8 px-3 py-1 rounded-full border border-white/10">
                          {service.duration_minutes} min
                        </span>
                      </div>
                      <Link
                        to={`/book?service_id=${service.id}`}
                        className="block w-full text-center text-sm font-bold py-2.5 rounded-2xl bg-white text-purple-700 hover:bg-white/90 transition-all duration-200 shadow-md"
                      >
                        Book Now
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-[28px] overflow-hidden bg-white/5 border border-white/10" style={{ height: '420px' }}>
                    <div className="h-full skeleton opacity-30" />
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
      <section ref={bannerRef} onMouseMove={handleBannerMouseMove} onMouseLeave={handleBannerMouseLeave} onTouchMove={handleBannerTouchMove} onTouchEnd={handleBannerTouchEnd}
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
      <section className="relative py-12 sm:py-14 px-4 overflow-hidden bg-gradient-to-b from-white via-purple-50/30 to-white">

        {/* Ambient orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 w-[480px] h-[480px] rounded-full bg-purple-200/25 blur-[110px]" />
          <div className="absolute -bottom-24 -right-24 w-[420px] h-[420px] rounded-full bg-violet-300/20 blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full bg-purple-100/20 blur-[90px]" />
        </div>

        {/* Dot-grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: 'radial-gradient(circle, #7c3aed 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto">

          {/* Header */}
          <div className="text-center mb-8 sm:mb-10">
            <motion.div
              initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }}
              className="inline-flex items-center gap-3 mb-4"
            >
              <span className="w-8 h-px bg-purple-300" />
              <span className="text-purple-500 text-xs font-semibold tracking-[0.2em] uppercase">The Artists</span>
              <span className="w-8 h-px bg-purple-300" />
            </motion.div>
            <motion.h2
              initial="hidden" whileInView="visible" variants={fadeUp} custom={1} viewport={{ once: true }}
              className="section-title"
            >
              Meet Our Team
            </motion.h2>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredStaff.length > 0 ? featuredStaff.map((member: any, i: number) => (
              <motion.div
                key={member.id}
                initial="hidden" whileInView="visible" variants={fadeUp} custom={i}
                viewport={{ once: true }}
                className="group relative bg-white/70 backdrop-blur-sm border border-purple-100/60 rounded-2xl
                           shadow-sm hover:shadow-xl hover:shadow-purple-200/40 hover:-translate-y-2
                           transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Top gradient accent line */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-purple-400/60 to-transparent
                                opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

                {/* Image — full width, fixed height */}
                <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-purple-50 shrink-0">
                  {member.image_url ? (
                    <img
                      src={resolveImageUrl(member.image_url)}
                      alt={member.first_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-white
                                    bg-gradient-to-br from-purple-400 to-violet-600">
                      {member.first_name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  {/* Image scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  {/* Available dot */}
                  <span className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm
                                   text-emerald-400 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Available
                  </span>
                </div>

                {/* Info */}
                <div className="flex flex-col flex-1 p-4 sm:p-5">
                  <h3 className="font-bold text-gray-900 text-base leading-tight capitalize">
                    {member.first_name} {member.last_name}
                  </h3>
                  <p className="text-purple-500 text-xs font-semibold uppercase tracking-wide mt-1">{member.role}</p>

                  <div className="flex items-center gap-1 mt-2">
                    <Stars rating={Math.round(member.avg_rating || 5)} />
                    <span className="text-gray-400 text-xs ml-0.5">({member.review_count || 0})</span>
                  </div>

                  <div className="mt-auto pt-4">
                    <Link
                      to={`/book?employee_id=${member.id}`}
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
            )) : (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white/70 border border-purple-100/60 rounded-2xl overflow-hidden">
                  <div className="h-48 sm:h-56 bg-purple-50 skeleton" />
                  <div className="p-4 sm:p-5 space-y-2.5">
                    <div className="h-3.5 skeleton bg-gray-100 rounded w-3/4" />
                    <div className="h-3 skeleton bg-gray-100 rounded w-1/2" />
                    <div className="h-3 skeleton bg-gray-100 rounded w-2/3 mt-4" />
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
      <section className="py-12 sm:py-14 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
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
      <section className="relative py-16 sm:py-20 px-4 bg-purple-900 overflow-hidden">

        {/* Background video */}
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        >
          <source src="/assets/videos/cc.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay to keep text readable */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Top & bottom blending fades */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-gray-50 via-gray-50/60 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-white via-white/60 to-transparent z-10" />

        {/* Ambient orbs */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.18, 0.28, 0.18] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-purple-700/30 blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.14, 0.22, 0.14] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-violet-600/25 blur-[110px]"
        />

        {/* Dot-grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #a78bfa 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto text-center">

          {/* Badge */}
          <motion.div
            initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }}
            className="inline-flex items-center gap-2.5 mb-8"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500" />
            </span>
            <span className="text-purple-400 text-xs font-semibold tracking-[0.2em] uppercase">
              Ready to Transform?
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h2
            initial="hidden" whileInView="visible" variants={fadeUp} custom={1} viewport={{ once: true }}
            className="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-[1.05] mb-6"
          >
            Book Your<br />
            <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-white bg-clip-text text-transparent">
              Appointment Today
            </span>
          </motion.h2>

          {/* Subtext */}
          <motion.p
            initial="hidden" whileInView="visible" variants={fadeUp} custom={2} viewport={{ once: true }}
            className="text-gray-400 text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto"
          >
            Easy online booking, no fees, flexible scheduling — crafted around your lifestyle.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial="hidden" whileInView="visible" variants={fadeUp} custom={3} viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-14"
          >
            <Link to="/book" className="btn-primary px-10 py-3.5 text-base">
              Book Now
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-white/15 text-white/70 font-semibold text-base hover:bg-white/8 hover:text-white hover:border-white/30 transition-all duration-200"
            >
              View Services
            </Link>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial="hidden" whileInView="visible" variants={fadeUp} custom={4} viewport={{ once: true }}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
          >
            {[
              { value: '50,000+', label: 'Happy Clients' },
              { value: '4.9★',    label: 'Average Rating' },
              { value: '200+',    label: 'Expert Stylists' },
              { value: '12',      label: 'Locations' },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 bg-white/5 border border-white/8 backdrop-blur-sm px-4 py-2.5 rounded-full"
              >
                <span className="text-white font-bold text-sm">{value}</span>
                <span className="w-px h-3.5 bg-white/20" />
                <span className="text-gray-400 text-xs">{label}</span>
              </div>
            ))}
          </motion.div>

        </div>
      </section>

    </div>
  );
}
