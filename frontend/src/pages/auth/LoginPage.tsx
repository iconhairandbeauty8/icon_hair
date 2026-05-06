// LoginPage.tsx
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back!');
      const user = useAuthStore.getState().user;
      if (user?.role_name === 'admin' || user?.role_name === 'manager' || user?.role_name === 'staff') {
        navigate('/admin');
      } else {
        navigate(redirect);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920')] bg-cover bg-center opacity-10" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative card-luxury max-w-md w-full p-8"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-gold-gradient flex items-center justify-center mx-auto mb-4 shadow-gold">
            <span className="text-white font-display font-bold text-xl">L</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-onyx-900">Welcome Back</h1>
          <p className="text-onyx-400 text-sm mt-1">Sign in to your LuxeSalon account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-onyx-700 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="input-luxury" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-onyx-700 mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="input-luxury" placeholder="••••••••" required />
          </div>
          <div className="flex justify-end">
            <a href="#" className="text-xs text-gold-600 hover:text-gold-700">Forgot password?</a>
          </div>
          <button type="submit" disabled={isLoading} className="btn-gold w-full py-3.5 text-base disabled:opacity-60">
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-onyx-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-gold-600 hover:text-gold-700 font-medium">Create one</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;
