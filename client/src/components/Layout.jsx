import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

/* ─────────────────────────────────────────────────────────────
   Design tokens (from Stitch / tailwind.config.js)
   Sidebar bg  : #1C1C1C   (primary-container / charcoal)
   Active item : #2E2E2E   (slightly lighter charcoal)
   Gold CTA    : #C6A664
   Ivory bg    : #F9F7F3
   Text muted  : rgba(255,255,255,0.45)
   Border      : rgba(255,255,255,0.08)
───────────────────────────────────────────────────────────── */

const NAV_ITEMS = [
  { icon: 'dashboard',           label: 'Dashboard',        to: '/'           },
  { icon: 'storefront',          label: 'Vendors',          to: '/vendors'    },
  { icon: 'request_quote',       label: 'RFQs',             to: '/rfqs'       },
  { icon: 'description',         label: 'Quotations',       to: '/quotations' },
  { icon: 'fact_check',          label: 'Approvals',        to: '/approvals'  },
  { icon: 'shopping_cart',       label: 'Purchase Orders',  to: '/pos'        },
  { icon: 'receipt_long',        label: 'Invoices',         to: '/invoices'   },
  { icon: 'notifications_active',label: 'Activity Center',  to: '/audit-trail'},
  { icon: 'bar_chart',           label: 'Reports',          to: '/reports'    },
  { icon: 'manage_accounts',     label: 'User Management',  to: '/users'      },
];

const SidebarItem = ({ icon, label, to, isActive }) => (
  <Link
    to={to}
    className={`
      group flex items-center gap-3 px-3 py-[9px] rounded-[8px]
      text-[13.5px] font-semibold tracking-[0.01em]
      transition-all duration-150
      ${isActive
        ? 'bg-[#2E2E2E] text-white'
        : 'text-white/45 hover:text-white/80 hover:bg-white/[0.06]'
      }
    `}
  >
    <span
      className="material-symbols-outlined text-[18px] shrink-0"
      style={{
        fontVariationSettings: isActive ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 300",
        color: isActive ? '#C6A664' : 'inherit',
      }}
    >
      {icon}
    </span>
    <span className="truncate">{label}</span>
  </Link>
);

/* Notification bell — fetches unread count */
const NotificationBell = () => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    api.get('/notifications?limit=1')
      .then((r) => setCount(r.data?.unreadCount || 0))
      .catch(() => {});
  }, []);
  return (
    <div className="relative shrink-0">
      <button
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-[#E5E1D8]
                   text-[#858484] hover:text-[#1C1C1C] hover:border-[#C6A664]/60 transition-all"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
      </button>
      {count > 0 && (
        <span className="absolute top-1 right-1 w-[7px] h-[7px] rounded-full bg-red-500
                         ring-[1.5px] ring-[#F9F7F3]" />
      )}
    </div>
  );
};

export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  const handleLogout = () => { logout(); navigate('/login'); };
  const userInitial  = (user?.name || 'U').charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#F9F7F3]">

      {/* ══════════════════════════════════════
          SIDEBAR  — charcoal #1C1C1C
      ══════════════════════════════════════ */}
      <aside
        className="fixed inset-y-0 left-0 w-[252px] bg-[#1C1C1C] flex flex-col z-50"
        style={{ fontFamily: "'Source Sans 3', sans-serif" }}
      >
        {/* Logo block */}
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h1
            className="text-white text-[20px] font-bold tracking-[-0.02em] leading-tight"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            VendorBridge
          </h1>
          <p className="text-[10px] text-white/35 tracking-[0.18em] uppercase mt-[3px]">
            Procurement Portal
          </p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-3 space-y-[2px] overflow-y-auto scrollbar-none">
          {NAV_ITEMS.map(({ icon, label, to }) => {
            const isActive = to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to);
            return (
              <SidebarItem key={to} icon={icon} label={label} to={to} isActive={isActive} />
            );
          })}
        </nav>

        {/* Bottom — gold CTA + user row */}
        <div className="px-3 pb-5 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Gold CTA */}
          <Link
            to="/rfqs"
            className="flex items-center justify-center gap-2
                       bg-[#C6A664] hover:bg-[#B5954F] active:bg-[#A3843E]
                       text-[#1C1C1C] text-[13px] font-bold rounded-[10px]
                       py-[11px] mb-4 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              add
            </span>
            Create New RFQ
          </Link>

          {/* User row */}
          <div className="flex items-center gap-3 px-1">
            {/* Avatar */}
            <div className="w-[30px] h-[30px] rounded-full bg-[#C6A664] flex items-center
                            justify-center text-[#1C1C1C] text-[11px] font-bold shrink-0">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white leading-tight truncate">
                {user?.name}
              </p>
              <p className="text-[11px] text-white/35 capitalize truncate mt-[1px]">
                {user?.role?.replace(/_/g, ' ')}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="text-white/30 hover:text-red-400 transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════
          TOP BAR  — ivory #F9F7F3
      ══════════════════════════════════════ */}
      <header
        className="fixed top-0 left-[252px] right-0 h-[52px] z-40
                   flex items-center gap-4 px-8
                   bg-[#F9F7F3]/96 backdrop-blur-sm"
        style={{ borderBottom: '1px solid #E5E1D8' }}
      >
        {/* Search pill */}
        <div className="relative flex-1 max-w-[340px]">
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2
                       text-[18px] text-[#858484] pointer-events-none"
          >
            search
          </span>
          <input
            type="text"
            placeholder="Search RFQs, Vendors…"
            className="w-full pl-9 pr-4 py-[7px] rounded-xl bg-white
                       border border-[#E5E1D8] text-[13px] text-[#1C1C1C]
                       placeholder:text-[#858484]/70
                       focus:outline-none focus:border-[#C6A664] focus:ring-1 focus:ring-[#C6A664]/30
                       transition-all"
          />
        </div>
        <div className="ml-auto">
          <NotificationBell />
        </div>
      </header>

      {/* ══════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════ */}
      <main className="ml-[252px] mt-[52px] flex-1 overflow-y-auto px-10 py-8 min-h-[calc(100vh-52px)]">
        <Outlet />
      </main>
    </div>
  );
};
