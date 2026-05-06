import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export default function RegisterPage() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', confirm: '' });
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    try {
      const payload: Record<string, string> = { first_name: form.first_name, last_name: form.last_name, email: form.email, password: form.password };
      if (form.phone.trim()) payload.phone = form.phone.trim();
      await register(payload);
      toast.success('Account created! Welcome to LuxeSalon 🎉');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-luxury max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-gold-gradient flex items-center justify-center mx-auto mb-4 shadow-gold">
            <span className="text-white font-display font-bold text-xl">L</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-onyx-900">Create Account</h1>
          <p className="text-onyx-400 text-sm mt-1">Join LuxeSalon NZ today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-onyx-700 mb-1.5">First Name</label>
              <input name="first_name" value={form.first_name} onChange={handleChange}
                className="input-luxury" placeholder="Jane" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-onyx-700 mb-1.5">Last Name</label>
              <input name="last_name" value={form.last_name} onChange={handleChange}
                className="input-luxury" placeholder="Smith" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-onyx-700 mb-1.5">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              className="input-luxury" placeholder="jane@example.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-onyx-700 mb-1.5">Phone (NZ)</label>
            <input name="phone" type="tel" value={form.phone} onChange={handleChange}
              className="input-luxury" placeholder="+64 21 000 0000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-onyx-700 mb-1.5">Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange}
              className="input-luxury" placeholder="Min. 8 characters" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-onyx-700 mb-1.5">Confirm Password</label>
            <input name="confirm" type="password" value={form.confirm} onChange={handleChange}
              className="input-luxury" placeholder="Repeat password" required />
          </div>
          <button type="submit" disabled={isLoading} className="btn-gold w-full py-3.5 text-base disabled:opacity-60">
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-onyx-500">
            Already have an account?{' '}
            <Link to="/login" className="text-gold-600 hover:text-gold-700 font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
