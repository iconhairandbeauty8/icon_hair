import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const navItems = [
  { icon: '📊', label: 'Dashboard', to: '/admin' },
  { icon: '📅', label: 'Bookings', to: '/admin/bookings' },
  { icon: '👥', label: 'Staff', to: '/admin/staff' },
  { icon: '✂️', label: 'Services', to: '/admin/services' },
  { icon: '🏢', label: 'Branches', to: '/admin/branches' },
  { icon: '📦', label: 'Inventory', to: '/admin/inventory' },
  { icon: '📈', label: 'Reports', to: '/admin/reports' },
  { icon: '🎁', label: 'Promotions', to: '/admin/promotions' },
  { icon: '👤', label: 'Customers', to: '/admin/customers' },
  { icon: '📱', label: 'Social Feed', to: '/admin/social' },
  { icon: '⭐', label: 'Loyalty', to: '/admin/loyalty' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setMobileOpen(false), [location]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
  };

  // Labels visible when desktop sidebar is expanded OR mobile drawer is open
  const showLabels = mobileOpen || sidebarOpen;

  const SidebarNav = () => (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-gold-gradient flex-shrink-0 flex items-center justify-center">
          <span className="text-white font-bold text-sm">L</span>
        </div>
        {showLabels && (
          <div className="overflow-hidden flex-1">
            <div className="font-display text-white font-bold text-sm">LuxeSalon</div>
            <div className="text-gold-400 text-[10px] font-accent italic">Admin Portal</div>
          </div>
        )}
        {/* Close on mobile */}
        <button onClick={() => setMobileOpen(false)} className="lg:hidden text-white/40 hover:text-white ml-auto">✕</button>
        {/* Collapse on desktop */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block text-white/40 hover:text-white ml-auto">
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to !== '/admin' && location.pathname.startsWith(item.to));
          return (
            <Link key={item.to} to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gold-gradient text-white shadow-gold'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
              title={!showLabels ? item.label : undefined}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {showLabels && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/10 flex-shrink-0">
        <div className={`flex items-center gap-3 px-3 py-2 rounded-xl ${showLabels ? 'bg-white/5' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-gold-gradient flex-shrink-0 flex items-center justify-center text-white font-semibold text-xs">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          {showLabels && (
            <div className="flex-1 overflow-hidden">
              <div className="text-white text-sm font-medium truncate">{user?.first_name} {user?.last_name}</div>
              <div className="text-gold-400 text-xs capitalize">{user?.role_name}</div>
            </div>
          )}
        </div>
        <div className="mt-2 space-y-1">
          <Link to="/" className={`sidebar-link text-xs ${!showLabels ? 'justify-center' : ''}`}>
            <span>🌐</span>{showLabels && <span>View Website</span>}
          </Link>
          <button onClick={handleLogout} className={`w-full sidebar-link text-xs text-red-400 hover:text-red-400 hover:bg-red-50/10 ${!showLabels ? 'justify-center' : ''}`}>
            <span>🚪</span>{showLabels && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-onyx-950 flex flex-col transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarNav />
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col flex-shrink-0 bg-onyx-950 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <SidebarNav />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-1.5 rounded-lg text-onyx-600 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <div className="w-5 h-0.5 bg-current mb-1.5" />
              <div className="w-5 h-0.5 bg-current mb-1.5" />
              <div className="w-5 h-0.5 bg-current" />
            </button>
            <h1 className="font-display text-base lg:text-xl text-onyx-900 font-semibold truncate">
              {navItems.find(n => n.to === location.pathname || (n.to !== '/admin' && location.pathname.startsWith(n.to)))?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            <Link to="/book" target="_blank"
              className="hidden sm:block text-xs bg-gold-gradient text-white px-3 py-1.5 rounded-lg hover:shadow-gold transition-shadow whitespace-nowrap">
              + New Booking
            </Link>
            <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.first_name?.[0]}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
