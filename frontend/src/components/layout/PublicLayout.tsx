import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';

const navLinks = [
  { label: 'Services', to: '/services' },
  { label: 'Our Team', to: '/team' },
  { label: 'Branches', to: '/branches' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Offers', to: '/feed' },
  { label: 'Contact', to: '/contact' },
];

export default function PublicLayout() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-onyx-950/95 backdrop-blur-md shadow-luxury py-3' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center shadow-gold">
              <span className="text-white font-display font-bold text-lg">L</span>
            </div>
            <div>
              <div className="font-display font-bold text-xl text-white leading-none">LuxeSalon</div>
              <div className="text-gold-400 text-xs font-accent italic tracking-widest">New Zealand</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium tracking-wide transition-colors duration-200 hover:text-gold-400 ${
                  location.pathname === link.to ? 'text-gold-400' : 'text-white/80'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={user?.role_name === 'customer' ? '/my' : '/admin'}
                className="hidden sm:flex items-center gap-2 text-sm text-white/80 hover:text-gold-400 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-white font-semibold text-xs">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <span>{user?.first_name}</span>
              </Link>
            ) : (
              <Link to="/login" className="hidden sm:block text-sm text-white/80 hover:text-gold-400 transition-colors">
                Sign In
              </Link>
            )}
            <Link to="/book" className="btn-gold text-sm px-5 py-2.5">
              Book Now
            </Link>
            {/* Mobile menu toggle */}
            <button
              className="lg:hidden text-white p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <div className={`w-6 h-0.5 bg-current transition-all mb-1.5 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <div className={`w-6 h-0.5 bg-current transition-all mb-1.5 ${mobileOpen ? 'opacity-0' : ''}`} />
              <div className={`w-6 h-0.5 bg-current transition-all ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-onyx-950/98 backdrop-blur-md border-t border-white/10"
            >
              <div className="px-4 py-4 flex flex-col gap-3">
                {navLinks.map((link) => (
                  <Link key={link.to} to={link.to}
                    className="text-white/80 hover:text-gold-400 py-2 text-sm font-medium transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                {!isAuthenticated && (
                  <Link to="/login" className="text-white/80 hover:text-gold-400 py-2 text-sm">Sign In</Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Sticky book now on mobile */}
      <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden">
        <Link to="/book" className="btn-gold w-full text-center block py-4 text-base rounded-2xl shadow-luxury">
          ✨ Book Appointment
        </Link>
      </div>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-onyx-950 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center">
                  <span className="text-white font-display font-bold text-lg">L</span>
                </div>
                <div>
                  <div className="font-display font-bold text-xl">LuxeSalon NZ</div>
                  <div className="text-gold-400 text-xs font-accent italic">Premium Salon Experience</div>
                </div>
              </div>
              <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                New Zealand's premier multi-branch salon network. Expert stylists, luxury services, and an unforgettable experience.
              </p>
              <div className="flex gap-3 mt-4">
                {['Instagram', 'Facebook', 'TikTok'].map((s) => (
                  <a key={s} href="#" className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-xs text-white/60 hover:border-gold-500 hover:text-gold-400 transition-colors">
                    {s[0]}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gold-400 mb-4 text-sm tracking-wider uppercase">Services</h4>
              <ul className="space-y-2 text-sm text-white/60">
                {['Hair Styling', 'Colour & Highlights', 'Skincare', 'Nails', 'Beauty', 'Wellness'].map((s) => (
                  <li key={s}><Link to="/services" className="hover:text-gold-400 transition-colors">{s}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gold-400 mb-4 text-sm tracking-wider uppercase">Company</h4>
              <ul className="space-y-2 text-sm text-white/60">
                {[
                  { label: 'Our Branches', to: '/branches' },
                  { label: 'Our Team', to: '/team' },
                  { label: 'Gallery', to: '/gallery' },
                  { label: 'Book Online', to: '/book' },
                  { label: 'Gift Vouchers', to: '/book' },
                  { label: 'Contact Us', to: '/contact' },
                ].map((l) => (
                  <li key={l.label}><Link to={l.to} className="hover:text-gold-400 transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm">© 2024 LuxeSalon NZ. All rights reserved.</p>
            <div className="flex gap-4 text-sm text-white/40">
              <a href="#" className="hover:text-gold-400">Privacy Policy</a>
              <a href="#" className="hover:text-gold-400">Terms of Service</a>
              <a href="#" className="hover:text-gold-400">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
