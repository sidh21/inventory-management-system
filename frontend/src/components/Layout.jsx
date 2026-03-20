import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, useTheme } from '../context/AppContext';
import {
  LayoutDashboard, Package, Users, Tag, ArrowLeftRight,
  ShoppingCart, LogOut, Sun, Moon, Menu, X, ChevronRight,
  BarChart2, ClipboardList, Shield
} from 'lucide-react';
import { useState } from 'react';
import NotificationBell from './NotificationBell';

const NAV = [
  { to: '/',                icon: LayoutDashboard, label: 'Dashboard',      end: true,  admin: false },
  { to: '/products',        icon: Package,         label: 'Products',                   admin: false },
  { to: '/stock',           icon: ArrowLeftRight,  label: 'Stock',                      admin: false },
  { to: '/purchase-orders', icon: ShoppingCart,    label: 'Orders',                     admin: false },
  { to: '/suppliers',       icon: Users,           label: 'Suppliers',                  admin: false },
  { to: '/categories',      icon: Tag,             label: 'Categories',                 admin: false },
  { to: '/reports',         icon: BarChart2,       label: 'Reports',                    admin: false },
  { to: '/users',           icon: Shield,          label: 'Users',                      admin: true  },
  { to: '/audit-logs',      icon: ClipboardList,   label: 'Audit Logs',                 admin: true  },
];

const MOBILE_NAV = NAV.slice(0, 4);

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const { dark, toggle }          = useTheme();
  const navigate                  = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const visibleNav = NAV.filter(n => !n.admin || isAdmin);

  const SidebarInner = () => (
    <>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-200 dark:shadow-blue-900/40">
            <Package size={17} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">InvenTrack</p>
            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Inventory Pro</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {/* Main section */}
        <p className="px-3 mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Main</p>
        {visibleNav.filter(n => !n.admin).map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to} to={to} end={end}
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={16} className="flex-shrink-0" />
            <span className="flex-1 truncate">{label}</span>
          </NavLink>
        ))}

        {/* Admin section */}
        {isAdmin && (
          <>
            <p className="px-3 mb-1 mt-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Admin</p>
            {visibleNav.filter(n => n.admin).map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to} to={to}
                onClick={() => setDrawerOpen(false)}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} className="flex-shrink-0" />
                <span className="flex-1 truncate">{label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User + actions */}
      <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/60 mb-2">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{user?.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{user?.role}</p>
          </div>
        </div>
        <button onClick={toggle} className="sidebar-link w-full">
          {dark ? <Sun size={15} className="flex-shrink-0" /> : <Moon size={15} className="flex-shrink-0" />}
          <span>{dark ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <button onClick={handleLogout} className="sidebar-link w-full !text-red-500 hover:!bg-red-50 dark:hover:!bg-red-900/20">
          <LogOut size={15} className="flex-shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 h-full">
        <SidebarInner />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="relative z-10 w-72 max-w-[85vw] flex flex-col bg-white dark:bg-gray-800 h-full shadow-2xl">
            <button onClick={() => setDrawerOpen(false)} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 z-10">
              <X size={18} className="text-gray-500" />
            </button>
            <SidebarInner />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <button onClick={() => setDrawerOpen(true)} className="icon-btn hover:bg-gray-100 dark:hover:bg-gray-700 -ml-1">
            <Menu size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white truncate">InvenTrack</span>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button onClick={toggle} className="icon-btn hover:bg-gray-100 dark:hover:bg-gray-700">
              {dark ? <Sun size={17} className="text-gray-500" /> : <Moon size={17} className="text-gray-500" />}
            </button>
          </div>
        </header>

        {/* Desktop top bar with notification bell */}
        <header className="hidden lg:flex items-center justify-end gap-2 px-6 h-14 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <NotificationBell />
          <button onClick={toggle} className="icon-btn hover:bg-gray-100 dark:hover:bg-gray-700">
            {dark ? <Sun size={17} className="text-gray-500" /> : <Moon size={17} className="text-gray-500" />}
          </button>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex z-40">
          {MOBILE_NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2.5 gap-1 min-h-[56px] transition-colors touch-manipulation
                ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                    <Icon size={19} />
                  </div>
                  <span className="text-[10px] font-semibold">{label}</span>
                </>
              )}
            </NavLink>
          ))}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 min-h-[56px] text-gray-400 dark:text-gray-500 touch-manipulation"
          >
            <div className="p-1.5 rounded-xl"><Menu size={19} /></div>
            <span className="text-[10px] font-semibold">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
