import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { promotionApi, serviceApi, resolveImageUrl } from '../../services/api';

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] } }),
};

// ─── Type config ──────────────────────────────────────────────────────────────
const TYPE_META: Record<string, {
  label: string; icon: string; hero: string;
  badge: string; badgeText: string; accent: string;
  tagline: string; hint: string; shimmer: string;
}> = {
  daily_special:    { label: 'Daily Special',    icon: '🌅', hero: 'from-amber-400 to-orange-500',   badge: 'bg-amber-100 text-amber-700 border-amber-200',   badgeText: 'text-amber-700',  accent: 'text-amber-600',  tagline: 'Fresh deals every day',        hint: 'Rotating discounts on select services',       shimmer: 'from-amber-500/20 to-orange-400/10'  },
  weekly_deal:      { label: 'Weekly Deal',      icon: '📅', hero: 'from-blue-500 to-indigo-500',    badge: 'bg-blue-100 text-blue-700 border-blue-200',       badgeText: 'text-blue-700',   accent: 'text-blue-600',   tagline: 'Bigger savings each week',     hint: 'New deals drop every Monday',                 shimmer: 'from-blue-500/20 to-indigo-400/10'   },
  monthly_campaign: { label: 'Monthly Campaign', icon: '📆', hero: 'from-purple-500 to-violet-600',  badge: 'bg-purple-100 text-purple-700 border-purple-200', badgeText: 'text-purple-700', accent: 'text-purple-600', tagline: 'Extended luxury campaigns',    hint: 'Month-long exclusive events & savings',       shimmer: 'from-purple-500/20 to-violet-400/10' },
  discount_code:    { label: 'Discount Code',    icon: '🏷',  hero: 'from-emerald-500 to-teal-500',  badge: 'bg-green-100 text-green-700 border-green-200',    badgeText: 'text-green-700',  accent: 'text-green-600',  tagline: 'Exclusive promo codes',        hint: 'Apply at checkout for instant savings',       shimmer: 'from-emerald-500/20 to-teal-400/10'  },
  package:          { label: 'Package Deal',     icon: '📦', hero: 'from-indigo-500 to-purple-600',  badge: 'bg-indigo-100 text-indigo-700 border-indigo-200', badgeText: 'text-indigo-700', accent: 'text-indigo-600', tagline: 'Curated service bundles',      hint: 'Premium services bundled beautifully',        shimmer: 'from-indigo-500/20 to-purple-400/10' },
};

const FILTERS = [
  { key: 'all',              label: 'All Offers',      icon: '✨' },
  { key: 'daily_special',    label: 'Daily Specials',  icon: '🌅' },
  { key: 'weekly_deal',      label: 'Weekly Deals',    icon: '📅' },
  { key: 'monthly_campaign', label: 'Monthly',         icon: '📆' },
  { key: 'discount_code',    label: 'Discount Codes',  icon: '🏷'  },
  { key: 'package',          label: 'Packages',        icon: '📦' },
];

// ─── Days remaining chip ──────────────────────────────────────────────────────
function DaysLeft({ endDate }: { endDate: string | null }) {
  if (!endDate) return null;
  const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return null;
  if (days === 0) return <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">Ends today!</span>;
  if (days <= 3)  return <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-semibold">⏳ {days}d left</span>;
  return <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{days} days left</span>;
}

// ─── Copy code button ─────────────────────────────────────────────────────────
function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <button onClick={copy}
      className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-mono tracking-widest hover:bg-gray-800 transition-colors group">
      <span>{code}</span>
      <span className="text-gray-400 group-hover:text-white transition-colors text-xs">{copied ? '✓ Copied' : '⧉'}</span>
    </button>
  );
}

