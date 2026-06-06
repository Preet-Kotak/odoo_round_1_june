import React from 'react';
import { Outlet, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const SidebarItem = ({ icon, label, to, isActive }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-title-sm transition-all duration-200 ${
      isActive
        ? 'bg-secondary-container text-on-secondary-container'
        : 'text-on-primary-container hover:text-on-primary hover:bg-primary-container'
    }`}
  >
    <span className="material-symbols-outlined">{icon}</span>
    {label}
  </Link>
);

export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex bg-background min-h-screen">
      {/* Side Navigation */}
      <aside className="fixed left-0 top-0 h-screen w-[280px] bg-primary text-on-primary p-6 flex flex-col z-50">
        <div className="mb-10">
          <h1 className="font-display-lg text-display-lg text-on-primary">VendorBridge</h1>
          <p className="font-label-caps text-on-primary-container tracking-widest mt-1">ENTERPRISE PROCUREMENT</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          <SidebarItem icon="dashboard" label="Dashboard" to="/" isActive={location.pathname === '/'} />
          <SidebarItem icon="factory" label="Vendors" to="/vendors" isActive={location.pathname.startsWith('/vendors')} />
          <SidebarItem icon="request_quote" label="RFQs" to="/rfqs" isActive={location.pathname.startsWith('/rfqs')} />
          <SidebarItem icon="description" label="Quotations" to="/quotations" isActive={location.pathname.startsWith('/quotations')} />
          <SidebarItem icon="shopping_cart" label="Purchase Orders" to="/pos" isActive={location.pathname.startsWith('/pos')} />
          <SidebarItem icon="receipt_long" label="Invoices" to="/invoices" isActive={location.pathname.startsWith('/invoices')} />
          <SidebarItem icon="fact_check" label="Approvals" to="/approvals" isActive={location.pathname.startsWith('/approvals')} />
        </nav>

        <div className="mt-auto border-t border-on-primary-container/20 pt-6">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-sm font-bold text-on-primary">{user?.name || 'Director of Procurement'}</span>
            <button onClick={handleLogout} className="text-on-primary-container hover:text-error transition-colors" title="Log out">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
          <button className="w-full flex items-center justify-center gap-2 bg-[#C6A664] text-[#1C1C1C] font-bold py-3 rounded-md hover:bg-[#B39352] transition-colors">
            <span className="material-symbols-outlined">add</span>
            New Requisition
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="ml-[280px] flex-1 h-screen overflow-y-auto px-margin-page py-10">
        <Outlet />
      </main>

      {/* Floating Support Action Button */}
      <div className="fixed bottom-10 right-10 z-50">
        <button className="w-16 h-16 rounded-full bg-primary text-on-primary shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group relative">
          <span className="material-symbols-outlined text-3xl">support_agent</span>
          <span className="absolute right-20 bg-primary text-on-primary px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none text-sm font-bold">
            Procurement Support
          </span>
        </button>
      </div>
    </div>
  );
};
