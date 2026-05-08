import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { serviceApi, staffApi, bookingApi, voucherApi, loyaltyApi, promotionApi, resolveImageUrl } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { Service, Employee } from '../../types';

const STEPS = ['Service', 'Stylist', 'Date & Time', 'Confirm'];

// Generate next N days as { iso, label, dayName, dayNum }
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

export default function BookingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff]     = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate]       = useState('');
  const [selectedSlot, setSelectedSlot]       = useState('');
  const [activeCategory, setActiveCategory]   = useState('All');
  const [notes, setNotes]         = useState('');
  const [voucherCode, setVoucherCode]   = useState('');
  const [voucherData, setVoucherData]   = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateScrollRef = useRef<HTMLDivElement>(null);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: servicesRes } = useQuery({
    queryKey: ['services'],
    queryFn: () => serviceApi.list(),
  });
  const { data: staffRes } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.list(),
    enabled: step >= 1,
  });
  const { data: slotsRes, isFetching: slotsLoading } = useQuery({
    queryKey: ['slots', selectedStaff?.id, selectedService?.id, selectedDate],
    queryFn: () => bookingApi.availability({
      employee_id: selectedStaff?.id,
      service_id: selectedService?.id,
      date: selectedDate,
    }),
    enabled: step === 2 && !!selectedService && !!selectedDate,
  });

  const { data: loyaltyProfileRes } = useQuery({
    queryKey: ['loyalty-profile'],
    queryFn: loyaltyApi.profile,
    enabled: isAuthenticated,
  });
  const { data: loyaltySettingsRes } = useQuery({
    queryKey: ['loyalty-settings'],
    queryFn: loyaltyApi.getSettings,
    enabled: isAuthenticated,
  });

  // Fetch active promotions for the selected booking date (or today if no date yet)
  const { data: promosRes } = useQuery({
    queryKey: ['promotions-booking', selectedDate],
    queryFn: () => promotionApi.list(selectedDate ? { date: selectedDate } : {}),
  });

  const services: Service[]  = Array.isArray(servicesRes?.data) ? servicesRes.data : [];
  const staffList: Employee[] = Array.isArray(staffRes?.data) ? staffRes.data : [];
  const slots: string[]       = Array.isArray(slotsRes?.data?.slots) ? slotsRes.data.slots : [];
  const promos: any[]         = Array.isArray(promosRes?.data) ? promosRes.data : [];

  // Loyalty tier discount
  const loyaltyProfile = loyaltyProfileRes?.data;
  const loyaltyTiers: any[] = loyaltySettingsRes?.data?.tiers ?? [];
  const activeTier = loyaltyTiers.find((t: any) => t.key === loyaltyProfile?.membership_tier);
  const tierDiscountPct: number = activeTier?.discount ?? 0;

  // Auto-apply best promotion for the selected service
  const applicablePromo = selectedService
    ? promos.find((p) => {
        const svcIds: string[] = Array.isArray(p.applicable_services) ? p.applicable_services : [];
        return svcIds.length === 0 || svcIds.includes(selectedService.id);
      })
    : null;

  const categories = ['All', ...Array.from(new Set(services.map((s) => s.category)))];
  const visibleServices = activeCategory === 'All'
    ? services
    : services.filter((s) => s.category === activeCategory);

  const basePrice   = Number(selectedService?.price || 0);
  const afterTier   = tierDiscountPct > 0 ? basePrice * (1 - tierDiscountPct / 100) : basePrice;
  const promoDiscountAmt = applicablePromo
    ? applicablePromo.discount_type === 'percentage'
      ? afterTier * (applicablePromo.discount_value / 100)
      : Number(applicablePromo.discount_value)
    : 0;
  const afterPromo  = applicablePromo ? Math.max(0, afterTier - promoDiscountAmt) : afterTier;
  const finalPrice  = voucherData ? Math.max(0, afterPromo - voucherData.amount) : afterPromo;

  // Helper: find best promo for a given service (for step-0 badges)
  const promoForService = (serviceId: string) =>
    promos.find((p) => {
      const svcIds: string[] = Array.isArray(p.applicable_services) ? p.applicable_services : [];
      return svcIds.length === 0 || svcIds.includes(serviceId);
    }) ?? null;

  // Scroll selected date into view
  useEffect(() => {
    if (step === 2 && selectedDate && dateScrollRef.current) {
      const btn = dateScrollRef.current.querySelector(`[data-date="${selectedDate}"]`) as HTMLElement;
      if (btn) btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [step, selectedDate]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const pickService = (service: Service) => {
    setSelectedService(service);
    setTimeout(() => setStep(1), 180);
  };

  const pickStaff = (member: Employee | { id: string; first_name: string; last_name: string }) => {
    setSelectedStaff(member as Employee);
    setTimeout(() => setStep(2), 180);
  };

  const pickSlot = (slot: string) => {
    setSelectedSlot(slot);
    setTimeout(() => setStep(3), 180);
  };

  const pickDate = (iso: string) => {
    setSelectedDate(iso);
    setSelectedSlot('');
  };

  const validateVoucher = async () => {
    if (!voucherCode.trim()) return;
    try {
      const res = await voucherApi.validate(voucherCode);
      setVoucherData(res.data);
      toast.success(`Voucher applied! NZ$${res.data.amount} off`);
    } catch {
      toast.error('Invalid or expired voucher');
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book');
      navigate('/login?redirect=/book');
      return;
    }
    if (!selectedService || !selectedStaff || !selectedDate || !selectedSlot) {
      toast.error('Please complete all steps');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await bookingApi.create({
        service_id: selectedService.id,
        employee_id: selectedStaff.id === 'any' ? null : selectedStaff.id,
        start_time: `${selectedDate}T${selectedSlot}:00`,
        notes,
        voucher_code: voucherCode || undefined,
        promotion_id: applicablePromo?.id || undefined,
      });
      navigate(`/book/success?booking_id=${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Booking failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step display name helpers ─────────────────────────────────────────────
  const summaryLabel = () => {
    const parts: string[] = [];
    if (selectedService) parts.push(selectedService.name);
    if (selectedStaff)   parts.push(selectedStaff.id === 'any' ? 'Any stylist' : selectedStaff.first_name);
    if (selectedDate)    parts.push(new Date(selectedDate + 'T00:00').toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' }));
    if (selectedSlot)    parts.push(selectedSlot);
    return parts;
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-ivory flex flex-col">

      {/* ── Top bar ── */}
      <div className="bg-onyx-950 text-white py-3 px-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 mr-auto">
            <div className="w-7 h-7 rounded-full bg-gold-gradient flex items-center justify-center">
              <span className="text-white font-bold text-xs">L</span>
            </div>
            <span className="font-display font-bold text-sm">LuxeSalon</span>
          </Link>
          <span className="text-white/50 text-xs">Book Appointment</span>
        </div>
      </div>

      {/* ── Step indicator ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 flex-shrink-0">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-0">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center flex-1 min-w-0">
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-2 ${i < step ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                    i < step  ? 'bg-green-500 text-white'
                    : i === step ? 'bg-gold-gradient text-white shadow-gold'
                    : 'bg-gray-100 text-gray-400'
                  }`}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block truncate transition-colors ${
                    i === step ? 'text-gold-600' : i < step ? 'text-green-600' : 'text-gray-400'
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

      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2 }}
            >

              {/* ════════ STEP 0: SERVICE ════════ */}
              {step === 0 && (
                <div>
                  <h2 className="font-display text-2xl font-bold text-onyx-900 mb-1">What can we do for you?</h2>
                  <p className="text-onyx-400 text-sm mb-5">Tap a service to continue.</p>

                  {/* Category filter */}
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                          activeCategory === cat
                            ? 'bg-onyx-900 text-white'
                            : 'bg-white border border-gray-200 text-onyx-600 hover:border-onyx-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Service list */}
                  <div className="space-y-3">
                    {visibleServices.map((service) => (
                      <motion.button
                        key={service.id}
                        onClick={() => pickService(service)}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full text-left flex items-center gap-4 bg-white rounded-2xl border-2 overflow-hidden transition-all shadow-sm hover:shadow-md ${
                          selectedService?.id === service.id
                            ? 'border-gold-500 bg-gold-50'
                            : 'border-transparent hover:border-gold-300'
                        }`}
                      >
                        <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-gold-100 to-champagne overflow-hidden">
                          {(service as any).image_url
                            ? <img src={resolveImageUrl((service as any).image_url)} alt={service.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-2xl">✂️</div>
                          }
                        </div>
                        <div className="flex-1 py-4 min-w-0">
                          <p className="font-semibold text-onyx-900 text-sm">{service.name}</p>
                          <p className="text-xs text-onyx-400 mt-0.5">{service.duration_minutes} min</p>
                          {service.description && (
                            <p className="text-xs text-onyx-400 mt-1 line-clamp-1">{service.description}</p>
                          )}
                        </div>
                        <div className="pr-5 flex-shrink-0 text-right">
                          {(() => {
                            const svcPromo = promoForService(service.id);
                            const afterTierPrice = tierDiscountPct > 0
                              ? Number(service.price) * (1 - tierDiscountPct / 100)
                              : Number(service.price);
                            const promoAmt = svcPromo
                              ? svcPromo.discount_type === 'percentage'
                                ? afterTierPrice * (svcPromo.discount_value / 100)
                                : Number(svcPromo.discount_value)
                              : 0;
                            const displayPrice = Math.max(0, afterTierPrice - promoAmt);
                            const hasDiscount = tierDiscountPct > 0 || svcPromo;
                            return (
                              <>
                                {hasDiscount && (
                                  <p className="text-onyx-400 text-xs line-through">NZ${service.price}</p>
                                )}
                                <p className="text-gold-600 font-bold text-base">NZ${displayPrice.toFixed(2)}</p>
                                {tierDiscountPct > 0 && !svcPromo && (
                                  <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                                    {tierDiscountPct}% off
                                  </span>
                                )}
                                {svcPromo && (
                                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold block mt-0.5">
                                    🎁 {svcPromo.discount_type === 'percentage' ? `${svcPromo.discount_value}% off` : `NZ$${svcPromo.discount_value} off`}
                                  </span>
                                )}
                              </>
                            );
                          })()}
                          {selectedService?.id === service.id && (
                            <span className="text-[10px] bg-gold-500 text-white px-2 py-0.5 rounded-full mt-1 inline-block">Selected</span>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* ════════ STEP 1: STYLIST ════════ */}
              {step === 1 && (
                <div>
                  <h2 className="font-display text-2xl font-bold text-onyx-900 mb-1">Choose your stylist</h2>
                  <p className="text-onyx-400 text-sm mb-5">Tap a stylist to continue, or pick any available.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {/* Any available */}
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => pickStaff({ id: 'any', first_name: 'Any', last_name: 'Stylist' })}
                      className={`bg-white rounded-2xl border-2 p-5 text-center transition-all shadow-sm hover:shadow-md ${
                        selectedStaff?.id === 'any' ? 'border-gold-500 bg-gold-50' : 'border-transparent hover:border-gold-300'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-200 to-champagne flex items-center justify-center text-2xl mx-auto mb-3">🎲</div>
                      <p className="font-semibold text-onyx-900 text-sm">Any Available</p>
                      <p className="text-xs text-onyx-400 mt-0.5">Best match</p>
                    </motion.button>

                    {staffList.map((member) => (
                      <motion.button
                        key={member.id}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => pickStaff(member)}
                        className={`bg-white rounded-2xl border-2 p-5 text-center transition-all shadow-sm hover:shadow-md ${
                          selectedStaff?.id === member.id ? 'border-gold-500 bg-gold-50' : 'border-transparent hover:border-gold-300'
                        }`}
                      >
                        <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 bg-gradient-to-br from-gold-100 to-champagne">
                          {member.image_url
                            ? <img src={resolveImageUrl(member.image_url)} alt={member.first_name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-2xl text-gold-400 font-bold">{member.first_name[0]}</div>
                          }
                        </div>
                        <p className="font-semibold text-onyx-900 text-sm">{member.first_name}</p>
                        <p className="text-xs text-gold-600 mt-0.5">{member.role}</p>
                        {member.avg_rating > 0 && (
                          <div className="flex items-center justify-center gap-0.5 mt-1.5">
                            <span className="text-yellow-400 text-xs">★</span>
                            <span className="text-xs text-onyx-500">{Number(member.avg_rating).toFixed(1)}</span>
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* ════════ STEP 2: DATE & TIME ════════ */}
              {step === 2 && (
                <div>
                  <h2 className="font-display text-2xl font-bold text-onyx-900 mb-1">Pick a date & time</h2>
                  <p className="text-onyx-400 text-sm mb-5">Tap a time slot to continue.</p>

                  {/* Date scroller */}
                  <div
                    ref={dateScrollRef}
                    className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide"
                  >
                    {DAYS.map((day) => (
                      <button
                        key={day.iso}
                        data-date={day.iso}
                        onClick={() => pickDate(day.iso)}
                        className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl border-2 min-w-[64px] transition-all ${
                          selectedDate === day.iso
                            ? 'border-gold-500 bg-gold-gradient text-white shadow-gold'
                            : 'border-gray-200 bg-white text-onyx-700 hover:border-gold-300'
                        }`}
                      >
                        <span className={`text-[10px] font-medium uppercase tracking-wide ${selectedDate === day.iso ? 'text-white/80' : 'text-onyx-400'}`}>
                          {day.dayName}
                        </span>
                        <span className="text-xl font-bold leading-tight">{day.dayNum}</span>
                        <span className={`text-[10px] ${selectedDate === day.iso ? 'text-white/70' : 'text-onyx-400'}`}>
                          {day.month}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Time slots */}
                  {!selectedDate && (
                    <div className="text-center py-10 text-onyx-400 text-sm">
                      Select a date above to see available times.
                    </div>
                  )}

                  {selectedDate && slotsLoading && (
                    <div className="flex items-center justify-center py-10 gap-3 text-onyx-400 text-sm">
                      <span className="animate-spin text-xl">⏳</span> Loading slots…
                    </div>
                  )}

                  {selectedDate && !slotsLoading && slots.length === 0 && (
                    <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                      <p className="text-2xl mb-2">😔</p>
                      <p className="font-medium text-onyx-700">No slots available</p>
                      <p className="text-sm text-onyx-400 mt-1">Try selecting a different date.</p>
                    </div>
                  )}

                  {selectedDate && !slotsLoading && slots.length > 0 && (
                    <div>
                      <p className="text-xs text-onyx-400 mb-3 font-medium uppercase tracking-wide">
                        {slots.length} slots available · {slotsRes?.data?.duration ?? selectedService?.duration_minutes} min
                      </p>
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                        {slots.map((slot) => (
                          <motion.button
                            key={slot}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => pickSlot(slot)}
                            className={`py-2.5 px-2 rounded-xl text-sm font-semibold border-2 transition-all text-center ${
                              selectedSlot === slot
                                ? 'bg-gold-gradient text-white border-transparent shadow-gold'
                                : 'border-gray-200 bg-white text-onyx-700 hover:border-gold-400'
                            }`}
                          >
                            {slot}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ════════ STEP 3: CONFIRM ════════ */}
              {step === 3 && (
                <div>
                  <h2 className="font-display text-2xl font-bold text-onyx-900 mb-1">Confirm your booking</h2>
                  <p className="text-onyx-400 text-sm mb-5">Review details and confirm to complete.</p>

                  {/* Summary cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {[
                      { icon: '✂️', label: 'Service', value: selectedService?.name, sub: `NZ$${selectedService?.price} · ${selectedService?.duration_minutes}min`, backStep: 0 },
                      { icon: '👤', label: 'Stylist',  value: selectedStaff?.id === 'any' ? 'Any available' : selectedStaff?.first_name, sub: selectedStaff?.id !== 'any' ? selectedStaff?.role : '', backStep: 1 },
                      { icon: '📅', label: 'Date',     value: selectedDate ? new Date(selectedDate + 'T00:00').toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' }) : '—', sub: '', backStep: 2 },
                      { icon: '🕐', label: 'Time',     value: selectedSlot || '—', sub: '', backStep: 2 },
                    ].map(({ icon, label, value, sub, backStep }) => (
                      <button
                        key={label}
                        onClick={() => setStep(backStep)}
                        className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:border-gold-300 hover:shadow-sm transition-all group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-lg">{icon}</span>
                          <span className="text-[10px] text-gold-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                        </div>
                        <p className="text-[10px] text-onyx-400 uppercase tracking-wide font-medium">{label}</p>
                        <p className="font-semibold text-onyx-900 text-sm mt-0.5 leading-tight">{value}</p>
                        {sub && <p className="text-[10px] text-onyx-400 mt-0.5">{sub}</p>}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Voucher */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <h4 className="font-semibold text-onyx-800 text-sm mb-3">🎟 Gift Voucher / Promo</h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter code"
                          value={voucherCode}
                          onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                          className="input-luxury flex-1 text-sm py-2.5"
                        />
                        <button onClick={validateVoucher} className="btn-gold py-2.5 px-4 text-sm">Apply</button>
                      </div>
                      {voucherData && (
                        <p className="text-green-600 text-xs mt-2">✓ NZ${voucherData.amount} off applied</p>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <h4 className="font-semibold text-onyx-800 text-sm mb-3">📝 Special Requests</h4>
                      <textarea
                        rows={3}
                        placeholder="Any notes for your stylist…"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="input-luxury text-sm resize-none"
                      />
                    </div>
                  </div>

                  {/* Price summary */}
                  <div className="bg-onyx-950 rounded-2xl p-5 mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-xs">Total to pay</p>
                      {(tierDiscountPct > 0 || applicablePromo || voucherData) && (
                        <p className="text-white/40 text-xs line-through">NZ${basePrice.toFixed(2)}</p>
                      )}
                      {tierDiscountPct > 0 && (
                        <p className="text-xs text-gold-400 font-medium mb-0.5">
                          {activeTier?.icon} {activeTier?.label} member — {tierDiscountPct}% off
                        </p>
                      )}
                      {applicablePromo && (
                        <p className="text-xs text-green-400 font-medium mb-0.5">
                          🎁 {applicablePromo.title} — {applicablePromo.discount_type === 'percentage' ? `${applicablePromo.discount_value}% off` : `NZ$${applicablePromo.discount_value} off`}
                        </p>
                      )}
                      {voucherData && (
                        <p className="text-xs text-green-400 font-medium mb-0.5">
                          🎟 Voucher — NZ${voucherData.amount} off
                        </p>
                      )}
                      <p className="text-white font-bold text-2xl font-display">NZ${finalPrice.toFixed(2)}</p>
                    </div>
                    {!isAuthenticated ? (
                      <div className="text-right">
                        <p className="text-white/60 text-xs mb-2">Sign in to complete</p>
                        <Link to="/login?redirect=/book" className="btn-gold text-sm px-5 py-2.5">Sign In</Link>
                      </div>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="btn-gold text-sm px-6 py-3 disabled:opacity-60 flex items-center gap-2"
                      >
                        {isSubmitting
                          ? <><span className="animate-spin">⏳</span> Confirming…</>
                          : <>✓ Confirm Booking</>
                        }
                      </button>
                    )}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Sticky bottom summary bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex-shrink-0 w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-onyx-500 hover:border-gold-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ←
          </button>

          {/* Summary pills */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide min-w-0">
            {summaryLabel().length === 0 ? (
              <span className="text-onyx-400 text-sm">Select a service to begin</span>
            ) : (
              summaryLabel().map((part, i) => (
                <span key={i} className="text-xs bg-onyx-50 text-onyx-700 px-3 py-1.5 rounded-full whitespace-nowrap font-medium flex-shrink-0">
                  {part}
                </span>
              ))
            )}
          </div>

          {/* Step label */}
          <span className="text-xs text-onyx-400 flex-shrink-0">{step + 1}/{STEPS.length}</span>
        </div>
      </div>
    </div>
  );
}
