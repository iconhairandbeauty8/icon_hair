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

  const showLabels = mobileOpen || sidebarOpen;

  const SidebarNav = () => (
    <>
      {/* Logo */}
      <div className="h-14 px-4 border-b border-gray-100 flex items-center gap-2.5 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-purple-600 flex-shrink-0 flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-sm">L</span>
        </div>
        {showLabels && (
          <div className="overflow-hidden flex-1">
            <div className="font-bold text-gray-900 text-base tracking-tight leading-tight">LuxeSalon</div>
            <div className="text-purple-600 text-[10px] tracking-wider uppercase font-semibold">Admin Portal</div>
          </div>
        )}
        {/* Close on mobile */}
        <button onClick={() => setMobileOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600 ml-auto transition-colors">✕</button>
        {/* Collapse on desktop */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block text-gray-400 hover:text-gray-600 ml-auto transition-colors text-xs">
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to !== '/admin' && location.pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'text-purple-600 bg-purple-50'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
              title={!showLabels ? item.label : undefined}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {showLabels && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-2 border-t border-gray-100 flex-shrink-0">
        <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${showLabels ? 'bg-gray-50' : ''}`}>
          <div className="w-7 h-7 rounded-full bg-purple-100 flex-shrink-0 flex items-center justify-center text-purple-700 font-semibold text-xs">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          {showLabels && (
            <div className="flex-1 overflow-hidden">
              <div className="text-gray-900 text-sm font-medium truncate">{user?.first_name} {user?.last_name}</div>
              <div className="text-purple-600 text-[10px] tracking-widest uppercase font-semibold">{user?.role_name}</div>
            </div>
          )}
        </div>
        <div className="mt-1 space-y-0.5">
          <Link
            to="/"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors ${!showLabels ? 'justify-center' : ''}`}
          >
            <span>🌐</span>{showLabels && <span>View Website</span>}
          </Link>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors ${!showLabels ? 'justify-center' : ''}`}
          >
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
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarNav />
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col flex-shrink-0 bg-white border-r border-gray-100 transition-all duration-300 ${sidebarOpen ? 'w-56' : 'w-14'}`}>
        <SidebarNav />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 h-14 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-1.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <div className="w-5 h-0.5 bg-current mb-1.5" />
              <div className="w-5 h-0.5 bg-current mb-1.5" />
              <div className="w-5 h-0.5 bg-current" />
            </button>
            <h1 className="font-display text-lg text-gray-900 font-semibold truncate">
              {navItems.find(n => n.to === location.pathname || (n.to !== '/admin' && location.pathname.startsWith(n.to)))?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            <Link
              to="/book"
              target="_blank"
              className="hidden sm:block text-sm bg-purple-600 text-white px-4 py-1.5 rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap font-medium"
            >
              + New Booking
            </Link>
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold flex-shrink-0">
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