// ─── Promo card ───────────────────────────────────────────────────────────────
function PromoCard({ promo, i }: { promo: any; i: number }) {
  const meta = TYPE_META[promo.type] ?? TYPE_META.daily_special;
  const hasServices = promo.service_details?.length > 0;
  const packageTotal = hasServices
    ? promo.service_details.reduce((s: number, sv: any) => s + Number(sv.price), 0)
    : 0;

  return (
    <motion.div
      initial="hidden" whileInView="visible" variants={fadeUp} custom={i} viewport={{ once: true }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-purple-100/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Banner */}
      {promo.image_url ? (
        <div className="h-44 overflow-hidden flex-shrink-0">
          <img src={resolveImageUrl(promo.image_url)} alt={promo.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
        </div>
      ) : (
        <div className={`h-28 bg-gradient-to-br ${meta.hero} flex items-center justify-center flex-shrink-0 relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <span className="text-5xl">{meta.icon}</span>
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Badge row */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.badge}`}>
            {meta.icon} {meta.label}
          </span>
          <DaysLeft endDate={promo.end_date} />
        </div>

        <h3 className="font-display text-lg font-bold text-gray-900 mb-1.5 leading-tight">{promo.title}</h3>
        {promo.description && (
          <p className="text-sm text-gray-500 leading-relaxed mb-3 flex-1">{promo.description}</p>
        )}

        {/* Package services list */}
        {promo.type === 'package' && hasServices && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 mb-3">
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2">What's Included</p>
            <div className="space-y-1.5">
              {promo.service_details.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                    {s.name}
                  </span>
                  <span className="font-semibold text-indigo-600 flex-shrink-0 ml-3">NZ${s.price}</span>
                </div>
              ))}
            </div>
            {promo.discount_type === 'percentage' ? (
              <div className="mt-3 pt-2.5 border-t border-indigo-100 flex justify-between text-sm">
                <span className="text-gray-500">Combined value</span>
                <div className="text-right">
                  <span className="line-through text-gray-400 mr-1.5">NZ${packageTotal.toFixed(2)}</span>
                  <span className="font-bold text-indigo-700">NZ${(packageTotal * (1 - promo.discount_value / 100)).toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="mt-3 pt-2.5 border-t border-indigo-100 flex justify-between text-sm">
                <span className="text-gray-500">Package price</span>
                <span className="font-bold text-indigo-700">NZ${Math.max(0, packageTotal - promo.discount_value).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Discount badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-purple-600 text-white text-sm font-bold px-3 py-1.5 rounded-xl">
            {promo.discount_type === 'percentage' ? `${promo.discount_value}% OFF` : `NZ$${promo.discount_value} OFF`}
          </span>
          {promo.end_date && (
            <span className="text-xs text-gray-400">
              Until {new Date(promo.end_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>

        {/* Active dates */}
        {Array.isArray(promo.applicable_dates) && promo.applicable_dates.length > 0 && (
          <p className="text-xs text-gray-400 mb-3 flex items-center gap-1 flex-wrap leading-relaxed">
            <span>📅</span>
            {promo.applicable_dates
              .map((d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' }))
              .join(' · ')}
          </p>
        )}

        {/* Code or CTA */}
        {promo.code ? (
          <div className="space-y-2 mt-auto">
            <p className="text-xs text-gray-400">Use code at checkout:</p>
            <CopyCode code={promo.code} />
            <Link to="/book" className="btn-primary w-full text-sm py-2.5 justify-center">Book & Apply Code</Link>
          </div>
        ) : (
          <Link to="/book" className="btn-primary w-full text-sm py-2.5 justify-center mt-auto">Book This Offer</Link>
        )}
      </div>
    </motion.div>
  );
}

// ─── Default / coming-soon tile (shown when no promos, or as grid filler) ────
function DefaultPromoCard({ typeKey, i }: { typeKey: string; i: number }) {
  const meta = TYPE_META[typeKey] ?? Object.values(TYPE_META)[i % 5];
  return (
    <motion.div
      initial="hidden" whileInView="visible" variants={fadeUp} custom={i} viewport={{ once: true }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-lg hover:shadow-purple-100/30 hover:-translate-y-1 transition-all duration-300"
    >
      {/* Rich gradient header */}
      <div className={`relative h-44 bg-gradient-to-br ${meta.hero} overflow-hidden flex-shrink-0`}>
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.12]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
        {/* Decorative light ray */}
        <div className={`absolute -top-10 -right-10 w-48 h-48 rounded-full bg-gradient-to-br ${meta.shimmer} blur-2xl`} />
        {/* Decorative ring */}
        <div className="absolute bottom-3 right-4 w-20 h-20 rounded-full border-2 border-white/10" />
        <div className="absolute bottom-7 right-8 w-10 h-10 rounded-full border border-white/10" />
        {/* "Coming soon" ribbon */}
        <div className="absolute top-3 right-3">
          <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/30 tracking-wide">
            Coming Soon
          </span>
        </div>
        {/* Central icon */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
            <span className="text-3xl">{meta.icon}</span>
          </div>
          <span className="text-white font-bold text-sm tracking-wide drop-shadow">{meta.label}</span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        {/* Badge */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.badge}`}>
            {meta.icon} {meta.label}
          </span>
          <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">Soon</span>
        </div>

        {/* Title & hint */}
        <h3 className="font-display text-base font-bold text-gray-800 mb-1 leading-snug">{meta.tagline}</h3>
        <p className="text-sm text-gray-400 leading-relaxed flex-1">{meta.hint}</p>

        {/* Placeholder discount badge */}
        <div className="flex items-center gap-2 mt-4 mb-4">
          <span className="bg-gray-100 text-gray-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-dashed border-gray-200">
            ✦ Offer pending
          </span>
        </div>

        {/* CTA */}
        <Link to="/book"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-purple-100 text-purple-600 text-sm font-semibold hover:bg-purple-50 hover:border-purple-300 transition-all">
          Book at Full Price →
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Featured hero offer ──────────────────────────────────────────────────────
function FeaturedOffer({ promo }: { promo: any }) {
  const meta = TYPE_META[promo.type] ?? TYPE_META.daily_special;
  const hasServices = promo.service_details?.length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="relative rounded-3xl overflow-hidden shadow-xl shadow-purple-200/30 border border-gray-100">
      {promo.image_url ? (
        <div className="absolute inset-0">
          <img src={resolveImageUrl(promo.image_url)} alt={promo.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/85 via-gray-900/60 to-transparent" />
        </div>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${meta.hero}`}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
      )}

      <div className="relative z-10 p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/30">
              ⭐ Featured Offer
            </span>
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/20">
              {meta.icon} {meta.label}
            </span>
            <DaysLeft endDate={promo.end_date} />
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight mb-2">{promo.title}</h2>
          {promo.description && <p className="text-white/70 text-sm sm:text-base leading-relaxed max-w-lg mb-4">{promo.description}</p>}

          {hasServices && (
            <div className="flex flex-wrap gap-2 mb-4">
              {promo.service_details.map((s: any) => (
                <span key={s.id} className="bg-white/10 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/20">
                  {s.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-white text-purple-700 font-bold text-lg px-4 py-2 rounded-xl shadow">
              {promo.discount_type === 'percentage' ? `${promo.discount_value}% OFF` : `NZ$${promo.discount_value} OFF`}
            </span>
            {promo.code && <CopyCode code={promo.code} />}
          </div>
        </div>

        <div className="flex-shrink-0">
          <Link to="/book"
            className="inline-flex items-center gap-2 bg-white text-purple-700 font-bold px-7 py-3.5 rounded-xl shadow-lg hover:bg-purple-50 transition-colors text-sm active:scale-95">
            Book This Offer ✦
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SocialFeedPage() {
  const [filter, setFilter] = useState('all');

  const { data, isLoading } = useQuery({ queryKey: ['promotions-public'], queryFn: () => promotionApi.list(), staleTime: 0 });
  const { data: servicesData } = useQuery({ queryKey: ['services-offers'], queryFn: () => serviceApi.list() });

  const promos: any[] = Array.isArray(data?.data) ? data.data : [];
  const services: any[] = Array.isArray(servicesData?.data) ? servicesData.data.slice(0, 3) : [];

  const filtered = filter === 'all' ? promos : promos.filter(p => p.type === filter);
  const featured  = promos[0];
  const rest      = filter === 'all' ? promos.slice(1) : filtered;

  // Pad to at least 3 in grid (with "coming soon" cards) only when there are some but few promos
  const shouldPad = rest.length > 0 && rest.length < 3;
  const padCount  = shouldPad ? 3 - rest.length : 0;

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative flex items-center justify-center overflow-hidden bg-purple-900"
        style={{ minHeight: '40vh', paddingTop: '3rem', paddingBottom: '4rem' }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-purple-700/30 blur-[120px]" />
          <div className="absolute -bottom-16 right-0 w-[400px] h-[400px] rounded-full bg-violet-600/20 blur-[100px]" />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #a78bfa 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white via-white/50 to-transparent" />

        <div className="relative z-10 text-center max-w-3xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 mb-5">
            <span className="w-6 h-px bg-purple-400/60" />
            <span className="text-purple-300 text-xs font-semibold tracking-[0.2em] uppercase">Exclusive Deals</span>
            <span className="w-6 h-px bg-purple-400/60" />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="font-display text-5xl md:text-6xl font-bold text-white mb-4">
            Offers & Promotions
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            className="text-white/60 text-lg">
            Daily specials, package deals and exclusive discount codes — updated regularly.
          </motion.p>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="relative py-12 sm:py-16 px-4 overflow-hidden bg-gradient-to-b from-white via-purple-50/20 to-white">
        <div className="pointer-events-none absolute top-0 right-0 w-[450px] h-[450px] rounded-full bg-purple-100/40 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full bg-violet-100/30 blur-[90px]" />

        <div className="relative z-10 max-w-6xl mx-auto">

          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide justify-start">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 border transition-all ${
                  filter === f.key
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-600'
                }`}>
                <span>{f.icon}</span> {f.label}
                {f.key !== 'all' && promos.filter(p => p.type === f.key).length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ml-0.5 ${filter === f.key ? 'bg-white/20' : 'bg-purple-100 text-purple-600'}`}>
                    {promos.filter(p => p.type === f.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-white border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-44 bg-gray-100" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-5 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : promos.length === 0 ? (
            /* ── Fully empty: show elegant default tiles for all 5 types ── */
            <div className="space-y-10">
              {/* Intro */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-xl mx-auto">
                <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 text-purple-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  Offers launching soon
                </div>
                <h3 className="font-display text-2xl font-bold text-gray-900 mb-2">Something Special is Coming</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Our team is crafting exclusive deals for you. Here's a preview of what's on the way — check back soon.
                </p>
              </motion.div>

              {/* All 5 type tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.keys(TYPE_META).map((key, i) => (
                  <DefaultPromoCard key={key} typeKey={key} i={i} />
                ))}
              </div>

              {/* Services fallback */}
              {services.length > 0 && (
                <div className="pt-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-gray-100" />
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">Meanwhile, explore our services</p>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {services.map((s: any, i: number) => (
                      <motion.div key={s.id} initial="hidden" whileInView="visible" variants={fadeUp} custom={i} viewport={{ once: true }}
                        className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-purple-100 transition-all">
                        <p className="font-semibold text-gray-900 mb-0.5">{s.name}</p>
                        <p className="text-xs text-gray-400 mb-3">{s.duration_minutes} min · {s.category}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-purple-600">NZ${s.price}</span>
                          <Link to="/book" className="text-xs border border-purple-200 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors font-medium">Book</Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="text-center mt-6">
                    <Link to="/services" className="text-sm text-gray-500 hover:text-purple-600 font-medium transition-colors">View All Services →</Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={filter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

                {/* Featured offer (only on "all" tab, first promo) */}
                {filter === 'all' && featured && (
                  <div className="mb-10">
                    <FeaturedOffer promo={featured} />
                  </div>
                )}

                {/* Filtered empty */}
                {filtered.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center text-3xl mx-auto mb-3">
                      {FILTERS.find(f => f.key === filter)?.icon}
                    </div>
                    <p className="font-semibold text-gray-600 mb-1">No {FILTERS.find(f => f.key === filter)?.label} right now</p>
                    <p className="text-sm text-gray-400 mb-5">Check back soon or browse our other offers.</p>
                    <button onClick={() => setFilter('all')} className="btn-primary text-sm px-5 py-2.5">View All Offers</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rest.map((promo, i) => <PromoCard key={promo.id} promo={promo} i={i} />)}
                    {[...Array(padCount)].map((_, i) => {
                      // Pick a type not already shown in current results
                      const usedTypes = new Set(rest.map((p: any) => p.type));
                      const unusedKey = Object.keys(TYPE_META).find(k => !usedTypes.has(k)) ?? Object.keys(TYPE_META)[i];
                      return <DefaultPromoCard key={`pad-${i}`} typeKey={unusedKey} i={rest.length + i} />;
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="bg-purple-900 py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #a78bfa 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <p className="section-label mb-3 text-purple-300">Ready to treat yourself?</p>
          <h3 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">Book Your Next Appointment</h3>
          <p className="text-white/60 mb-8">Enjoy any active offer — simply mention it at checkout or enter your code when booking online.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/book" className="btn-primary px-8 py-3.5 text-base rounded-xl">Book Appointment</Link>
            <Link to="/services" className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl border-2 border-white/30 text-white font-semibold text-base hover:bg-white/10 transition-all">
              Explore Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
