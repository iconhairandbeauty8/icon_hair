import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { serviceApi, staffApi, bookingApi, voucherApi, loyaltyApi, promotionApi, resolveImageUrl } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { Service, Employee } from '../../types';

const STEPS = ['Service', 'Stylist', 'Date & Time', 'Confirm'];

const PROMO_ICONS: Record<string, string> = {
  daily_special: '⚡', weekly_deal: '📅', monthly_campaign: '🎯', discount_code: '🏷️', package: '📦',
};

function getNextDays(n = 21) {
  const days = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-NZ', { weekday: 'short' });
    const dayNum = d.getDate();
    const month = d.toLocaleDateString('en-NZ', { month: 'short' });
    days.push({ iso, dayName, dayNum, month });
  }
  return days;
}
const DAYS = getNextDays(21);

function formatDate(iso: string) {
  return new Date(iso + 'T00:00').toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function BookingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [step, setStep]                       = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff]     = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate]       = useState('');
  const [selectedSlot, setSelectedSlot]       = useState('');
  const [activeCategory, setActiveCategory]   = useState('All');
  const [notes, setNotes]                     = useState('');
  const [voucherCode, setVoucherCode]         = useState('');
  const [voucherData, setVoucherData]         = useState<any>(null);
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting]       = useState(false);

  const dateScrollRef = useRef<HTMLDivElement>(null);

  const { data: servicesRes } = useQuery({ queryKey: ['services'], queryFn: () => serviceApi.list() });
  const { data: staffRes }    = useQuery({ queryKey: ['staff'],    queryFn: () => staffApi.list(), enabled: step >= 1 });
  const { data: slotsRes, isFetching: slotsLoading } = useQuery({
    queryKey: ['slots', selectedStaff?.id, selectedService?.id, selectedDate],
    queryFn:  () => bookingApi.availability({ employee_id: selectedStaff?.id, service_id: selectedService?.id, date: selectedDate }),
    enabled:  step === 2 && !!selectedService && !!selectedDate,
  });
  const { data: loyaltyProfileRes }  = useQuery({ queryKey: ['loyalty-profile'],  queryFn: loyaltyApi.profile,     enabled: isAuthenticated });
  const { data: loyaltySettingsRes } = useQuery({ queryKey: ['loyalty-settings'], queryFn: loyaltyApi.getSettings, enabled: isAuthenticated });
  const { data: promosRes } = useQuery({
    queryKey: ['promotions-booking', selectedDate],
    queryFn:  () => promotionApi.list(selectedDate ? { date: selectedDate } : {}),
  });

  const services: Service[]   = Array.isArray(servicesRes?.data)       ? servicesRes.data       : [];
  const staffList: Employee[] = Array.isArray(staffRes?.data)           ? staffRes.data           : [];
  const slots: string[]       = Array.isArray(slotsRes?.data?.slots)   ? slotsRes.data.slots    : [];
  const promos: any[]         = Array.isArray(promosRes?.data)          ? promosRes.data          : [];

  const loyaltyTiers: any[]  = loyaltySettingsRes?.data?.tiers ?? [];
  const activeTier           = loyaltyTiers.find((t: any) => t.key === loyaltyProfileRes?.data?.membership_tier);
  const tierDiscountPct: number = activeTier?.discount ?? 0;

  const applicablePromos = selectedService
    ? promos.filter((p) => {
        const ids: string[] = Array.isArray(p.applicable_services) ? p.applicable_services : [];
        return ids.length === 0 || ids.includes(selectedService.id);
      })
    : [];

  useEffect(() => { setSelectedPromoId(null); }, [selectedService?.id, selectedDate]);

  const categories      = ['All', ...Array.from(new Set(services.map((s) => s.category)))];
  const visibleServices = activeCategory === 'All' ? services : services.filter((s) => s.category === activeCategory);

  const basePrice        = Number(selectedService?.price || 0);
  const afterTier        = tierDiscountPct > 0 ? basePrice * (1 - tierDiscountPct / 100) : basePrice;
  const applicablePromo  = applicablePromos.find(p => p.id === selectedPromoId) ?? null;
  const promoDiscountAmt = applicablePromo
    ? applicablePromo.discount_type === 'percentage'
      ? afterTier * (applicablePromo.discount_value / 100)
      : Number(applicablePromo.discount_value)
    : 0;
  const afterPromo  = applicablePromo ? Math.max(0, afterTier - promoDiscountAmt) : afterTier;
  const finalPrice  = voucherData ? Math.max(0, afterPromo - Number(voucherData.amount)) : afterPromo;

  const promoCountForService = (serviceId: string) =>
    promos.filter((p) => {
      const ids: string[] = Array.isArray(p.applicable_services) ? p.applicable_services : [];
      return ids.length === 0 || ids.includes(serviceId);
    }).length;

  useEffect(() => {
    if (step === 2 && selectedDate && dateScrollRef.current) {
      const btn = dateScrollRef.current.querySelector(`[data-date="${selectedDate}"]`) as HTMLElement;
      if (btn) btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [step, selectedDate]);

  const pickService = (s: Service)  => { setSelectedService(s); setTimeout(() => setStep(1), 180); };
  const pickStaff   = (m: Employee | { id: string; first_name: string; last_name: string }) => { setSelectedStaff(m as Employee); setTimeout(() => setStep(2), 180); };
  const pickSlot    = (slot: string) => { setSelectedSlot(slot); setTimeout(() => setStep(3), 180); };
  const pickDate    = (iso: string)  => { setSelectedDate(iso); setSelectedSlot(''); };

  const validateVoucher = async () => {
    if (!voucherCode.trim()) return;
    try {
      const res = await voucherApi.validate(voucherCode);
      setVoucherData(res.data);
      toast.success(`Voucher applied! NZ$${res.data.amount} off`);
    } catch { toast.error('Invalid or expired voucher'); }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) { toast.error('Please sign in to book'); navigate('/login?redirect=/book'); return; }
    if (!selectedService || !selectedStaff || !selectedDate || !selectedSlot) { toast.error('Please complete all steps'); return; }
    setIsSubmitting(true);
    try {
      const res = await bookingApi.create({
        service_id:   selectedService.id,
        employee_id:  selectedStaff.id === 'any' ? null : selectedStaff.id,
        start_time:   `${selectedDate}T${selectedSlot}:00`,
        notes,
        voucher_code: voucherCode || undefined,
        promotion_id: applicablePromo?.id || undefined,
      });
      navigate(`/book/success?booking_id=${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Booking failed');
    } finally { setIsSubmitting(false); }
  };

  const summaryParts = () => {
    const parts: string[] = [];
    if (selectedService) parts.push(selectedService.name);
    if (selectedStaff)   parts.push(selectedStaff.id === 'any' ? 'Any stylist' : selectedStaff.first_name);
    if (selectedDate)    parts.push(formatDate(selectedDate));
    if (selectedSlot)    parts.push(selectedSlot);
    return parts;
  };

  const sidebarStatusText =
    !selectedService ? 'Select a service to begin' :
    !selectedStaff   ? 'Choose your stylist' :
    !selectedDate    ? 'Pick a date' :
    !selectedSlot    ? 'Select a time slot' :
                       'Ready to confirm ✓';

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-gray-100 py-3 px-4 flex-shrink-0 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 mr-auto">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center shadow-sm shadow-purple-200">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-bold text-gray-900 text-base tracking-tight">LuxeSalon</span>
          </Link>
          <span className="text-gray-400 text-xs hidden sm:block">Book Appointment</span>
        </div>
      </div>

      {/* ── Step indicator ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-0">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center flex-1 min-w-0">
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-2 ${i < step ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                    i < step     ? 'bg-green-500 text-white'
                    : i === step ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                    : 'bg-gray-100 text-gray-400'
                  }`}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block truncate transition-colors ${
                    i === step ? 'text-purple-600' : i < step ? 'text-green-600' : 'text-gray-400'
                  }`}>{label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="flex-1 pb-20 lg:pb-10">
        <div className="max-w-6xl mx-auto px-4 py-6 lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 lg:items-start">

          {/* ══ LEFT: wizard steps ══ */}
          <div className="min-w-0">

            {/* Back button — visible on all sizes (mobile bottom bar also has ←) */}
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-purple-600 transition-colors font-medium mb-5 group"
              >
                <span className="group-hover:-translate-x-0.5 transition-transform inline-block">←</span>
                Back to {STEPS[step - 1]}
              </button>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.2 }}
              >

                {/* ════ STEP 0: SERVICE ════ */}
                {step === 0 && (
                  <div>
                    <h2 className="font-display text-2xl font-bold text-gray-900 mb-1">What can we do for you?</h2>
                    <p className="text-gray-400 text-sm mb-5">Choose a service to get started.</p>

                    <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
                      {categories.map((cat) => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                            activeCategory === cat
                              ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                              : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600'
                          }`}>
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3">
                      {visibleServices.map((service) => (
                        <motion.button key={service.id} onClick={() => pickService(service)} whileTap={{ scale: 0.98 }}
                          className={`w-full text-left flex items-center gap-4 bg-white rounded-2xl border-2 overflow-hidden transition-all shadow-sm hover:shadow-md ${
                            selectedService?.id === service.id ? 'border-purple-500 bg-purple-50' : 'border-transparent hover:border-purple-200'
                          }`}>
                          <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-purple-100 to-purple-50 overflow-hidden">
                            {(service as any).image_url
                              ? <img src={resolveImageUrl((service as any).image_url)} alt={service.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-2xl">✂️</div>
                            }
                          </div>
                          <div className="flex-1 py-4 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">{service.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{service.duration_minutes} min</p>
                            {service.description && (
                              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{service.description}</p>
                            )}
                            {(service.avg_rating ?? 0) > 0 && (
                              <p className="text-xs text-yellow-500 mt-1.5">
                                ★ {Number(service.avg_rating).toFixed(1)}
                                {service.review_count ? <span className="text-gray-400"> · {service.review_count} reviews</span> : null}
                              </p>
                            )}
                          </div>
                          <div className="pr-5 flex-shrink-0 text-right">
                            {tierDiscountPct > 0 ? (
                              <>
                                <p className="text-gray-400 text-xs line-through">NZ${service.price}</p>
                                <p className="text-purple-600 font-bold text-base">NZ${(Number(service.price) * (1 - tierDiscountPct / 100)).toFixed(2)}</p>
                                <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">{tierDiscountPct}% off</span>
                              </>
                            ) : (
                              <p className="text-purple-600 font-bold text-base">NZ${service.price}</p>
                            )}
                            {promoCountForService(service.id) > 0 && (
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold block mt-0.5">
                                🎁 {promoCountForService(service.id)} offer{promoCountForService(service.id) > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ════ STEP 1: STYLIST ════ */}
                {step === 1 && (
                  <div>
                    <h2 className="font-display text-2xl font-bold text-gray-900 mb-1">Choose your stylist</h2>
                    <p className="text-gray-400 text-sm mb-5">Select a stylist or let us pick the best available.</p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <motion.button whileTap={{ scale: 0.96 }}
                        onClick={() => pickStaff({ id: 'any', first_name: 'Any', last_name: 'Stylist' })}
                        className={`bg-white rounded-2xl border-2 p-5 text-center transition-all shadow-sm hover:shadow-md ${
                          selectedStaff?.id === 'any' ? 'border-purple-500 bg-purple-50' : 'border-transparent hover:border-purple-200'
                        }`}>
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center text-2xl mx-auto mb-3">🎲</div>
                        <p className="font-semibold text-gray-900 text-sm">Any Available</p>
                        <p className="text-xs text-gray-400 mt-0.5">Best match for you</p>
                      </motion.button>

                      {staffList.map((member) => (
                        <motion.button key={member.id} whileTap={{ scale: 0.96 }} onClick={() => pickStaff(member)}
                          className={`bg-white rounded-2xl border-2 p-5 text-center transition-all shadow-sm hover:shadow-md ${
                            selectedStaff?.id === member.id ? 'border-purple-500 bg-purple-50' : 'border-transparent hover:border-purple-200'
                          }`}>
                          <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 bg-gradient-to-br from-purple-100 to-purple-50">
                            {member.image_url
                              ? <img src={resolveImageUrl(member.image_url)} alt={member.first_name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center font-bold text-purple-400 text-xl">{member.first_name[0]}</div>
                            }
                          </div>
                          <p className="font-semibold text-gray-900 text-sm">{member.first_name} {member.last_name}</p>
                          <p className="text-xs text-purple-600 mt-0.5 font-medium">{member.role}</p>
                          {member.experience_years > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5">{member.experience_years} yrs experience</p>
                          )}
                          {(member.avg_rating ?? 0) > 0 && (
                            <div className="flex items-center justify-center gap-1 mt-1.5">
                              <span className="text-yellow-400 text-xs">★</span>
                              <span className="text-xs text-gray-600 font-medium">{Number(member.avg_rating).toFixed(1)}</span>
                              {member.review_count ? <span className="text-xs text-gray-400">({member.review_count})</span> : null}
                            </div>
                          )}
                          {member.bio && (
                            <p className="text-xs text-gray-400 mt-2 line-clamp-2 text-left leading-relaxed">{member.bio}</p>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ════ STEP 2: DATE & TIME ════ */}
                {step === 2 && (
                  <div>
                    <h2 className="font-display text-2xl font-bold text-gray-900 mb-1">Pick a date & time</h2>
                    <p className="text-gray-400 text-sm mb-5">Select a date then tap a time slot.</p>

                    <div ref={dateScrollRef} className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
                      {DAYS.map((day) => (
                        <button key={day.iso} data-date={day.iso} onClick={() => pickDate(day.iso)}
                          className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl border-2 min-w-[64px] transition-all ${
                            selectedDate === day.iso
                              ? 'border-purple-600 bg-purple-600 text-white shadow-sm shadow-purple-200'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'
                          }`}>
                          <span className={`text-[10px] font-medium uppercase tracking-wide ${selectedDate === day.iso ? 'text-white/80' : 'text-gray-400'}`}>{day.dayName}</span>
                          <span className="text-xl font-bold leading-tight">{day.dayNum}</span>
                          <span className={`text-[10px] ${selectedDate === day.iso ? 'text-white/70' : 'text-gray-400'}`}>{day.month}</span>
                        </button>
                      ))}
                    </div>

                    {!selectedDate && (
                      <div className="text-center py-10 text-gray-400 text-sm">Select a date above to see available times.</div>
                    )}
                    {selectedDate && slotsLoading && (
                      <div className="flex items-center justify-center py-10 gap-3 text-gray-400 text-sm">
                        <span className="animate-spin text-xl">⏳</span> Loading slots…
                      </div>
                    )}
                    {selectedDate && !slotsLoading && slots.length === 0 && (
                      <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                        <p className="text-2xl mb-2">😔</p>
                        <p className="font-medium text-gray-700">No slots available</p>
                        <p className="text-sm text-gray-400 mt-1">Try a different date.</p>
                      </div>
                    )}
                    {selectedDate && !slotsLoading && slots.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">
                          {slots.length} slots available · {slotsRes?.data?.duration ?? selectedService?.duration_minutes} min
                        </p>
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                          {slots.map((slot) => (
                            <motion.button key={slot} whileTap={{ scale: 0.95 }} onClick={() => pickSlot(slot)}
                              className={`py-2.5 px-2 rounded-xl text-sm font-semibold border-2 transition-all text-center ${
                                selectedSlot === slot
                                  ? 'bg-purple-600 text-white border-transparent shadow-sm shadow-purple-200'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'
                              }`}>
                              {slot}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ════ STEP 3: CONFIRM ════ */}
                {step === 3 && (
                  <div>
                    <h2 className="font-display text-2xl font-bold text-gray-900 mb-1">Confirm your booking</h2>
                    <p className="text-gray-400 text-sm mb-5">Review and confirm to complete.</p>

                    {/* Summary cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                      {[
                        { icon: '✂️', label: 'Service', value: selectedService?.name,  sub: `NZ$${selectedService?.price} · ${selectedService?.duration_minutes}min`, backStep: 0 },
                        { icon: '👤', label: 'Stylist',  value: selectedStaff?.id === 'any' ? 'Any available' : selectedStaff?.first_name, sub: selectedStaff?.id !== 'any' ? selectedStaff?.role : '', backStep: 1 },
                        { icon: '📅', label: 'Date',     value: selectedDate ? formatDate(selectedDate) : '—', sub: '', backStep: 2 },
                        { icon: '🕐', label: 'Time',     value: selectedSlot || '—',   sub: '', backStep: 2 },
                      ].map(({ icon, label, value, sub, backStep }) => (
                        <button key={label} onClick={() => setStep(backStep)}
                          className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:border-purple-200 hover:shadow-sm transition-all group">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-lg">{icon}</span>
                            <span className="text-[10px] text-purple-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                          </div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{label}</p>
                          <p className="font-semibold text-gray-900 text-sm mt-0.5 leading-tight">{value}</p>
                          {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
                        </button>
                      ))}
                    </div>

                    {/* Offer selector */}
                    {applicablePromos.length > 0 && (
                      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                        <h4 className="font-semibold text-gray-800 text-sm mb-3">
                          🎁 Available Offers
                          <span className="ml-1.5 text-xs text-gray-400 font-normal">— choose one or skip</span>
                        </h4>
                        <div className="space-y-2">
                          <button type="button" onClick={() => setSelectedPromoId(null)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                              selectedPromoId === null ? 'border-gray-300 bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                            }`}>
                            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                              selectedPromoId === null ? 'border-gray-500 bg-gray-500' : 'border-gray-300'
                            }`}>
                              {selectedPromoId === null && <span className="w-2 h-2 rounded-full bg-white block" />}
                            </div>
                            <span className="text-sm text-gray-500">No offer — pay full price</span>
                          </button>

                          {applicablePromos.map((p) => {
                            const saving = p.discount_type === 'percentage' ? afterTier * (p.discount_value / 100) : Number(p.discount_value);
                            const isSelected = selectedPromoId === p.id;
                            return (
                              <button key={p.id} type="button" onClick={() => setSelectedPromoId(isSelected ? null : p.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                                  isSelected ? 'border-purple-400 bg-purple-50' : 'border-gray-100 hover:border-purple-200 hover:bg-purple-50/40'
                                }`}>
                                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                                  isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                                }`}>
                                  {isSelected && <span className="w-2 h-2 rounded-full bg-white block" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 leading-tight">{p.title}</p>
                                  {p.description && <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{p.description}</p>}
                                </div>
                                <div className="flex-shrink-0 text-right">
                                  <span className="bg-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg block">
                                    {p.discount_type === 'percentage' ? `${p.discount_value}% OFF` : `NZ$${p.discount_value} OFF`}
                                  </span>
                                  <span className="text-[10px] text-purple-600 font-medium mt-0.5 block">save NZ${saving.toFixed(2)}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <h4 className="font-semibold text-gray-800 text-sm mb-3">🎟 Gift Voucher / Promo Code</h4>
                        <div className="flex gap-2">
                          <input type="text" placeholder="Enter code" value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                            className="input-luxury flex-1 text-sm py-2.5" />
                          <button onClick={validateVoucher} className="btn-primary py-2.5 px-4 text-sm">Apply</button>
                        </div>
                        {voucherData && <p className="text-green-600 text-xs mt-2">✓ NZ${voucherData.amount} off applied</p>}
                      </div>
                      <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <h4 className="font-semibold text-gray-800 text-sm mb-3">📝 Special Requests</h4>
                        <textarea rows={3} placeholder="Any notes for your stylist…" value={notes}
                          onChange={(e) => setNotes(e.target.value)} className="input-luxury text-sm resize-none" />
                      </div>
                    </div>

                    {/* Mobile-only price + confirm */}
                    <div className="lg:hidden bg-purple-900 rounded-2xl p-5 mt-4 flex items-center justify-between relative overflow-hidden">
                      <div className="absolute inset-0 opacity-[0.04]"
                        style={{ backgroundImage: 'radial-gradient(circle, #a78bfa 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                      <div className="relative z-10">
                        <p className="text-white/60 text-xs mb-1">Total to pay</p>
                        {(tierDiscountPct > 0 || applicablePromo || voucherData) && (
                          <p className="text-white/40 text-xs line-through">NZ${basePrice.toFixed(2)}</p>
                        )}
                        <p className="text-white font-bold text-2xl font-display">NZ${finalPrice.toFixed(2)}</p>
                      </div>
                      <div className="relative z-10">
                        {!isAuthenticated ? (
                          <Link to="/login?redirect=/book" className="btn-primary text-sm px-5 py-2.5">Sign In</Link>
                        ) : (
                          <button onClick={handleSubmit} disabled={isSubmitting}
                            className="btn-primary text-sm px-6 py-3 disabled:opacity-60 flex items-center gap-2">
                            {isSubmitting ? <><span className="animate-spin">⏳</span> Confirming…</> : <>✓ Confirm</>}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* ══ RIGHT: sticky sidebar (desktop only) ══ */}
          <aside className="hidden lg:flex lg:flex-col lg:sticky lg:top-[104px] gap-4 overflow-y-auto max-h-[calc(100vh-120px)] scrollbar-hide">

            {/* Booking summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-700 to-purple-500 px-5 py-4">
                <p className="text-white font-bold text-sm">Your Booking</p>
                <p className="text-purple-200 text-xs mt-0.5">{sidebarStatusText}</p>
              </div>
              <div className="divide-y divide-gray-50">
                {([
                  { icon: '✂️', label: 'Service', value: selectedService?.name,     sub: selectedService ? `${selectedService.duration_minutes} min · NZ$${selectedService.price}` : null, back: 0 },
                  { icon: '👤', label: 'Stylist',  value: selectedStaff ? (selectedStaff.id === 'any' ? 'Any available' : `${selectedStaff.first_name} ${selectedStaff.last_name}`) : null, sub: selectedStaff?.id !== 'any' ? selectedStaff?.role ?? null : null, back: 1 },
                  { icon: '📅', label: 'Date',     value: selectedDate ? formatDate(selectedDate) : null, sub: null, back: 2 },
                  { icon: '🕐', label: 'Time',     value: selectedSlot || null,      sub: null, back: 2 },
                ] as { icon: string; label: string; value: string | null; sub: string | null; back: number }[]).map(({ icon, label, value, sub, back }) => (
                  <div key={label} onClick={() => value && setStep(back)}
                    className={`px-5 py-3 flex items-center gap-3 ${value ? 'cursor-pointer hover:bg-purple-50/50 transition-colors' : ''}`}>
                    <span className={`text-base flex-shrink-0 ${value ? '' : 'opacity-25'}`}>{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{label}</p>
                      {value
                        ? <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
                        : <p className="text-sm text-gray-300 italic">Not selected</p>
                      }
                      {sub && <p className="text-xs text-gray-400">{sub}</p>}
                    </div>
                    {value && <span className="text-[10px] text-purple-400 flex-shrink-0 font-medium">Edit</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Price breakdown + confirm — kept near top so it's always visible */}
            {selectedService ? (
              <div className="bg-purple-900 rounded-2xl p-5 relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 opacity-[0.04]"
                  style={{ backgroundImage: 'radial-gradient(circle, #a78bfa 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <div className="relative z-10">
                  <p className="text-white/60 text-[10px] uppercase tracking-wide font-semibold mb-3">Price Breakdown</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60 truncate pr-2">{selectedService.name}</span>
                      <span className="text-white font-medium flex-shrink-0">NZ${basePrice.toFixed(2)}</span>
                    </div>
                    {tierDiscountPct > 0 && (
                      <div className="flex justify-between">
                        <span className="text-purple-300 truncate pr-2">{activeTier?.label} ({tierDiscountPct}% off)</span>
                        <span className="text-green-400 flex-shrink-0">−NZ${(basePrice - afterTier).toFixed(2)}</span>
                      </div>
                    )}
                    {applicablePromo && (
                      <div className="flex justify-between">
                        <span className="text-purple-300 truncate pr-2">{applicablePromo.title}</span>
                        <span className="text-green-400 flex-shrink-0">−NZ${promoDiscountAmt.toFixed(2)}</span>
                      </div>
                    )}
                    {voucherData && (
                      <div className="flex justify-between">
                        <span className="text-purple-300">Voucher</span>
                        <span className="text-green-400 flex-shrink-0">−NZ${Number(voucherData.amount).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-white/10 mt-3 pt-3 flex justify-between items-baseline">
                    <span className="text-white/70 text-sm">Total</span>
                    <span className="text-white font-bold text-2xl font-display">NZ${finalPrice.toFixed(2)}</span>
                  </div>
                  {step === 3 ? (
                    <div className="mt-4">
                      {!isAuthenticated ? (
                        <Link to="/login?redirect=/book"
                          className="block w-full text-center bg-white text-purple-900 font-bold text-sm py-3 rounded-xl hover:bg-purple-50 transition-colors">
                          Sign In to Book
                        </Link>
                      ) : (
                        <button onClick={handleSubmit} disabled={isSubmitting}
                          className="w-full bg-white text-purple-900 font-bold text-sm py-3 rounded-xl hover:bg-purple-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                          {isSubmitting ? <><span className="animate-spin">⏳</span> Confirming…</> : <>✓ Confirm Booking</>}
                        </button>
                      )}
                    </div>
                  ) : selectedSlot ? (
                    <button onClick={() => setStep(3)}
                      className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors">
                      Review & Confirm →
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-3 text-xl">✂️</div>
                <p className="text-sm font-semibold text-gray-700">Start by choosing a service</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">Your booking details and pricing will appear here.</p>
              </div>
            )}

            {/* Selected stylist detail */}
            {selectedStaff && selectedStaff.id !== 'any' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-3">Your Stylist</p>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-100 to-purple-50">
                    {selectedStaff.image_url
                      ? <img src={resolveImageUrl(selectedStaff.image_url)} alt={selectedStaff.first_name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center font-bold text-purple-400 text-2xl">{selectedStaff.first_name[0]}</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{selectedStaff.first_name} {selectedStaff.last_name}</p>
                    <p className="text-sm text-purple-600 font-medium">{selectedStaff.role}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                      {(selectedStaff.avg_rating ?? 0) > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <span className="text-yellow-400">★</span>
                          {Number(selectedStaff.avg_rating).toFixed(1)}
                          {selectedStaff.review_count ? <span className="text-gray-400">({selectedStaff.review_count})</span> : null}
                        </span>
                      )}
                      {selectedStaff.experience_years > 0 && (
                        <span className="text-xs text-gray-400">{selectedStaff.experience_years} yrs exp</span>
                      )}
                    </div>
                  </div>
                </div>
                {selectedStaff.bio && (
                  <p className="text-sm text-gray-500 mt-3 leading-relaxed line-clamp-4">{selectedStaff.bio}</p>
                )}
              </div>
            )}

            {/* Active offers for selected service */}
            {applicablePromos.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-3">
                  Available Offers ({applicablePromos.length})
                </p>
                <div className="space-y-2">
                  {applicablePromos.map((p) => (
                    <div key={p.id} className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50 to-white rounded-xl border border-purple-100">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 text-sm">
                        {PROMO_ICONS[p.type] || '🎁'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 leading-tight">{p.title}</p>
                        {p.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{p.description}</p>}
                      </div>
                      <span className="text-xs bg-purple-600 text-white font-bold px-2 py-1 rounded-lg flex-shrink-0 whitespace-nowrap">
                        {p.discount_type === 'percentage' ? `${p.discount_value}% OFF` : `NZ$${p.discount_value} OFF`}
                      </span>
                    </div>
                  ))}
                </div>
                {step < 3 && (
                  <p className="text-xs text-gray-400 text-center mt-2">Select an offer at the confirm step</p>
                )}
              </div>
            )}

            {/* Price breakdown + confirm */}
            {selectedService ? (
              <div className="bg-purple-900 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.04]"
                  style={{ backgroundImage: 'radial-gradient(circle, #a78bfa 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <div className="relative z-10">
                  <p className="text-white/60 text-[10px] uppercase tracking-wide font-semibold mb-3">Price Breakdown</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60 truncate pr-2">{selectedService.name}</span>
                      <span className="text-white font-medium flex-shrink-0">NZ${basePrice.toFixed(2)}</span>
                    </div>
                    {tierDiscountPct > 0 && (
                      <div className="flex justify-between">
                        <span className="text-purple-300 truncate pr-2">{activeTier?.label} ({tierDiscountPct}% off)</span>
                        <span className="text-green-400 flex-shrink-0">−NZ${(basePrice - afterTier).toFixed(2)}</span>
                      </div>
                    )}
                    {applicablePromo && (
                      <div className="flex justify-between">
                        <span className="text-purple-300 truncate pr-2">{applicablePromo.title}</span>
                        <span className="text-green-400 flex-shrink-0">−NZ${promoDiscountAmt.toFixed(2)}</span>
                      </div>
                    )}
                    {voucherData && (
                      <div className="flex justify-between">
                        <span className="text-purple-300">Voucher</span>
                        <span className="text-green-400 flex-shrink-0">−NZ${Number(voucherData.amount).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-white/10 mt-3 pt-3 flex justify-between items-baseline">
                    <span className="text-white/70 text-sm">Total</span>
                    <span className="text-white font-bold text-2xl font-display">NZ${finalPrice.toFixed(2)}</span>
                  </div>

                  {step === 3 ? (
                    <div className="mt-4">
                      {!isAuthenticated ? (
                        <Link to="/login?redirect=/book"
                          className="block w-full text-center bg-white text-purple-900 font-bold text-sm py-3 rounded-xl hover:bg-purple-50 transition-colors">
                          Sign In to Book
                        </Link>
                      ) : (
                        <button onClick={handleSubmit} disabled={isSubmitting}
                          className="w-full bg-white text-purple-900 font-bold text-sm py-3 rounded-xl hover:bg-purple-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                          {isSubmitting ? <><span className="animate-spin">⏳</span> Confirming…</> : <>✓ Confirm Booking</>}
                        </button>
                      )}
                    </div>
                  ) : selectedSlot ? (
                    <button onClick={() => setStep(3)}
                      className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors">
                      Review & Confirm →
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-3 text-xl">✂️</div>
                <p className="text-sm font-semibold text-gray-700">Start by choosing a service</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">Your booking details and pricing will appear here.</p>
              </div>
            )}

            {/* Salon info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">LuxeSalon</p>
                  <p className="text-xs text-gray-400">Premium Hair & Beauty</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-gray-500">
                <p>🕐 Mon–Sat  9:00 am – 6:00 pm</p>
                <p>📍 Auckland, New Zealand</p>
                <p>📞 +64 9 123 4567</p>
              </div>
            </div>

          </aside>
        </div>
      </div>

      {/* ── Mobile bottom bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
            className="flex-shrink-0 w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-300 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            ←
          </button>
          <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide min-w-0">
            {summaryParts().length === 0
              ? <span className="text-gray-400 text-sm">Select a service to begin</span>
              : summaryParts().map((part, i) => (
                  <span key={i} className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1.5 rounded-full whitespace-nowrap font-medium flex-shrink-0">
                    {part}
                  </span>
                ))
            }
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0">{step + 1}/{STEPS.length}</span>
        </div>
      </div>
    </div>
  );
}
