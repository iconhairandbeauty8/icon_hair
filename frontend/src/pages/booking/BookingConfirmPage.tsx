import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { paymentApi } from '../../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripeKey && !stripeKey.includes('placeholder')
  ? loadStripe(stripeKey)
  : null;

function StripeCheckout({ booking }: { booking: any }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/book/success?booking_id=${booking.id}` },
      });
      if (error) toast.error(error.message || 'Payment failed');
    } catch {
      toast.error('Payment error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={loading || !stripe}
        className="btn-gold w-full py-4 text-base disabled:opacity-60"
      >
        {loading ? 'Processing...' : `Pay NZ$${Number(booking.price).toFixed(2)}`}
      </button>
    </form>
  );
}

export function BookingConfirmPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { booking, service, staff } = location.state || {};
  const [clientSecret, setClientSecret] = useState('');
  const [stripeReady, setStripeReady] = useState(false);
  const [payMode, setPayMode] = useState<'venue' | 'online'>('venue');

  useEffect(() => {
    if (!booking) { navigate('/book'); return; }
    if (!stripePromise) return;
    paymentApi.createIntent({ booking_id: booking.id })
      .then((res) => { setClientSecret(res.data.client_secret); setStripeReady(true); })
      .catch(() => { /* Stripe not configured — Pay at Venue is default */ });
  }, [booking]);

  if (!booking) return null;

  const handlePayAtVenue = () => {
    navigate(`/book/success?booking_id=${booking.id}`);
  };

  return (
    <div className="min-h-screen bg-ivory pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/book" className="text-gold-600 text-sm hover:text-gold-700 mb-6 inline-block">← Back</Link>
        <h1 className="font-display text-3xl font-bold text-onyx-900 mb-8">Confirm Your Booking</h1>

        {/* Summary */}
        <div className="card-luxury p-6 mb-6">
          <h2 className="font-semibold text-onyx-700 text-sm uppercase tracking-wide mb-4">Booking Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-onyx-500">Service</span><span className="font-medium">{service?.name}</span></div>
            <div className="flex justify-between"><span className="text-onyx-500">Stylist</span><span className="font-medium">{staff?.id === 'any' ? 'Assigned on arrival' : `${staff?.first_name} ${staff?.last_name}`}</span></div>
            <div className="flex justify-between"><span className="text-onyx-500">Date & Time</span><span className="font-medium">{new Date(booking.start_time).toLocaleString('en-NZ')}</span></div>
            <div className="border-t border-gray-100 pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-gold-600 text-lg">NZ${Number(booking.price).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment options — only show tabs if Stripe is available */}
        {stripeReady && (
          <div className="flex gap-3 mb-6">
            {(['venue', 'online'] as const).map((mode) => (
              <button key={mode} onClick={() => setPayMode(mode)}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  payMode === mode ? 'border-gold-500 bg-gold-50 text-gold-700' : 'border-gray-200 text-onyx-600 hover:border-gold-300'
                }`}>
                {mode === 'venue' ? '🏪 Pay at Venue' : '💳 Pay Online'}
              </button>
            ))}
          </div>
        )}

        <div className="card-luxury p-6">
          {(!stripeReady || payMode === 'venue') ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gold-100 flex items-center justify-center text-3xl mx-auto">🏪</div>
              <div>
                <h3 className="font-display text-lg font-semibold text-onyx-900 mb-1">Pay at Venue</h3>
                <p className="text-sm text-onyx-500">Your booking is confirmed. Payment will be collected when you arrive at the salon.</p>
              </div>
              <button onClick={handlePayAtVenue} className="btn-gold w-full py-4 text-base">
                ✓ Confirm Booking
              </button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-semibold text-onyx-700 text-sm uppercase tracking-wide mb-4">Card Payment</h2>
              {clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                  <StripeCheckout booking={booking} />
                </Elements>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmPage;
