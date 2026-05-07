import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { serviceApi, staffApi, bookingApi, voucherApi, resolveImageUrl } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { Service, Employee } from '../../types';

const STEPS = ['Service', 'Stylist', 'Date & Time', 'Confirm'];

export default function BookingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherData, setVoucherData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const { data: servicesRes } = useQuery({
    queryKey: ['services'],
    queryFn: () => serviceApi.list(),
    enabled: step === 0,
  });
  const { data: staffRes } = useQuery({
    queryKey: ['staff', selectedService?.id],
    queryFn: () => staffApi.list(),
    enabled: step === 1,
  });
  const { data: slotsRes } = useQuery({
    queryKey: ['slots', selectedStaff?.id, selectedService?.id, selectedDate],
    queryFn: () => bookingApi.availability({
      employee_id: selectedStaff?.id,
      service_id: selectedService?.id,
      date: selectedDate,
    }),
    enabled: step === 2 && !!selectedService && !!selectedDate,
  });

  const services: Service[] = Array.isArray(servicesRes?.data) ? servicesRes.data : [];
  const staffList: Employee[] = Array.isArray(staffRes?.data) ? staffRes.data : [];
  const slots: string[] = Array.isArray(slotsRes?.data?.slots) ? slotsRes.data.slots : [];

  const servicesByCategory = services.reduce((acc: Record<string, Service[]>, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  const finalPrice = voucherData
    ? Math.max(0, Number(selectedService?.price || 0) - voucherData.amount)
    : Number(selectedService?.price || 0);

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
      const startTime = `${selectedDate}T${selectedSlot}:00`;
      const res = await bookingApi.create({
        service_id: selectedService.id,
        employee_id: selectedStaff.id === 'any' ? null : selectedStaff.id,
        start_time: startTime,
        notes,
        voucher_code: voucherCode || undefined,
      });
      navigate(`/book/success?booking_id=${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Booking failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canNext = () => {
    if (step === 0) return !!selectedService;
    if (step === 1) return !!selectedStaff;
    if (step === 2) return !!selectedDate && !!selectedSlot;
    return true;
  };

  return (
    <div className="min-h-screen bg-ivory pt-20">
      {/* Top bar */}
      <div className="bg-onyx-950 text-white py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-display font-bold">LuxeSalon</span>
          </Link>
          <span className="text-white/60 text-sm">Book Appointment</span>
        </div>
      </div>

      {/* Step progress */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-0.5 sm:gap-1 flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => i < step && setStep(i)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                      i < step ? 'step-complete cursor-pointer'
                      : i === step ? 'step-active'
                      : 'step-inactive cursor-not-allowed'
                    }`}
                  >
                    {i < step ? '✓' : i + 1}
                  </button>
                  <span className={`text-[10px] sm:text-xs hidden sm:block ${i === step ? 'text-gold-600 font-medium' : 'text-onyx-400'}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 sm:mx-2 mb-0 sm:mb-4 rounded-full transition-colors ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >

            {/* ── STEP 0: SERVICE ── */}
            {step === 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold text-onyx-900 mb-2">Select a Service</h2>
                <p className="text-onyx-400 mb-6">Choose from our premium treatments.</p>
                {Object.entries(servicesByCategory).map(([category, catServices]) => (
                  <div key={category} className="mb-6">
                    <h3 className="font-semibold text-gold-600 text-sm uppercase tracking-wide mb-3">{category}</h3>
                    <div className="space-y-2">
                      {catServices.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => setSelectedService(service)}
                          className={`w-full card-luxury text-left flex items-center gap-4 overflow-hidden ${
                            selectedService?.id === service.id
                              ? 'border-2 border-gold-500 bg-gold-50'
                              : ''
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-gold-100 to-champagne overflow-hidden">
                            {(service as any).image_url
                              ? <img src={resolveImageUrl((service as any).image_url)} alt={service.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-2xl text-gold-300">✂️</div>
                            }
                          </div>
                          <div className="flex-1 py-3 min-w-0">
                            <div className="font-medium text-onyx-900">{service.name}</div>
                            <div className="text-sm text-onyx-400 mt-0.5">{service.duration_minutes} min</div>
                            {service.description && (
                              <div className="text-xs text-onyx-400 mt-1 line-clamp-1">{service.description}</div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 pr-4">
                            <div className="text-gold-600 font-bold text-lg">NZ${service.price}</div>
                            {selectedService?.id === service.id && (
                              <div className="text-gold-600 text-xs mt-1">✓ Selected</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── STEP 1: STAFF ── */}
            {step === 1 && (
              <div>
                <h2 className="font-display text-2xl font-bold text-onyx-900 mb-2">Choose Your Stylist</h2>
                <p className="text-onyx-400 mb-6">Select your preferred stylist, or skip for any available.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                  {/* "Any stylist" option */}
                  <button
                    onClick={() => setSelectedStaff({ id: 'any', first_name: 'Any', last_name: 'Stylist' } as any)}
                    className={`card-luxury p-4 text-center ${
                      selectedStaff?.id === 'any' ? 'border-2 border-gold-500 bg-gold-50' : ''
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-200 to-champagne flex items-center justify-center text-2xl mx-auto mb-3">
                      🎲
                    </div>
                    <div className="font-medium text-onyx-900 text-sm">Any Available</div>
                    <div className="text-xs text-onyx-400">Best match</div>
                  </button>
                  {staffList.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedStaff(member)}
                      className={`card-luxury p-4 text-center group ${
                        selectedStaff?.id === member.id ? 'border-2 border-gold-500 bg-gold-50' : ''
                      }`}
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 bg-gradient-to-br from-gold-100 to-champagne">
                        {member.image_url ? (
                          <img src={resolveImageUrl(member.image_url)} alt={member.first_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl text-gold-400">
                            {member.first_name[0]}
                          </div>
                        )}
                      </div>
                      <div className="font-medium text-onyx-900 text-sm">{member.first_name}</div>
                      <div className="text-xs text-gold-600">{member.role}</div>
                      {member.avg_rating > 0 && (
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="star-filled text-xs">★</span>
                          <span className="text-xs text-onyx-500">{Number(member.avg_rating).toFixed(1)}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 2: DATE & TIME ── */}
            {step === 2 && (
              <div>
                <h2 className="font-display text-2xl font-bold text-onyx-900 mb-2">Pick Date & Time</h2>
                <p className="text-onyx-400 mb-6">Select your preferred appointment time.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-onyx-700 mb-2">Select Date</label>
                    <input
                      type="date"
                      min={today}
                      value={selectedDate}
                      onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(''); }}
                      className="input-luxury"
                    />
                  </div>
                  {selectedDate && (
                    <div>
                      <label className="block text-sm font-medium text-onyx-700 mb-2">
                        Available Times {slotsRes?.data?.duration ? `(${slotsRes.data.duration} min service)` : ''}
                      </label>
                      {slots.length === 0 ? (
                        <div className="text-onyx-400 text-sm py-4">No slots available for this date. Try another day.</div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                          {slots.map((slot) => (
                            <button
                              key={slot}
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-2 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                                selectedSlot === slot
                                  ? 'bg-gold-gradient text-white border-transparent shadow-gold'
                                  : 'border-gray-200 text-onyx-700 hover:border-gold-400'
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 3: CONFIRM ── */}
            {step === 3 && (
              <div>
                <h2 className="font-display text-2xl font-bold text-onyx-900 mb-2">Confirm Your Booking</h2>
                <p className="text-onyx-400 mb-6">Review your appointment details and confirm to complete your booking.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card-luxury p-6">
                    <h3 className="font-semibold text-onyx-700 text-sm uppercase tracking-wide mb-4">Appointment Summary</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Service', value: selectedService?.name },
                        { label: 'Duration', value: `${selectedService?.duration_minutes} minutes` },
                        { label: 'Stylist', value: selectedStaff?.id === 'any' ? 'Any available' : `${selectedStaff?.first_name} ${selectedStaff?.last_name}` },
                        { label: 'Date', value: selectedDate },
                        { label: 'Time', value: selectedSlot },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between text-sm">
                          <span className="text-onyx-500">{label}</span>
                          <span className="font-medium text-onyx-900">{value}</span>
                        </div>
                      ))}
                      <div className="border-t border-gray-100 pt-3">
                        <div className="flex justify-between">
                          <span className="text-onyx-500 text-sm">Service Price</span>
                          <span className="font-medium">NZ${selectedService?.price}</span>
                        </div>
                        {voucherData && (
                          <div className="flex justify-between text-green-600 text-sm mt-1">
                            <span>Voucher Discount</span>
                            <span>-NZ${voucherData.amount}</span>
                          </div>
                        )}
                        <div className="flex justify-between mt-2">
                          <span className="font-bold text-onyx-900">Total</span>
                          <span className="font-bold text-gold-600 text-xl">NZ${finalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Voucher */}
                    <div className="card-luxury p-5">
                      <h4 className="font-medium text-onyx-700 text-sm mb-3">🎟 Gift Voucher / Promo Code</h4>
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
                        <div className="text-green-600 text-xs mt-2">✓ Voucher applied – NZ${voucherData.amount} off</div>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="card-luxury p-5">
                      <h4 className="font-medium text-onyx-700 text-sm mb-3">📝 Special Requests</h4>
                      <textarea
                        rows={3}
                        placeholder="Any notes for your stylist..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="input-luxury text-sm"
                      />
                    </div>

                    {!isAuthenticated && (
                      <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 text-sm text-gold-800">
                        ⚠️ You need to <Link to="/login" className="font-semibold underline">sign in</Link> or{' '}
                        <Link to="/register" className="font-semibold underline">create an account</Link> to complete your booking.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100 fixed sm:relative bottom-0 left-0 right-0 sm:bottom-auto bg-white sm:bg-transparent px-4 sm:px-0 py-3 sm:py-0 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] sm:shadow-none z-10">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-6 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-onyx-600 hover:border-gold-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => canNext() && setStep((s) => s + 1)}
              disabled={!canNext()}
              className="btn-gold px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !isAuthenticated}
              className="btn-gold px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Confirming...' : '✓ Confirm Booking'}
            </button>
          )}
        </div>

        {/* Mini summary bar */}
        {selectedService && step < 3 && (
          <div className="mt-4 bg-onyx-50 rounded-xl px-4 py-3 flex flex-wrap gap-3 text-xs text-onyx-600">
            {selectedService && <span>✂️ {selectedService.name} · NZ${selectedService.price}</span>}
            {selectedStaff && selectedStaff.id !== 'any' && <span>👤 {selectedStaff.first_name}</span>}
            {selectedDate && <span>📅 {selectedDate} {selectedSlot && `@ ${selectedSlot}`}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
