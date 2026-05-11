import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { reviewApi } from '../services/api';

interface Booking {
  id: string;
  service_name: string;
  staff_name: string;
  start_time: string;
}

interface Props {
  booking: Booking;
  onClose: () => void;
}

export default function ReviewModal({ booking, onClose }: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      reviewApi.create({ booking_id: booking.id, rating, comment: comment.trim() || undefined }),
    onSuccess: () => {
      toast.success('Thank you for your feedback!');
      onClose();
    },
    onError: () => {
      toast.error('Failed to submit review. Please try again.');
    },
  });

  const displayDate = new Date(booking.start_time).toLocaleDateString('en-NZ', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-8">
        <h2 className="text-2xl font-semibold text-[#faf8f4] mb-1">How was your visit?</h2>
        <p className="text-sm text-[#faf8f4]/60 mb-6">
          {booking.service_name} with {booking.staff_name} · {displayDate}
        </p>

        {/* Star rating */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="text-4xl transition-transform hover:scale-110 focus:outline-none"
            >
              <span className={(hovered || rating) >= star ? 'text-[#d4a01e]' : 'text-white/20'}>
                ★
              </span>
            </button>
          ))}
        </div>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Share your experience (optional)"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[#faf8f4] placeholder-white/30 text-sm resize-none focus:outline-none focus:border-[#d4a01e]/50 mb-6"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-[#faf8f4]/60 text-sm hover:bg-white/5 transition-colors"
          >
            Skip
          </button>
          <button
            type="button"
            disabled={rating === 0 || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="flex-1 py-3 rounded-xl bg-[#d4a01e] text-[#1a1a1a] font-semibold text-sm hover:bg-[#c49018] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}
