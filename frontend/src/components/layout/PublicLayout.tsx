import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';

const navLinks = [
  { label: 'Services', to: '/services' },
  { label: 'Our Team', to: '/team' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Offers', to: '/feed' },
  { label: 'Contact', to: '/contact' },
];

const footerServices = ['Hair Styling', 'Colour & Highlights', 'Skincare', 'Nails', 'Beauty', 'Wellness'];
const footerCompany = [
  { label: 'Our Team', to: '/team' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Book Online', to: '/book' },
  { label: 'Gift Vouchers', to: '/book' },
  { label: 'Contact Us', to: '/contact' },
];

/** Links shown in the dropdown / mobile menu per role */
function userMenuLinks(role?: string) {
  if (role === 'staff') return [
    { icon: '🗓', label: 'Staff Portal', to: '/staff-portal' },
  ];
  if (role === 'admin' || role === 'manager') return [
    { icon: '⚙️', label: 'Admin Dashboard', to: '/admin' },
  ];
  // 'customer' or unknown/missing role → show customer links
  return [
    { icon: '👤', label: 'My Profile',  to: '/my' },
    { icon: '📅', label: 'My Bookings', to: '/my/bookings' },
  ];
}

export default function PublicLayout() {
  const [scrolled,      setScrolled]      = useState(false);
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const location  = useLocation();
  const navigate  = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Navbar shadow on scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close menus on navigation
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const menuLinks = userMenuLinks(user?.role_name);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── Navbar ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 transition-shadow duration-300 ${scrolled ? 'shadow-sm' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-bold text-gray-900 text-base tracking-tight">LuxeSalon</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to}
                className={`text-sm font-medium transition-colors duration-150 ${
                  location.pathname === link.to ? 'text-purple-600' : 'text-gray-500 hover:text-gray-900'
                }`}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">

            {isAuthenticated ? (
              /* ── User dropdown ── */
              <div className="relative hidden sm:block" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs flex-shrink-0">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </div>
                  <span className="hidden md:block font-medium leading-none">{user?.first_name}</span>
                  {/* Chevron */}
                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown panel */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0,  scale: 1    }}
                      exit={{   opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.13, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                    >
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-gray-50">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">
                            {user?.first_name?.[0]}{user?.last_name?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
                              {user?.first_name} {user?.last_name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Role-specific links */}
                      <div className="py-1">
                        {menuLinks.map(l => (
                          <Link key={l.to} to={l.to}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <span className="text-base w-5 text-center">{l.icon}</span>
                            {l.label}
                          </Link>
                        ))}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <span className="text-base w-5 text-center">🚪</span>
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Sign In
              </Link>
            )}

            <Link to="/book" className="btn-primary text-sm px-4 py-2 rounded-lg">
              Book Now
            </Link>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <div className={`w-5 h-0.5 bg-current transition-all duration-200 ${mobileOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <div className={`w-5 h-0.5 bg-current my-1 transition-all duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
              <div className={`w-5 h-0.5 bg-current transition-all duration-200 ${mobileOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden border-t border-gray-100 bg-white overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                {navLinks.map((link) => (
                  <Link key={link.to} to={link.to}
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === link.to
                        ? 'text-purple-600 bg-purple-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}>
                    {link.label}
                  </Link>
                ))}

                {isAuthenticated ? (
                  <>
                    {/* Divider + user info */}
                    <div className="pt-2 mt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2.5 px-3 py-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs flex-shrink-0">
                          {user?.first_name?.[0]}{user?.last_name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{user?.first_name} {user?.last_name}</p>
                          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>
                      </div>
                      {menuLinks.map(l => (
                        <Link key={l.to} to={l.to}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <span>{l.icon}</span>{l.label}
                        </Link>
                      ))}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <span>🚪</span> Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <Link to="/login"
                    className="flex items-center px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    Sign In
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer for fixed navbar */}
      <div className="h-16 shrink-0" />

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden">
        <Link to="/book" className="btn-primary w-full justify-center rounded-xl py-3.5 shadow-lg shadow-purple-200">
          Book Appointment
        </Link>
      </div>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100 pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link to="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <span className="font-bold text-gray-900">LuxeSalon</span>
              </Link>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                New Zealand's premier multi-branch salon network. Expert stylists, luxury services.
              </p>
              <div className="flex gap-2.5 mt-5">
                {['In', 'Fb', 'Tk'].map((s) => (
                  <a key={s} href="#"
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-500 hover:border-purple-300 hover:text-purple-600 transition-colors">
                    {s}
                  </a>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <p className="section-label mb-4">Services</p>
              <ul className="space-y-2.5">
                {footerServices.map((s) => (
                  <li key={s}>
                    <Link to="/services" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">{s}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="section-label mb-4">Company</p>
              <ul className="space-y-2.5">
                {footerCompany.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="section-label mb-4">Contact</p>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li>Auckland, New Zealand</li>
                <li><a href="tel:+6491234567" className="hover:text-gray-900 transition-colors">+64 9 123 4567</a></li>
                <li><a href="mailto:hello@luxesalon.nz" className="hover:text-gray-900 transition-colors">hello@luxesalon.nz</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-gray-400 text-xs">© 2024 LuxeSalon NZ. All rights reserved.</p>
            <div className="flex gap-5 text-xs text-gray-400">
              <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-gray-600 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
