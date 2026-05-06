import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export default function RegisterPage() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', password: '', confirm: '',
  });
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    try {
      const payload: Record<string, string> = {
        first_name: form.first_name, last_name: form.last_name,
        email: form.email, password: form.password,
      };
      if (form.phone.trim()) payload.phone = form.phone.trim();
      await register(payload);
      toast.success('Account created! Welcome to LuxeSalon');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 w-full max-w-md p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-purple-200">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <h1 className="font-bold text-2xl text-gray-900">Create account</h1>
          <p className="text-gray-500 text-sm mt-1">Join LuxeSalon NZ today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
              <input name="first_name" value={form.first_name} onChange={handleChange}
                className="input" placeholder="Jane" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
              <input name="last_name" value={form.last_name} onChange={handleChange}
                className="input" placeholder="Smith" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              className="input" placeholder="jane@example.com" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
            <input name="phone" type="tel" value={form.phone} onChange={handleChange}
              className="input" placeholder="+64 21 000 0000" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange}
              className="input" placeholder="Min. 8 characters" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
            <input name="confirm" type="password" value={form.confirm} onChange={handleChange}
              className="input" placeholder="Repeat password" required />
          </div>

          <button
            type="submit" disabled={isLoading}
            className="btn-primary w-full py-3 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
