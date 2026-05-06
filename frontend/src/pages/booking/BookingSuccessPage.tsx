import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { bookingApi } from '../../services/api';

export default function BookingSuccessPage() {
  const [params] = useSearchParams();
  const bookingId = params.get('booking_id');

  const { data } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingApi.get(bookingId!),
    enabled: !!bookingId,
  });

  const booking = data?.data;

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-luxury max-w-lg w-full p-10 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-gold-gradient flex items-center justify-center text-white text-3xl mx-auto mb-6 shadow-gold"
        >
          ✓
        </motion.div>
        <h1 className="font-display text-3xl font-bold text-onyx-900 mb-3">Booking Confirmed!</h1>
        <p className="text-onyx-500 mb-6">
          Your appointment has been booked successfully. A confirmation has been sent to your email.
        </p>

        {booking && (
          <div className="bg-gold-50 rounded-xl p-4 mb-6 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-onyx-500">Reference</span>
              <span className="font-bold text-gold-700">#{booking.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-onyx-500">Service</span>
              <span className="font-medium">{booking.service_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-onyx-500">Stylist</span>
              <span className="font-medium">{booking.staff_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-onyx-500">Date & Time</span>
              <span className="font-medium">{new Date(booking.start_time).toLocaleString('en-NZ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-onyx-500">Branch</span>
              <span className="font-medium">{booking.branch_name}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link to="/my/bookings" className="btn-gold w-full py-3">View My Bookings</Link>
          <Link to="/book" className="btn-outline-gold w-full py-3">Book Another Appointment</Link>
          <Link to="/" className="text-onyx-400 text-sm hover:text-onyx-600 transition-colors">Return Home</Link>
        </div>
      </motion.div>
    </div>
  );
}
