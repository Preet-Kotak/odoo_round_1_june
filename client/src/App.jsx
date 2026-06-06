import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VendorManagement from './pages/VendorManagement';
import RFQManagement from './pages/RFQManagement';
import QuotationComparison from './pages/QuotationComparison';
import PurchaseOrders from './pages/PurchaseOrders';
import Invoices from './pages/Invoices';
import Approvals from './pages/Approvals';
import Reports from './pages/Reports';
import AuditTrail from './pages/AuditTrail';

// Role constants matching backend
const ROLES = {
  ADMIN: 'admin',
  OFFICER: 'procurement_officer',
  MANAGER: 'manager',
  VENDOR: 'vendor',
};

const INTERNAL_ROLES = [ROLES.ADMIN, ROLES.OFFICER, ROLES.MANAGER];

/* ── Unauthorized page — shows who you're logged in as + logout ── */
const UnauthorizedPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F7F3]">
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
          <span className="material-symbols-outlined text-[32px] text-red-500">lock</span>
        </div>
        <h2 className="text-[22px] font-normal mb-2" style={{ fontFamily: "'DM Serif Display',serif" }}>
          Access Denied
        </h2>
        <p className="text-[13px] text-[#858484] mb-1">
          You don't have permission to view this page.
        </p>
        {user && (
          <p className="text-[12px] text-[#858484] mb-6">
            Logged in as <strong className="text-[#1C1C1C]">{user.name}</strong>{' '}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#EEECE8] text-[#858484]">
              {user.role?.replace(/_/g, ' ')}
            </span>
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <a href="/"
             className="px-5 py-2.5 rounded-lg text-[13px] font-semibold border border-[#E5E1D8] hover:bg-[#F9F7F3] transition-colors text-[#1C1C1C]">
            Go to Dashboard
          </a>
          <button onClick={handleLogout}
                  className="px-5 py-2.5 rounded-lg text-[13px] font-bold transition-colors hover:opacity-90"
                  style={{ background: '#C6A664', color: '#1C1C1C' }}>
            Switch Account
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Unauthorized page */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected routes — any logged-in user */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />

            {/* Vendor management — internal staff only */}
            <Route path="vendors" element={
              <ProtectedRoute allowedRoles={INTERNAL_ROLES}>
                <VendorManagement />
              </ProtectedRoute>
            } />

            {/* RFQs — internal staff only */}
            <Route path="rfqs" element={
              <ProtectedRoute allowedRoles={INTERNAL_ROLES}>
                <RFQManagement />
              </ProtectedRoute>
            } />

            {/* Quotations — all logged-in users (vendors submit, officers review) */}
            <Route path="quotations" element={<QuotationComparison />} />

            {/* Purchase Orders — internal staff only */}
            <Route path="pos" element={
              <ProtectedRoute allowedRoles={INTERNAL_ROLES}>
                <PurchaseOrders />
              </ProtectedRoute>
            } />

            {/* Invoices — all logged-in users */}
            <Route path="invoices" element={<Invoices />} />

            {/* Approvals — managers and admins only */}
            <Route path="approvals" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <Approvals />
              </ProtectedRoute>
            } />

            {/* Reports — managers and admins only */}
            <Route path="reports" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <Reports />
              </ProtectedRoute>
            } />

            {/* Audit Trail — admins only */}
            <Route path="audit-trail" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <AuditTrail />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
