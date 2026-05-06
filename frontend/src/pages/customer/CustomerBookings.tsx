import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { bookingApi } from '../../services/api';
import toast from 'react-hot-toast';
import type { Booking } from '../../types';

export default function CustomerBookings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['my-bookings-all'], queryFn: () => bookingApi.list({ limit: 50 }) });
  const bookings: Booking[] = data?.data?.bookings || [];

  const cancel = useMutation({
    mutationFn: (id: string) => bookingApi.updateStatus(id, 'cancelled'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-bookings-all'] }); toast.success('Booking cancelled'); },
    onError: () => toast.error('Could not cancel booking'),
  });

  const upcoming = bookings.filter(b => ['pending','confirmed'].includes(b.status));
  const past = bookings.filter(b => ['completed','cancelled','no_show'].includes(b.status));

  const BookingCard = ({ booking, showCancel = false }: { booking: Booking; showCancel?: boolean }) => (
    <div className="card-luxury p-5 flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-onyx-900">{booking.service_name}</h3>
            <p className="text-sm text-onyx-500 mt-0.5">with {booking.staff_name} · {booking.branch_name}</p>
          </div>
          <span className={`badge-${booking.status} flex-shrink-0`}>{booking.status.replace('_',' ')}</span>
        </div>
        <div className="flex gap-4 mt-3 text-sm text-onyx-600">
          <span>📅 {new Date(booking.start_time).toLocaleDateString('en-NZ', { weekday:'short', day:'numeric', month:'short' })}</span>
          <span>⏰ {new Date(booking.start_time).toLocaleTimeString('en-NZ',{hour:'2-digit',minute:'2-digit'})}</span>
          <span className="font-semibold text-gold-600">NZ${Number(booking.price).toFixed(2)}</span>
        </div>
        {booking.reference && <p className="text-xs text-onyx-300 mt-1 font-mono">Ref: #{booking.reference}</p>}
      </div>
      <div className="flex sm:flex-col gap-2 justify-end">
        {showCancel && booking.status !== 'cancelled' && (
          <button onClick={() => { if (confirm('Cancel this booking?')) cancel.mutate(booking.id); }}
            className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
            Cancel
          </button>
        )}
        {booking.status === 'completed' && (
          <Link to={`/book?staff_id=${booking.employee_id}&service_id=${booking.service_id}`}
            className="text-xs border border-gold-300 text-gold-600 px-3 py-1.5 rounded-lg hover:bg-gold-50 transition-colors">
            Rebook
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ivory pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/my" className="text-gold-600 text-sm hover:text-gold-700">← Dashboard</Link>
            <h1 className="font-display text-3xl font-bold text-onyx-900 mt-2">My Bookings</h1>
          </div>
          <Link to="/book" className="btn-gold text-sm">+ New Booking</Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">{[...Array(4)].map((_,i)=><div key={i} className="h-28 skeleton rounded-2xl"/>)}</div>
        ) : (
          <div className="space-y-8">
            {upcoming.length > 0 && (
              <div>
                <h2 className="font-semibold text-onyx-700 text-sm uppercase tracking-wide mb-3">Upcoming ({upcoming.length})</h2>
                <div className="space-y-3">{upcoming.map(b=><BookingCard key={b.id} booking={b} showCancel />)}</div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 className="font-semibold text-onyx-700 text-sm uppercase tracking-wide mb-3">Past Bookings ({past.length})</h2>
                <div className="space-y-3">{past.map(b=><BookingCard key={b.id} booking={b} />)}</div>
              </div>
            )}
            {bookings.length === 0 && (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">✂️</div>
                <h3 className="font-display text-xl font-bold text-onyx-700 mb-2">No bookings yet</h3>
                <p className="text-onyx-400 mb-6">Book your first LuxeSalon appointment today!</p>
                <Link to="/book" className="btn-gold">Book Now</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
